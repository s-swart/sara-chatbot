// route.ts (chat endpoint)
//
// PURPOSE:
// This API route handles POST requests to generate chatbot responses using OpenAI's GPT model.
// It supports optional semantic search using embeddings and Supabase to provide context-aware answers.
// The route formats the prompt with a system message defining Sara Swart's assistant behavior,
// sends the user input to OpenAI, logs the exchange, and returns the reply.
// It also handles OpenAI quota errors and provides a helpful billing message.
//
// USE THIS WHEN:
// - You want to generate a natural language response based on recruiter questions
// - You are integrating the assistant into a frontend chat interface
// - You need to log user questions and AI responses for follow-up or review
// - You want to enhance responses with relevant contextual information via semantic search

import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ reply: 'No input.' }, { status: 400 })

  try {
    const { searchParams } = new URL(req.url)
    const useEmbeddings = searchParams.get('embeddings') !== 'false'

    // --- Semantic search using Supabase and OpenAI embeddings ---
    let matches = []
    if (useEmbeddings) {
      try {
        // Create embedding for the user message using OpenAI's embedding model
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002', // embedding model optimized for semantic search
          input: message
        })

        const [{ embedding }] = embeddingResponse.data

        const supabaseResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/match_vectors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
          },
          body: JSON.stringify({
            query_embedding: embedding,
            // Slightly relaxed threshold to improve recall on narrow queries like "pricing" or "RevOps"
            match_threshold: 0.80, // relaxed threshold
            match_count: 6
          })
        })

        if (!supabaseResponse.ok) throw new Error(`Supabase error: ${supabaseResponse.statusText}`)

        matches = await supabaseResponse.json()
        // Commented out to reduce verbose logging
        // console.log('🧠 Matches raw:', JSON.stringify(matches, null, 2))
        console.log(`Found ${matches.length} semantic matches for context.`)
        // matches.forEach((m: { content?: string; chunk?: string }) =>
        //   console.log(`– ${m.content || m.chunk || '[no content field]'}`)
        // )
      } catch (e) {
        console.warn('⚠️ Embedding-based match failed, proceeding without matches:', e)
      }
    }

    // Prepare context text from semantic matches or fallback to empty string
    const contextText = Array.isArray(matches) && matches.length > 0
      ? matches.map((m) => m.content || m.chunk || '').join('\n\n')
      : ''
    if (contextText === '') {
      // Log fallback to no context for clarity
      console.warn('⚠️ No semantic matches found — falling back to no context')
    }

    // Create chat completion with system prompt and user message including context if available
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Sara Swart’s AI assistant. Use the provided context to answer questions.
If the answer is not directly in the context, you may still answer using relevant generalizations or summaries based on the provided information.
Avoid fabricating specific experiences or job titles that are not explicitly stated.`,
        },
        {
          role: 'user',
          content:
            contextText !== ''
              ? `Context:\n${contextText}\n\nQuestion: ${message}`
              : `Context:\n(no strong match)\n\nQuestion: ${message}`,
        },
      ],
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content ?? '…'

    // Add a fallback preface if needed based on presence of context and reply content
    let finalReply = reply;
    if (!contextText && reply.trim().startsWith("Sorry")) {
      finalReply = "Based on the information I have, I’m not sure about that. You might want to ask Sara directly!";
    } else if (!contextText) {
      // Provide a helpful note when no context was found but a reply is generated
      finalReply =
        "I don’t have exact details on that, but here's what I can share from the general context I know:\n\n" + reply;
    }



    return NextResponse.json({ reply: finalReply })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    console.error('OpenAI API ERROR:', err)

    let friendlyMessage = `Sorry, something went wrong. Please try rephrasing your question or come back later.`
    if (errorMessage.toLowerCase().includes('quota')) {
      friendlyMessage = `OpenAI error: Your API key may have no credits left. Check your billing settings at https://platform.openai.com/account/billing.`
    }

    return NextResponse.json({ reply: friendlyMessage }, { status: 500 })
  }
}
