import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/regulai/system-prompt'

export const runtime = 'nodejs'
export const maxDuration = 60

// Cadeia de providers (Groq primeiro, fallback para OpenRouter)
const PROVIDERS = [
  {
    name: 'Groq Llama 3.3 70B',
    host: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'Groq Llama 3.1 8B',
    host: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    keyEnv: 'GROQ_API_KEY',
    model: 'llama-3.1-8b-instant',
  },
  {
    name: 'OpenRouter GPT OSS',
    host: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    keyEnv: 'OPENROUTER_API_KEY',
    model: 'openai/gpt-oss-20b:free',
  },
]

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  const body = await req.json()
  const { messages, pageContext } = body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    pageContext?: string
  }

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Mensagens inválidas' }), { status: 400 })
  }

  // System prompt vem do arquivo (texto simples para esses providers)
  const systemBlocks = buildSystemPrompt()
  const systemText = systemBlocks.map(b => b.text).join('\n\n')
  const systemFinal = pageContext
    ? `${systemText}\n\nCONTEXTO DA PÁGINA ATUAL: ${pageContext}`
    : systemText

  const apiMessages = [
    { role: 'system', content: systemFinal },
    ...messages.filter(m => m.content.trim()).map(m => ({ role: m.role, content: m.content })),
  ]

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const tryProvider = async (index: number): Promise<boolean> => {
        if (index >= PROVIDERS.length) {
          send({ text: 'Todos os modelos estão saturados. Tente novamente em 30 segundos.' })
          return false
        }

        const provider = PROVIDERS[index]
        const apiKey = process.env[provider.keyEnv]
        if (!apiKey) {
          console.warn(`${provider.name}: chave ${provider.keyEnv} não configurada, pulando`)
          return tryProvider(index + 1)
        }

        try {
          const response = await fetch(`https://${provider.host}${provider.path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              ...(provider.host === 'openrouter.ai' ? {
                'HTTP-Referer': 'https://lab.gobeaute.com.br',
                'X-Title': 'RegulAI Lab Gobeaute',
              } : {}),
            },
            body: JSON.stringify({
              model: provider.model,
              messages: apiMessages,
              stream: true,
              max_tokens: 2048,
              temperature: 0.3,
            }),
          })

          if (!response.ok || !response.body) {
            console.error(`${provider.name} falhou: status ${response.status}`)
            return tryProvider(index + 1)
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let receivedText = false

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
              if (!jsonStr || jsonStr === '[DONE]') continue
              try {
                const parsed = JSON.parse(jsonStr)
                const text = parsed?.choices?.[0]?.delta?.content
                if (text) {
                  receivedText = true
                  send({ text })
                }
              } catch {}
            }
          }

          if (!receivedText) {
            console.error(`${provider.name}: stream vazio, tentando próximo`)
            return tryProvider(index + 1)
          }

          return true
        } catch (err) {
          console.error(`Erro em ${provider.name}:`, err instanceof Error ? err.message : err)
          return tryProvider(index + 1)
        }
      }

      try {
        await tryProvider(0)
      } finally {
        send({ done: true })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
