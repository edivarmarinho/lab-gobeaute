'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { FlaskConical, X, Send, ChevronDown, ThumbsUp, ThumbsDown, RotateCcw, Sparkles } from 'lucide-react'
import ChatMessage, { ChatMessageData, ToolStatus } from './ChatMessage'

const SUGGESTED_QUESTIONS = [
  { label: 'Verificar conformidade', text: 'Quais conservantes estão liberados pela ANVISA em cosméticos leave-on?' },
  { label: 'Gerar INCI list', text: 'Como faço para gerar a INCI list de uma fórmula para notificação?' },
  { label: 'Regimes regulatórios', text: 'Qual a diferença entre Grau 1 e Grau 2 para cosméticos ANVISA?' },
  { label: 'Claims de rótulo', text: 'Quais claims posso usar em hidratante facial sem precisar de registro?' },
  { label: 'Rituaria (suplementos)', text: 'Quais alegações são permitidas para o 4Mag (magnésio) segundo a RDC 843/2024?' },
  { label: 'Fragrâncias e IFRA', text: 'Quais alérgenos de fragrância preciso declarar no rótulo?' },
]

type FeedbackState = Record<string, 'up' | 'down' | null>

export default function RegulAIWidget({ pageContext }: { pageContext?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>({})
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    }

    const assistantId = (Date.now() + 1).toString()
    const assistantMsg: ChatMessageData = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolStatuses: [],
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setIsLoading(true)
    setShowSuggestions(false)

    // Montar histórico para a API (excluindo a mensagem assistant vazia que acabamos de adicionar)
    const historyMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    })).filter(m => m.content.trim() !== '')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch('/api/regulai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          pageContext,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const event of events) {
          const dataLines = event.split('\n').filter(l => l.startsWith('data: '))
          if (dataLines.length === 0) continue
          const jsonStr = dataLines.map(l => l.slice(6)).join('').trim()
          if (!jsonStr) continue

          try {
            const ev = JSON.parse(jsonStr)
            if (ev.text) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + ev.text } : m
              ))
            } else if (ev.done) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ))
            } else if (ev.error) {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `Erro: ${ev.error}`, isStreaming: false, isError: true }
                  : m
              ))
            }
          } catch {
            // Ignorar JSON inválido
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Erro de conexão. Tente novamente.', isStreaming: false, isError: true }
          : m
      ))
    } finally {
      setIsLoading(false)
      abortRef.current = null
      setMessages(prev => prev.map(m =>
        m.id === assistantId && m.isStreaming ? { ...m, isStreaming: false } : m
      ))
    }
  }, [isLoading, messages, pageContext])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [msgId]: prev[msgId] === type ? null : type }))
  }

  const clearChat = () => {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setShowSuggestions(true)
    setFeedback({})
    setIsLoading(false)
  }

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-700 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
        title="RegulAI — Copiloto regulatório"
      >
        {isOpen ? (
          <ChevronDown size={16} />
        ) : (
          <FlaskConical size={16} />
        )}
        <span className="text-sm font-medium">RegulAI</span>
        {isLoading && (
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </button>

      {/* Painel de chat */}
      {isOpen && (
        <div className="fixed bottom-16 right-5 z-50 w-[380px] max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: 'min(560px, calc(100vh - 100px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <FlaskConical size={16} />
              <div>
                <p className="text-sm font-semibold leading-none">RegulAI</p>
                <p className="text-xs text-indigo-200 leading-none mt-0.5">Copiloto ANVISA & P&D</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasMessages && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
                  title="Limpar conversa"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
                title="Fechar (ESC)"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {/* Estado inicial com sugestões */}
            {!hasMessages && showSuggestions && (
              <div className="space-y-3">
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full mx-auto mb-2 overflow-hidden flex items-center justify-center border-2 border-indigo-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/regulai-avatar.png"
                      alt="RegulAI"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Olá! Sou o RegulAI.</p>
                  <p className="text-xs text-gray-500 mt-1">Copiloto de ANVISA e P&D do Lab Gobeaute.</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Sparkles size={11} />
                    Perguntas frequentes
                  </p>
                  <div className="space-y-1.5">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q.text)}
                        className="w-full text-left text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-gray-700 group"
                      >
                        <span className="text-indigo-600 font-medium group-hover:text-indigo-700">{q.label}: </span>
                        {q.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mensagens */}
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage message={msg} />

                {/* Feedback para respostas do assistente concluídas */}
                {msg.role === 'assistant' && !msg.isStreaming && !msg.isError && msg.content && (
                  <div className="flex items-center gap-1 mt-1 pl-9">
                    <button
                      onClick={() => handleFeedback(msg.id, 'up')}
                      className={`p-1 rounded-lg transition-colors ${
                        feedback[msg.id] === 'up'
                          ? 'text-green-600 bg-green-50'
                          : 'text-gray-300 hover:text-gray-500'
                      }`}
                      title="Resposta útil"
                    >
                      <ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, 'down')}
                      className={`p-1 rounded-lg transition-colors ${
                        feedback[msg.id] === 'down'
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-300 hover:text-gray-500'
                      }`}
                      title="Resposta não útil"
                    >
                      <ThumbsDown size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 bg-white px-3 py-2.5">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte sobre ANVISA, fórmulas, ingredientes..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 disabled:opacity-50 bg-gray-50 max-h-24 overflow-y-auto"
                style={{ minHeight: '36px' }}
                onInput={e => {
                  const t = e.currentTarget
                  t.style.height = 'auto'
                  t.style.height = Math.min(t.scrollHeight, 96) + 'px'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="shrink-0 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={15} />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Enter para enviar · Shift+Enter para quebrar linha
            </p>
          </div>
        </div>
      )}
    </>
  )
}
