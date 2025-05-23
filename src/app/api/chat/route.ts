const VERBOSE_LOGGING = process.env.VERBOSE_LOGGING === 'true'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
// route.ts (chat endpoint)
//
// PURPOSE:
// This API route handles POST requests to generate chatbot responses using OpenAI's GPT model,
// enhanced with optional context via semantic search using Supabase vector embeddings.
//
// It performs the following steps:
// - Extracts the user's message from the request
// - Optionally generates a text embedding and performs semantic search
// - Constructs a prompt using the retrieved context (if available)
// - Sends the prompt to OpenAI's chat completion API
// - Returns the formatted reply as a JSON response
//
// USE THIS WHEN:
// - You want to generate natural language answers based on recruiter or user questions
// - You are integrating the assistant into a frontend chat UI
// - You want responses to be smarter using relevant stored context chunks
// - You need to log and monitor chatbot interactions for feedback and tuning
//
// NOTE:
// - Includes helper functions to isolate key responsibilities like embedding lookup, prompt construction, and error handling
// - Gracefully handles fallback behavior when context is missing or matching fails

import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { assistantName } from '@/lib/constants'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function getEmbedding(message: string): Promise<number[]> {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: message
  })
  return embeddingResponse.data[0].embedding
}

type MatchResult = {
  id: string
  content?: string
  chunk?: string
  similarity: number
  recency_score?: number
}

async function fetchSemanticMatches(embedding: number[]): Promise<MatchResult[]> {
  const supabaseResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/match_vectors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_threshold: 0.80,
      match_count: 6
    })
  })

  if (!supabaseResponse.ok) throw new Error(`Supabase error: ${supabaseResponse.statusText}`)
  return (await supabaseResponse.json()).map((match: {
    id: string
    content?: string
    chunk?: string
    similarity: number
    metadata?: {
      recency_score?: number
      [key: string]: unknown
    }
  }) => ({
    ...match,
    recency_score: match.metadata?.recency_score ?? 1.0,
  }))
}

function buildContext(matches: MatchResult[]): string {
  if (!Array.isArray(matches) || matches.length === 0) {
    console.warn('⚠️ No semantic matches found — falling back to no context')
    return ''
  }

  console.log(`Found ${matches.length} semantic matches for context.`)
  return matches
    .sort((a, b) => {
      const simA = a.similarity ?? 0
      const simB = b.similarity ?? 0
      const recA = a.recency_score ?? 1
      const recB = b.recency_score ?? 1
      return recB * simB - recA * simA
    })
    .map((m) => m.content || m.chunk || '')
    .join('\n\n')
}

function buildPrompt(contextText: string, message: string): ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: `You are a helpful assistant trained on ${assistantName}'s background. Answer questions clearly, concisely, and with just enough context to be useful. Use your judgment on tone and structure to keep replies very easily readable and informative. Slightly prioritize her most recent roles and accomplishments.`,
    },
    {
      role: 'user',
      content:
        contextText !== ''
          ? `Context:\n${contextText}\n\nQuestion: ${message}`
          : `Context:\n(no strong match)\n\nQuestion: ${message}`,
    },
  ]
}

function formatReply(reply: string, contextText: string): string {
  if (!contextText && reply.trim().startsWith("Sorry")) {
    return `Based on the information I have, I’m not sure about that. You might want to ask ${assistantName} directly!`
  } else if (!contextText) {
    return "I don’t have exact details on that, but here's what I can share from the general context I know:\n\n" + reply
  }
  return reply
}

function handleOpenAIError(err: unknown): string {
  const errorMessage = err instanceof Error ? err.message : 'unknown'
  console.error('OpenAI API ERROR:', err)

  if (errorMessage.toLowerCase().includes('quota')) {
    return `OpenAI error: Your API key may have no credits left. Check your billing settings at https://platform.openai.com/account/billing.`
  }

  return `Sorry, something went wrong. Please try rephrasing your question or come back later.`
}

// ✅ PROD chat handler — main logic extracted from POST
async function handleProdChatRequest(req: Request) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ reply: 'No input.' }, { status: 400 })

  try {
    const { searchParams } = new URL(req.url)
    const useEmbeddings = searchParams.get('embeddings') !== 'false'

    let matches: MatchResult[] = []
    let contextText = ''

    if (useEmbeddings) {
      try {
        const embedding = await getEmbedding(message)
        matches = await fetchSemanticMatches(embedding)
        // 🧠 Debug: Show raw matches with recency and similarity
        if (VERBOSE_LOGGING) {
          console.log('🧠 Raw Matches with Recency and Similarity:')
          matches.forEach((m, idx) => {
            console.log(
              `#${idx + 1}: sim=${(m.similarity ?? 0).toFixed(3)}, recency=${(m.recency_score ?? 1).toFixed(2)}, content="${(m.content || m.chunk || '').slice(0, 60)}..."`
            )
          })
        }
        contextText = buildContext(matches)
      } catch (e) {
        console.warn('⚠️ Dev embedding-based match failed, proceeding without matches:', e)
      }
    }

    const messages = buildPrompt(contextText, message)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    })

    const rawReply = completion.choices[0]?.message?.content ?? '…'
    const finalReply = formatReply(rawReply, contextText)

    return NextResponse.json({ reply: finalReply })
  } catch (err) {
    const friendlyMessage = handleOpenAIError(err)
    return NextResponse.json({ reply: friendlyMessage }, { status: 500 })
  }
}

// 🧪 DEV chat handler — development version with full logic and logging
async function handleDevChatRequest(req: Request) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ reply: 'No input.' }, { status: 400 })

  try {
    const { searchParams } = new URL(req.url)
    const useEmbeddings = searchParams.get('embeddings') !== 'false'

    let matches: MatchResult[] = []
    let contextText = ''

    if (useEmbeddings) {
      try {
        const embedding = await getEmbedding(message)
        matches = await fetchSemanticMatches(embedding)
        // 🧠 Debug: Show raw matches with recency and similarity
        if (VERBOSE_LOGGING) {
          console.log('🧠 Raw Matches with Recency and Similarity:')
          matches.forEach((m, idx) => {
            console.log(
              `#${idx + 1}: sim=${(m.similarity ?? 0).toFixed(3)}, recency=${(m.recency_score ?? 1).toFixed(2)}, content="${(m.content || m.chunk || '').slice(0, 60)}..."`
            )
          })
        }
        contextText = buildContext(matches)
      } catch (e) {
        console.warn('⚠️ Dev embedding-based match failed, proceeding without matches:', e)
      }
    }

    const messages = buildPrompt(contextText, message)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
    })

    const rawReply = completion.choices[0]?.message?.content ?? '…'
    const finalReply = formatReply(rawReply, contextText)

    return NextResponse.json({ reply: finalReply })
  } catch (err) {
    const friendlyMessage = handleOpenAIError(err)
    return NextResponse.json({ reply: friendlyMessage }, { status: 500 })
  }
}

// 🚦 Branch between dev and prod chat handlers
export async function POST(req: Request) {
  const mode = process.env.CHAT_MODE || process.env.NODE_ENV
  return mode === 'development' || mode === 'dev'
    ? handleDevChatRequest(req)
    : handleProdChatRequest(req)
}
