/**
 * Helper para registrar entradas no audit_log
 *
 * Uso (server-side, em API routes):
 *
 *   import { registrarAuditoria } from '@/lib/audit'
 *   await registrarAuditoria({
 *     entidade: 'formulas',
 *     entidade_id: formula.id,
 *     acao: 'approve',
 *     usuario_id: profile.id,
 *     usuario_nome: profile.nome,
 *     usuario_email: profile.email,
 *   })
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type AuditEntry = {
  entidade: string
  entidade_id: string
  acao: 'create' | 'update' | 'delete' | 'status_change' | 'approve' | 'reject' | 'view'
  campo?: string | null
  valor_antes?: unknown
  valor_depois?: unknown
  usuario_id?: string | null
  usuario_nome?: string | null
  usuario_email?: string | null
  ip_address?: string | null
  user_agent?: string | null
}

function serializar(v: unknown): string | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/**
 * Registra uma entrada de auditoria. Não lança erro — log de falha apenas.
 */
export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('audit_log').insert({
      entidade: entry.entidade,
      entidade_id: entry.entidade_id,
      acao: entry.acao,
      campo: entry.campo ?? null,
      valor_antes: serializar(entry.valor_antes),
      valor_depois: serializar(entry.valor_depois),
      usuario_id: entry.usuario_id ?? null,
      usuario_nome: entry.usuario_nome ?? null,
      usuario_email: entry.usuario_email ?? null,
      ip_address: entry.ip_address ?? null,
      user_agent: entry.user_agent ?? null,
    })
  } catch (err) {
    console.error('[audit] erro ao registrar:', err)
  }
}

/**
 * Registra múltiplas mudanças de campos de uma vez (uma entrada por campo)
 */
export async function registrarMudancas(
  entidade: string,
  entidade_id: string,
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
  usuario: { id?: string; nome?: string | null; email?: string }
): Promise<void> {
  const mudancas: AuditEntry[] = []
  const todasChaves = new Set([...Object.keys(antes), ...Object.keys(depois)])

  for (const k of todasChaves) {
    const v1 = antes[k]
    const v2 = depois[k]
    if (serializar(v1) !== serializar(v2)) {
      mudancas.push({
        entidade,
        entidade_id,
        acao: 'update',
        campo: k,
        valor_antes: v1,
        valor_depois: v2,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        usuario_email: usuario.email,
      })
    }
  }

  if (mudancas.length === 0) return

  try {
    const supabase = createAdminClient()
    await supabase.from('audit_log').insert(mudancas.map(m => ({
      entidade: m.entidade,
      entidade_id: m.entidade_id,
      acao: m.acao,
      campo: m.campo,
      valor_antes: serializar(m.valor_antes),
      valor_depois: serializar(m.valor_depois),
      usuario_id: m.usuario_id ?? null,
      usuario_nome: m.usuario_nome ?? null,
      usuario_email: m.usuario_email ?? null,
    })))
  } catch (err) {
    console.error('[audit] erro ao registrar mudanças:', err)
  }
}
