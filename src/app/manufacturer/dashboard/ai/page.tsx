'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { Send, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

const SUGGESTED_QUESTIONS = [
  'What are my top selling products?',
  'Which pincodes buy most from me?',
  'What should I produce next?',
  'Why are returns happening?',
  'What are the trending searches in my category?',
  'How can I improve my revenue this week?',
]

function ChatContent({ manufacturerId }: { manufacturerId: string }) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const router = useRouter()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/manufacturer-ai',
      body: { manufacturerId },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue('')
    sendMessage({ parts: [{ type: 'text', text }] })
  }

  function handleSuggestion(q: string) {
    if (isLoading) return
    sendMessage({ parts: [{ type: 'text', text: q }] })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
        <button onClick={() => router.back()}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F15A2B]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#F15A2B]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Business Advisor</p>
            <p className="text-xs text-gray-400">Powered by your real sales data</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#F5F5F5]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8">
            <div className="w-16 h-16 rounded-3xl bg-[#F15A2B]/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-[#F15A2B]" />
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Your AI Business Advisor</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Ask me anything about your sales, products, demand trends, or what to produce next. I have access to your real data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} onClick={() => handleSuggestion(q)} disabled={isLoading}
                  className="text-xs px-3 py-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-[#F15A2B]/40 hover:bg-orange-50 transition-all duration-200 disabled:opacity-50 shadow-sm">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const text = m.parts.filter(isTextUIPart).map((p) => p.text).join('')
              if (!text) return null
              return (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    m.role === 'user'
                      ? 'bg-[#F15A2B] text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {text}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs">Analyzing your data…</span>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && messages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                  <button key={q} onClick={() => handleSuggestion(q)} disabled={isLoading}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-[#F15A2B]/40 transition-all duration-200 disabled:opacity-50">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-3 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your sales, trends, what to produce next…"
            rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            className="flex-1 bg-gray-100 border border-gray-200 focus:border-[#F15A2B] focus:bg-white rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none transition-all duration-200 max-h-32 overflow-y-auto"
          />
          <button type="button" onClick={handleSend} disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#F15A2B] hover:bg-orange-700 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}

export default function AIPage() {
  const router = useRouter()
  const { manufacturer, loading, error } = useManufacturerData()

  useEffect(() => {
    if (!loading && error && process.env.NODE_ENV !== 'development') {
      router.replace('/manufacturer/login')
    }
  }, [loading, error, router])

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] p-6 gap-4">
        <div className="h-7 w-48 animate-pulse bg-gray-100 rounded-xl" />
        <div className="flex-1 animate-pulse bg-gray-100 rounded-2xl" />
        <div className="h-14 animate-pulse bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!manufacturer) return null

  return <ChatContent manufacturerId={manufacturer.id} />
}
