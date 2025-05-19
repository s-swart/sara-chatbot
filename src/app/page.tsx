/**
 * page.tsx
 *
 * PURPOSE:
 * This file renders the main chatbot UI for interacting with Sara’s AI assistant.
 * It provides a real-time chat interface supporting markdown-formatted bot replies,
 * leveraging a context-aware API backend that performs vector search on Sara's resume
 * to deliver semantically enriched responses.
 *
 * FEATURES:
 * - Dynamic chat conversation with OpenAI responses rendered using ReactMarkdown
 * - Scroll-to-bottom behavior as new messages are added
 * - Mobile-responsive layout and accessible design
 * - Cleaner logging and context-aware API backend integration
 *
 * REQUIREMENTS:
 * - A working API route at `/api/chat` that returns context-aware responses
 * - `react-markdown` package installed for rendering bot replies
 * - Environment setup via `.env.local` for OpenAI and logging credentials
 * - `react-icons` package installed for feedback buttons (👍 👎 ❤️)
 */
'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { assistantName } from '../lib/constants'
// import { FaThumbsUp, FaThumbsDown, FaHeart } from 'react-icons/fa'
// (Retained for future reactivation of feedback UI)

type Message = { role: 'user' | 'bot'; text: string; feedback?: 'up' | 'down' | 'heart' }

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate a persistent sessionId and store in localStorage
  useEffect(() => {
    let sid = localStorage.getItem('sessionId')
    if (!sid) {
      // UUID v4 generator using crypto.getRandomValues (TypeScript-safe)
      sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
      localStorage.setItem('sessionId', sid)
    }
    setSessionId(sid)
  }, [])

  async function send() {
    if (!input.trim()) return
    // Ensure sessionId is loaded before sending any requests
    if (!sessionId) return
    const userMsg: Message = { role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg, { role: 'bot', text: 'Thinking...' }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.text,
          sessionId: sessionId,
        }),
      })
      const data = await res.json()
      const botMsg: Message = { role: 'bot', text: data.reply }
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = botMsg
        return newMessages
      })
      // Log only if both reply and sessionId are present, and only once per message
      if (data.reply && sessionId) {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput: userMsg.text,
            botReply: data.reply,
            sessionId: sessionId,
          }),
        })
      }
    } catch (e) {
      console.error(e)
      const botMsg: Message = { role: 'bot', text: 'Sorry – something went wrong.' }
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = botMsg
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  async function submitEmail() {
    if (!email) return
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        sessionId: sessionId || undefined,
      }),
    })
    setEmailSubmitted(true)
  }

  // --- FEEDBACK HANDLER TEMPORARILY DISABLED ---
  // The feedback handler is commented out while the feedback UI is inactive.
  /*
  function handleFeedback(index: number, type: 'up' | 'down' | 'heart') {
    setMessages(prev => {
      const newMessages = [...prev]
      const msg = newMessages[index]
      if (msg.feedback === type) {
        delete msg.feedback
      } else {
        msg.feedback = type
      }
      return newMessages
    })
  }
  */

  return (
    <main className="min-h-screen flex flex-col justify-between bg-[#d0e0da] p-4 sm:p-6">
      <div className="mx-auto max-w-2xl flex flex-col gap-4">
        <div className="bg-[#f8f8f8] flex-grow p-4 sm:p-6 rounded-xl shadow-md flex flex-col text-[#2b2b2b]">
          <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Chat with {assistantName}’s AI</h1>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 sm:mb-6">
            {messages.length === 0 && (
              <p className="text-center text-gray-700 py-20 text-lg italic">
                Ask about {assistantName}’s experience…
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
                {m.role === 'bot' ? (
                  <>
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                    {/* Feedback icons are currently disabled due to issues with UI state persistence and logging
                    <div className="flex gap-3 mt-2 text-xl">
                      <FaThumbsUp
                        className={`cursor-pointer ${m.feedback === 'up' ? 'text-green-600' : 'text-gray-500'} hover:text-green-600`}
                        onClick={() => handleFeedback(i, 'up')}
                        aria-label="Thumbs up feedback"
                      />
                      <FaThumbsDown
                        className={`cursor-pointer ${m.feedback === 'down' ? 'text-red-600' : 'text-gray-500'} hover:text-red-600`}
                        onClick={() => handleFeedback(i, 'down')}
                        aria-label="Thumbs down feedback"
                      />
                      <FaHeart
                        className={`cursor-pointer ${m.feedback === 'heart' ? 'text-pink-600' : 'text-gray-500'} hover:text-pink-600`}
                        onClick={() => handleFeedback(i, 'heart')}
                        aria-label="Heart feedback"
                      />
                    </div>
                    */}
                  </>
                ) : (
                  m.text
                )}
              </div>
            ))}

            {/* Removed loading && <div>Thinking...</div> block as "Thinking..." is now a placeholder message */}
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

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          {!emailSubmitted ? (
            <>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 sm:mb-4">
                Want a follow-up? Leave your email:
              </label>
              <div className="flex w-full gap-2">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitEmail()}
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
      </div>
    </main>
  )
}
