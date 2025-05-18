// route.ts (chat endpoint)
//
// PURPOSE:
// This API route handles POST requests to generate chatbot responses using OpenAI's GPT model.
// It formats the prompt with a system message defining Sara Swart's assistant behavior,
// sends the user input to OpenAI, logs the exchange, and returns the reply.
// It also catches OpenAI quota errors and provides a helpful billing message.
//
// USE THIS WHEN:
// - You want to generate a natural language response based on recruiter questions
// - You are integrating the assistant into a frontend chat interface
// - You need to log user questions and AI responses for follow-up or review

import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { message } = await req.json()
  if (!message) return NextResponse.json({ reply: 'No input.' }, { status: 400 })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Sara Swart’s AI assistant. 
Answer recruiters’ questions truthfully. 
If Sara lacks direct experience, say “No, but her closest experience is …” and explain.`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content ?? '…'

    // Log to /api/log
    await fetch(`${req.headers.get('origin') || ''}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput: message, botReply: reply }),
    })

    return NextResponse.json({ reply })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'unknown'
    console.error('OpenAI API ERROR:', err)

    let friendlyMessage = `OpenAI error: ${errorMessage}`
    if (errorMessage.toLowerCase().includes('quota')) {
      friendlyMessage = `OpenAI error: Your API key may have no credits left. Check your billing settings at https://platform.openai.com/account/billing.`
    }

    return NextResponse.json({ reply: friendlyMessage }, { status: 500 })
  }
}
