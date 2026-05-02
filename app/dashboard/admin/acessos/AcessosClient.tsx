'use client'

import { useState } from 'react'
import {
  Users, Mail, Plus, Trash2, CheckCircle2, AlertTriangle, Clock,
  ChevronDown, Copy, X, Shield, Eye, Pencil, Send
} from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile, UserRole } from '@/lib/types'
import { MARCAS_DISPONIVEIS, ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'

type Invite = {
  id: string
  email: string
  role: UserRole
  marcas: string[]
  status: 'pendente' | 'aceito' | 'expirado' | 'cancelado'
  convidado_por_nome: string | null
  expires_at: string
  created_at: string
}

type Tab = 'usuarios' | 'convites'

export default function AcessosClient({
  profiles,
  invites: initialInvites,
}: {
  profiles: Profile[]
  invites: Invite[]
}) {
  const [tab, setTab] = useState<Tab>('usuarios')
  const [invites, setInvites] = useState(initialInvites)
  const [showConviteForm, setShowConviteForm] = useState(false)

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'usuarios', label: 'Usuários', icon: Users, count: profiles.length },
          { key: 'convites', label: 'Convites', icon: Mail, count: invites.filter(i => i.status === 'pendente').length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2',
              tab === t.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full font-medium',
                tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Usuários */}
      {tab === 'usuarios' && (
        <TabelaUsuarios profiles={profiles} />
      )}

      {/* Tab: Convites */}
      {tab === 'convites' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Gerencie convites enviados para novos colaboradores.</p>
            <button
              onClick={() => setShowConviteForm(true)}
              className="flex items-center gap-1.5 text-sm bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-600 transition font-medium"
            >
              <Plus className="w-4 h-4" />
              Novo convite
            </button>
          </div>

          {showConviteForm && (
            <FormNovoConvite
              onClose={() => setShowConviteForm(false)}
              onCreated={(inv) => {
                setInvites(prev => [inv, ...prev])
                setShowConviteForm(false)
              }}
            />
          )}

          <TabelaConvites invites={invites} onUpdate={setInvites} />
        </div>
      )}
    </div>
  )
}

// ─── Tabela de Usuários ───────────────────────────────────────────────────────

