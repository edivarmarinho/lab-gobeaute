'use client'

import { useState, useMemo } from 'react'
import {
  Package, Plus, X, Search, Filter, ChevronDown, ChevronUp,
  Leaf, FlaskConical, ShieldCheck, AlertTriangle, Telescope, Download,
  GitCompareArrows,
} from 'lucide-react'
import { clsx } from 'clsx'
import { MARCAS_DISPONIVEIS } from '@/lib/types'
import { exportToCsv } from '@/lib/export-csv'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MP = {
  id: string
  codigo: string
  nome: string
  inci?: string | null
  cas?: string | null
  categoria?: string | null
  anvisa: string
  homolog: string
  vegano: boolean
  cf: boolean
  origem_natural: boolean
  testado_animal: boolean
  parabenos: boolean
  preco_ref_usd?: number | null
  forn_candidato?: string | null
  marcas?: string[]
  origem?: string
  // Fragrâncias
  familia_olfativa?: string | null
  notas_topo?: string | null
  notas_coracao?: string | null
  notas_fundo?: string | null
  ifra_categoria?: string | null
  ifra_limite_pct?: number | null
  ifra_compliance?: boolean
  iso_conformidade?: string | null
  substancias_alergenas?: string | null
  // Flags ANVISA / regulatórias
  flag_alergeno?: boolean
  flag_cmr?: boolean
  flag_nanomaterial?: boolean
  flag_preservante?: boolean
  flag_corante?: boolean
  flag_filtro_uv?: boolean
  funcao_cosmetica?: string[] | null
  custo_kg_brl?: number | null
  concentracao_max_br?: string | null
  concentracao_max_eu?: string | null
}

const CATEGORIAS = [
  'Emoliente', 'Ativo', 'Emulsionante', 'Conservante', 'Espessante',
  'Surfactante', 'Hidratante', 'Antioxidante', 'Fragrância', 'Corante',
  'pH Adjuster', 'Condicionante', 'Umectante', 'Solubilizante', 'Outro',
]

const FAMILIAS_OLFATIVAS = [
  'Floral', 'Cítrico', 'Oriental', 'Amadeirado', 'Fougère',
  'Chypre', 'Aquático', 'Frutado', 'Gourmand', 'Aromático', 'Outro',
]

const IFRA_CATEGORIAS = [
  'Cat 1 — Produtos para lábios',
  'Cat 2 — Produtos aplicados sobre a pele',
  'Cat 3 — Higiene e bem-estar',
  'Cat 4 — Sem restrição',
  'Cat 5 — Rinse-off',
  'Cat 6 — Cuidados com o cabelo',
  'Cat 7 — Perfume fino',
  'Cat 8 — Produtos para roupa',
  'Cat 9 — Ambiente',
  'Cat 10 — Outros',
  'Cat 11 — Spray corporal / desodorante',
  'Cat 12 — Não classificado',
]

const homologColor: Record<string, string> = {
  'Homologada':  'bg-green-100 text-green-700',
  'Em Processo': 'bg-yellow-100 text-yellow-700',
  'Pendente':    'bg-gray-100 text-gray-600',
  'Reprovada':   'bg-red-100 text-red-700',
}

const anvisaColor: Record<string, string> = {
  'Livre':    'bg-green-50 text-green-600',
  'Restrito': 'bg-orange-50 text-orange-600',
  'Proibido': 'bg-red-50 text-red-600',
}

// ─── Formulário MP ────────────────────────────────────────────────────────────

type MPForm = Omit<MP, 'id'>

const emptyForm = (): MPForm => ({
  codigo: '',
  nome: '',
  inci: '',
  cas: '',
  categoria: '',
  anvisa: 'Livre',
  homolog: 'Pendente',
  vegano: false,
  cf: false,
  origem_natural: false,
  testado_animal: false,
  parabenos: false,
  preco_ref_usd: null,
  forn_candidato: '',
  marcas: [],
  origem: 'patricia',
  familia_olfativa: '',
  notas_topo: '',
  notas_coracao: '',
  notas_fundo: '',
  ifra_categoria: '',
  ifra_limite_pct: null,
  ifra_compliance: false,
  iso_conformidade: '',
  substancias_alergenas: '',
})

