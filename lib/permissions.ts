import { createAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/types'

export type ModulePermission = {
  module_id: string
  can_read: boolean
  can_write: boolean
}

/**
 * Retorna o conjunto de módulos que o usuário pode ler/escrever.
 * Admin sempre vê tudo.
 */
// Lista canônica de fallback se o banco não retornar módulos
const FALLBACK_MODULES = [
  'dashboard', 'homologacoes', 'projetos', 'mps', 'formulas',
  'fornecedores', 'documentos', 'produtos', 'regulai', 'roadmap',
  'admin_usuarios', 'admin_acessos', 'admin_auditoria',
]

export async function getUserPermissions(profile: Profile | null): Promise<{
  canRead: Set<string>
  canWrite: Set<string>
  isAdmin: boolean
}> {
  if (!profile) return { canRead: new Set(), canWrite: new Set(), isAdmin: false }

  const isAdmin = profile.role === 'admin'

  if (isAdmin) {
    // Admin tem acesso a tudo — busca módulos e usa fallback se falhar
    try {
      const admin = createAdminClient()
      const { data: modules } = await admin.from('modules').select('id').eq('ativo', true)
      const ids = (modules ?? []).map(m => m.id)
      const all = new Set(ids.length > 0 ? ids : FALLBACK_MODULES)
      return { canRead: all, canWrite: all, isAdmin: true }
    } catch {
      // Se algo der errado, admin sempre vê tudo via fallback
      const all = new Set(FALLBACK_MODULES)
      return { canRead: all, canWrite: all, isAdmin: true }
    }
  }

  // Não-admin: lê tabela de permissões
  try {
    const admin = createAdminClient()
    const { data: perms } = await admin
      .from('user_module_permissions')
      .select('module_id, can_read, can_write')
      .eq('user_id', profile.id)

    const canRead = new Set<string>()
    const canWrite = new Set<string>()
    for (const p of perms ?? []) {
      if (p.can_read) canRead.add(p.module_id)
      if (p.can_write) {
        canWrite.add(p.module_id)
        canRead.add(p.module_id)
      }
    }
    return { canRead, canWrite, isAdmin: false }
  } catch {
    return { canRead: new Set(), canWrite: new Set(), isAdmin: false }
  }
}

/** Helper síncrono pra checar permissão dado um conjunto */
export function canRead(set: Set<string>, moduleId: string): boolean {
  return set.has(moduleId)
}
export function canWrite(set: Set<string>, moduleId: string): boolean {
  return set.has(moduleId)
}