function TabelaUsuarios({ profiles }: { profiles: Profile[] }) {
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [localProfiles, setLocalProfiles] = useState(profiles)
  const [editando, setEditando] = useState<string | null>(null)

  async function updateUser(id: string, updates: { role?: UserRole; marcas?: string[] }) {
    setSaving(id)
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n })
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
      setEditando(null)
      setTimeout(() => setSuccess(prev => { const n = { ...prev }; delete n[id]; return n }), 3000)
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [id]: err.message ?? 'Erro' }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Colaborador</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Último acesso</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Nível</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Marcas</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {localProfiles.map(p => (
            <UsuarioRow
              key={p.id}
              profile={p}
              saving={saving === p.id}
              error={errors[p.id] ?? null}
              saved={success[p.id] ?? false}
              editando={editando === p.id}
              onEdit={() => setEditando(editando === p.id ? null : p.id)}
              onSave={updates => updateUser(p.id, updates)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsuarioRow({
  profile, saving, error, saved, editando, onEdit, onSave,
}: {
  profile: Profile
  saving: boolean
  error: string | null
  saved: boolean
  editando: boolean
  onEdit: () => void
  onSave: (u: { role?: UserRole; marcas?: string[] }) => void
}) {
  const [marcas, setMarcas] = useState(profile.marcas)
  const [role, setRole] = useState<UserRole>(profile.role)
  const isAdmin = role === 'admin'
  const hasChanges = role !== profile.role || JSON.stringify([...marcas].sort()) !== JSON.stringify([...profile.marcas].sort())

  function toggleMarca(marca: string) {
    setMarcas(prev => prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca])
  }

  return (
    <tr className={clsx('transition align-top', editando ? 'bg-brand-50/50' : 'hover:bg-gray-50')}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="w-8 h-8 rounded-full shrink-0" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-brand-600 font-bold text-xs">
                {(profile.nome ?? profile.email ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{profile.nome ?? '—'}</p>
            <p className="text-xs text-gray-400">{profile.email}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 hidden md:table-cell">
        <span className="text-xs text-gray-400">—</span>
      </td>

      <td className="px-5 py-4">
        {editando ? (
          <select
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="viewer">Visualizador</option>
            <option value="pd">P&D</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_BADGE_COLOR[profile.role])}>
            {ROLE_LABEL[profile.role]}
          </span>
        )}
      </td>

      <td className="px-5 py-4 hidden lg:table-cell">
        {editando ? (
          isAdmin ? (
            <span className="text-xs text-gray-400 italic">Acesso total</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {MARCAS_DISPONIVEIS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMarca(m)}
                  className={clsx(
                    'text-xs px-2 py-0.5 rounded-full border font-medium transition',
                    marcas.includes(m)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-1">
            {profile.role === 'admin' ? (
              <span className="text-xs text-gray-400 italic">Todas</span>
            ) : profile.marcas.length > 0 ? (
              profile.marcas.map(m => (
                <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{m}</span>
              ))
            ) : (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Nenhuma marca
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex flex-col items-end gap-1">
          {editando ? (
            <div className="flex gap-2">
              <button
                onClick={() => onSave({ role, marcas: isAdmin ? [] : marcas })}
                disabled={saving || !hasChanges}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition',
                  hasChanges && !saving
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={onEdit}
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-gray-500 hover:bg-gray-100 transition"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={onEdit}
              className="text-xs flex items-center gap-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 px-2 py-1.5 rounded-lg transition"
            >
              <Pencil className="w-3 h-3" /> Editar
            </button>
          )}
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Salvo
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Tabela de Convites ───────────────────────────────────────────────────────

function TabelaConvites({ invites, onUpdate }: { invites: Invite[]; onUpdate: (i: Invite[]) => void }) {
  const [canceling, setCanceling] = useState<string | null>(null)

  const STATUS_CONFIG = {
    pendente:  { label: 'Pendente',  color: 'bg-yellow-50 text-yellow-700', icon: Clock },
    aceito:    { label: 'Aceito',    color: 'bg-green-50 text-green-700',  icon: CheckCircle2 },
    expirado:  { label: 'Expirado',  color: 'bg-gray-100 text-gray-500',   icon: X },
    cancelado: { label: 'Cancelado', color: 'bg-red-50 text-red-600',      icon: X },
  }

  async function cancelarConvite(id: string) {
    setCanceling(id)
    try {
      const res = await fetch(`/api/admin/convites/${id}`, { method: 'DELETE' })
      if (res.ok) {
        onUpdate(invites.map(i => i.id === id ? { ...i, status: 'cancelado' as const } : i))
      }
    } finally {
      setCanceling(null)
    }
  }

  if (invites.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <Mail className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Nenhum convite enviado ainda</p>
        <p className="text-xs text-gray-300 mt-1">Clique em "Novo convite" para adicionar colaboradores</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-5 py-3 font-medium text-gray-500">E-mail convidado</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Nível</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Enviado em</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {invites.map(inv => {
            const cfg = STATUS_CONFIG[inv.status]
            const StatusIcon = cfg.icon
            return (
              <tr key={inv.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{inv.email}</p>
                  {inv.convidado_por_nome && (
                    <p className="text-xs text-gray-400">Convidado por {inv.convidado_por_nome}</p>
                  )}
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_BADGE_COLOR[inv.role])}>
                    {ROLE_LABEL[inv.role]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={clsx('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </td>
                <td className="px-5 py-3 hidden md:table-cell">
                  <span className="text-xs text-gray-400">
                    {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {inv.status === 'pendente' && (
                    <button
                      onClick={() => cancelarConvite(inv.id)}
                      disabled={canceling === inv.id}
                      className="text-xs text-red-400 hover:text-red-600 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      {canceling === inv.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Formulário de Novo Convite ───────────────────────────────────────────────

function FormNovoConvite({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (inv: Invite) => void
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('viewer')
  const [marcas, setMarcas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleMarca(m: string) {
    setMarcas(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('E-mail inválido'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/convites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, marcas: role === 'admin' ? [] : marcas }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar convite')
      onCreated(json.invite)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-brand-50 border border-brand-100 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-brand-500" />
          Enviar convite
        </h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">E-mail do colaborador *</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nome@gobeaute.com.br"
            required
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Nível de acesso *</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as UserRole)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            <option value="viewer">Visualizador</option>
            <option value="pd">P&D</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {role !== 'admin' && (
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-2">Marcas com acesso</label>
          <div className="flex flex-wrap gap-1.5">
            {MARCAS_DISPONIVEIS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggleMarca(m)}
                className={clsx(
                  'text-xs px-2.5 py-1 rounded-full border font-medium transition',
                  marcas.includes(m)
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !email}
          className="text-sm px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar convite'}
        </button>
      </div>
    </form>
  )
}
