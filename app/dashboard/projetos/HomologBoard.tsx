'use client'

import { ClipboardCheck, AlertCircle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

const STEPS = ['Pendente', 'Aval. Documental', 'Aprov. Documental', 'Aprov. Bancada', 'Homologado'] as const

// Dados fixos extraídos do HTML (homologData)
const HOMOLOG_DATA = [
  {
    mp: 'MP0022',
    nomeMp: 'Ácido Cítrico Monoidratado',
    fornecedor: 'ANASTACIO SP',
    etapa: 1,
    responsavel: 'Patrícia',
    inicio: '01/04/2026',
    prazo: '30/04/2026',
  },
  {
    mp: 'MP0088',
    nomeMp: 'Fenoxietanol + IPBC',
    fornecedor: 'ALPHA QUIMICA SP',
    etapa: 0,
    responsavel: 'Patrícia',
    inicio: '20/04/2026',
    prazo: '20/05/2026',
  },
  {
    mp: 'MP0140',
    nomeMp: 'Óleo de Baobá (novo fornecedor)',
    fornecedor: 'PHYTOVITAL SP',
    etapa: 2,
    responsavel: 'Patrícia',
    inicio: '10/03/2026',
    prazo: '10/05/2026',
  },
]

function isPrazoVencendo(prazo: string): boolean {
  const [d, m, y] = prazo.split('/')
  const dt = new Date(`${y}-${m}-${d}`)
  const diff = (dt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff <= 7 && diff >= 0
}

function isPrazoVencido(prazo: string): boolean {
  const [d, m, y] = prazo.split('/')
  const dt = new Date(`${y}-${m}-${d}`)
  return dt < new Date()
}

export default function HomologBoard({ canEdit }: { canEdit: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold text-gray-900">Homologações em Andamento</h2>
        <span className="text-sm text-gray-400 ml-1">{HOMOLOG_DATA.length} processos</span>
      </div>

      <div className="space-y-4">
        {HOMOLOG_DATA.map((h, i) => {
          const vencendo = isPrazoVencendo(h.prazo)
          const vencido = isPrazoVencido(h.prazo)
          return (
            <div
              key={i}
              className={clsx(
                'bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition',
                vencido ? 'border-red-200' : vencendo ? 'border-yellow-200' : 'border-gray-100'
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{h.mp}</span>
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
                  <h3 className="font-semibold text-gray-900">{h.nomeMp}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{h.fornecedor} · Resp: {h.responsavel}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">Início: {h.inicio}</p>
                  <p className={clsx('text-xs font-medium mt-0.5',
                    vencido ? 'text-red-600' : vencendo ? 'text-yellow-600' : 'text-gray-500'
                  )}>
                    Prazo: {h.prazo}
                  </p>
                </div>
              </div>

              {/* Progress steps */}
              <div className="flex items-center gap-0">
                {STEPS.map((step, idx) => {
                  const done = idx < h.etapa
                  const current = idx === h.etapa
                  const last = idx === STEPS.length - 1
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
                          done ? 'text-emerald-600 font-medium'
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
    </div>
  )
}
