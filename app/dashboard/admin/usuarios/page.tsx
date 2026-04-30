import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck } from 'lucide-react'
import UsuariosClient from './UsuariosClient'
import type { Profile } from '@/lib/types'

export default async function UsuariosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Defina o role e as marcas de cada colaborador. Usuários com role <strong>P&D</strong> ou <strong>Visualizador</strong> só veem MPs e projetos das marcas atribuídas.
      </p>

      <UsuariosClient profiles={(profiles ?? []) as Profile[]} />

      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
        <p><strong className="text-red-600">Admin</strong> — acesso total, sem filtro de marca. Pode gerenciar usuários.</p>
        <p><strong className="text-blue-600">P&D</strong> — pode criar e editar MPs, projetos, fórmulas e documentos das marcas atribuídas.</p>
        <p><strong className="text-gray-600">Visualizador</strong> — somente leitura, restrito às marcas atribuídas.</p>
      </div>
    </div>
  )
}
