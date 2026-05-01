import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSystemPrompt } from '@/lib/regulai/system-prompt'
import { TOOL_DEFINITIONS, executeTool } from '@/lib/regulai/tools'

export const runtime = 'nodejs'
export const maxDuration = 120

// Tipo local para acumular tool use durante streaming (não usa o tipo read-only do SDK)
type ToolUseBlockAccumulator = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
  _rawInput?: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  // Verificar autenticação
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  const body = await req.json()
  const { messages, pageContext } = body as {
    messages: Anthropic.Messages.MessageParam[]
    pageContext?: string
  }

  if (!messages || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Mensagens inválidas' }), { status: 400 })
  }

  const systemBlocks = buildSystemPrompt()

  // Adicionar contexto da página atual se fornecido
  const systemFinal: Anthropic.Messages.TextBlockParam[] = pageContext
    ? [
        ...systemBlocks,
        {
          type: 'text',
          text: `CONTEXTO DA PÁGINA ATUAL DO USUÁRIO: ${pageContext}\n\nUse este contexto para responder de forma mais relevante.`,
        },
      ]
    : systemBlocks

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        let currentMessages = [...messages]
        let iterations = 0
        const MAX_ITERATIONS = 5

        while (iterations < MAX_ITERATIONS) {
          iterations++

          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: systemFinal,
            tools: TOOL_DEFINITIONS,
            messages: currentMessages,
            stream: true,
          })

          let assistantText = ''
          let toolUseBlocks: ToolUseBlockAccumulator[] = []
          let stopReason: string | null = null

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                // Sinaliza início de tool use
                send({ type: 'tool_start', tool: event.content_block.name })
                toolUseBlocks.push({
                  type: 'tool_use',
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                  _rawInput: '',
                })
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                assistantText += event.delta.text
                send({ type: 'text', text: event.delta.text })
              } else if (event.delta.type === 'input_json_delta') {
                // Acumular JSON do tool input
                const lastTool = toolUseBlocks[toolUseBlocks.length - 1]
                if (lastTool) {
                  lastTool._rawInput = (lastTool._rawInput ?? '') + event.delta.partial_json
                }
              }
            } else if (event.type === 'message_delta') {
              stopReason = event.delta.stop_reason || null
            }
          }

          // Parse tool inputs e remover campo auxiliar
          for (const tool of toolUseBlocks) {
            if (tool._rawInput) {
              try {
                tool.input = JSON.parse(tool._rawInput)
              } catch {
                tool.input = {}
              }
            }
            delete tool._rawInput
          }

          // Montar bloco de conteúdo do assistente
          type AssistantContentBlock =
            | Anthropic.Messages.TextBlockParam
            | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
          const assistantContent: AssistantContentBlock[] = []
          if (assistantText) {
            assistantContent.push({ type: 'text', text: assistantText })
          }
          for (const tool of toolUseBlocks) {
            assistantContent.push({ type: 'tool_use', id: tool.id, name: tool.name, input: tool.input })
          }

          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: assistantContent },
          ]

          // Se não há tool calls, terminar
          if (stopReason !== 'tool_use' || toolUseBlocks.length === 0) {
            break
          }

          // Executar tool calls
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []

          for (const tool of toolUseBlocks) {
            send({ type: 'tool_running', tool: tool.name })

            const result = await executeTool(
              tool.name,
              tool.input as Record<string, string>
            )

            toolResults.push({
              type: 'tool_result',
              tool_use_id: tool.id,
              content: result,
            })

            send({ type: 'tool_done', tool: tool.name })
          }

          currentMessages = [
            ...currentMessages,
            { role: 'user', content: toolResults },
          ]
        }

        send({ type: 'done' })
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro interno'
        send({ type: 'error', message: msg })
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

