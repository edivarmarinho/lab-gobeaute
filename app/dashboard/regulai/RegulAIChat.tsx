'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Zap, Search, FlaskConical, FileCheck } from 'lucide-react'
import { clsx } from 'clsx'

type ToolEvent = { type: 'tool_start' | 'tool_running' | 'tool_done'; tool: string }
type StreamEvent =
  | { type: 'text'; text: string }
  | ToolEvent
  | { type: 'done' }
  | { type: 'error'; message: string }

type Message = {
  role: 'user' | 'assistant'
  content: string
  tools?: string[]
}

const TOOL_LABELS: Record<string, string> = {
  search_anvisa: 'Buscando ANVISA...',
  search_market_news: 'Buscando tendências...',
  get_formula: 'Carregando fórmula...',
  check_ingredient_anvisa: 'Verificando ingrediente...',
  generate_inci_list: 'Gerando INCI list...',
  get_mps_by_status: 'Consultando MPs...',
}

const SUGGESTIONS = [
  { icon: FileCheck, text: 'O ácido glicólico a 5% em leave-on precisa de registro Grau 2?', label: 'ANVISA' },
  { icon: FlaskConical, text: 'Quais conservantes posso usar numa emulsão Grau 1 da Kokeshi?', label: 'Fórmula' },
  { icon: Search, text: 'Quais são as últimas atualizações da ANVISA sobre retinol em cosméticos?', label: 'Regulatório' },
  { icon: Zap, text: 'Qual a diferença entre notificação Grau 1 e registro Grau 2?', label: 'Geral' },
]

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-2">$1</h1>')
    .replace(/^---$/gm, '<hr class="border-gray-200 my-3">')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br>')
}

export default function RegulAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTools])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    setActiveTools([])

    // Preparar payload
    const apiMessages = newMessages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/regulai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok || !res.body) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      const usedTools: string[] = []

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw) as StreamEvent
            if (event.type === 'text') {
              assistantText += event.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText, tools: usedTools }
                return updated
              })
            } else if (event.type === 'tool_start' || event.type === 'tool_running') {
              const toolName = (event as ToolEvent).tool
              if (!usedTools.includes(toolName)) usedTools.push(toolName)
              setActiveTools([toolName])
            } else if (event.type === 'tool_done') {
              setActiveTools([])
            } else if (event.type === 'done') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText, tools: usedTools }
                return updated
              })
            } else if (event.type === 'error') {
              assistantText = `Erro: ${(event as { type: 'error'; message: string }).message}`
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch {
            // evento inválido, ignorar
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro ao conectar: ${msg}` }])
    } finally {
      setLoading(false)
      setActiveTools([])
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="bg-brand-500 p-2 rounded-xl">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900">RegulAI</h1>
          <p className="text-xs text-gray-400">Copiloto técnico-regulatório · ANVISA · P&D Gobeaute</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-700 font-medium">Online</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-gray-900 font-semibold mb-1">RegulAI</h2>
            <p className="text-gray-500 text-sm max-w-md mb-8">
              Especialista em regulamentação ANVISA e P&D de cosméticos do Lab Gobeaute.
              Tire dúvidas sobre conformidade, fórmulas, INCI lists e muito mais.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  className="flex items-start gap-2.5 text-left px-3.5 py-3 rounded-xl border border-gray-200 hover:border-brand-200 hover:bg-brand-50 transition text-sm text-gray-700"
                >
                  <s.icon className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
              msg.role === 'assistant' ? 'bg-brand-500' : 'bg-gray-200'
            )}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-white" />
                : <User className="w-4 h-4 text-gray-600" />
              }
            </div>
            <div className={clsx(
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
              msg.role === 'user'
                ? 'bg-brand-500 text-white rounded-tr-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
            )}>
              {msg.role === 'assistant' ? (
                <>
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {msg.tools.map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                  />
                  {msg.content === '' && loading && (
                    <span className="inline-flex gap-1 items-center text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Tool indicator */}
        {activeTools.length > 0 && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-brand-500 animate-spin" />
              <span className="text-xs text-gray-600">{TOOL_LABELS[activeTools[0]] ?? `${activeTools[0]}...`}</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100 transition">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize() }}
            onKeyDown={onKeyDown}
            placeholder="Pergunta sobre ANVISA, fórmulas, ingredients, INCI..."
            disabled={loading}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none min-h-[24px] max-h-40 py-1 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className={clsx(
              'shrink-0 p-2 rounded-xl transition',
              input.trim() && !loading
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          Enter para enviar · Shift+Enter para nova linha · Respostas fundamentadas em regulamentação ANVISA vigente
        </p>
      </div>
    </div>
  )
}
