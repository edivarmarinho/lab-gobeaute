'use client'

import { useEffect, useState } from 'react'
import {
  ListChecks, AlertTriangle, ShieldCheck, Brain, Beaker, FlaskConical,
  ArrowRight, ChevronDown, ChevronUp, Clock, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

type Pendencia = {
  tipo: string
  ref_id: string
  ref_codigo: string
  ref_label: string
  marca: string | null
  acao: string
  prioridade: number
}

const TIPO_CONFIG: Record<string, { label: string; icon: any; cor: string; href: (p: Pendencia) => string }> = {
  formula_bid_validar: {
    label: 'BID a validar',
    icon: FlaskConical,
    cor: 'purple',
    href: (p) => `/dashboard/formulas/${p.ref_id}`,
  },
  formula_sem_anvisa: {
    label: 'Sem nº processo ANVISA',
    icon: ShieldCheck,
    cor: 'red',
    href: (p) => `/dashboard/formulas/${p.ref_id}`,
  },
  formula_sem_grau: {
    label: 'Sem classificação ANVISA',
    icon: AlertTriangle,
    cor: 'amber',
    href: (p) => `/dashboard/formulas/${p.ref_id}`,
  },
  mp_sem_inteligencia: {
    label: 'Sem inteligência IA',
    icon: Brain,
    cor: 'blue',
    href: (p) => `/dashboard/mps/${p.ref_id}`,
  },
}

const COR_CLASSES: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  purple: { bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700', iconBg: 'bg-purple-100' },
  red:    { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',    iconBg: 'bg-red-100' },
  amber:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',  iconBg: 'bg-amber-100' },
  blue:   { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',   iconBg: 'bg-blue-100' },
}

export default function PainelPendencias() {
  const [pendencias, setPendencias] = useState<Pendencia[]>([])
  const [loading, setLoading] = useState(true)
  const [tipoExpandido, setTipoExpandido] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/pendencias')
      .then(r => r.json())
      .then(json => setPendencias(json.pendencias ?? []))
      .catch(() => setPendencias([]))
      .finally(() => setLoading(false))
  }, [])

  // Agrupar por tipo
  const grupos: Record<string, Pendencia[]> = {}
  for (const p of pendencias) {
    if (!grupos[p.tipo]) grupos[p.tipo] = []
    grupos[p.tipo].push(p)
  }

  const totalPendencias = pendencias.length
  const totalUrgentes = pendencias.filter(p => p.prioridade === 1).length

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (totalPendencias === 0) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Tudo em dia! 🎉</p>
          <p className="text-xs text-emerald-700">Nenhuma pendência crítica para o time de P&D.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-brand-50 to-pink-50 border-2 border-brand-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 bg-white/60 border-b border-brand-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-sm">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Pendências do P&D</h2>
            <p className="text-xs text-gray-600">
              {totalPendencias} {totalPendencias === 1 ? 'pendência ativa' : 'pendências ativas'}
              {totalUrgentes > 0 && <span className="text-red-600 font-medium"> · {totalUrgentes} urgente{totalUrgentes > 1 ? 's' : ''}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Grupos */}
      <div className="divide-y divide-brand-100">
        {Object.entries(grupos)
          .sort(([, a], [, b]) => Math.min(...a.map(x => x.prioridade)) - Math.min(...b.map(x => x.prioridade)))
          .map(([tipo, items]) => {
            const cfg = TIPO_CONFIG[tipo]
            if (!cfg) return null
            const cores = COR_CLASSES[cfg.cor]
            const Icon = cfg.icon
            const isExpandido = tipoExpandido === tipo
            const minPrioridade = Math.min(...items.map(i => i.prioridade))

            return (
              <div key={tipo} className="bg-white/40">
                <button
                  onClick={() => setTipoExpandido(isExpandido ? null : tipo)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-white/60 transition text-left"
                >
                  <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', cores.iconBg)}>
                    <Icon className={clsx('w-4 h-4', cores.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={clsx('text-sm font-semibold', cores.text)}>{cfg.label}</p>
                      {minPrioridade === 1 && (
                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">URGENTE</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {items.length} {items.length === 1 ? 'item' : 'itens'} aguardando ação
                    </p>
                  </div>
                  <span className={clsx(
                    'text-2xl font-bold',
                    cores.text,
                  )}>{items.length}</span>
                  {isExpandido ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isExpandido && (
                  <div className="px-5 pb-3 space-y-1.5 bg-white/40">
                    {items.slice(0, 10).map(p => (
                      <Link
                        key={p.ref_id}
                        href={cfg.href(p)}
                        className={clsx(
                          'flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:shadow-sm transition group',
                          cores.border
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-gray-500">{p.ref_codigo}</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{p.ref_label}</p>
                          {p.marca && <p className="text-xs text-gray-400">{p.marca}</p>}
                        </div>
                        <p className="text-xs text-gray-500 hidden sm:block">{p.acao}</p>
                        <ArrowRight className={clsx('w-4 h-4 transition shrink-0', cores.text, 'group-hover:translate-x-1')} />
                      </Link>
                    ))}
                    {items.length > 10 && (
                      <p className="text-xs text-gray-400 text-center pt-2">
                        + {items.length - 10} item{items.length - 10 > 1 ? 's' : ''} adicionais
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}
