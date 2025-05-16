import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
     console.log('Received log payload:', body) 
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('Missing LOG_WEBHOOK_URL')
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const payload = body.email
      ? { timestamp, email: body.email, ip, userAgent }
      : { timestamp, userInput: body.userInput, botReply: body.botReply, ip, userAgent }

    const result = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!result.ok) {
      console.error('Google Sheet webhook failed:', await result.text())
      return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
    }

    return NextResponse.json({ logged: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}