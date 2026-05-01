'use client'

import { ClipboardCheck, AlertCircle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

const STEPS = ['Pendente', 'Aval. Documental', 'Aprov. Documental', 'Aprov. Bancada', 'Homologado'] as const

export type HomologItem = {
  id: string
  mp_codigo: string
  mp_nome: string
  fornecedor_nome: string
  etapa: number
  responsavel: string
  data_inicio: string | null
  prazo: string | null
}

function isPrazoVencendo(prazo: string): boolean {
  const dt = new Date(prazo)
  const diff = (dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff <= 7 && diff >= 0
}

function isPrazoVencido(prazo: string): boolean {
  return new Date(prazo) < new Date()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function HomologBoard({ items, canEdit }: { items: HomologItem[]; canEdit: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-gray-900">Homologações em Andamento</h2>
        <span className="text-sm text-gray-400 ml-1">{items.length} processo{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Nenhum processo de homologação em andamento.</p>
          <p className="text-xs text-gray-400 mt-1">Use "Iniciar Homologação" na aba Fornecedores para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(h => {
            const vencendo = h.prazo ? isPrazoVencendo(h.prazo) : false
            const vencido  = h.prazo ? isPrazoVencido(h.prazo)  : false
            return (
              <div
                key={h.id}
                className={clsx(
                  'bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition',
                  vencido ? 'border-red-200' : vencendo ? 'border-yellow-200' : 'border-gray-100'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-400">{h.mp_codigo}</span>
                      {vencido && (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle className="w-3 h-3" /> Prazo vencido
                        </span>
                      )}
                      {vencendo && !vencido && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                          <Clock className="w-3 h-3" /> Vence em breve
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{h.mp_nome}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{h.fornecedor_nome} · Resp: {h.responsavel}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Início: {formatDate(h.data_inicio)}</p>
                    <p className={clsx('text-xs font-medium mt-0.5',
                      vencido ? 'text-red-600' : vencendo ? 'text-yellow-600' : 'text-gray-500'
                    )}>
                      Prazo: {formatDate(h.prazo)}
                    </p>
                  </div>
                </div>

                {/* Progress steps */}
                <div className="flex items-center gap-0">
                  {STEPS.map((step, idx) => {
                    const done    = idx < h.etapa
                    const current = idx === h.etapa
                    const last    = idx === STEPS.length - 1
                    return (
                      <div key={step} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div className={clsx(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                            done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : current
                                ? 'bg-white border-brand-500 text-brand-600 ring-2 ring-brand-100'
                                : 'bg-gray-100 border-gray-200 text-gray-400'
                          )}>
                            {done ? '✓' : idx + 1}
                          </div>
                          <span className={clsx(
                            'text-xs text-center leading-tight max-w-16',
                            done    ? 'text-emerald-600 font-medium'
                              : current ? 'text-brand-600 font-semibold'
                              : 'text-gray-400'
                          )}>
                            {step}
                          </span>
                        </div>
                        {!last && (
                          <div className={clsx(
                            'flex-1 h-0.5 mx-1 mb-4 transition-all',
                            idx < h.etapa ? 'bg-emerald-400' : 'bg-gray-200'
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
