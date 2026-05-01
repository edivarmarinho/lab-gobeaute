'use client'

import { useState } from 'react'
import type { Profile, UserRole } from '@/lib/types'
import { MARCAS_DISPONIVEIS, ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { clsx } from 'clsx'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

export default function UsuariosClient({ profiles }: { profiles: Profile[] }) {
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [localProfiles, setLocalProfiles] = useState(profiles)

  async function updateUser(id: string, updates: { role?: UserRole; marcas?: string[] }) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Usuário</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
            <th className="text-left px-5 py-3 font-medium text-gray-500">Marcas com acesso</th>
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
              onUpdate={updates => updateUser(p.id, updates)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsuarioRow({
  profile,
  saving,
  error,
  saved,
  onUpdate,
}: {
  profile: Profile
  saving: boolean
  error: string | null
  saved: boolean
  onUpdate: (u: { role?: UserRole; marcas?: string[] }) => void
}) {
  const [marcas, setMarcas] = useState(profile.marcas)
  const [role, setRole] = useState<UserRole>(profile.role)
  const isAdmin = role === 'admin'

  function toggleMarca(marca: string) {
    setMarcas(prev =>
      prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca]
    )
  }

  const hasChanges = role !== profile.role || JSON.stringify(marcas.sort()) !== JSON.stringify([...profile.marcas].sort())

  return (
    <tr className="hover:bg-gray-50 transition align-top">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="w-8 h-8 rounded-full shrink-0" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-brand-600 font-bold text-xs">{(profile.nome ?? profile.email ?? '?').charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{profile.nome ?? '—'}</p>
            <p className="text-xs text-gray-400">{profile.email}</p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <select
          value={role}
          onChange={e => setRole(e.target.value as UserRole)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="viewer">Visualizador</option>
          <option value="pd">P&D</option>
          <option value="admin">Admin</option>
        </select>
        <div className="mt-1.5">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_BADGE_COLOR[role])}>
            {ROLE_LABEL[role]}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        {isAdmin ? (
          <span className="text-xs text-gray-400 italic">Admin — acesso total (sem filtro)</span>
        ) : (
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
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => onUpdate({ role, marcas: isAdmin ? [] : marcas })}
            disabled={saving || !hasChanges}
            className={clsx(
              'text-xs px-4 py-2 rounded-lg font-medium transition',
              hasChanges && !saving
                ? 'bg-brand-500 text-white hover:bg-brand-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Salvo
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-600 max-w-32 text-right">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {error}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}
