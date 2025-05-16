'use client'
import { useState, useRef, useEffect } from 'react'

type Message = { role: 'user' | 'bot'; text: string }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  /* auto-scroll */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput(''); setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }])
    } catch (e) {
      console.error(e)
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry – something went wrong.' }])
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl h-[80vh] bg-white p-6 rounded-xl shadow-md flex flex-col">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">Chat with Sara’s AI</h1>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-700 py-20 text-lg italic">
              Ask about Sara’s experience…
            </p>
          )}

          {messages.map((m, i) => (
            <div key={i}
              className={`p-3 text-base leading-relaxed rounded-lg max-w-[80%] ${
                m.role === 'user' ? 'bg-blue-100 ml-auto text-black' : 'bg-gray-200 mr-auto text-gray-800'
              }`}>
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="bg-gray-200 p-3 rounded-lg w-16 mr-auto">
              <span className="animate-pulse">...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={loading}
            className="flex-1 border border-gray-300 rounded p-2 shadow-sm text-black bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a question"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 transition-colors">
            {loading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  )
}
