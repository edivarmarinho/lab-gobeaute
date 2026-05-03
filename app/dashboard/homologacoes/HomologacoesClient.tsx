'use client'

import { useMemo, useState } from 'react'
import { ClipboardCheck, TrendingDown, Users, Beaker, Search, ArrowDownUp, MapPin, Calendar } from 'lucide-react'

export type ProjetoHom = {
  id: string
  codigo: string
  nome: string
  mp_codigo: string
  fornecedor_nome: string
  etapa: string
  status: string
  saving_estimado_usd: number | null
  saving_pct: number | null
  preco_referencia_usd: number | null
  preco_decidido_usd: number | null
  volume_anual_kg: number | null
  moq: string | null
  lead_time_estoque: string | null
  lead_time_sem_estoque: string | null
  acao_observacao: string | null
  data_decisao: string | null
  estado_fornecedor: string | null
  homologado_no_bid: string | null
  created_at: string
}

type KPIs = {
  totalAHomologar: number
  totalDecididos: number
  savingDecididoAbs: number
  savingPotencialAbs: number
  fornecedoresUnicos: number
  mpsUnicos: number
}

const fmtUSD = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const fmtNum = (v: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)

const fmtPct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

type SortKey = 'saving' | 'mp' | 'fornecedor' | 'volume'

