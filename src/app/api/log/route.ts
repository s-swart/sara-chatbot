import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userInput, botReply } = await req.json()

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'undefined' 

  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ userInput, botReply, userAgent, ip }),
    headers: { 'Content-Type': 'application/json' },
  })

  return NextResponse.json({ logged: true })
}
