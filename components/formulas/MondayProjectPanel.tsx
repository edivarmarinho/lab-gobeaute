'use client'

import { useEffect, useState } from 'react'
import { Loader2, ExternalLink, Calendar, Layers, Activity, AlertTriangle } from 'lucide-react'

type Projeto = {
  id: string
  name: string
  url: string
  etapa: string | null
  status: string | null
  categoria: string | null
  data_lancamento: string | null
  mes_lancamento: string | null
}

const STATUS_COLOR: Record<string, string> = {
  'Em andamento': 'bg-blue-100 text-blue-700',
  'Concluído': 'bg-green-100 text-green-700',
  'Parado': 'bg-red-100 text-red-700',
  'Não Iniciado': 'bg-gray-100 text-gray-600',
  'Com risco': 'bg-amber-100 text-amber-700',
  'No prazo': 'bg-indigo-100 text-indigo-700',
}

const ETAPA_COLOR: Record<string, string> = {
  'Validação de formula': 'bg-orange-100 text-orange-700',
  'Validação de embalagem': 'bg-slate-100 text-slate-700',
  'ANVISA': 'bg-red-100 text-red-700',
  'Agendar produção': 'bg-yellow-100 text-yellow-700',
  'Lançado': 'bg-green-100 text-green-700',
  'Produção': 'bg-blue-100 text-blue-700',
  'Em estoque nos CDs': 'bg-cyan-100 text-cyan-700',
  'Arte': 'bg-sky-100 text-sky-700',
  'Validação': 'bg-pink-100 text-pink-700',
  'Validação de custo': 'bg-fuchsia-100 text-fuchsia-700',
  'CTR/Waitlist': 'bg-violet-100 text-violet-700',
  'Recebimento de MPs': 'bg-teal-100 text-teal-700',
  'Em trânsito para CDs': 'bg-gray-100 text-gray-700',
}

export default function MondayProjectPanel({ itemId, boardId }: { itemId: string; boardId?: string | null }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projeto, setProjeto] = useState<Projeto | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    fetch(`/api/monday/items/${itemId}`)
      .then(async r => {
        const json = await r.json()
        if (!alive) return
        if (!r.ok) throw new Error(json.error ?? 'erro')
        setProjeto(json.projeto)
      })
      .catch(e => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [itemId])

  const mondayUrl = projeto?.url ?? (boardId ? `https://gobeaute-produto.monday.com/boards/${boardId}/pulses/${itemId}` : null)

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
          Projeto Monday vinculado
        </div>
        {mondayUrl && (
          <a href={mondayUrl} target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5">
            abrir <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando projeto…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs text-amber-700 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div>
            Não foi possível carregar do Monday: {error}
            <p className="text-amber-600 mt-0.5">Vínculo (#{itemId}) está salvo. Verifique <code className="font-mono bg-amber-100 px-1 rounded">MONDAY_API_TOKEN</code> no Vercel.</p>
          </div>
        </div>
      )}

      {projeto && !loading && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-gray-900">{projeto.name}</p>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {projeto.etapa && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${ETAPA_COLOR[projeto.etapa] ?? 'bg-gray-100 text-gray-600'}`}>
                <Layers className="w-2.5 h-2.5" />
                {projeto.etapa}
              </span>
            )}
            {projeto.status && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[projeto.status] ?? 'bg-gray-100 text-gray-600'}`}>
                <Activity className="w-2.5 h-2.5" />
                {projeto.status}
              </span>
            )}
            {projeto.categoria && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full font-medium bg-pink-100 text-pink-700">
                {projeto.categoria}
              </span>
            )}
            {(projeto.data_lancamento || projeto.mes_lancamento) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                <Calendar className="w-2.5 h-2.5" />
                {projeto.data_lancamento
                  ? new Date(projeto.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : projeto.mes_lancamento}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
