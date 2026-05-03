'use client'

import { useState } from 'react'
import type { Profile, UserRole, Module, ModulePermission } from '@/lib/types'
import { MARCAS_DISPONIVEIS, ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { clsx } from 'clsx'
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Lock, Unlock, Eye, Pencil } from 'lucide-react'

type Props = {
  profiles: Profile[]
  modules: Module[]
  permissions: ModulePermission[]
  currentUserId: string
}

type PermMap = Record<string, { can_read: boolean; can_write: boolean }>

export default function UsuariosClient({ profiles, modules, permissions, currentUserId }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [localProfiles, setLocalProfiles] = useState(profiles)

  // Mapa { user_id → { module_id → {read,write} } }
  const initialPerms: Record<string, PermMap> = {}
  for (const p of permissions) {
    if (!initialPerms[p.user_id]) initialPerms[p.user_id] = {}
    initialPerms[p.user_id][p.module_id] = { can_read: p.can_read, can_write: p.can_write }
  }
  const [permsByUser, setPermsByUser] = useState<Record<string, PermMap>>(initialPerms)

  async function patchUser(id: string, updates: { role?: UserRole; marcas?: string[]; ativo?: boolean }) {
    setSaving(id)
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n })
    setSuccess(prev => { const n = { ...prev }; delete n[id]; return n })
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      setLocalProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
      setSuccess(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setSuccess(prev => { const n = { ...prev }; delete n[id]; return n }), 3000)
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message ?? 'Erro ao salvar' }))
    } finally {
      setSaving(null)
    }
  }

  async function savePermissions(id: string, perms: PermMap) {
    setSaving(id)
    try {
      const payload = Object.entries(perms).map(([module_id, p]) => ({
        module_id,
        can_read: p.can_read,
        can_write: p.can_write,
      }))
      const res = await fetch(`/api/admin/usuarios/${id}/permissoes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar permissões')
      setSuccess(prev => ({ ...prev, [id]: true }))
      setTimeout(() => setSuccess(prev => { const n = { ...prev }; delete n[id]; return n }), 3000)
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message ?? 'Erro ao salvar' }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-3">
      {localProfiles.map(p => (
        <UsuarioCard
          key={p.id}
          profile={p}
          modules={modules}
          perms={permsByUser[p.id] ?? {}}
          isSelf={p.id === currentUserId}
          saving={saving === p.id}
          error={errors[p.id] ?? null}
          saved={success[p.id] ?? false}
          onPatchUser={updates => patchUser(p.id, updates)}
          onUpdatePerms={newPerms => {
            setPermsByUser(prev => ({ ...prev, [p.id]: newPerms }))
          }}
          onSavePerms={() => savePermissions(p.id, permsByUser[p.id] ?? {})}
        />
      ))}
    </div>
  )
}

function UsuarioCard({
  profile, modules, perms, isSelf, saving, error, saved,
  onPatchUser, onUpdatePerms, onSavePerms,
}: {
  profile: Profile
  modules: Module[]
  perms: PermMap
  isSelf: boolean
  saving: boolean
  error: string | null
  saved: boolean
  onPatchUser: (u: { role?: UserRole; marcas?: string[]; ativo?: boolean }) => void
  onUpdatePerms: (p: PermMap) => void
  onSavePerms: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [marcas, setMarcas] = useState(profile.marcas)
  const [role, setRole] = useState<UserRole>(profile.role)
  const ativo = profile.ativo ?? true
  const isAdmin = role === 'admin'

  function toggleMarca(marca: string) {
    setMarcas(prev => prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca])
  }

  function setPerm(moduleId: string, key: 'can_read' | 'can_write', value: boolean) {
    const current = perms[moduleId] ?? { can_read: false, can_write: false }
    const next = { ...current, [key]: value }
    if (key === 'can_write' && value) next.can_read = true
    if (key === 'can_read' && !value) next.can_write = false
    onUpdatePerms({ ...perms, [moduleId]: next })
  }

  const hasChangesBasic = role !== profile.role
    || JSON.stringify(marcas.sort()) !== JSON.stringify([...profile.marcas].sort())

  const totalLiberados = Object.values(perms).filter(p => p.can_read || p.can_write).length

  return (
    <div className={clsx(
      'bg-white rounded-xl border shadow-sm overflow-hidden transition',
      ativo ? 'border-gray-100' : 'border-red-200 bg-red-50/30'
    )}>
      <div className="p-4 grid grid-cols-12 gap-3 items-center">
        <div className="col-span-12 md:col-span-3 flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="w-10 h-10 rounded-full shrink-0" alt="" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-brand-600 font-bold text-sm">{(profile.nome ?? profile.email ?? '?').charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{profile.nome ?? '—'}</p>
            <p className="text-xs text-gray-400 truncate">{profile.email}</p>
            {!ativo && <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">DESATIVADO</span>}
          </div>
        </div>

        <div className="col-span-6 md:col-span-2">
          <select
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            disabled={!ativo}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:bg-gray-50"
          >
            <option value="viewer">Visualizador</option>
            <option value="pd">P&D</option>
            <option value="admin">Admin</option>
          </select>
          <span className={clsx('mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium', ROLE_BADGE_COLOR[role])}>
            {ROLE_LABEL[role]}
          </span>
        </div>

        <div className="col-span-6 md:col-span-4 text-xs text-gray-500">
          {isAdmin ? (
            <span className="italic">Admin — acesso total a marcas</span>
          ) : (
            <span>{marcas.length === 0 ? 'Sem marcas' : marcas.join(', ')}</span>
          )}
        </div>

        <div className="col-span-6 md:col-span-2 text-xs text-gray-500">
          {isAdmin ? (
            <span className="italic">Acesso total a módulos</span>
          ) : (
            <span>{totalLiberados} de {modules.length} módulos</span>
          )}
        </div>

        <div className="col-span-6 md:col-span-1 flex justify-end">
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            title="Expandir"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">
          {/* Marcas */}
          {!isAdmin && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Marcas com acesso</p>
              <div className="flex flex-wrap gap-1.5">
                {MARCAS_DISPONIVEIS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMarca(m)}
                    className={clsx(
                      'text-xs px-2.5 py-1 rounded-full border font-medium transition',
                      marcas.includes(m)
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600'
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {hasChangesBasic && (
                <button
                  onClick={() => onPatchUser({ role, marcas })}
                  disabled={saving}
                  className="mt-2 text-xs px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar role e marcas'}
                </button>
              )}
            </div>
          )}

          {/* Permissões por módulo */}
          {!isAdmin && (
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Permissões por módulo</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {modules.map(mod => {
                  const p = perms[mod.id] ?? { can_read: false, can_write: false }
                  return (
                    <div key={mod.id} className="bg-white rounded-lg border border-gray-100 p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{mod.label}{mod.admin_only && <span className="ml-1 text-[10px] text-red-500">admin</span>}</p>
                        {mod.descricao && <p className="text-[10px] text-gray-400 truncate">{mod.descricao}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setPerm(mod.id, 'can_read', !p.can_read)}
                          className={clsx(
                            'p-1.5 rounded border text-xs transition',
                            p.can_read ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                          )}
                          title="Leitura"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setPerm(mod.id, 'can_write', !p.can_write)}
                          className={clsx(
                            'p-1.5 rounded border text-xs transition',
                            p.can_write ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                          )}
                          title="Escrita"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={onSavePerms}
                disabled={saving}
                className="mt-3 text-xs px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar permissões'}
              </button>
            </div>
          )}

          {/* Bloquear/desbloquear */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {ativo
                ? 'Usuário ativo — pode logar normalmente.'
                : `Usuário desativado em ${profile.desativado_em?.split('T')[0] ?? '—'}.`}
            </div>
            <button
              onClick={() => onPatchUser({ ativo: !ativo })}
              disabled={saving || isSelf}
              title={isSelf ? 'Você não pode desativar a si mesmo' : ''}
              className={clsx(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition',
                ativo
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
                (saving || isSelf) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {ativo ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {ativo ? 'Bloquear acesso' : 'Reativar usuário'}
            </button>
          </div>
        </div>
      )}

      {(error || saved) && (
        <div className="px-4 py-2 border-t border-gray-100 text-xs">
          {saved && <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Salvo</span>}
          {error && <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="w-3 h-3 shrink-0" /> {error}</span>}
        </div>
      )}
    </div>
  )
}
