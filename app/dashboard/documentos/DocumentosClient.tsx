'use client'

import { useState, useMemo } from 'react'
import { FileText, Search, ExternalLink, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { clsx } from 'clsx'

type Doc = {
  id: string
  nome: string
  tipo: string | null
  mp_codigo: string | null
  fornecedor_nome: string | null
  status: string | null
  data_validade: string | null
  drive_url: string | null
}

const STATUS_COLOR: Record<string, string> = {
  'Aprovado':    'bg-green-100 text-green-700',
  'Em Revisão':  'bg-yellow-100 text-yellow-700',
  'Pendente':    'bg-gray-100 text-gray-600',
  'Vencido':     'bg-red-100 text-red-700',
  'Rejeitado':   'bg-red-100 text-red-700',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function validadeInfo(iso: string | null): { label: string; cls: string; icon: React.ReactNode } | null {
  if (!iso) return null
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return { label: 'Vencido',            cls: 'text-red-600',    icon: <AlertTriangle className="w-3 h-3" /> }
  if (diff <= 15) return { label: `Vence em ${diff}d`,  cls: 'text-red-600',    icon: <AlertTriangle className="w-3 h-3" /> }
  if (diff <= 60) return { label: `Vence em ${diff}d`,  cls: 'text-amber-600',  icon: <Clock className="w-3 h-3" /> }
  return { label: formatDate(iso), cls: 'text-gray-500', icon: <CheckCircle2 className="w-3 h-3 text-green-400" /> }
}

const TIPOS = ['FISPQ', 'COA', 'Ficha Técnica', 'ISO 22716', 'ISO 9001', 'Laudo Micro', 'Laudo Estabilidade', 'Outros']

export default function DocumentosClient({ documentos }: { documentos: Doc[] }) {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return documentos.filter(d => {
      const matchSearch = !q ||
        d.nome.toLowerCase().includes(q) ||
        (d.mp_codigo ?? '').toLowerCase().includes(q) ||
        (d.fornecedor_nome ?? '').toLowerCase().includes(q)
      const matchTipo   = !filterTipo   || d.tipo === filterTipo
      const matchStatus = !filterStatus || d.status === filterStatus
      return matchSearch && matchTipo && matchStatus
    })
  }, [documentos, search, filterTipo, filterStatus])

  const vencendo = documentos.filter(d => {
    if (!d.data_validade) return false
    const diff = (new Date(d.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff < 30
  }).length

  return (
    <>
      {/* Alerta de docs vencendo */}
      {vencendo > 0 && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span><strong>{vencendo}</strong> documento{vencendo > 1 ? 's' : ''} vencendo nos próximos 30 dias.</span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, código MP ou fornecedor..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="">Todos os status</option>
          {['Aprovado', 'Em Revisão', 'Pendente', 'Vencido', 'Rejeitado'].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="text-xs text-gray-400 self-center">{filtered.length} de {documentos.length}</span>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
          <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">MP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Fornecedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => {
                const val = validadeInfo(d.data_validade)
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        {d.drive_url
                          ? (
                            <a
                              href={d.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-brand-500 hover:underline flex items-center gap-1 truncate"
                            >
                              {d.nome}
                              <ExternalLink className="w-3 h-3 shrink-0 text-gray-400" />
                            </a>
                          )
                          : <span className="truncate">{d.nome}</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{d.tipo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono hidden md:table-cell">{d.mp_codigo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{d.fornecedor_nome ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        STATUS_COLOR[d.status ?? ''] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {d.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {val ? (
                        <span className={clsx('flex items-center gap-1 text-xs font-medium', val.cls)}>
                          {val.icon}
                          {val.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </>
  )
}
