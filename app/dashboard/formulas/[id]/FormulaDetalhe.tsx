'use client'

import { useState, useMemo } from 'react'
import {
  ArrowLeft, Beaker, FileText, History, ShieldCheck,
  Copy, Download, AlertTriangle, CheckCircle2, Info, XCircle,
  Sparkles, FlaskConical, BarChart3
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'
import { avaliarCompliance } from '@/lib/anvisa'
import { gerarINCI } from '@/lib/inci'
import { ComplianceBadge } from '@/components/lab/ComplianceBadge'

type Formula = any
type Ingrediente = any
type Versao = any

const STATUS_COLOR: Record<string, string> = {
  'Em Desenvolvimento':      'bg-blue-100 text-blue-700',
  'Aprovada Internamente':   'bg-yellow-100 text-yellow-700',
  'Em Estabilidade':         'bg-orange-100 text-orange-700',
  'Aprovada QA':             'bg-green-100 text-green-700',
  'Arquivada':               'bg-gray-100 text-gray-500',
  'Importada BID':           'bg-purple-100 text-purple-700',
}

type Tab = 'composicao' | 'regulatorio' | 'inci' | 'historico'

export default function FormulaDetalhe({
  formula, ingredientes, versoes,
}: {
  formula: Formula
  ingredientes: Ingrediente[]
  versoes: Versao[]
  profile: any
}) {
  const [tab, setTab] = useState<Tab>('composicao')
  const [tipoProduto, setTipoProduto] = useState<'leave-on' | 'rinse-off'>('leave-on')

  // Calcular compliance por ingrediente
  const complianceItens = useMemo(() => {
    return ingredientes.map(ing => {
      const pct = ing.percentual ? parseFloat(String(ing.percentual).replace(/[^0-9.]/g, '')) : null
      const check = avaliarCompliance(
        ing.inci ?? ing.mp_nome ?? '',
        pct,
        undefined,
        tipoProduto
      )
      return { ing, check, pct }
    })
  }, [ingredientes, tipoProduto])

  // Stats de compliance
  const statsCompliance = useMemo(() => {
    return {
      ok: complianceItens.filter(c => c.check.severidade === 'ok').length,
      info: complianceItens.filter(c => c.check.severidade === 'info').length,
      warning: complianceItens.filter(c => c.check.severidade === 'warning').length,
      error: complianceItens.filter(c => c.check.severidade === 'error').length,
    }
  }, [complianceItens])

  const statusCompliance: 'ok' | 'warning' | 'error' =
    statsCompliance.error > 0 ? 'error' :
    statsCompliance.warning > 0 ? 'warning' : 'ok'

  // INCI gerado
  const inci = useMemo(() => gerarINCI(ingredientes, tipoProduto), [ingredientes, tipoProduto])

  // Cobertura de %
  const totalPct = useMemo(() => {
    return ingredientes.reduce((sum, ing) => {
      const p = parseFloat(String(ing.percentual ?? '').replace(/[^0-9.]/g, ''))
      return sum + (isNaN(p) ? 0 : p)
    }, 0)
  }, [ingredientes])

  function copyINCI() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(inci.texto)
    }
  }

  // Agrupar por fase (se existir)
  const ingredientesPorFase = useMemo(() => {
    const map: Record<string, Ingrediente[]> = {}
    for (const ing of ingredientes) {
      const fase = ing.fase ?? 'Composição'
      if (!map[fase]) map[fase] = []
      map[fase].push(ing)
    }
    return map
  }, [ingredientes])

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <Link href="/dashboard/formulas" className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-1 mb-3 transition">
          <ArrowLeft className="w-3 h-3" />
          Voltar para fórmulas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Beaker className="w-5 h-5 text-brand-500" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{formula.codigo}</h1>
              <span className="text-sm text-gray-400 font-mono">{formula.versao}</span>
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLOR[formula.status] ?? 'bg-gray-100 text-gray-600')}>
                {formula.status}
              </span>
            </div>
            <h2 className="text-lg text-gray-700">{formula.produto}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {formula.marca} · {formula.tipo} · {formula.responsavel ?? 'Sem responsável'}
            </p>
          </div>

          {/* Status compliance */}
          <div className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl border',
            statusCompliance === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            statusCompliance === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-green-50 border-green-200 text-green-700'
          )}>
            {statusCompliance === 'error' ? <XCircle className="w-5 h-5" /> :
             statusCompliance === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
             <CheckCircle2 className="w-5 h-5" />}
            <div>
              <p className="text-xs font-semibold">
                {statusCompliance === 'error' ? 'Não conforme' :
                 statusCompliance === 'warning' ? 'Atenção' : 'Compliant'}
              </p>
              <p className="text-xs opacity-75">
                {statsCompliance.error > 0 && `${statsCompliance.error} erro${statsCompliance.error > 1 ? 's' : ''} · `}
                {statsCompliance.warning > 0 && `${statsCompliance.warning} aviso${statsCompliance.warning > 1 ? 's' : ''} · `}
                {statsCompliance.info > 0 && `${statsCompliance.info} info · `}
                {statsCompliance.ok} OK
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Ingredientes</p>
          <p className="text-2xl font-bold text-gray-900">{ingredientes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">% Mapeado</p>
          <p className={clsx(
            'text-2xl font-bold',
            totalPct >= 95 && totalPct <= 105 ? 'text-green-600' :
            totalPct >= 80 ? 'text-yellow-600' : 'text-red-500'
          )}>
            {totalPct.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Versões</p>
          <p className="text-2xl font-bold text-gray-900">{versoes.length || 1}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Alérgenos detectados</p>
          <p className="text-2xl font-bold text-amber-600">{inci.alergenos_declaraveis.length}</p>
        </div>
      </div>

      {/* Tipo de produto */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Modo de uso</p>
            <p className="text-xs text-gray-400">Determina os limites de declaração de alérgenos</p>
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setTipoProduto('leave-on')}
              className={clsx(
                'text-xs px-4 py-2 font-medium transition border-r border-gray-200',
                tipoProduto === 'leave-on' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Leave-on (sem enxágue)
            </button>
            <button
              onClick={() => setTipoProduto('rinse-off')}
              className={clsx(
                'text-xs px-4 py-2 font-medium transition',
                tipoProduto === 'rinse-off' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              Rinse-off (enxaguável)
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {([
          { key: 'composicao',  label: 'Composição',  icon: Beaker },
          { key: 'regulatorio', label: 'Regulatório', icon: ShieldCheck },
          { key: 'inci',        label: 'Lista INCI',  icon: Sparkles },
          { key: 'historico',   label: 'Histórico',   icon: History },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-5 py-3 text-sm font-medium transition border-b-2 whitespace-nowrap',
              tab === t.key
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Composição */}
      {tab === 'composicao' && (
        <div className="space-y-4">
          {Object.entries(ingredientesPorFase).map(([fase, ings]) => (
            <div key={fase} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">{fase}</p>
                <p className="text-xs text-gray-400">{ings.length} ingredientes</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Ingrediente</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 hidden md:table-cell">INCI</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">%</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 hidden lg:table-cell">Função</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Compliance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ings.map((ing, i) => {
                    const item = complianceItens.find(c => c.ing.id === ing.id) ?? complianceItens[i]
                    return (
                      <tr key={ing.id ?? i} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-2.5">
                          <p className="text-sm font-medium text-gray-900">{ing.mp_nome ?? '—'}</p>
                          {ing.mp_codigo && <p className="text-xs text-gray-400 font-mono">{ing.mp_codigo}</p>}
                        </td>
                        <td className="px-5 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-gray-500">{ing.inci ?? '—'}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <span className="text-sm font-medium text-gray-700">{ing.percentual ?? 'q.s.'}</span>
                        </td>
                        <td className="px-5 py-2.5 hidden lg:table-cell">
                          <span className="text-xs text-gray-400">{ing.funcao ?? '—'}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <ComplianceBadge check={item?.check ?? { severidade: 'ok', mensagem: null, resolucao: null, restricao: null }} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Regulatório */}
      {tab === 'regulatorio' && (
        <div className="space-y-4">

          {/* Resumo ANVISA */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Status Regulatório ANVISA</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Grau ANVISA</p>
                <p className="text-sm font-medium text-gray-700">{formula.anvisa_grau ?? 'Não classificado'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Nº Registro</p>
                <p className="text-sm font-medium text-gray-700">{formula.anvisa_num_reg ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Forma cosmética</p>
                <p className="text-sm font-medium text-gray-700">{formula.forma_cosmetica ?? formula.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Compliance Brasil</p>
                <ComplianceBadge
                  showLabel
                  check={{
                    severidade: statusCompliance,
                    mensagem: statusCompliance === 'ok' ? 'Compliant com normas ANVISA' :
                              statusCompliance === 'warning' ? 'Verificar avisos abaixo' :
                              'Não conforme — ação necessária',
                    resolucao: null,
                    restricao: null,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Lista de problemas */}
          {complianceItens.filter(c => c.check.severidade !== 'ok').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Avisos e restrições por ingrediente</p>
              </div>
              <div className="divide-y divide-gray-50">
                {complianceItens
                  .filter(c => c.check.severidade !== 'ok')
                  .sort((a, b) => {
                    const ord = { error: 0, warning: 1, info: 2, ok: 3 }
                    return ord[a.check.severidade] - ord[b.check.severidade]
                  })
                  .map((c, i) => (
                    <div key={i} className="px-5 py-3 flex items-start gap-3">
                      <ComplianceBadge check={c.check} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{c.ing.mp_nome}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{c.check.mensagem}</p>
                        {c.check.resolucao && (
                          <p className="text-xs text-gray-400 mt-1">📜 {c.check.resolucao}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-500">{c.ing.percentual ?? '—'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Alérgenos */}
          {inci.alergenos_declaraveis.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Alérgenos com declaração obrigatória
              </p>
              <p className="text-xs text-amber-700 mb-2">
                Os seguintes alérgenos estão presentes acima do limite de declaração ({tipoProduto === 'leave-on' ? '0.001%' : '0.01%'}) e devem aparecer no rótulo:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {inci.alergenos_declaraveis.map(a => (
                  <span key={a} className="text-xs bg-white text-amber-700 px-2 py-1 rounded-md border border-amber-200 font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: INCI */}
      {tab === 'inci' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <h3 className="font-semibold text-gray-900 text-sm">Lista INCI gerada automaticamente</h3>
              </div>
              <button
                onClick={copyINCI}
                className="flex items-center gap-1.5 text-xs bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-800 leading-relaxed">{inci.texto || 'Nenhum ingrediente para gerar INCI'}</p>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Lista em ordem decrescente de concentração conforme RDC 7/2015 e EU 1223/2009.
              Ingredientes ≤1% em ordem alfabética.
            </p>

            {inci.avisos.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-amber-700 mb-1">Avisos:</p>
                {inci.avisos.map((a, i) => (
                  <p key={i} className="text-xs text-amber-700">⚠ {a}</p>
                ))}
              </div>
            )}
          </div>

          {/* Detalhe item por item */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Detalhe por item</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">#</th>
                  <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">INCI</th>
                  <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">%</th>
                  <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inci.itens.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-2 text-xs text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-5 py-2 text-sm text-gray-900">{item.inci}</td>
                    <td className="px-5 py-2 text-sm text-gray-600">{item.percentual !== null ? `${item.percentual}%` : '—'}</td>
                    <td className="px-5 py-2">
                      {item.corante ? <span className="text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded">Corante</span> :
                       item.fragrancia ? <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Fragrância</span> :
                       <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Histórico */}
      {tab === 'historico' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Histórico de versões</p>
          </div>
          {versoes.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Esta fórmula não possui versões registradas.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {versoes.map((v: any) => (
                <div key={v.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.versao}</p>
                      {v.descricao && <p className="text-xs text-gray-600 mt-0.5">{v.descricao}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{v.por ?? '—'}</p>
                      {v.data_versao && (
                        <p className="text-xs text-gray-400">{new Date(v.data_versao).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
