import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { History } from 'lucide-react'
import AuditoriaClient from './AuditoriaClient'


export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAuditEntries() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return []
  return data ?? []
}

async function getSessions() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .order('signed_in_at', { ascending: false })
    .limit(100)
  if (error) return []
  return data ?? []
}

export default async function AuditoriaPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [entries, sessions] = await Promise.all([
    getAuditEntries(),
    getSessions(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <History className="w-6 h-6 text-brand-500" />
          <h1 className="text-xl font-bold text-gray-900">Auditoria & Atividade</h1>
        </div>
        <p className="text-sm text-gray-500">
          Audit trail imutável das alterações no sistema e histórico de sessões de acesso.
        </p>
      </div>

      <AuditoriaClient entries={entries} sessions={sessions} />
    </div>
  )
}
