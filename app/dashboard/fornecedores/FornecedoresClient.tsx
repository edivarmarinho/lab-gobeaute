'use client'

import { useState, useMemo } from 'react'
import { Users, Search, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Package, FileWarning, Shield, ShieldOff } from 'lucide-react'
import { clsx } from 'clsx'

const STATUS_CONFIG: Record<string, { color: string; dot: string }> = {
  'Homologado':   { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  'Em Avaliação': { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  'Reprovado':    { color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  'Inativo':      { color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
}

const CRM_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  green:  { color: 'text-green-700',  bg: 'bg-green-50 border-green-100',  icon: '✅' },
  yellow: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100', icon: '⚠️' },
  red:    { color: 'text-red-700',    bg: 'bg-red-50 border-red-100',       icon: '🚨' },
  blue:   { color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',     icon: 'ℹ️' },
}

type Fornecedor = { id: string; nome: string; uf: string; cnpj: string | null; contato: string | null; status: string; iso22716: boolean; iso9001: boolean; pendencias: number; mps_ativas: number; [k: string]: any }
type CRMEvent = { id: string; fornecedor_id: string; tipo: string; titulo: string; detalhe: string | null; data_evento: string | null }

export default function FornecedoresClient({ fornecedores, crm, canEdit }: {
  fornecedores: Fornecedor[]
  crm: CRMEvent[]
  canEdit: boolean
}) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterISO, setFilterISO] = useState<string>('todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return fornecedores.filter(f => {
      const matchSearch = search === '' ||
        f.nome.toLowerCase().includes(search.toLowerCase()) ||
        (f.contato ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'todos' || f.status === filterStatus
      const matchISO = filterISO === 'todos' ||
        (filterISO === 'iso22716' && f.iso22716) ||
        (filterISO === 'sem_iso' && !f.iso22716)
      return matchSearch && matchStatus && matchISO
    })
  }, [fornecedores, search, filterStatus, filterISO])

  const homologados = fornecedores.filter(f => f.status === 'Homologado').length
  const emAvaliacao = fornecedores.filter(f => f.status === 'Em Avaliação').length
  const comPendencias = fornecedores.filter(f => f.pendencias > 0).length

  const crmByForn = useMemo(() => {
    const m: Record<string, CRMEvent[]> = {}
    for (const ev of crm) {
      if (!m[ev.fornecedor_id]) m[ev.fornecedor_id] = []
      m[ev.fornecedor_id].push(ev)
    }
    return m
  }, [crm])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
        <span className="text-sm text-gray-400 ml-1">{fornecedores.length} cadastrados</span>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Homologados',  value: homologados,  color: 'text-green-600',  bg: 'bg-green-50',  icon: CheckCircle2 },
          { label: 'Em Avaliação', value: emAvaliacao,  color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle },
          { label: 'Com Pendências', value: comPendencias, color: 'text-red-600',  bg: 'bg-red-50',    icon: FileWarning },
          { label: 'Com ISO 22716', value: fornecedores.filter(f => f.iso22716).length, color: 'text-blue-600', bg: 'bg-blue-50', icon: Shield },
        ].map(kpi => (
          <div key={kpi.label} className={clsx('rounded-xl p-4 border', kpi.bg, 'border-transparent')}>
            <div className="flex items-center gap-2">
              <kpi.icon className={clsx('w-4 h-4', kpi.color)} />
              <span className="text-xs text-gray-500">{kpi.label}</span>
            </div>
            <p className={clsx('text-2xl font-bold mt-1', kpi.color)}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou contato..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="todos">Todos os status</option>
          <option value="Homologado">Homologado</option>
          <option value="Em Avaliação">Em Avaliação</option>
          <option value="Reprovado">Reprovado</option>
          <option value="Inativo">Inativo</option>
        </select>
        <select
          value={filterISO}
          onChange={e => setFilterISO(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="todos">Todos (ISO)</option>
          <option value="iso22716">Com ISO 22716</option>
          <option value="sem_iso">Sem ISO 22716</option>
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(f => {
          const isExpanded = expanded === f.id
          const events = crmByForn[f.id] ?? []
          const cfg = STATUS_CONFIG[f.status] ?? STATUS_CONFIG['Inativo']
          const hasCritical = events.some(e => e.tipo === 'red')

          return (
            <div
              key={f.id}
              className={clsx(
                'bg-white rounded-xl border shadow-sm transition-all',
                hasCritical ? 'border-red-200' : 'border-gray-100',
                isExpanded && 'shadow-md'
              )}
            >
              {/* Row principal */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : f.id)}
              >
                {/* Avatar inicial */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">{f.nome.charAt(0)}</span>
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate">{f.nome}</p>
                    {hasCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{f.contato ?? '—'}</p>
                </div>

                {/* Status */}
                <span className={clsx('shrink-0 text-xs px-2.5 py-1 rounded-full font-medium', cfg.color)}>
                  <span className={clsx('inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle', cfg.dot)} />
                  {f.status}
                </span>

                {/* ISO badges */}
                <div className="flex gap-1.5 shrink-0">
                  <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
                    f.iso22716 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                  )}>
                    22716
                  </span>
                  <span className={clsx('text-xs px-2 py-0.5 rounded font-medium',
                    f.iso9001 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400 line-through'
                  )}>
                    9001
                  </span>
                </div>

                {/* MPs + pendências */}
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Package className="w-3.5 h-3.5" />
                    {f.mps_ativas} MPs
                  </span>
                  {f.pendencias > 0 && (
                    <span className="bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                      {f.pendencias} pend.
                    </span>
                  )}
                </div>

                {/* Chevron */}
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                }
              </div>

              {/* Expanded: detalhes + CRM */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Dados cadastrais */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dados Cadastrais</h4>
                      <div className="space-y-2 text-sm">
                        {f.cnpj && (
                          <div className="flex gap-2">
                            <span className="text-gray-400 w-16 shrink-0">CNPJ</span>
                            <span className="font-mono text-gray-700">{f.cnpj}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <span className="text-gray-400 w-16 shrink-0">UF</span>
                          <span className="text-gray-700">{f.uf}</span>
                        </div>
                        {f.contato && (
                          <div className="flex gap-2">
                            <span className="text-gray-400 w-16 shrink-0">Contato</span>
                            <a href={`mailto:${f.contato}`} className="text-brand-600 hover:underline">{f.contato}</a>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          {f.iso22716
                            ? <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded"><Shield className="w-3 h-3" /> ISO 22716 ativo</span>
                            : <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"><ShieldOff className="w-3 h-3" /> Sem ISO 22716</span>
                          }
                          {f.iso9001
                            ? <span className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 px-2 py-1 rounded"><Shield className="w-3 h-3" /> ISO 9001 ativo</span>
                            : <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded"><ShieldOff className="w-3 h-3" /> Sem ISO 9001</span>
                          }
                        </div>
                      </div>
                    </div>

                    {/* CRM */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Histórico CRM ({events.length})
                      </h4>
                      {events.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Nenhum evento registrado.</p>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {events.map(ev => {
                            const crmCfg = CRM_CONFIG[ev.tipo] ?? CRM_CONFIG.blue
                            return (
                              <div key={ev.id} className={clsx('border rounded-lg px-3 py-2', crmCfg.bg)}>
                                <div className="flex items-start gap-2">
                                  <span className="text-sm mt-0.5">{crmCfg.icon}</span>
                                  <div className="min-w-0">
                                    <p className={clsx('text-xs font-semibold', crmCfg.color)}>{ev.titulo}</p>
                                    {ev.detalhe && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ev.detalhe}</p>}
                                    {ev.data_evento && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(ev.data_evento).toLocaleDateString('pt-BR')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
