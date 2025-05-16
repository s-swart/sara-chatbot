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
    return NextResponse.json({ reply })
  } catch (err) {
  console.error('OpenAI API ERROR:', err)
  return NextResponse.json({
    reply: `OpenAI error: ${err instanceof Error ? err.message : 'unknown'}`,
  }, { status: 500 })
}
}