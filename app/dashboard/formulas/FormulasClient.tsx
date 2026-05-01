'use client'

import { useState, useMemo } from 'react'
import {
  Beaker, Plus, X, Search, ChevronDown, ChevronUp,
  ExternalLink, FlaskConical, History, Save, Loader2, Package, Download
} from 'lucide-react'
import { exportToCsv } from '@/lib/export-csv'
import { clsx } from 'clsx'
import { MARCAS_DISPONIVEIS } from '@/lib/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Ingrediente = {
  id?: string
  formula_id?: string
  mp_id?: string | null
  mp_codigo?: string | null
  mp_nome?: string | null
  inci?: string | null
  percentual?: string | null
  funcao?: string | null
}

type Versao = {
  id?: string
  formula_id?: string
  versao: string
  data_versao?: string | null
  descricao?: string | null
  por?: string | null
}

type Formula = {
  id: string
  codigo: string
  versao: string
  produto: string
  marca: string
  tipo: string
  categoria?: string | null
  n_mps: number
  status: string
  responsavel?: string | null
  link_produto?: string | null
  grau?: number | null
  fase?: string | null
  obs?: string | null
  vendas_mes?: number | null
  formula_ingredientes?: Ingrediente[]
  formula_versoes?: Versao[]
}

type Fornecedor = { id: string; nome: string }

// ─── Constantes ───────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  'Em Desenvolvimento':      'bg-blue-100 text-blue-700',
  'Aprovada Internamente':   'bg-yellow-100 text-yellow-700',
  'Em Estabilidade':         'bg-orange-100 text-orange-700',
  'Aprovada QA':             'bg-green-100 text-green-700',
  'Arquivada':               'bg-gray-100 text-gray-500',
}

const MARCA_COLOR: Record<string, string> = {
  'Kokeshi':    'bg-pink-100 text-pink-700',
  'Ápice':      'bg-emerald-100 text-emerald-700',
  'Barbours':   'bg-orange-100 text-orange-700',
  'Yenzah':     'bg-sky-100 text-sky-700',
  'By Samia':   'bg-violet-100 text-violet-700',
  'Rituária':   'bg-purple-100 text-purple-700',
  'Lescent':    'bg-rose-100 text-rose-700',
  'Auá Natural':'bg-lime-100 text-lime-700',
}

const FASES_REG = [
  'RDC 752/2022 — Comunicação Prévia',
  'RDC 752/2022 — Notificação',
  'RDC 752/2022 — Registro',
  'RDC 243/2018 — Suplemento',
  'Outro',
]

// ─── Modal de Fórmula ─────────────────────────────────────────────────────────

