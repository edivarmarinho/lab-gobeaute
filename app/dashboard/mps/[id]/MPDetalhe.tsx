'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Package, Sparkles, AlertTriangle, CheckCircle2,
  Beaker, Droplet, Thermometer, Sun, Zap, Leaf, ShieldCheck,
  TrendingUp, Heart, X, RefreshCw, Brain, Activity, FlaskConical,
  Sprout, Recycle, ExternalLink, Info, Microscope
} from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'
import type { IntelMP } from '@/lib/mp-intelligence'

type MP = any
type FormulaUso = any

const SOLUBILIDADE_COR = {
  soluvel:   'text-green-600 bg-green-50',
  parcial:   'text-yellow-600 bg-yellow-50',
  insoluvel: 'text-red-600 bg-red-50',
  na:        'text-gray-400 bg-gray-50',
}

export default function MPDetalhe({
  mp, uso, formulas, profile,
}: {
  mp: MP
  uso: any
  formulas: FormulaUso[]
  profile: any
}) {
  const router = useRouter()
  const [enriquecendo, setEnriquecendo] = useState(false)
  const [erroEnriquecer, setErroEnriquecer] = useState<string | null>(null)

  const intel: IntelMP | null = mp.inteligencia_tecnica ?? null
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  async function enriquecer() {
    setEnriquecendo(true)
    setErroEnriquecer(null)
    try {
      const res = await fetch(`/api/mps/${mp.id}/enriquecer`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro')
      router.refresh()
    } catch (err: any) {
      setErroEnriquecer(err.message)
    } finally {
      setEnriquecendo(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <Link href="/dashboard/mps" className="text-xs text-gray-400 hover:text-brand-500 flex items-center gap-1 mb-3 transition">
          <ArrowLeft className="w-3 h-3" />
          Voltar para Matérias-Primas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Package className="w-5 h-5 text-blue-500" />
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{mp.codigo}</h1>
              <span className="text-sm text-gray-400 font-mono">{mp.cas ?? ''}</span>
            </div>
            <h2 className="text-lg text-gray-800">{mp.nome}</h2>
            {mp.inci && <p className="text-sm text-gray-500 mt-0.5 italic">INCI: {mp.inci}</p>}

            {/* Flags */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {mp.flag_cmr && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">⚠ CMR</span>}
              {mp.flag_preservante && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">⚗ Preservante</span>}
              {mp.flag_filtro_uv && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">☀ Filtro UV</span>}
              {mp.flag_alergeno && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">⚠ Alérgeno</span>}
              {mp.flag_corante && <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">🎨 Corante</span>}
              {mp.flag_nanomaterial && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Nano</span>}
              {mp.origem_natural && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1"><Leaf className="w-3 h-3" />Natural</span>}
              {mp.vegano && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Vegano</span>}
              {mp.cf && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Cruelty-Free</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium',
              mp.homolog === 'Homologada' ? 'bg-green-50 text-green-700 border border-green-200' :
              mp.homolog === 'Em Processo' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              'bg-gray-50 text-gray-600 border border-gray-200'
            )}>
              {mp.homolog}
            </div>
            <div className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium',
              mp.anvisa === 'Livre' ? 'bg-green-50 text-green-700 border border-green-200' :
              mp.anvisa === 'Restrito' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            )}>
              ANVISA: {mp.anvisa}
            </div>
          </div>
        </div>
      </div>

      {/* Stats / Custo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Custo NET</p>
          <p className="text-2xl font-bold text-gray-900">
            {mp.preco_ref_usd ? `$${Number(mp.preco_ref_usd).toFixed(2)}` : '—'}
          </p>
          <p className="text-xs text-gray-400">USD/kg referência</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Melhor preço</p>
          <p className="text-2xl font-bold text-emerald-600">
            {mp.melhor_preco_usd ? `$${Number(mp.melhor_preco_usd).toFixed(2)}` : '—'}
          </p>
          <p className="text-xs text-gray-400">USD/kg negociado</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Em Fórmulas</p>
          <p className="text-2xl font-bold text-gray-900">{uso?.total_geral ?? 0}</p>
          <p className="text-xs text-gray-400">{uso?.total_validadas ?? 0} validadas · {uso?.total_bid ?? 0} BID</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Marcas que usam</p>
          <p className="text-2xl font-bold text-gray-900">{uso?.marcas?.length ?? 0}</p>
          <p className="text-xs text-gray-400 truncate">{uso?.marcas?.join(', ') ?? '—'}</p>
        </div>
      </div>

      {/* ── Inteligência Técnica ── */}
      {!intel ? (
        <div className="bg-gradient-to-br from-brand-50 to-blue-50 border-2 border-dashed border-brand-200 rounded-xl p-6 text-center">
          <Brain className="w-10 h-10 text-brand-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Inteligência Técnica não disponível</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Gere uma ficha técnica completa com IA: função na fórmula, mecanismo de ação, compatibilidades, fase recomendada e muito mais.
          </p>
          {canEdit ? (
            <button
              onClick={enriquecer}
              disabled={enriquecendo}
              className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg hover:bg-brand-600 transition font-medium text-sm shadow-sm disabled:opacity-50"
            >
              {enriquecendo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enriquecendo ? 'Pesquisando com IA...' : 'Gerar com IA'}
            </button>
          ) : (
            <p className="text-xs text-gray-400">Apenas admins e P&D podem gerar inteligência</p>
          )}
          {erroEnriquecer && (
            <p className="text-xs text-red-600 mt-3">{erroEnriquecer}</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header da inteligência */}
          <div className="bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Brain className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  Ficha Técnica IA <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                </p>
                <p className="text-xs text-gray-500">
                  Confiança: <strong className={
                    intel.confianca >= 0.8 ? 'text-green-600' :
                    intel.confianca >= 0.5 ? 'text-yellow-600' : 'text-red-500'
                  }>{(intel.confianca * 100).toFixed(0)}%</strong>
                  {mp.inteligencia_atualizada_em && ` · Atualizada ${new Date(mp.inteligencia_atualizada_em).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
            </div>
            {canEdit && (
              <button
                onClick={enriquecer}
                disabled={enriquecendo}
                className="text-xs bg-white border border-brand-200 text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', enriquecendo && 'animate-spin')} />
                {enriquecendo ? 'Atualizando...' : 'Regenerar'}
              </button>
            )}
          </div>

          {/* Função primária + sensorial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Beaker className="w-4 h-4 text-brand-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Função na Fórmula</p>
              </div>
              <p className="text-base font-semibold text-gray-900 mb-2">{intel.funcao_primaria}</p>
              {intel.funcoes_secundarias.length > 0 && (
                <div className="flex gap-1 flex-wrap mt-2">
                  {intel.funcoes_secundarias.map(f => (
                    <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-pink-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Efeito Sensorial</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{intel.efeito_sensorial}</p>
            </div>
          </div>

          {/* Mecanismo de ação */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Microscope className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Mecanismo de Ação</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{intel.mecanismo_acao}</p>
          </div>

          {/* Concentração + Solubilidade + pH + Estabilidade — grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Concentração Típica</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {intel.concentracao_tipica.min}–{intel.concentracao_tipica.max}{intel.concentracao_tipica.unidade}
              </p>
              <p className="text-xs text-gray-400">{intel.concentracao_tipica.contexto}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="w-4 h-4 text-cyan-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Solubilidade</p>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Água</span><span className={clsx('px-1.5 rounded font-medium', SOLUBILIDADE_COR[intel.solubilidade.agua])}>{intel.solubilidade.agua}</span></div>
                <div className="flex justify-between"><span>Óleo</span><span className={clsx('px-1.5 rounded font-medium', SOLUBILIDADE_COR[intel.solubilidade.oleo])}>{intel.solubilidade.oleo}</span></div>
                <div className="flex justify-between"><span>Álcool</span><span className={clsx('px-1.5 rounded font-medium', SOLUBILIDADE_COR[intel.solubilidade.alcool])}>{intel.solubilidade.alcool}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">pH Ideal</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{intel.ph_ideal.min}–{intel.ph_ideal.max}</p>
              <p className="text-xs text-gray-400 capitalize">Sensibilidade {intel.ph_ideal.sensibilidade}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-red-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Fase Recomendada</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">Fase {intel.fase_recomendada}</p>
              <p className="text-xs text-gray-400">
                {intel.fase_recomendada === 'A' ? 'Aquosa' :
                 intel.fase_recomendada === 'B' ? 'Oleosa' :
                 intel.fase_recomendada === 'C' ? 'Resfriamento' :
                 intel.fase_recomendada === 'D' ? 'Ajuste final' : 'Qualquer fase'}
              </p>
            </div>
          </div>

          {/* Estabilidade */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Estabilidade</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              {[
                { key: 'sensivel_calor', label: 'Calor', icon: Thermometer },
                { key: 'sensivel_luz', label: 'Luz', icon: Sun },
                { key: 'sensivel_oxigeno', label: 'O₂', icon: Activity },
                { key: 'sensivel_metais', label: 'Metais', icon: Zap },
              ].map(s => {
                const sensivel = (intel.estabilidade as any)[s.key]
                return (
                  <div key={s.key} className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
                    sensivel ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-green-50 border-green-100 text-green-700'
                  )}>
                    <s.icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                    <span className="ml-auto font-medium">{sensivel ? 'Sensível' : 'OK'}</span>
                  </div>
                )
              })}
            </div>
            {intel.estabilidade.temp_max_processo_c && (
              <p className="text-xs text-gray-600">Temperatura máxima de processo: <strong>{intel.estabilidade.temp_max_processo_c}°C</strong></p>
            )}
            <p className="text-xs text-gray-600 mt-1">{intel.estabilidade.notas}</p>
          </div>

          {/* Compatibilidades */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Compatibilidades & Sinergias</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Combina com</p>
                <ul className="space-y-1">
                  {intel.compatibilidades.bom_com.map(x => (
                    <li key={x} className="text-xs text-gray-700">• {x}</li>
                  ))}
                  {intel.compatibilidades.bom_com.length === 0 && <li className="text-xs text-gray-400 italic">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Cuidado</p>
                <ul className="space-y-1">
                  {intel.compatibilidades.cuidado_com.map(x => (
                    <li key={x} className="text-xs text-gray-700">• {x}</li>
                  ))}
                  {intel.compatibilidades.cuidado_com.length === 0 && <li className="text-xs text-gray-400 italic">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1"><X className="w-3.5 h-3.5" />Incompatíveis</p>
                <ul className="space-y-1">
                  {intel.compatibilidades.incompativel_com.map(x => (
                    <li key={x} className="text-xs text-gray-700">• {x}</li>
                  ))}
                  {intel.compatibilidades.incompativel_com.length === 0 && <li className="text-xs text-gray-400 italic">—</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" />Sinergias</p>
                <ul className="space-y-1">
                  {intel.compatibilidades.sinergias_conhecidas.map(x => (
                    <li key={x} className="text-xs text-gray-700">• {x}</li>
                  ))}
                  {intel.compatibilidades.sinergias_conhecidas.length === 0 && <li className="text-xs text-gray-400 italic">—</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Procedimento */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-teal-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase">Modo de Adicionar / Procedimento</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{intel.procedimento}</p>
          </div>

          {/* Aplicações & Benefícios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Aplicações Ideais</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {intel.aplicacoes_ideais.map(x => (
                  <span key={x} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded">{x}</span>
                ))}
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Público-alvo</p>
              <div className="flex flex-wrap gap-1.5">
                {intel.publico_alvo.map(x => (
                  <span key={x} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{x}</span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-pink-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Benefícios para o Consumidor</p>
              </div>
              <ul className="space-y-1.5">
                {intel.beneficios_consumidor.map(b => (
                  <li key={b} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-pink-400 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {intel.contraindicacoes.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-red-700 uppercase mt-4 mb-2 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Contraindicações</p>
                  <ul className="space-y-1">
                    {intel.contraindicacoes.map(c => (
                      <li key={c} className="text-xs text-red-700">• {c}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Origem & Sustentabilidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Origem</p>
              </div>
              <p className="text-base font-semibold text-gray-900 capitalize">{intel.origem.replace('_', '-')}</p>
              {intel.fornecedores_referencia.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fornecedores globais</p>
                  <p className="text-xs text-gray-600">{intel.fornecedores_referencia.join(' · ')}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Recycle className="w-4 h-4 text-green-500" />
                <p className="text-xs font-semibold text-gray-500 uppercase">Sustentabilidade</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Biodegradável</span><span className="font-medium">{String(intel.sustentabilidade.biodegradavel)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Vegano</span><span className="font-medium">{String(intel.sustentabilidade.vegano)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Cruelty-free</span><span className="font-medium">{String(intel.sustentabilidade.cruelty_free)}</span></div>
              </div>
              {intel.sustentabilidade.notas && (
                <p className="text-xs text-gray-500 mt-3 italic">{intel.sustentabilidade.notas}</p>
              )}
            </div>
          </div>

          {/* Notas adicionais */}
          {intel.notas_adicionais && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">Notas Adicionais</p>
                <p className="text-sm text-blue-800 leading-relaxed">{intel.notas_adicionais}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rastreabilidade — Fórmulas que usam essa MP */}
      {formulas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-teal-500" />
              <p className="text-sm font-semibold text-gray-900">Fórmulas que usam esta MP</p>
            </div>
            <span className="text-xs text-gray-400">{formulas.length} fórmulas</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Código</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Produto</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Marca</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">%</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {formulas.slice(0, 50).map((f: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-2 font-mono text-xs text-gray-500">{f.formulas?.codigo}</td>
                  <td className="px-5 py-2 text-sm text-gray-900">{f.formulas?.produto}</td>
                  <td className="px-5 py-2 text-xs text-gray-500">{f.formulas?.marca}</td>
                  <td className="px-5 py-2">
                    <span className={clsx(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      f.formulas?.status === 'Aprovada QA' ? 'bg-green-100 text-green-700' :
                      f.formulas?.status === 'Importada BID' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    )}>
                      {f.formulas?.status}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-sm text-gray-700">{f.percentual ?? '—'}</td>
                  <td className="px-5 py-2 text-right">
                    <Link href={`/dashboard/formulas/${f.formula_id}`} className="text-xs text-brand-500 hover:underline">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
