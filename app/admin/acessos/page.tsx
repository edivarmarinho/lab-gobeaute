import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Users, Lock, History } from 'lucide-react'
import AcessosClient from './AcessosClient'
import type { Profile } from '@/lib/types'


export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDados() {
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  // user_invites pode não existir ainda (migration pendente)
  let invites: any[] = []
  try {
    const result = await supabase
      .from('user_invites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    invites = result.data ?? []
  } catch {
    invites = []
  }

  return {
    profiles: (profiles ?? []) as Profile[],
    invites,
  }
}

export default async function AcessosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { profiles, invites } = await getDados()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-6 h-6 text-brand-500" />
          <h1 className="text-xl font-bold text-gray-900">Gestão de Acessos</h1>
        </div>
        <p className="text-sm text-gray-500">
          Controle de usuários, permissões, convites e histórico de atividade do sistema.
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Usuários ativos', value: profiles.filter(p => p.role !== undefined).length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Admins', value: profiles.filter(p => p.role === 'admin').length, icon: ShieldCheck, color: 'text-red-600 bg-red-50' },
          { label: 'P&D', value: profiles.filter(p => p.role === 'pd').length, icon: Lock, color: 'text-brand-600 bg-brand-50' },
          { label: 'Convites pendentes', value: invites.filter((i: any) => i.status === 'pendente').length, icon: History, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <AcessosClient profiles={profiles} invites={invites} />

      {/* Legenda de roles */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-2">
        <p className="font-semibold text-gray-700 mb-2">Níveis de acesso</p>
        <p><strong className="text-red-600">Admin</strong> — Acesso total. Pode gerenciar usuários, convites e todas as configurações.</p>
        <p><strong className="text-blue-600">P&D</strong> — Pode criar/editar MPs, projetos, fórmulas e documentos das marcas atribuídas.</p>
        <p><strong className="text-gray-600">Visualizador</strong> — Somente leitura. Restrito às marcas atribuídas. Não pode criar ou editar.</p>
        <p className="mt-2 text-gray-400">Usuários P&D e Visualizador sem marcas atribuídas não conseguem visualizar nenhum dado específico de marca.</p>
      </div>
    </div>
  )
}
