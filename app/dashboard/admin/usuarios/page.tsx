import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck } from 'lucide-react'
import UsuariosClient from './UsuariosClient'
import type { Profile, Module, ModulePermission } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()
  const [profilesRes, modulesRes, permsRes] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: true }),
    adminClient.from('modules').select('*').eq('ativo', true).order('ordem'),
    adminClient.from('user_module_permissions').select('*'),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Gerenciar Usuários</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Defina role, marcas e <strong>permissões por módulo</strong> de cada colaborador. Bloqueie usuários sem deletar.
      </p>

      <UsuariosClient
        profiles={(profilesRes.data ?? []) as Profile[]}
        modules={(modulesRes.data ?? []) as Module[]}
        permissions={(permsRes.data ?? []) as ModulePermission[]}
        currentUserId={profile.id}
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-1">
        <p><strong className="text-red-600">Admin</strong> — acesso total, sem filtro de marca. Pode gerenciar usuários.</p>
        <p><strong className="text-blue-600">P&D</strong> — pode criar e editar nos módulos liberados, restrito às marcas atribuídas.</p>
        <p><strong className="text-gray-600">Visualizador</strong> — somente leitura, restrito às marcas e módulos atribuídos.</p>
        <p className="pt-1">Permissões por módulo se sobrepõem ao role: você pode dar leitura de Fórmulas a um Visualizador, ou tirar acesso a Fornecedores de um P&D.</p>
      </div>
    </div>
  )
}