function FormulaModal({
  formula, onClose, onSaved
}: {
  formula: Formula | null
  onClose: () => void
  onSaved: (f: Formula) => void
}) {
  const [tab, setTab] = useState<'geral' | 'ingredientes' | 'regulatorio' | 'versoes'>('geral')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    codigo: formula?.codigo ?? '',
    versao: formula?.versao ?? 'v1',
    produto: formula?.produto ?? '',
    marca: formula?.marca ?? '',
    tipo: formula?.tipo ?? 'Cosmético',
    categoria: formula?.categoria ?? '',
    status: formula?.status ?? 'Em Desenvolvimento',
    responsavel: formula?.responsavel ?? 'Patrícia',
    link_produto: formula?.link_produto ?? '',
    grau: formula?.grau ?? 2,
    fase: formula?.fase ?? '',
    obs: formula?.obs ?? '',
  })

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
    formula?.formula_ingredientes ?? []
  )

  function f(k: string, v: any) { setForm(prev => ({ ...prev, [k]: v })) }

  function addIngrediente() {
    setIngredientes(prev => [...prev, { mp_codigo: '', mp_nome: '', inci: '', percentual: '', funcao: '' }])
  }

  function updateIng(idx: number, k: keyof Ingrediente, v: string) {
    setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, [k]: v } : ing))
  }

  function removeIng(idx: number) {
    setIngredientes(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!form.codigo.trim() || !form.produto.trim() || !form.marca) {
      setError('Código, produto e marca são obrigatórios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const url = formula ? `/api/formulas/${formula.id}` : '/api/formulas'
      const method = formula ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ingredientes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      onSaved(json.formula)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'geral', label: 'Dados Gerais' },
    { id: 'ingredientes', label: `Ingredientes (${ingredientes.length})` },
    { id: 'regulatorio', label: 'Regulatório' },
    ...(formula ? [{ id: 'versoes', label: `Histórico (${formula.formula_versoes?.length ?? 0})` }] : []),
  ] as { id: typeof tab; label: string }[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Beaker className="w-5 h-5 text-teal-500" />
          <h2 className="font-bold text-gray-900">
            {formula ? `${formula.codigo} — ${formula.produto}` : 'Nova Fórmula'}
          </h2>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={clsx('px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition',
                tab === t.id ? 'border-teal-500 text-teal-700 bg-teal-50' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {tab === 'geral' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Código *</label>
                  <input className="input" value={form.codigo} onChange={e => f('codigo', e.target.value)} placeholder="F-KOK-001" disabled={!!formula} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Versão</label>
                  <input className="input" value={form.versao} onChange={e => f('versao', e.target.value)} placeholder="v1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Produto Final *</label>
                <input className="input" value={form.produto} onChange={e => f('produto', e.target.value)} placeholder="Ex: Hidratante Facial Pele de Porcelana 30g" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Marca *</label>
                  <select className="input" value={form.marca} onChange={e => f('marca', e.target.value)}>
                    <option value="">— selecione —</option>
                    {MARCAS_DISPONIVEIS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Tipo</label>
                  <select className="input" value={form.tipo} onChange={e => f('tipo', e.target.value)}>
                    <option>Cosmético</option>
                    <option>Suplemento</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Categoria</label>
                  <input className="input" value={form.categoria} onChange={e => f('categoria', e.target.value)} placeholder="Ex: Sérum, Hidratante, Body Splash" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Status</label>
                  <select className="input" value={form.status} onChange={e => f('status', e.target.value)}>
                    {Object.keys(STATUS_COLOR).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Responsável</label>
                  <input className="input" value={form.responsavel} onChange={e => f('responsavel', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Link Produto</label>
                  <input className="input" value={form.link_produto} onChange={e => f('link_produto', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              {form.obs !== undefined && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Observações</label>
                  <textarea className="input min-h-[64px] resize-none" value={form.obs} onChange={e => f('obs', e.target.value)} placeholder="Notas técnicas, claims, informações relevantes..." />
                </div>
              )}
            </>
          )}

          {tab === 'ingredientes' && (
            <div className="space-y-3">
              {ingredientes.map((ing, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative">
                  <button onClick={() => removeIng(idx)} className="absolute top-3 right-3 p-1 hover:bg-gray-200 rounded">
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Código MP</label>
                      <input className="input bg-white text-xs" value={ing.mp_codigo ?? ''} onChange={e => updateIng(idx, 'mp_codigo', e.target.value)} placeholder="MP0011" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Nome</label>
                      <input className="input bg-white text-xs" value={ing.mp_nome ?? ''} onChange={e => updateIng(idx, 'mp_nome', e.target.value)} placeholder="Glicerina Vegetal USP" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">INCI</label>
                      <input className="input bg-white text-xs" value={ing.inci ?? ''} onChange={e => updateIng(idx, 'inci', e.target.value)} placeholder="GLYCERIN" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">%</label>
                      <input className="input bg-white text-xs" value={ing.percentual ?? ''} onChange={e => updateIng(idx, 'percentual', e.target.value)} placeholder="5.0" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Função</label>
                      <input className="input bg-white text-xs" value={ing.funcao ?? ''} onChange={e => updateIng(idx, 'funcao', e.target.value)} placeholder="Umectante" />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addIngrediente}
                className="w-full flex items-center justify-center gap-2 text-sm text-teal-600 border border-dashed border-teal-300 rounded-xl py-3 hover:bg-teal-50 transition">
                <Plus className="w-4 h-4" /> Adicionar ingrediente
              </button>
            </div>
          )}

          {tab === 'regulatorio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Grau de Risco</label>
                  <select className="input" value={form.grau} onChange={e => f('grau', parseInt(e.target.value))}>
                    <option value={1}>Grau 1 — Comunicação Prévia</option>
                    <option value={2}>Grau 2 — Notificação</option>
                    <option value={3}>Grau 3 — Registro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Fase Regulatória</label>
                  <select className="input" value={form.fase} onChange={e => f('fase', e.target.value)}>
                    <option value="">— selecione —</option>
                    {FASES_REG.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'versoes' && formula?.formula_versoes && (
            <div className="space-y-3">
              {[...formula.formula_versoes]
                .sort((a, b) => (b.versao ?? '').localeCompare(a.versao ?? ''))
                .map((v, i) => (
                  <div key={i} className="flex gap-4 items-start border-l-2 border-teal-200 pl-4 py-1">
                    <div className="shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-teal-700">{v.versao}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{v.descricao ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.por && <span>{v.por} · </span>}
                        {v.data_versao && new Date(v.data_versao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              {formula.formula_versoes.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhuma versão registrada.</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="px-6 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</p>}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm px-5 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {formula ? 'Salvar alterações' : 'Cadastrar fórmula'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function FormulasClient({
  formulas: initialFormulas, fornecedores, canEdit
}: {
  formulas: Formula[]
  fornecedores: Fornecedor[]
  canEdit: boolean
}) {
  const [formulas, setFormulas] = useState<Formula[]>(initialFormulas)
  const [search, setSearch] = useState('')
  const [filterMarca, setFilterMarca] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [modalFormula, setModalFormula] = useState<Formula | null | 'new'>('new' as any)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return formulas.filter(f =>
      (!q || f.codigo.toLowerCase().includes(q) || f.produto.toLowerCase().includes(q) || (f.categoria ?? '').toLowerCase().includes(q)) &&
      (!filterMarca || f.marca === filterMarca) &&
      (!filterTipo || f.tipo === filterTipo) &&
      (!filterStatus || f.status === filterStatus)
    )
  }, [formulas, search, filterMarca, filterTipo, filterStatus])

  const marcas = [...new Set(formulas.map(f => f.marca))].sort()

  function onSaved(saved: Formula) {
    setFormulas(prev => {
      const idx = prev.findIndex(f => f.id === saved.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
      return [saved, ...prev]
    })
    setModalOpen(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Beaker className="w-6 h-6 text-teal-500" />
        <h1 className="text-xl font-bold text-gray-900">Fórmulas</h1>
        <span className="text-sm text-gray-400">{filtered.length} de {formulas.length}</span>
        <button
          onClick={() => exportToCsv('formulas', filtered.map(f => ({
            Código: f.codigo,
            Versão: f.versao,
            Produto: f.produto,
            Marca: f.marca,
            Tipo: f.tipo,
            Categoria: f.categoria ?? '',
            Status: f.status,
            MPs: f.formula_ingredientes?.length ?? f.n_mps,
            Responsável: f.responsavel ?? '',
          })))}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-200 transition"
          title="Exportar CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
        {canEdit && (
          <button onClick={() => { setModalFormula(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-2.5 py-2 md:px-3 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Fórmula</span>
          </button>
        )}
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: formulas.length, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Aprovadas QA', value: formulas.filter(f => f.status === 'Aprovada QA').length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Em Desenvolvimento', value: formulas.filter(f => f.status === 'Em Desenvolvimento').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Marcas', value: marcas.length, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-4 ${k.bg}`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Buscar por código, produto ou categoria..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          value={filterMarca} onChange={e => setFilterMarca(e.target.value)}>
          <option value="">Todas as marcas</option>
          {marcas.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
          <option value="">Cosmético + Suplemento</option>
          <option>Cosmético</option>
          <option>Suplemento</option>
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-200"
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.keys(STATUS_COLOR).map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 w-8" />
              <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Produto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Marca</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Tipo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">MPs</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Responsável</th>
              {canEdit && <th className="px-4 py-3 w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(formula => (
              <>
                <tr key={formula.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setExpandedId(expandedId === formula.id ? null : formula.id)}>
                  <td className="px-4 py-3 text-gray-400">
                    {expandedId === formula.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-700 font-medium">{formula.codigo}</p>
                    <p className="text-xs text-gray-400">{formula.versao}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{formula.produto}</p>
                    {formula.categoria && <p className="text-xs text-gray-400">{formula.categoria}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MARCA_COLOR[formula.marca] ?? 'bg-gray-100 text-gray-600'}`}>
                      {formula.marca}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${formula.tipo === 'Suplemento' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>
                      {formula.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[formula.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {formula.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <Package className="w-3.5 h-3.5" />
                      {formula.formula_ingredientes?.length ?? formula.n_mps}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formula.responsavel ?? '—'}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setModalFormula(formula); setModalOpen(true) }}
                        className="text-xs text-gray-400 hover:text-teal-600 transition">
                        Editar
                      </button>
                    </td>
                  )}
                </tr>

                {/* Linha expandida */}
                {expandedId === formula.id && (
                  <tr key={`${formula.id}-detail`} className="bg-teal-50/30">
                    <td colSpan={canEdit ? 9 : 8} className="px-8 py-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                        {/* Ingredientes */}
                        <div className="md:col-span-2">
                          <p className="font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-teal-500" />
                            Ingredientes
                          </p>
                          {formula.formula_ingredientes && formula.formula_ingredientes.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-teal-100">
                              <table className="w-full text-xs">
                                <thead className="bg-teal-50">
                                  <tr>
                                    <th className="text-left px-3 py-2 text-gray-500 font-medium">MP</th>
                                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Nome</th>
                                    <th className="text-left px-3 py-2 text-gray-500 font-medium">INCI</th>
                                    <th className="text-right px-3 py-2 text-gray-500 font-medium">%</th>
                                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Função</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-teal-50">
                                  {formula.formula_ingredientes.map((ing, i) => (
                                    <tr key={i}>
                                      <td className="px-3 py-2 font-mono text-gray-500">{ing.mp_codigo ?? '—'}</td>
                                      <td className="px-3 py-2 text-gray-700 font-medium">{ing.mp_nome ?? '—'}</td>
                                      <td className="px-3 py-2 text-gray-400 italic">{ing.inci ?? '—'}</td>
                                      <td className="px-3 py-2 text-right text-gray-700 font-mono">{ing.percentual ?? '—'}</td>
                                      <td className="px-3 py-2 text-gray-500">{ing.funcao ?? '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-gray-400 italic">Ingredientes não cadastrados.</p>
                          )}
                        </div>

                        {/* Info regulatória + histórico */}
                        <div className="space-y-4">
                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2">Regulatório</p>
                            <div className="space-y-1">
                              {formula.grau && <div className="flex gap-2"><span className="text-gray-400">Grau</span><span className="text-gray-700">{formula.grau}</span></div>}
                              {formula.fase && <div className="flex gap-2 flex-col"><span className="text-gray-400">Fase</span><span className="text-gray-700">{formula.fase}</span></div>}
                              {formula.obs && <div className="mt-2 p-2 bg-amber-50 rounded text-gray-600 italic">{formula.obs}</div>}
                            </div>
                          </div>

                          <div>
                            <p className="font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <History className="w-3.5 h-3.5" /> Versões
                            </p>
                            {formula.formula_versoes && formula.formula_versoes.length > 0 ? (
                              <div className="space-y-2">
                                {[...formula.formula_versoes]
                                  .sort((a, b) => b.versao.localeCompare(a.versao))
                                  .slice(0, 3)
                                  .map((v, i) => (
                                    <div key={i} className="border-l-2 border-teal-200 pl-3">
                                      <p className="font-medium text-teal-700">{v.versao}</p>
                                      <p className="text-gray-500">{v.descricao}</p>
                                      <p className="text-gray-400">{v.por} · {v.data_versao && new Date(v.data_versao).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 italic">Sem histórico.</p>
                            )}
                          </div>

                          {formula.link_produto && (
                            <a href={formula.link_produto} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-brand-600 hover:underline">
                              <ExternalLink className="w-3.5 h-3.5" /> Ver produto
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Beaker className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma fórmula encontrada</p>
          </div>
        )}
      </div>

      {modalOpen && (
        <FormulaModal
          formula={modalFormula as Formula | null}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
