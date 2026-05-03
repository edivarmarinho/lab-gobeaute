// AuditLogger: registra mutações em audit_log com diff JSONB.
// Append-only por trigger no DB.

import { createAdminClient } from '@/lib/supabase/admin'
import { generateDiff, hasDiff, type Diff } from './diff'
import type { Profile } from '@/lib/types'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'BAN' | 'UNBAN' | 'LOGIN' | 'PERMISSION_CHANGE' | 'EXPORT' | 'IMPORT'

export type AuditLogInput = {
  module: string                          // 'usuarios' | 'formulas' | 'mps' | etc
  entidade: string                        // mesmo nome de tabela ou domínio
  entidade_id?: string | null
  acao: AuditAction
  before?: Record<string, any> | null
  after?: Record<string, any> | null
  actor: Pick<Profile, 'id' | 'email' | 'nome'> | null
  metadata?: Record<string, any>
  ip?: string | null
  user_agent?: string | null
  // Quando não é uma mudança de campo, mas uma ação (ex.: BAN, EXPORT)
  forceDiff?: Diff
}

export async function audit(input: AuditLogInput) {
  try {
    const supabase = createAdminClient()
    const diff = input.forceDiff ?? generateDiff(input.before, input.after)
    if (!hasDiff(diff) && !input.forceDiff && (input.acao === 'CREATE' || input.acao === 'UPDATE')) {
      return // nada mudou — não polui o log
    }

    await supabase.from('audit_log').insert({
      entidade: input.entidade,
      entidade_id: input.entidade_id ?? null,
      acao: input.acao,
      diff,
      module_name: input.module,
      metadata: input.metadata ?? {},
      usuario_id: input.actor?.id ?? null,
      usuario_nome: input.actor?.nome ?? null,
      usuario_email: input.actor?.email ?? null,
      ip_address: input.ip ?? null,
      user_agent: input.user_agent ?? null,
    })
  } catch (err) {
    // Auditoria nunca quebra o fluxo principal — só loga
    console.error('[audit] insert failed:', err)
  }
}

// Helper p/ ler IP+UA de NextRequest
export function extractRequestInfo(req: Request): { ip: string | null; user_agent: string | null } {
  const h = req.headers
  return {
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null,
    user_agent: h.get('user-agent') ?? null,
  }
}
