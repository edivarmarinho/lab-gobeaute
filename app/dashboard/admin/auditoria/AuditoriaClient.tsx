'use client'

import { useState, useMemo } from 'react'
import { History, Activity, Filter, User, Clock, Search } from 'lucide-react'
import { clsx } from 'clsx'

type Tab = 'audit' | 'sessions'

const ACAO_CONFIG: Record<string, { label: string; color: string }> = {
  create:        { label: 'Criação',        color: 'bg-green-50 text-green-700' },
  update:        { label: 'Atualização',    color: 'bg-blue-50 text-blue-700' },
  delete:        { label: 'Exclusão',       color: 'bg-red-50 text-red-700' },
  status_change: { label: 'Mudança status', color: 'bg-amber-50 text-amber-700' },
  approve:       { label: 'Aprovação',      color: 'bg-emerald-50 text-emerald-700' },
  reject:        { label: 'Rejeição',       color: 'bg-rose-50 text-rose-700' },
  view:          { label: 'Visualização',   color: 'bg-gray-50 text-gray-600' },
}

const ENTIDADE_LABEL: Record<string, string> = {
  formulas: 'Fórmula',
  mps: 'Matéria-Prima',
  fornecedores: 'Fornecedor',
  pd_projetos: 'Projeto P&D',
  documentos: 'Documento',
  profiles: 'Usuário',
  user_invites: 'Convite',
}

export default function AuditoriaClient({
  entries,
  sessions,
}: {
  entries: any[]
  sessions: any[]
}) {
  const [tab, setTab] = useState<Tab>('audit')
  const [search, setSearch] = useState('')
  const [filterEntidade, setFilterEntidade] = useState('')
  const [filterAcao, setFilterAcao] = useState('')

  const entriesFiltrados = useMemo(() => {
    return entries.filter(e => {
      if (filterEntidade && e.entidade !== filterEntidade) return false
      if (filterAcao && e.acao !== filterAcao) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (e.usuario_email ?? '').toLowerCase().includes(q) ||
          (e.usuario_nome ?? '').toLowerCase().includes(q) ||
          (e.entidade ?? '').toLowerCase().includes(q) ||
          (e.campo ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [entries, search, filterEntidade, filterAcao])

  const entidades = [...new Set(entries.map(e => e.entidade))].sort()

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {([
          { key: 'audit',    label: 'Audit Trail',  icon: History,  count: entries.length },
          { key: 'sessions', label: 'Sessões',      icon: Activity, count: sessions.length },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2',
              tab === t.key ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'audit' && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por usuário, entidade, campo..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <select
              value={filterEntidade}
              onChange={e => setFilterEntidade(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todas as entidades</option>
              {entidades.map(e => (
                <option key={e} value={e}>{ENTIDADE_LABEL[e] ?? e}</option>
              ))}
            </select>
            <select
              value={filterAcao}
              onChange={e => setFilterAcao(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Todas as ações</option>
              {Object.entries(ACAO_CONFIG).map(([key, c]) => (
                <option key={key} value={key}>{c.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 ml-auto">{entriesFiltrados.length} registros</p>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {entriesFiltrados.length === 0 ? (
              <div className="p-12 text-center">
                <History className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Nenhuma alteração registrada ainda</p>
                <p className="text-xs text-gray-300 mt-1">O audit trail captura automaticamente todas as alterações no sistema</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Quando</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Usuário</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Ação</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Entidade</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Campo</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">Mudança</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entriesFiltrados.slice(0, 200).map(e => {
                    const acao = ACAO_CONFIG[e.acao] ?? { label: e.acao, color: 'bg-gray-50 text-gray-600' }
                    const data = new Date(e.created_at)
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <p className="text-xs text-gray-700">{data.toLocaleDateString('pt-BR')}</p>
                          <p className="text-xs text-gray-400">{data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-medium text-gray-900">{e.usuario_nome ?? '—'}</p>
                          <p className="text-xs text-gray-400">{e.usuario_email ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={clsx('text-xs px-2 py-0.5 rounded font-medium', acao.color)}>
                            {acao.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-medium text-gray-700">{ENTIDADE_LABEL[e.entidade] ?? e.entidade}</p>
                          {e.entidade_id && <p className="text-xs text-gray-400 font-mono">{String(e.entidade_id).slice(0, 8)}</p>}
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className="text-xs text-gray-500 font-mono">{e.campo ?? '—'}</span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          {e.valor_antes && e.valor_depois ? (
                            <div className="text-xs space-y-0.5">
                              <p className="text-red-600 line-through truncate max-w-xs">{String(e.valor_antes).slice(0, 40)}</p>
                              <p className="text-green-700 truncate max-w-xs">{String(e.valor_depois).slice(0, 40)}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{String(e.valor_depois ?? '—').slice(0, 40)}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {entriesFiltrados.length > 200 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
                Exibindo 200 de {entriesFiltrados.length} registros. Use os filtros para refinar.
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'sessions' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhuma sessão registrada ainda</p>
              <p className="text-xs text-gray-300 mt-1">As sessões serão registradas conforme usuários fizerem login</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Usuário</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Login</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Logout</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden md:table-cell">Duração</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500 hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-gray-900">{s.usuario_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs text-gray-700">{new Date(s.signed_in_at).toLocaleString('pt-BR')}</p>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {s.signed_out_at ? (
                        <p className="text-xs text-gray-700">{new Date(s.signed_out_at).toLocaleString('pt-BR')}</p>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">Ativa</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {s.duracao_min ? (
                        <span className="text-xs text-gray-500">{s.duracao_min < 60 ? `${s.duracao_min} min` : `${Math.floor(s.duracao_min / 60)}h ${s.duracao_min % 60}min`}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-400 font-mono">{s.ip_address ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
