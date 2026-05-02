'use client'

import { useState, useMemo } from 'react'
import { Package, Search, Filter, ChevronDown, ChevronUp, CheckCircle2, XCircle, FlaskConical, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import type { Profile } from '@/lib/types'
import { MARCAS_DISPONIVEIS } from '@/lib/types'

type Produto = {
  id: string
  sku: string
  descricao: string
  marca: string
  status: string
  pmv: number | null
}

type Formula = {
  id: string
  codigo: string
  produto: string
  marca: string
  status: string
  n_mps: number
  responsavel: string | null
}

const STATUS_FORMULA: Record<string, { label: string; color: string }> = {
  'Aprovada QA':           { label: 'Aprovada QA',      color: 'bg-green-100 text-green-700' },
  'Aprovada Internamente': { label: 'Aprov. Interna',   color: 'bg-yellow-100 text-yellow-700' },
  'Em Estabilidade':       { label: 'Em Estabilidade',  color: 'bg-orange-100 text-orange-700' },
  'Em Desenvolvimento':    { label: 'Em Desenvolvimento', color: 'bg-blue-100 text-blue-700' },
  'Importada BID':         { label: 'BID (a validar)',  color: 'bg-purple-100 text-purple-700' },
  'Arquivada':             { label: 'Arquivada',         color: 'bg-gray-100 text-gray-500' },
}

// Normaliza string para comparação fuzzy
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Tenta associar um produto a uma fórmula pelo nome (fuzzy)
function matchFormula(produto: Produto, formulas: Formula[]): Formula | null {
  const normProd = normalize(produto.descricao)
  const marcaFormulas = formulas.filter(f => f.marca === produto.marca)

  // Match exato por produto.descricao == formula.produto
  const exact = marcaFormulas.find(f => normalize(f.produto) === normProd)
  if (exact) return exact

  // Match parcial — produto contém nome da fórmula ou vice-versa
  const partial = marcaFormulas.find(f => {
    const normF = normalize(f.produto)
    return normProd.includes(normF) || normF.includes(normProd)
  })
  return partial ?? null
}

export default function ProdutosClient({
  produtos,
  formulas,
  profile,
}: {
  produtos: Produto[]
  formulas: Formula[]
  profile: Profile | null
}) {
  const [search, setSearch] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState<string>('Todas')
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'com' | 'sem' | 'bid'>('todos')
  const [sortField, setSortField] = useState<'descricao' | 'marca' | 'status'>('marca')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Apenas produtos ativos
  const produtosAtivos = useMemo(() => produtos.filter(p => p.status === 'Ativo'), [produtos])

  // Construir mapa produto → fórmula
  const produtoComFormula = useMemo(() => {
    return produtosAtivos.map(p => ({
      produto: p,
      formula: matchFormula(p, formulas),
    }))
  }, [produtosAtivos, formulas])

  // Stats por marca
  const statsPorMarca = useMemo(() => {
    const acc: Record<string, { total: number; comFormula: number; bid: number }> = {}
    for (const { produto, formula } of produtoComFormula) {
      const m = produto.marca
      if (!acc[m]) acc[m] = { total: 0, comFormula: 0, bid: 0 }
      acc[m].total++
      if (formula) {
        if (formula.status === 'Importada BID') acc[m].bid++
        else acc[m].comFormula++
      }
    }
    return acc
  }, [produtoComFormula])

  const totalAtivos = produtosAtivos.length
  const totalComFormula = produtoComFormula.filter(({ formula }) => formula && formula.status !== 'Importada BID').length
  const totalBid = produtoComFormula.filter(({ formula }) => formula?.status === 'Importada BID').length
  const coberturaPct = totalAtivos > 0 ? Math.round((totalComFormula / totalAtivos) * 100) : 0

  // Filtro + busca
  const filtrados = useMemo(() => {
    return produtoComFormula
      .filter(({ produto, formula }) => {
        if (marcaFiltro !== 'Todas' && produto.marca !== marcaFiltro) return false
        if (search) {
          const q = search.toLowerCase()
          if (!produto.descricao.toLowerCase().includes(q) && !produto.sku.toLowerCase().includes(q)) return false
        }
        if (statusFiltro === 'com') return formula && formula.status !== 'Importada BID'
        if (statusFiltro === 'sem') return !formula
        if (statusFiltro === 'bid') return formula?.status === 'Importada BID'
        return true
      })
      .sort((a, b) => {
        let va = '', vb = ''
        if (sortField === 'descricao') { va = a.produto.descricao; vb = b.produto.descricao }
        if (sortField === 'marca') { va = a.produto.marca; vb = b.produto.marca }
        if (sortField === 'status') {
          va = a.formula?.status ?? 'zzz'
          vb = b.formula?.status ?? 'zzz'
        }
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
  }, [produtoComFormula, marcaFiltro, search, statusFiltro, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-brand-500" />
      : <ChevronDown className="w-3 h-3 text-brand-500" />
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Package className="w-5 h-5 text-brand-500" />
          <h1 className="text-xl font-bold text-gray-900">Cobertura de Fórmulas por Produto</h1>
        </div>
        <p className="text-sm text-gray-500">Crossover entre SKUs ativos e fórmulas documentadas no Lab.</p>
      </div>

      {/* Cards de resumo por marca */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(statsPorMarca)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([marca, stats]) => {
            const pct = stats.total > 0 ? Math.round((stats.comFormula / stats.total) * 100) : 0
            return (
              <button
                key={marca}
                onClick={() => setMarcaFiltro(marcaFiltro === marca ? 'Todas' : marca)}
                className={clsx(
                  'text-left p-4 rounded-xl border shadow-sm transition',
                  marcaFiltro === marca
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                )}
              >
                <p className="text-xs font-semibold text-gray-600 mb-2 truncate">{marca}</p>
                <div className="flex items-end justify-between mb-2">
                  <p className={clsx(
                    'text-2xl font-bold',
                    pct >= 80 ? 'text-green-600' : pct >= 30 ? 'text-yellow-600' : 'text-red-500'
                  )}>{pct}%</p>
                  <p className="text-xs text-gray-400">{stats.comFormula}/{stats.total}</p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full',
                      pct >= 80 ? 'bg-green-400' : pct >= 30 ? 'bg-yellow-400' : 'bg-red-400'
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {stats.bid > 0 && (
                  <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {stats.bid} a validar (BID)
                  </p>
                )}
              </button>
            )
          })}
      </div>

      {/* Barra de cobertura geral */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Cobertura geral: <span className={clsx('font-bold', coberturaPct >= 80 ? 'text-green-600' : coberturaPct >= 30 ? 'text-yellow-600' : 'text-red-500')}>{coberturaPct}%</span></p>
            <p className="text-xs text-gray-400">{totalComFormula} fórmulas validadas · {totalBid} BID a validar · {totalAtivos - totalComFormula - totalBid} sem fórmula</p>
          </div>
        </div>
        <div className="flex-1 hidden sm:block">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-green-400" style={{ width: `${(totalComFormula / totalAtivos) * 100}%` }} />
            <div className="h-full bg-purple-300" style={{ width: `${(totalBid / totalAtivos) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Validadas</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-300 inline-block" /> BID (a validar)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" /> Sem fórmula</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar produto ou SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 w-56"
          />
        </div>

        <select
          value={marcaFiltro}
          onChange={e => setMarcaFiltro(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="Todas">Todas as marcas</option>
          {MARCAS_DISPONIVEIS.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {[
            { key: 'todos', label: 'Todos' },
            { key: 'com', label: '✅ Com fórmula' },
            { key: 'bid', label: '⚠️ BID' },
            { key: 'sem', label: '❌ Sem fórmula' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFiltro(opt.key as any)}
              className={clsx(
                'text-xs px-3 py-2 font-medium transition border-r last:border-0 border-gray-200',
                statusFiltro === opt.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 ml-auto">{filtrados.length} produtos</p>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('marca')} className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-700">
                  Marca <SortIcon field="marca" />
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('descricao')} className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-700">
                  Produto <SortIcon field="descricao" />
                </button>
              </th>
              <th className="text-left px-4 py-3 hidden md:table-cell font-medium text-gray-500">SKU</th>
              <th className="text-left px-4 py-3">
                <button onClick={() => toggleSort('status')} className="flex items-center gap-1 font-medium text-gray-500 hover:text-gray-700">
                  Fórmula <SortIcon field="status" />
                </button>
              </th>
              <th className="text-left px-4 py-3 hidden lg:table-cell font-medium text-gray-500">Código</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell font-medium text-gray-500">Responsável</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.slice(0, 200).map(({ produto, formula }) => (
              <tr key={produto.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-gray-700">{produto.marca}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{produto.descricao}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-mono text-gray-400">{produto.sku}</span>
                </td>
                <td className="px-4 py-3">
                  {formula ? (
                    <div className="flex items-center gap-1.5">
                      {formula.status === 'Importada BID'
                        ? <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                        : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      }
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        STATUS_FORMULA[formula.status]?.color ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {STATUS_FORMULA[formula.status]?.label ?? formula.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-gray-300 shrink-0" />
                      <span className="text-xs text-gray-400">Sem fórmula</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-mono text-gray-400">{formula?.codigo ?? '—'}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-gray-400">{formula?.responsavel ?? '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length > 200 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400 text-center">
            Exibindo 200 de {filtrados.length} resultados. Use os filtros para refinar.
          </div>
        )}
        {filtrados.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-400 text-sm">
            Nenhum produto encontrado com os filtros aplicados.
          </div>
        )}
      </div>
    </div>
  )
}