export default function HomologacoesClient({ items, kpis }: { items: ProjetoHom[]; kpis: KPIs }) {
  const [search, setSearch] = useState('')
  const [forn, setForn] = useState<string>('')
  const [etapa, setEtapa] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('saving')

  const fornecedoresLista = useMemo(() => {
    return Array.from(new Set(items.map(i => i.fornecedor_nome).filter(Boolean))).sort()
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let arr = items.filter(i => {
      if (forn && i.fornecedor_nome !== forn) return false
      if (etapa && i.etapa !== etapa) return false
      if (q && !`${i.mp_codigo} ${i.nome} ${i.fornecedor_nome} ${i.acao_observacao ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'saving': {
          // mais negativo (maior economia) primeiro
          const av = a.saving_estimado_usd ?? 0
          const bv = b.saving_estimado_usd ?? 0
          return av - bv
        }
        case 'mp': return a.mp_codigo.localeCompare(b.mp_codigo)
        case 'fornecedor': return a.fornecedor_nome.localeCompare(b.fornecedor_nome)
        case 'volume': return (b.volume_anual_kg ?? 0) - (a.volume_anual_kg ?? 0)
      }
    })
    return arr
  }, [items, search, forn, etapa, sortKey])

  const totalSavingFiltrado = filtered.reduce((acc, i) => acc + Math.abs(Math.min(i.saving_estimado_usd ?? 0, 0)), 0)

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="bg-gradient-to-br from-rose-100 to-pink-100 p-3 rounded-xl">
          <ClipboardCheck className="w-6 h-6 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Fila de Homologação</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pares MP × fornecedor que vieram do BID 2026 e aguardam processo formal de homologação pelo P&D.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
        <KPICard label="A homologar" value={kpis.totalAHomologar.toString()} sub="projetos" Icon={ClipboardCheck} color="text-amber-600" bg="bg-amber-50" />
        <KPICard label="Saving potencial" value={fmtUSD(kpis.savingPotencialAbs)} sub="estimado" Icon={TrendingDown} color="text-rose-600" bg="bg-rose-50" />
        <KPICard label="Já decididos" value={kpis.totalDecididos.toString()} sub="fornecedores ativos" Icon={Users} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard label="Saving decidido" value={fmtUSD(kpis.savingDecididoAbs)} sub="já contratado" Icon={TrendingDown} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard label="Fornecedores na fila" value={kpis.fornecedoresUnicos.toString()} sub="distintos" Icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard label="MPs envolvidas" value={kpis.mpsUnicos.toString()} sub="distintas" Icon={Beaker} color="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por MP, nome, fornecedor, ação..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
            />
          </div>
          <select
            value={forn}
            onChange={e => setForn(e.target.value)}
            className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
          >
            <option value="">Todos os fornecedores ({fornecedoresLista.length})</option>
            {fornecedoresLista.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select
            value={etapa}
            onChange={e => setEtapa(e.target.value)}
            className="md:col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
          >
            <option value="">Todas as etapas</option>
            <option value="Briefing/Conceito">Briefing/Conceito</option>
            <option value="Formulação em Bancada">Formulação em Bancada</option>
            <option value="Testes Internos">Testes Internos</option>
            <option value="Aprovação Interna">Aprovação Interna</option>
            <option value="Aprovação QA">Aprovação QA</option>
            <option value="Aprovado para Produção">Aprovado para Produção</option>
          </select>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
            className="md:col-span-3 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
          >
            <option value="saving">Ordenar por: Saving (maior primeiro)</option>
            <option value="volume">Ordenar por: Volume anual</option>
            <option value="mp">Ordenar por: Código MP</option>
            <option value="fornecedor">Ordenar por: Fornecedor</option>
          </select>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{filtered.length} projeto{filtered.length === 1 ? '' : 's'} listado{filtered.length === 1 ? '' : 's'}</span>
          <span>Saving total filtrado: <strong className="text-rose-600">{fmtUSD(totalSavingFiltrado)}</strong></span>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtered.map(item => <Linha key={item.id} item={item} />)}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-sm text-gray-500">
            Nenhum projeto encontrado com esses filtros.
          </div>
        )}
      </div>
    </div>
  )
}

function KPICard({ label, value, sub, Icon, color, bg }: { label: string; value: string; sub?: string; Icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`${bg} p-1.5 rounded-lg`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="text-xl md:text-2xl font-semibold text-gray-900 truncate" title={value}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function Linha({ item }: { item: ProjetoHom }) {
  const [open, setOpen] = useState(false)
  const savingAbs = item.saving_estimado_usd != null ? Math.abs(Math.min(item.saving_estimado_usd, 0)) : 0
  const isPositiveSaving = (item.saving_estimado_usd ?? 0) < 0  // negativo = economia

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:border-rose-200 transition">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`${open ? 'Fechar' : 'Abrir'} detalhes de ${item.nome}`}
        className="w-full text-left px-4 py-3"
      >
        {/* Layout desktop: grid 12 colunas */}
        <div className="hidden md:grid grid-cols-12 gap-3 items-center">
          <div className="col-span-1">
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">{item.mp_codigo}</span>
          </div>
          <div className="col-span-5">
            <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.nome.replace('Homologação ', '').replace(/ \([^)]+\)$/, '')}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{item.fornecedor_nome}{item.estado_fornecedor ? ` · ${item.estado_fornecedor}` : ''}</div>
          </div>
          <div className="col-span-2 text-sm">
            <div className="text-gray-700">{fmtUSD(item.preco_decidido_usd)}<span className="text-gray-400 text-xs"> /kg</span></div>
            <div className="text-xs text-gray-400">ref: {fmtUSD(item.preco_referencia_usd)}</div>
          </div>
          <div className="col-span-2 text-sm">
            {isPositiveSaving ? (
              <>
                <div className="text-rose-600 font-medium">{fmtUSD(savingAbs)}</div>
                <div className="text-xs text-rose-400">{item.saving_pct != null ? `${item.saving_pct.toFixed(1)}%` : ''}</div>
              </>
            ) : (
              <div className="text-gray-400 text-xs">sem economia direta</div>
            )}
          </div>
          <div className="col-span-2 text-right">
            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">{item.etapa}</span>
          </div>
        </div>

        {/* Layout mobile: stack vertical */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded shrink-0">{item.mp_codigo}</span>
            <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 shrink-0">{item.etapa}</span>
          </div>
          <div className="text-sm font-medium text-gray-900">{item.nome.replace('Homologação ', '').replace(/ \([^)]+\)$/, '')}</div>
          <div className="text-xs text-gray-500">{item.fornecedor_nome}{item.estado_fornecedor ? ` · ${item.estado_fornecedor}` : ''}</div>
          <div className="flex items-baseline justify-between gap-2 pt-1">
            <div>
              <div className="text-sm text-gray-700">{fmtUSD(item.preco_decidido_usd)}<span className="text-gray-400 text-xs"> /kg</span></div>
              <div className="text-[10px] text-gray-400">ref: {fmtUSD(item.preco_referencia_usd)}</div>
            </div>
            {isPositiveSaving ? (
              <div className="text-right">
                <div className="text-sm text-rose-600 font-medium">{fmtUSD(savingAbs)}</div>
                <div className="text-[10px] text-rose-400">{item.saving_pct != null ? `${item.saving_pct.toFixed(1)}%` : ''}</div>
              </div>
            ) : (
              <div className="text-[10px] text-gray-400">sem economia direta</div>
            )}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Volume anual" value={item.volume_anual_kg ? `${fmtNum(item.volume_anual_kg)} kg/ano` : '—'} />
          <Field label="MOQ" value={item.moq ?? '—'} />
          <Field label="Lead time" value={
            [item.lead_time_estoque && `c/ estoque: ${item.lead_time_estoque}`, item.lead_time_sem_estoque && `s/ estoque: ${item.lead_time_sem_estoque}`].filter(Boolean).join(' · ') || '—'
          } />
          <Field label="Estado" value={item.estado_fornecedor ? <><MapPin className="inline w-3 h-3" /> {item.estado_fornecedor}</> : '—'} />
          <Field label="Homologado no BID?" value={item.homologado_no_bid ?? '—'} />
          <Field label="Decisão BID" value={item.data_decisao ? <><Calendar className="inline w-3 h-3" /> {item.data_decisao}</> : '—'} />
          {item.acao_observacao && (
            <div className="md:col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-xs font-medium text-amber-800 mb-1">Ação / Observação do BID</div>
              <div className="text-sm text-amber-900">{item.acao_observacao}</div>
            </div>
          )}
          <div className="md:col-span-3 flex gap-2 pt-2">
            <a
              href={`/dashboard/projetos`}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition"
            >
              Abrir projeto P&D
            </a>
            <a
              href={`/dashboard/mps/${item.mp_codigo}`}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
            >
              Ver MP {item.mp_codigo}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm text-gray-700 mt-0.5">{value}</div>
    </div>
  )
}
