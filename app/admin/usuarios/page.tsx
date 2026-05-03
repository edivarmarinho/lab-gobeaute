import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { ShieldCheck, Activity } from 'lucide-react'
import UsuariosClient from './UsuariosClient'
import type { Profile, Module, ModulePermission } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  LOGIN_SUCCESS:           { label: 'Login',                color: 'text-emerald-600' },
  LOGIN_BLOCKED_DOMAIN:    { label: 'Bloqueado: domínio',   color: 'text-red-600' },
  LOGIN_BLOCKED_BANNED:    { label: 'Bloqueado: banido',    color: 'text-red-600' },
  USER_INVITED:            { label: 'Convite enviado',      color: 'text-blue-600' },
  USER_CREATED:            { label: 'Usuário criado',       color: 'text-blue-600' },
  USER_PROMOTED:           { label: 'Promovido',            color: 'text-amber-600' },
  USER_DEMOTED:            { label: 'Rebaixado',            color: 'text-gray-600' },
  PERMISSION_GRANTED:      { label: 'Permissão concedida',  color: 'text-emerald-600' },
  PERMISSION_REVOKED:      { label: 'Permissão revogada',   color: 'text-amber-600' },
  USER_SUSPENDED:          { label: 'Suspenso',             color: 'text-amber-600' },
  USER_REACTIVATED:        { label: 'Reativado',            color: 'text-emerald-600' },
  USER_BANNED:             { label: 'BANIDO',               color: 'text-red-700 font-bold' },
  USER_UNBANNED:           { label: 'Banimento removido',   color: 'text-emerald-600' },
  TOKEN_REVOKED:           { label: 'Token revogado',       color: 'text-gray-600' },
  SESSION_REVOKED:         { label: 'Sessão revogada',      color: 'text-gray-600' },
}

export default async function UsuariosPage() {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()
  const [profilesRes, modulesRes, permsRes, eventsRes] = await Promise.all([
    adminClient.from('profiles').select('*').order('created_at', { ascending: true }),
    adminClient.from('modules').select('*').eq('ativo', true).order('ordem'),
    adminClient.from('user_module_permissions').select('*'),
    adminClient.from('security_events').select('*').order('ts', { ascending: false }).limit(50),
  ])

  const events = (eventsRes.data ?? []) as Array<{
    id: string; ts: string; actor_email: string | null; target_email: string | null
    action_type: string; metadata: Record<string, any>
  }>

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-red-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciar Usuários</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Domínio permitido: <strong>@gobeaute.com.br</strong> · Defina role, marcas e
        <strong> permissões por módulo</strong> · Use <strong>Banir</strong> para bloqueio definitivo com auditoria.
      </p>

      <UsuariosClient
        profiles={(profilesRes.data ?? []) as Profile[]}
        modules={(modulesRes.data ?? []) as Module[]}
        permissions={(permsRes.data ?? []) as ModulePermission[]}
        currentUserId={profile.id}
      />

      {/* Security events log */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log de eventos de segurança</h2>
          <span className="text-xs text-gray-400 ml-2">imutável · últimos 50</span>
        </div>
        {events.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-6 text-sm text-gray-400 text-center">
            Nenhum evento de segurança registrado ainda.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-4 py-2 font-medium">Quando</th>
                  <th className="text-left px-4 py-2 font-medium">Ação</th>
                  <th className="text-left px-4 py-2 font-medium">Ator</th>
                  <th className="text-left px-4 py-2 font-medium">Alvo</th>
                  <th className="text-left px-4 py-2 font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {events.map(ev => {
                  const al = ACTION_LABEL[ev.action_type] ?? { label: ev.action_type, color: 'text-gray-500' }
                  const dt = new Date(ev.ts)
                  return (
                    <tr key={ev.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                        {dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className={`px-4 py-2 text-xs ${al.color}`}>{al.label}</td>
                      <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{ev.actor_email ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{ev.target_email ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500 max-w-md truncate">
                        {ev.metadata?.reason ?? Object.entries(ev.metadata ?? {}).map(([k,v]) => `${k}=${v}`).join(' ') ?? ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p><strong className="text-red-600">Admin</strong> — acesso total, sem filtro de marca. Pode gerenciar usuários.</p>
        <p><strong className="text-blue-600">P&D</strong> — pode criar e editar nos módulos liberados, restrito às marcas atribuídas.</p>
        <p><strong className="text-gray-600 dark:text-gray-300">Visualizador</strong> — somente leitura, restrito às marcas e módulos atribuídos.</p>
        <p className="pt-1">Permissões por módulo se sobrepõem ao role. <strong>Banir</strong> exige motivo e invalida sessões automaticamente.</p>
      </div>
    </div>
  )
}
