'use client'

import { useState, useMemo } from 'react'
import {
  ArrowLeft, Beaker, FileText, History, ShieldCheck,
  Copy, Download, AlertTriangle, CheckCircle2, Info, XCircle,
  Sparkles, FlaskConical, BarChart3, Send, ThumbsUp, ThumbsDown, Archive,
  Lock, Unlock, Save, Calendar
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import Link from 'next/link'
import { avaliarCompliance } from '@/lib/anvisa'
import { gerarINCI } from '@/lib/inci'
import { ComplianceBadge } from '@/components/lab/ComplianceBadge'
import PainelRegulatorio from '@/components/lab/PainelRegulatorio'

type Formula = any
type Ingrediente = any
type Versao = any

const STATUS_COLOR: Record<string, string> = {
  'Em Desenvolvimento':      'bg-blue-100 text-blue-700',
  'Aprovada Internamente':   'bg-yellow-100 text-yellow-700',
  'Em Estabilidade':         'bg-orange-100 text-orange-700',
  'Aprovada QA':             'bg-green-100 text-green-700',
  'Registrada ANVISA':       'bg-emerald-100 text-emerald-800 border border-emerald-300',
  'Arquivada':               'bg-gray-100 text-gray-500',
  'Importada BID':           'bg-purple-100 text-purple-700',
}

type Tab = 'composicao' | 'regulatorio' | 'inci' | 'historico'

export default function FormulaDetalhe({
  formula, ingredientes, versoes, mpsRelacionadas = [], profile,
}: {
  formula: Formula
  ingredientes: Ingrediente[]
  versoes: Versao[]
  mpsRelacionadas?: any[]
  profile: any
}) {
  // Map MP por código e nome (para enriquecer ingredientes com custo + intel)
  const mpPorChave: Record<string, any> = {}
  for (const mp of mpsRelacionadas) {
    if (mp.codigo) mpPorChave[`c:${mp.codigo}`] = mp
    if (mp.nome)   mpPorChave[`n:${mp.nome.toLowerCase()}`] = mp
  }
  function findMP(ing: any) {
    if (ing.mp_codigo && mpPorChave[`c:${ing.mp_codigo}`]) return mpPorChave[`c:${ing.mp_codigo}`]
    if (ing.mp_nome && mpPorChave[`n:${ing.mp_nome.toLowerCase()}`]) return mpPorChave[`n:${ing.mp_nome.toLowerCase()}`]
    return null
  }
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('composicao')
  const [tipoProduto, setTipoProduto] = useState<'leave-on' | 'rinse-off'>('leave-on')
  const [aprovando, setAprovando] = useState(false)
  const [rejeitando, setRejeitando] = useState(false)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [showRejeitar, setShowRejeitar] = useState(false)
  const [erroAcao, setErroAcao] = useState<string | null>(null)

  const canAprovar = profile?.role === 'admin' || profile?.role === 'pd'

  // Determinar ações disponíveis baseado no status atual
  const acoesDisponiveis = useMemo(() => {
    const t: Record<string, { acao: string; label: string; variante: 'primary' | 'success' | 'danger' | 'neutral' }[]> = {
      'Em Desenvolvimento':    [{ acao: 'enviar_validacao', label: 'Enviar para validação', variante: 'primary' }],
      'Em Estabilidade':       [
        { acao: 'aprovar', label: 'Aprovar internamente', variante: 'success' },
        { acao: 'rejeitar', label: 'Rejeitar', variante: 'danger' },
      ],
      'Aprovada Internamente': [
        { acao: 'aprovar', label: 'Aprovar QA', variante: 'success' },
        { acao: 'rejeitar', label: 'Rejeitar', variante: 'danger' },
      ],
      'Aprovada QA':           [{ acao: 'rejeitar', label: 'Reabrir', variante: 'neutral' }],
      'Importada BID':         [
        { acao: 'aprovar', label: 'Validar e promover', variante: 'success' },
        { acao: 'rejeitar', label: 'Descartar', variante: 'danger' },
      ],
      'Arquivada': [],
    }
    return t[formula.status] ?? []
  }, [formula.status])

  async function executarAcao(acao: string, motivo?: string) {
    setErroAcao(null)
    if (acao === 'rejeitar') setRejeitando(true)
    else setAprovando(true)
    try {
      const res = await fetch(`/api/formulas/${formula.id}/aprovacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, motivo }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      router.refresh()
      setShowRejeitar(false)
      setMotivoRejeicao('')
    } catch (err: any) {
      setErroAcao(err.message)
    } finally {
      setAprovando(false)
      setRejeitando(false)
    }
  }

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

  // Custo NET USD da fórmula (cálculo baseado em % × custo MP)
  const custoFormula = useMemo(() => {
    let totalNet = 0
    let totalMelhor = 0
    let mpsComCusto = 0
    for (const ing of ingredientes) {
      const mp = findMP(ing)
      if (!mp) continue
      const pct = parseFloat(String(ing.percentual ?? '').replace(/[^0-9.]/g, ''))
      if (isNaN(pct)) continue
      // Custo USD por kg de fórmula = (pct / 100) × custoMP_USD
      if (mp.preco_ref_usd) {
        totalNet += (pct / 100) * Number(mp.preco_ref_usd)
        mpsComCusto++
      }
      if (mp.melhor_preco_usd) {
        totalMelhor += (pct / 100) * Number(mp.melhor_preco_usd)
      }
    }
    const cobertura = ingredientes.length > 0 ? mpsComCusto / ingredientes.length : 0
    return {
      net_usd_kg: totalNet,
      melhor_usd_kg: totalMelhor,
      mpsComCusto,
      cobertura,
    }
  }, [ingredientes, mpsRelacionadas])

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

      {/* Workflow de Aprovação */}
      {canAprovar && acoesDisponiveis.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-500" />
              <p className="text-sm font-semibold text-gray-900">Workflow</p>
              <span className="text-xs text-gray-400">Status atual: <strong>{formula.status}</strong></span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {acoesDisponiveis.map(a => {
                const Icon = a.acao === 'aprovar' ? ThumbsUp :
                             a.acao === 'rejeitar' ? ThumbsDown :
                             a.acao === 'arquivar' ? Archive : Send
                const colorClasses = {
                  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
                  success: 'bg-green-500 hover:bg-green-600 text-white',
                  danger:  'bg-red-500 hover:bg-red-600 text-white',
                  neutral: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                }
                return (
                  <button
                    key={a.acao}
                    onClick={() => {
                      if (a.acao === 'rejeitar') setShowRejeitar(true)
                      else executarAcao(a.acao)
                    }}
                    disabled={aprovando || rejeitando}
                    className={clsx(
                      'flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition disabled:opacity-50',
                      colorClasses[a.variante]
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {aprovando ? 'Processando...' : a.label}
                  </button>
                )
              })}
            </div>
          </div>

          {erroAcao && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erroAcao}
            </div>
          )}

          {showRejeitar && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-2">Motivo da rejeição (obrigatório)</p>
              <textarea
                value={motivoRejeicao}
                onChange={e => setMotivoRejeicao(e.target.value)}
                rows={3}
                className="w-full text-sm border border-red-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
                placeholder="Descreva o motivo da rejeição..."
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => { setShowRejeitar(false); setMotivoRejeicao('') }}
                  className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => executarAcao('rejeitar', motivoRejeicao)}
                  disabled={!motivoRejeicao.trim() || rejeitando}
                  className="text-xs px-3 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition font-medium disabled:opacity-50"
                >
                  {rejeitando ? 'Rejeitando...' : 'Confirmar rejeição'}
                </button>
              </div>
            </div>
          )}

          {formula.rejeicao_motivo && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-red-700">Última rejeição:</p>
              <p className="text-xs text-red-600 mt-0.5">{formula.rejeicao_motivo}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
          <p className="text-xs text-gray-400 mb-1">Custo NET</p>
          <p className="text-xl font-bold text-gray-900">
            ${custoFormula.net_usd_kg.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">USD/kg fórmula</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Cobertura preço</p>
          <p className={clsx(
            'text-xl font-bold',
            custoFormula.cobertura >= 0.8 ? 'text-green-600' :
            custoFormula.cobertura >= 0.4 ? 'text-yellow-600' : 'text-red-500'
          )}>
            {(custoFormula.cobertura * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-400">{custoFormula.mpsComCusto}/{ingredientes.length} MPs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Versões</p>
          <p className="text-2xl font-bold text-gray-900">{versoes.length || 1}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Alérgenos</p>
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
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 hidden md:table-cell">INCI / Função</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-gray-500">%</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-gray-500 hidden lg:table-cell">$/kg</th>
                    <th className="text-right px-5 py-2 text-xs font-medium text-gray-500 hidden lg:table-cell">Custo na fórmula</th>
                    <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Compliance</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ings.map((ing, i) => {
                    const item = complianceItens.find(c => c.ing.id === ing.id) ?? complianceItens[i]
                    const mp = findMP(ing)
                    const pct = parseFloat(String(ing.percentual ?? '').replace(/[^0-9.]/g, ''))
                    const custoUSDkg = mp?.preco_ref_usd ? Number(mp.preco_ref_usd) : null
                    const custoNaFormula = (custoUSDkg && !isNaN(pct)) ? (pct / 100) * custoUSDkg : null
                    const intel = mp?.inteligencia_tecnica
                    return (
                      <tr key={ing.id ?? i} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-2.5">
                          <p className="text-sm font-medium text-gray-900">{ing.mp_nome ?? '—'}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {ing.mp_codigo && <span className="text-xs text-gray-400 font-mono">{ing.mp_codigo}</span>}
                            {mp?.flag_cmr && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold" title="CMR">CMR</span>}
                            {mp?.flag_alergeno && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded" title="Alérgeno declarável">⚠</span>}
                            {mp?.flag_preservante && <span className="text-[10px] bg-amber-100 text-amber-700 px-1 rounded" title="Preservante">⚗</span>}
                            {mp?.flag_filtro_uv && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded" title="Filtro UV">☀</span>}
                          </div>
                        </td>
                        <td className="px-5 py-2.5 hidden md:table-cell">
                          <span className="text-xs text-gray-500 italic">{ing.inci ?? mp?.inci ?? '—'}</span>
                          {(intel?.funcao_primaria || ing.funcao) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {intel?.funcao_primaria ?? ing.funcao}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <span className="text-sm font-medium text-gray-700">{ing.percentual ?? 'q.s.'}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right hidden lg:table-cell">
                          <span className="text-xs font-mono text-gray-600">{custoUSDkg ? `$${custoUSDkg.toFixed(2)}` : '—'}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right hidden lg:table-cell">
                          <span className="text-xs font-mono text-gray-700">{custoNaFormula ? `$${custoNaFormula.toFixed(4)}` : '—'}</span>
                        </td>
                        <td className="px-5 py-2.5">
                          <ComplianceBadge check={item?.check ?? { severidade: 'ok', mensagem: null, resolucao: null, restricao: null }} />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          {mp && (
                            <a href={`/dashboard/mps/${mp.id}`} className="text-xs text-brand-500 hover:underline" title="Ver ficha técnica completa">
                              Ficha →
                            </a>
                          )}
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
        <PainelRegulatorio
          formula={formula}
          canEdit={canAprovar}
          isAdmin={profile?.role === 'admin'}
          statusCompliance={statusCompliance}
        />
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
