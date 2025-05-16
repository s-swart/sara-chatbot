'use client'
import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'bot'; text: string }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry – something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  async function submitEmail() {
    if (!email) return
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setEmailSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-[#d0e0da] p-6">
      <div className="mx-auto max-w-2xl h-[80vh] bg-[#f8f8f8] p-6 rounded-xl shadow-md flex flex-col text-[#2b2b2b]">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Chat with Sara’s AI</h1>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-700 py-20 text-lg italic">
              Ask about Sara’s experience…
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 text-base leading-relaxed rounded-lg max-w-[80%] ${
                m.role === 'user'
                  ? 'bg-[#c6d9d3] ml-auto text-black'
                  : 'bg-[#e6eae9] mr-auto text-gray-800'
              }`}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="p-3 text-base leading-relaxed rounded-lg max-w-[80%] bg-[#e6eae9] mr-auto text-[#2b2b2b] italic">
              Thinking...
            </div>
          )}
          <div ref={endRef} />
        </div>

       

        <div className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
            className="flex-1 border border-[#2d2f35] rounded p-2 shadow-sm text-[#2b2b2b] bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d2f35]"
            placeholder="Type a question"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-[#2d2f35] text-white px-4 py-2 rounded hover:bg-[#1e1f22] disabled:bg-[#7a7a7a] transition-colors"
          >
            {loading ? '...' : 'Send'}
          </button>
        </div>

 

      </div>

      <div className="mx-auto max-w-2xl mt-6 bg-white p-6 rounded-xl shadow-md">
  {!emailSubmitted ? (
    <>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
        Want a follow-up? Leave your email:
      </label>
      <div className="flex w-full gap-2">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border border-[#2d2f35] rounded p-2 shadow-sm text-[#2b2b2b] bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2d2f35]"
          placeholder="you@example.com"
        />
        <button
          onClick={submitEmail}
          className="bg-[#2d2f35] text-white px-4 py-2 rounded hover:bg-[#1e1f22] disabled:bg-[#7a7a7a] transition-colors"
        >
          Submit
        </button>
      </div>
    </>
  ) : (
    <p className="text-sm text-green-700">
      Thanks! I’ve received your email and will be in touch if relevant.
    </p>
  )}
</div>
    </main>
  )
}