function MPModal({
  mp,
  onClose,
  onSaved,
}: {
  mp: MP | null
  onClose: () => void
  onSaved: (mp: MP) => void
}) {
  const [form, setForm] = useState<MPForm>(mp ? { ...mp } : emptyForm())
  const [tab, setTab] = useState<'geral' | 'regulatorio' | 'fragrancias'>('geral')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFragrancia = form.categoria === 'Fragrância'

  function f(field: keyof MPForm, value: any) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleMarca(m: string) {
    setForm(prev => {
      const cur = prev.marcas ?? []
      return { ...prev, marcas: cur.includes(m) ? cur.filter(x => x !== m) : [...cur, m] }
    })
  }

  async function handleSave() {
    if (!form.codigo.trim() || !form.nome.trim()) {
      setError('Código e nome são obrigatórios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const url = mp ? `/api/mps/${mp.id}` : '/api/mps'
      const method = mp ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      onSaved(json.mp)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'geral', label: 'Dados Gerais' },
    { id: 'regulatorio', label: 'Regulatório' },
    ...(isFragrancia ? [{ id: 'fragrancias', label: 'Fragrância / IFRA' }] : []),
  ] as { id: typeof tab; label: string }[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-semibold text-gray-900">
              {mp ? `Editar MP — ${mp.codigo}` : 'Nova Matéria-Prima'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'px-3 py-2 text-xs font-medium rounded-t-lg transition',
                tab === t.id ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === 'geral' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Código *">
                  <input
                    className="input"
                    value={form.codigo}
                    onChange={e => f('codigo', e.target.value)}
                    placeholder="MP0001"
                    disabled={!!mp}
                  />
                </Field>
                <Field label="Categoria">
                  <select className="input" value={form.categoria ?? ''} onChange={e => f('categoria', e.target.value)}>
                    <option value="">— selecione —</option>
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Nome *">
                <input className="input" value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome técnico completo" />
              </Field>
              <Field label="Nome INCI">
                <input className="input" value={form.inci ?? ''} onChange={e => f('inci', e.target.value)} placeholder="ex: Glycerin" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CAS">
                  <input className="input" value={form.cas ?? ''} onChange={e => f('cas', e.target.value)} placeholder="ex: 56-81-5" />
                </Field>
                <Field label="Fornecedor candidato">
                  <input className="input" value={form.forn_candidato ?? ''} onChange={e => f('forn_candidato', e.target.value)} />
                </Field>
              </div>
              <Field label="Preço referência (USD/kg)">
                <input className="input" type="number" step="0.01" value={form.preco_ref_usd ?? ''} onChange={e => f('preco_ref_usd', e.target.value ? Number(e.target.value) : null)} />
              </Field>
              <Field label="Marcas">
                <div className="flex flex-wrap gap-1.5">
                  {MARCAS_DISPONIVEIS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMarca(m)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-full border transition',
                        (form.marcas ?? []).includes(m)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {tab === 'regulatorio' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status ANVISA">
                  <select className="input" value={form.anvisa} onChange={e => f('anvisa', e.target.value)}>
                    <option>Livre</option>
                    <option>Restrito</option>
                    <option>Proibido</option>
                  </select>
                </Field>
                <Field label="Status Homologação">
                  <select className="input" value={form.homolog} onChange={e => f('homolog', e.target.value)}>
                    <option>Pendente</option>
                    <option>Em Processo</option>
                    <option>Homologada</option>
                    <option>Reprovada</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['vegano', 'Vegano'],
                  ['cf', 'Cruelty Free'],
                  ['origem_natural', 'Origem Natural'],
                  ['testado_animal', 'Testado em Animal'],
                  ['parabenos', 'Contém Parabenos'],
                ] as [keyof MPForm, string][]).map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-blue-500"
                      checked={!!form[field]}
                      onChange={e => f(field, e.target.checked)}
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {tab === 'fragrancias' && (
            <>
              <Field label="Família Olfativa">
                <select className="input" value={form.familia_olfativa ?? ''} onChange={e => f('familia_olfativa', e.target.value)}>
                  <option value="">— selecione —</option>
                  {FAMILIAS_OLFATIVAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Notas de Topo">
                <input className="input" value={form.notas_topo ?? ''} onChange={e => f('notas_topo', e.target.value)} placeholder="ex: Bergamota, Limão, Pimenta Rosa" />
              </Field>
              <Field label="Notas de Coração">
                <input className="input" value={form.notas_coracao ?? ''} onChange={e => f('notas_coracao', e.target.value)} placeholder="ex: Rosa, Jasmim, Íris" />
              </Field>
              <Field label="Notas de Fundo">
                <input className="input" value={form.notas_fundo ?? ''} onChange={e => f('notas_fundo', e.target.value)} placeholder="ex: Sândalo, Almíscar, Âmbar" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria IFRA">
                  <select className="input" value={form.ifra_categoria ?? ''} onChange={e => f('ifra_categoria', e.target.value)}>
                    <option value="">— selecione —</option>
                    {IFRA_CATEGORIAS.map(c => <option key={c} value={c.split(' ')[0] + ' ' + c.split(' ')[1]}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Limite IFRA (%)">
                  <input className="input" type="number" step="0.001" value={form.ifra_limite_pct ?? ''} onChange={e => f('ifra_limite_pct', e.target.value ? Number(e.target.value) : null)} placeholder="ex: 0.300" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-500"
                    checked={!!form.ifra_compliance}
                    onChange={e => f('ifra_compliance', e.target.checked)}
                  />
                  <span className="text-gray-700">IFRA Compliance</span>
                </label>
              </div>
              <Field label="Conformidade ISO">
                <input className="input" value={form.iso_conformidade ?? ''} onChange={e => f('iso_conformidade', e.target.value)} placeholder="ex: ISO 9235" />
              </Field>
              <Field label="Substâncias Alergênicas">
                <textarea
                  className="input min-h-[64px] resize-none"
                  value={form.substancias_alergenas ?? ''}
                  onChange={e => f('substancias_alergenas', e.target.value)}
                  placeholder="Limonene, Linalool, Citral..."
                />
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        {error && <p className="px-6 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</p>}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : mp ? 'Salvar alterações' : 'Cadastrar MP'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field helper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Comparativo Modal ────────────────────────────────────────────────────────

function ComparativoModal({ mp, onClose }: { mp: MP; onClose: () => void }) {
  const homologado = {
    label: 'Homologado',
    forn: mp.forn_candidato ? '(atual)' : '—',
    preco: mp.preco_ref_usd,
    homolog: mp.homolog,
    anvisa: mp.anvisa,
    iso22716: mp.iso_conformidade === 'ISO 22716' || false,
    vegano: mp.vegano,
    cf: mp.cf,
    natural: mp.origem_natural,
  }

  type Row = { label: string; home: React.ReactNode; cand: React.ReactNode; delta?: 'better' | 'worse' | 'equal' }

  const rows: Row[] = [
    {
      label: 'Fornecedor',
      home: <span className="font-medium text-gray-800">{mp.forn_candidato ?? '—'}</span>,
      cand: <span className="text-gray-400 italic">Preencher ao avaliar</span>,
    },
    {
      label: 'Preço ref. (USD/kg)',
      home: mp.preco_ref_usd ? <span className="font-mono font-medium text-gray-800">${Number(mp.preco_ref_usd).toFixed(2)}</span> : <span className="text-gray-400">—</span>,
      cand: <span className="text-gray-400 italic">A cotar</span>,
    },
    {
      label: 'Status ANVISA',
      home: <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${anvisaColor[mp.anvisa] ?? 'bg-gray-100'}`}>{mp.anvisa}</span>,
      cand: <span className="text-gray-400 italic">Verificar</span>,
    },
    {
      label: 'Homologação',
      home: <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${homologColor[mp.homolog] ?? 'bg-gray-100'}`}>{mp.homolog}</span>,
      cand: <span className="text-gray-400 italic">Em avaliação</span>,
    },
    {
      label: 'Vegano',
      home: mp.vegano ? <span className="text-green-600 font-medium">✓ Sim</span> : <span className="text-gray-400">Não</span>,
      cand: <span className="text-gray-400 italic">Verificar</span>,
    },
    {
      label: 'Cruelty-Free',
      home: mp.cf ? <span className="text-green-600 font-medium">✓ Sim</span> : <span className="text-gray-400">Não</span>,
      cand: <span className="text-gray-400 italic">Verificar</span>,
    },
    {
      label: 'Origem Natural',
      home: mp.origem_natural ? <span className="text-green-600 font-medium">✓ Sim</span> : <span className="text-gray-400">Não</span>,
      cand: <span className="text-gray-400 italic">Verificar</span>,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <GitCompareArrows className="w-5 h-5 text-indigo-500" />
          <div>
            <h2 className="font-bold text-gray-900">Comparativo de Fornecedores</h2>
            <p className="text-xs text-gray-400">{mp.codigo} — {mp.nome}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Cabeçalho das colunas */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
            <div className="px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Critério</div>
            <div className="px-6 py-3 bg-green-50 text-xs font-semibold text-green-700 uppercase tracking-wide border-l border-gray-100">
              Atual / Homologado
            </div>
            <div className="px-6 py-3 bg-indigo-50 text-xs font-semibold text-indigo-700 uppercase tracking-wide border-l border-gray-100">
              Candidato
            </div>
          </div>

          {/* Linhas */}
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-0 border-b border-gray-50 last:border-0">
              <div className="px-6 py-3 text-xs text-gray-500 font-medium bg-gray-50 flex items-center">{row.label}</div>
              <div className="px-6 py-3 text-xs border-l border-gray-100 flex items-center">{row.home}</div>
              <div className="px-6 py-3 text-xs border-l border-gray-100 flex items-center">{row.cand}</div>
            </div>
          ))}

          {/* Seção de justificativa */}
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-700 mb-2">Justificativa P&D para troca de fornecedor</p>
            <textarea
              rows={3}
              placeholder="Descreva o motivo da troca: preço, qualidade, prazo, risco de abastecimento..."
              className="w-full text-xs border border-amber-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400">Preencha os dados do candidato ao editar a MP.</p>
          <button onClick={onClose} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700 transition">Fechar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Gaps Modal ───────────────────────────────────────────────────────────────

function GapsModal({ mps, onClose, onCadastrar }: { mps: MP[]; onClose: () => void; onCadastrar: (codigo: string) => void }) {
  const { gaps, min, max, cobertura } = useMemo(() => {
    const codigos = new Set(mps.map(m => m.codigo.toUpperCase()))
    const result: string[] = []
    const nums = mps
      .map(m => parseInt(m.codigo.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n))
    if (nums.length === 0) return { gaps: result, min: 0, max: 0, cobertura: 0 }
    const minN = Math.min(...nums)
    const maxN = Math.max(...nums)
    const total = maxN - minN + 1
    for (let i = minN; i <= maxN; i++) {
      const padded = `MP${String(i).padStart(4, '0')}`
      if (!codigos.has(padded)) result.push(padded)
    }
    return { gaps: result, min: minN, max: maxN, cobertura: Math.round(((total - result.length) / total) * 100) }
  }, [mps])

  function handleExport() {
    exportToCsv('gaps-mps', gaps.map(codigo => ({ Código: codigo, Status: 'Faltando' })))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <Telescope className="w-5 h-5 text-purple-500" />
          <div>
            <h2 className="font-bold text-gray-900">Gaps na Sequência de MPs</h2>
            <p className="text-xs text-gray-400">
              {gaps.length} código{gaps.length !== 1 ? 's' : ''} faltando · {cobertura}% de cobertura
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 bg-purple-50 border-b border-purple-100 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-purple-700">{mps.length}</p>
            <p className="text-xs text-purple-500">Cadastradas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{gaps.length}</p>
            <p className="text-xs text-red-400">Faltando</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-600">{cobertura}%</p>
            <p className="text-xs text-emerald-500">Cobertura</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {gaps.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Sequência contínua!</p>
              <p className="text-xs text-gray-400 mt-1">Nenhum gap de {`MP${String(min).padStart(4, '0')}`} a {`MP${String(max).padStart(4, '0')}`}.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {gaps.map(codigo => (
                <div key={codigo} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-mono text-sm text-gray-700">{codigo}</span>
                  <button
                    onClick={() => { onClose(); onCadastrar(codigo) }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                  >
                    Cadastrar
                  </button>
                </div>
              ))}
              {gaps.length >= 100 && (
                <p className="text-xs text-gray-400 text-center pt-2">Mostrando os primeiros 100 gaps.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {gaps.length > 0 ? (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          ) : <span />}
          <button onClick={onClose} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700">Fechar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MPsClient({ mps: initialMps, canEdit }: { mps: MP[]; canEdit: boolean }) {
  const [mps, setMps] = useState<MP[]>(initialMps)
  const [search, setSearch] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterHomolog, setFilterHomolog] = useState('')
  const [editingMp, setEditingMp] = useState<MP | null | 'new'>('new' as any)
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [gapsOpen, setGapsOpen] = useState(false)
  const [comparativoMp, setComparativoMp] = useState<MP | null>(null)

  const filtered = useMemo(() => {
    return mps.filter(mp => {
      const q = search.toLowerCase()
      const matchSearch = !q || mp.nome.toLowerCase().includes(q) || mp.codigo.toLowerCase().includes(q) || (mp.inci ?? '').toLowerCase().includes(q)
      const matchCat = !filterCategoria || mp.categoria === filterCategoria
      const matchHomolog = !filterHomolog || mp.homolog === filterHomolog
      return matchSearch && matchCat && matchHomolog
    })
  }, [mps, search, filterCategoria, filterHomolog])

  function openNew() {
    setEditingMp(null)
    setModalOpen(true)
  }

  function openEdit(mp: MP) {
    setEditingMp(mp)
    setModalOpen(true)
  }

  function onSaved(saved: MP) {
    setMps(prev => {
      const idx = prev.findIndex(m => m.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    setModalOpen(false)
  }

  function openWithCode(codigo: string) {
    setEditingMp(null)
    setModalOpen(true)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {gapsOpen && (
        <GapsModal
          mps={mps}
          onClose={() => setGapsOpen(false)}
          onCadastrar={openWithCode}
        />
      )}
      {comparativoMp && (
        <ComparativoModal
          mp={comparativoMp}
          onClose={() => setComparativoMp(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0" />
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Matérias-Primas</h1>
        <span className="text-sm text-gray-400">{filtered.length} de {mps.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setGapsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-purple-600 text-xs md:text-sm font-medium rounded-lg hover:bg-purple-50 border border-purple-200 transition"
          >
            <Telescope className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Ver Gaps</span>
          </button>
          <button
            onClick={() => exportToCsv('mps', filtered.map(mp => ({
              Código: mp.codigo,
              Nome: mp.nome,
              INCI: mp.inci ?? '',
              CAS: mp.cas ?? '',
              Categoria: mp.categoria ?? '',
              ANVISA: mp.anvisa,
              Homologação: mp.homolog,
              Vegano: mp.vegano ? 'Sim' : 'Não',
              'Cruelty-Free': mp.cf ? 'Sim' : 'Não',
              'Origem Natural': mp.origem_natural ? 'Sim' : 'Não',
              'USD/kg': mp.preco_ref_usd ?? '',
              'Forn. Candidato': mp.forn_candidato ?? '',
            })))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 text-xs md:text-sm font-medium rounded-lg hover:bg-gray-100 border border-gray-200 transition"
            title="Exportar CSV"
          >
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          {canEdit && (
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500 text-white text-xs md:text-sm font-medium rounded-lg hover:bg-blue-600 transition"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Nova MP</span>
              <span className="sm:hidden">Nova</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Buscar por nome, código ou INCI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={filterCategoria}
          onChange={e => setFilterCategoria(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
        </select>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={filterHomolog}
          onChange={e => setFilterHomolog(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option>Homologada</option>
          <option>Em Processo</option>
          <option>Pendente</option>
          <option>Reprovada</option>
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
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ANVISA</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Homologação</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Fornecedor</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">USD/kg</th>
              {canEdit && <th className="px-4 py-3 w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(mp => (
              <>
                <tr
                  key={mp.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setExpandedId(expandedId === mp.id ? null : mp.id)}
                >
                  <td className="px-4 py-3 text-gray-400">
                    {expandedId === mp.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{mp.codigo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-xs truncate">{mp.nome}</p>
                    {mp.inci && <p className="text-xs text-gray-400 truncate">{mp.inci}</p>}
                    {(mp.flag_alergeno || mp.flag_cmr || mp.flag_preservante || mp.flag_filtro_uv || mp.flag_corante || mp.flag_nanomaterial) && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {mp.flag_cmr && <span title="CMR — Carcinogênico/Mutagênico/Reprotóxico" className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">CMR</span>}
                        {mp.flag_preservante && <span title="Preservante (RDC 29/2012)" className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">⚗ Preserv.</span>}
                        {mp.flag_filtro_uv && <span title="Filtro UV (RDC 30/2012)" className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">☀ Filtro UV</span>}
                        {mp.flag_alergeno && <span title="Alérgeno declarável (EU Anexo III)" className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">⚠ Alérgeno</span>}
                        {mp.flag_corante && <span title="Corante" className="text-[10px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">🎨</span>}
                        {mp.flag_nanomaterial && <span title="Nanomaterial — declaração obrigatória" className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Nano</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{mp.categoria ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${anvisaColor[mp.anvisa] ?? 'bg-gray-100'}`}>
                      {mp.anvisa}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${homologColor[mp.homolog] ?? 'bg-gray-100'}`}>
                      {mp.homolog}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[120px] truncate hidden lg:table-cell">{mp.forn_candidato ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-700 font-mono text-xs hidden lg:table-cell">
                    {mp.preco_ref_usd ? `$${Number(mp.preco_ref_usd).toFixed(2)}` : '—'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(mp)}
                        className="text-xs text-gray-400 hover:text-blue-600 transition"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>

                {/* Linha expandida */}
                {expandedId === mp.id && (
                  <tr key={`${mp.id}-detail`} className="bg-blue-50/30">
                    <td colSpan={canEdit ? 9 : 8} className="px-8 py-4">
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={e => { e.stopPropagation(); setComparativoMp(mp) }}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition"
                        >
                          <GitCompareArrows className="w-3.5 h-3.5" /> Comparar Fornecedores
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-medium mb-1">Atributos</p>
                          <div className="flex flex-wrap gap-1">
                            {mp.origem_natural && <Badge color="green" icon={<Leaf className="w-3 h-3" />}>Natural</Badge>}
                            {mp.vegano && <Badge color="green">Vegano</Badge>}
                            {mp.cf && <Badge color="blue">CF</Badge>}
                            {mp.testado_animal && <Badge color="red" icon={<AlertTriangle className="w-3 h-3" />}>Testado Animal</Badge>}
                            {mp.parabenos && <Badge color="orange">Parabenos</Badge>}
                          </div>
                        </div>
                        {mp.cas && (
                          <div>
                            <p className="text-gray-400 font-medium mb-1">CAS</p>
                            <p className="font-mono text-gray-700">{mp.cas}</p>
                          </div>
                        )}
                        {mp.marcas && mp.marcas.length > 0 && (
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Marcas</p>
                            <p className="text-gray-700">{mp.marcas.join(', ')}</p>
                          </div>
                        )}
                        {mp.categoria === 'Fragrância' && (
                          <div className="col-span-2 md:col-span-4 border-t border-blue-100 pt-3 mt-1">
                            <p className="text-gray-400 font-medium mb-2 flex items-center gap-1">
                              <FlaskConical className="w-3.5 h-3.5" />
                              Perfil Olfativo
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {mp.familia_olfativa && <div><span className="text-gray-400">Família:</span> <span className="text-gray-700">{mp.familia_olfativa}</span></div>}
                              {mp.notas_topo && <div><span className="text-gray-400">Topo:</span> <span className="text-gray-700">{mp.notas_topo}</span></div>}
                              {mp.notas_coracao && <div><span className="text-gray-400">Coração:</span> <span className="text-gray-700">{mp.notas_coracao}</span></div>}
                              {mp.notas_fundo && <div><span className="text-gray-400">Fundo:</span> <span className="text-gray-700">{mp.notas_fundo}</span></div>}
                              {mp.ifra_categoria && <div><span className="text-gray-400">IFRA:</span> <span className="text-gray-700">{mp.ifra_categoria} — {mp.ifra_limite_pct ? `${mp.ifra_limite_pct}%` : 'sem limite'}</span></div>}
                              {mp.ifra_compliance && <div><span className="flex items-center gap-1 text-green-600"><ShieldCheck className="w-3.5 h-3.5" />IFRA Compliant</span></div>}
                              {mp.substancias_alergenas && <div className="col-span-2"><span className="text-gray-400">Alergênicas:</span> <span className="text-gray-700">{mp.substancias_alergenas}</span></div>}
                            </div>
                          </div>
                        )}
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
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma MP encontrada</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <MPModal
          mp={editingMp as MP | null}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${colors[color]}`}>
      {icon}{children}
    </span>
  )
}
