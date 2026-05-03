'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, Lock, ArrowUpRight, Link2, ExternalLink, Unlink } from 'lucide-react'
import MondayProjectPanel from './MondayProjectPanel'

type FormulaLite = {
  id: string
  codigo: string
  produto?: string
  marca: string
  status: string
  monday_item_id?: string | null
  monday_board_id?: string | null
}

type MondayProject = {
  id: string
  name: string
  url: string
  etapa: string | null
  status: string | null
  categoria: string | null
}

export default function FormulaActionBar({
  formula, canEdit, isAdmin, onChange,
}: {
  formula: FormulaLite
  canEdit: boolean
  isAdmin: boolean
  onChange: (updated: any) => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  if (!canEdit) return null

  async function act(action: string, extra: Record<string, any> = {}) {
    if (!confirm(textForAction(action, formula))) return
    setBusy(action); setError(null)
    try {
      const res = await fetch(`/api/formulas/${formula.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      onChange(json.formula)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-teal-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ações</p>
      <div className="flex flex-wrap gap-2">
        {formula.status === 'Importada BID' && (
          <button onClick={() => act('promote')} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {busy === 'promote' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
            Promover (BID → Em Desenvolvimento)
          </button>
        )}
        {['Em Desenvolvimento', 'Em Estabilidade', 'Aprovada Internamente'].includes(formula.status) && (
          <button onClick={() => act('approve')} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
            {busy === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Aprovar (P&D OK)
          </button>
        )}
        {isAdmin && formula.status === 'Aprovada QA' && (
          <button onClick={() => act('lock')} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-900 disabled:opacity-50">
            {busy === 'lock' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Lock canônico
          </button>
        )}

        {formula.monday_item_id ? (
          <button onClick={() => act('unlink_monday')} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 text-xs rounded-lg hover:bg-red-50 hover:text-red-700 border border-blue-200 disabled:opacity-50"
            title="Desvincular projeto Monday">
            <Unlink className="w-3.5 h-3.5" />
            Desvincular Monday
          </button>
        ) : (
          <button onClick={() => setShowPicker(true)} disabled={!!busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Link2 className="w-3.5 h-3.5" />
            Vincular projeto Monday
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {formula.monday_item_id && (
        <MondayProjectPanel itemId={formula.monday_item_id} boardId={formula.monday_board_id} />
      )}

      {showPicker && (
        <MondayPicker
          marca={formula.marca}
          formulaText={[formula.produto, formula.codigo].filter(Boolean).join(' ')}
          onClose={() => setShowPicker(false)}
          onPick={(p) => {
            setShowPicker(false)
            act('link_monday', { monday_item_id: p.id })
          }}
        />
      )}
    </div>
  )
}

function textForAction(action: string, f: FormulaLite): string {
  switch (action) {
    case 'promote': return `Promover ${f.codigo} de "Importada BID" para "Em Desenvolvimento"?`
    case 'approve': return `Marcar ${f.codigo} como "Aprovada QA"? Esta ação posta um update no Monday vinculado (se houver).`
    case 'lock': return `Aplicar LOCK CANÔNICO em ${f.codigo}? A fórmula vira imutável e gera versão de snapshot.`
    case 'unlink_monday': return `Remover vínculo com Monday?`
    default: return 'Confirmar ação?'
  }
}

// Token overlap normalizado — barato e robusto pra nomes curtos de produtos
function similarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/).filter(t => t.length >= 2)
  const A = new Set(norm(a))
  const B = new Set(norm(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  A.forEach(t => { if (B.has(t)) inter++ })
  return inter / Math.max(A.size, B.size)
}

function MondayPicker({
  marca, formulaText = '', onClose, onPick,
}: {
  marca: string
  formulaText?: string
  onClose: () => void
  onPick: (p: MondayProject) => void
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projetos, setProjetos] = useState<MondayProject[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/monday/projetos?marca=${encodeURIComponent(marca)}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Erro')
        setProjetos(json.projetos ?? [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [marca])

  // Ranking: aplica similarity contra formulaText; com search ativo, busca textual
  const filtered = projetos
    .map(p => ({ p, score: search ? 0 : similarity(formulaText, p.name) }))
    .filter(({ p }) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.score - a.score)
  const topSuggestions = !search ? filtered.filter(x => x.score >= 0.34).slice(0, 3) : []
  const suggestionIds = new Set(topSuggestions.map(x => x.p.id))

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Vincular projeto do Monday — {marca}</h3>
          <p className="text-xs text-gray-500 mt-1">Projetos em "Validação de fórmula" do board {marca}</p>
        </div>
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar projeto..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Buscando projetos…
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              Erro: {error}. Verifique se MONDAY_API_TOKEN está configurado.
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">Nenhum projeto em validação de fórmula encontrado.</p>
          )}
          {!loading && !error && topSuggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-1.5 flex items-center gap-1">
                ✨ Sugestões por nome
              </p>
              {topSuggestions.map(({ p, score }) => (
                <button key={p.id} onClick={() => onPick(p)}
                  className="w-full text-left px-3 py-2.5 mb-1.5 rounded-lg border-2 border-amber-200 bg-amber-50 hover:border-amber-400 hover:bg-amber-100 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {p.categoria && <span className="inline-block px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded mr-1.5">{p.categoria}</span>}
                        {p.status && <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{p.status}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-amber-700 font-medium shrink-0">{Math.round(score * 100)}% match</span>
                  </div>
                </button>
              ))}
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-3 mb-1.5">Todos os projetos</p>
            </div>
          )}
          {!loading && !error && filtered.filter(({ p }) => !suggestionIds.has(p.id)).map(({ p }) => (
            <button key={p.id} onClick={() => onPick(p)}
              className="w-full text-left px-3 py-2.5 mb-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.categoria && <span className="inline-block px-1.5 py-0.5 bg-pink-50 text-pink-700 rounded mr-1.5">{p.categoria}</span>}
                    {p.status && <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">{p.status}</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">#{p.id}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
