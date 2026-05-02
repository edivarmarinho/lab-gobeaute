'use client'

import { useEffect, useRef } from 'react'
import { FlaskConical, User, Search, Loader2, AlertCircle } from 'lucide-react'

export type MessageRole = 'user' | 'assistant'

export type ToolStatus = {
  tool: string
  status: 'start' | 'running' | 'done'
}

export type ChatMessageData = {
  id: string
  role: MessageRole
  content: string
  toolStatuses?: ToolStatus[]
  isStreaming?: boolean
  isError?: boolean
}

const TOOL_LABELS: Record<string, string> = {
  search_anvisa: 'Consultando ANVISA',
  search_market_news: 'Buscando mercado',
  get_formula: 'Buscando fórmula',
  check_ingredient_anvisa: 'Verificando ingrediente',
  generate_inci_list: 'Gerando INCI list',
  get_mps_by_status: 'Consultando MPs',
}

function MarkdownText({ text }: { text: string }) {
  // Renderização básica de markdown sem dependências externas
  const lines = text.split('\n')

  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        // Heading ##
        if (line.startsWith('## ')) {
          return <p key={i} className="font-semibold text-gray-900 mt-2">{line.slice(3)}</p>
        }
        // Heading ###
        if (line.startsWith('### ')) {
          return <p key={i} className="font-medium text-gray-800 mt-1">{line.slice(4)}</p>
        }
        // Separador ---
        if (line === '---') {
          return <hr key={i} className="border-gray-200 my-2" />
        }
        // Linha vazia
        if (line.trim() === '') {
          return <div key={i} className="h-1" />
        }

        // Processar inline: **bold**, *italic*, `code`
        const parts: React.ReactNode[] = []
        const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
        let last = 0
        let match

        while ((match = regex.exec(line)) !== null) {
          if (match.index > last) {
            parts.push(line.slice(last, match.index))
          }
          const token = match[0]
          if (token.startsWith('**') && token.endsWith('**')) {
            parts.push(<strong key={match.index} className="font-semibold text-gray-900">{token.slice(2, -2)}</strong>)
          } else if (token.startsWith('*') && token.endsWith('*')) {
            parts.push(<em key={match.index}>{token.slice(1, -1)}</em>)
          } else if (token.startsWith('`') && token.endsWith('`')) {
            parts.push(<code key={match.index} className="bg-gray-100 text-gray-800 px-1 rounded text-xs font-mono">{token.slice(1, -1)}</code>)
          }
          last = match.index + token.length
        }
        if (last < line.length) parts.push(line.slice(last))

        // Lista com bullet
        if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('• ')) {
          const indent = line.length - line.trimStart().length
          return (
            <div key={i} className="flex gap-1.5" style={{ paddingLeft: indent > 0 ? '12px' : '0' }}>
              <span className="text-gray-400 mt-0.5 shrink-0">•</span>
              <span>{parts.length > 0 ? parts : line.trimStart().slice(2)}</span>
            </div>
          )
        }

        return <p key={i}>{parts.length > 0 ? parts : line}</p>
      })}
    </div>
  )
}

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === 'user'
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message.isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [message.content, message.isStreaming])

  if (isUser) {
    return (
      <div className="flex gap-2 justify-end">
        <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-3 py-2 text-sm leading-relaxed">
          {message.content}
        </div>
        <div className="shrink-0 w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center mt-0.5">
          <User size={14} className="text-gray-600" />
        </div>
      </div>
    )
  }

  // Mensagem do assistente
  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-7 h-7 rounded-full overflow-hidden mt-0.5 bg-indigo-50 border border-indigo-100 flex items-center justify-center">
        {/* Avatar customizado: coloque /public/regulai-avatar.png; cai para ícone se não existir */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/regulai-avatar.png"
          alt="RegulAI"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <FlaskConical size={14} className="text-indigo-600 absolute" style={{ zIndex: -1 }} />
      </div>

      <div className="max-w-[90%] space-y-2 min-w-0">
        {/* Tool status badges */}
        {message.toolStatuses && message.toolStatuses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolStatuses.map((ts, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  ts.status === 'done'
                    ? 'bg-green-50 text-green-700 border border-green-100'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}
              >
                {ts.status !== 'done' ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Search size={10} />
                )}
                {TOOL_LABELS[ts.tool] || ts.tool}
              </span>
            ))}
          </div>
        )}

        {/* Conteúdo da mensagem */}
        {message.isError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{message.content}</p>
          </div>
        ) : message.content ? (
          <div
            ref={contentRef}
            className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 text-gray-700 shadow-sm"
          >
            <MarkdownText text={message.content} />
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        ) : message.isStreaming ? (
          <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
