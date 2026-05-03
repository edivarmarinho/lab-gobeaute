import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import {
  FlaskConical, Package, Users, FolderKanban, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, Activity,
  Shield, Beaker, Microscope, ChevronRight, FileWarning,
  BarChart3, Zap, Leaf, Star, ArrowUpRight, Target,
  Clock, XCircle
} from 'lucide-react'
import FeedNoticias from '@/components/lab/FeedNoticias'
import PainelPendencias from '@/components/lab/PainelPendencias'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Dados ────────────────────────────────────────────────────────────────────

async function getLabStats() {
  const supabase = createAdminClient()
  const [mps, fornecedores, projetos, documentos, crm, formulas, produtosAtivos] = await Promise.all([
    supabase.from('mps').select('id, homolog, origem_natural', { count: 'exact' }),
    supabase.from('fornecedores').select('id, status, iso22716, avaliacao_geral'),
    supabase.from('pd_projetos').select('id, etapa, status, marca'),
    supabase.from('documentos').select('id, tipo, validade'),
    supabase.from('fornecedor_crm').select('id, tipo, data_evento').order('data_evento', { ascending: false }).limit(8),
    supabase.from('formulas').select('id, nome, status, marca', { count: 'exact' }),
    supabase.from('produtos').select('id', { count: 'exact', head: true }).eq('status', 'Ativo').eq('tem_formula', true),
  ])

  const { count: formulasReais } = await supabase
    .from('formulas')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'Importada BID')

  // Cobertura por marca
  const { data: formulasPorMarca } = await supabase
    .from('formulas')
    .select('marca, status')
    .neq('status', 'Importada BID')

  const { data: produtosPorMarca } = await supabase
    .from('produtos')
    .select('marca')
    .eq('status', 'Ativo')
    .eq('tem_formula', true)

  // Cobertura ANVISA: fórmulas validadas (não BID, não fechada por fábrica) com nº processo
  const { count: formulasPrecisamAnvisa } = await supabase
    .from('formulas')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'Importada BID')
    .neq('status', 'Arquivada')

  const { count: formulasComAnvisa } = await supabase
    .from('formulas')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'Importada BID')
    .neq('status', 'Arquivada')
    .not('anvisa_processo', 'is', null)

  // ── KPIs Sourcing 2026 (BID) ─────────────────────────────────────────────
  const { data: bidStats } = await supabase
    .from('bid_decisoes')
    .select('status_bid, saving_total_usd')

  const bidDecididos = (bidStats ?? []).filter(b => b.status_bid === 'DECIDIDO')
  const bidAHomologar = (bidStats ?? []).filter(b => b.status_bid === 'A HOMOLOGAR')
  const savingDecidido = bidDecididos.reduce((acc, b) => acc + Math.abs(Math.min(Number(b.saving_total_usd) || 0, 0)), 0)
  const savingPotencial = bidAHomologar.reduce((acc, b) => acc + Math.abs(Math.min(Number(b.saving_total_usd) || 0, 0)), 0)

  const { count: pdHomologPendentes } = await supabase
    .from('pd_projetos')
    .select('id', { count: 'exact', head: true })
    .eq('tipo_projeto', 'Homologação MP')
    .neq('status', 'Concluído')

  return {
    mps: mps.data ?? [],
    fornecedores: fornecedores.data ?? [],
    projetos: projetos.data ?? [],
    documentos: documentos.data ?? [],
    crm: crm.data ?? [],
    formulas: formulas.data ?? [],
    mpsCount: mps.count ?? 0,
    formulasCount: formulas.count ?? 0,
    produtosAtivos: produtosAtivos.count ?? 0,
    formulasReais: formulasReais ?? 0,
    formulasPorMarca: formulasPorMarca ?? [],
    produtosPorMarca: produtosPorMarca ?? [],
    formulasPrecisamAnvisa: formulasPrecisamAnvisa ?? 0,
    formulasComAnvisa: formulasComAnvisa ?? 0,
    bidDecididosCount: bidDecididos.length,
    bidAHomologarCount: bidAHomologar.length,
    savingDecidido,
    savingPotencial,
    pdHomologPendentes: pdHomologPendentes ?? 0,
  }
}

async function getProjetosAtivos() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('pd_projetos')
    .select('*')
    .not('etapa', 'eq', 'Aprovado para Produção')
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

async function getAlertaDocumentos() {
  const supabase = createAdminClient()
  const hoje = new Date()
  const em60dias = new Date(hoje.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data } = await supabase
    .from('documentos')
    .select('id, nome, tipo, validade, fornecedor_id')
    .not('validade', 'is', null)
    .lte('validade', em60dias)
    .order('validade', { ascending: true })
    .limit(5)
  return data ?? []
}

async function getCRMRecente() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('fornecedor_crm')
    .select('id, tipo, titulo, data_evento, fornecedor_id, fornecedores(nome)')
    .order('data_evento', { ascending: false })
    .limit(6)
  return data ?? []
}

// ─── Configurações visuais ────────────────────────────────────────────────────

const etapaColor: Record<string, string> = {
  'Briefing/Conceito':       'bg-gray-100 text-gray-600',
  'Formulação em Bancada':   'bg-blue-100 text-blue-700',
  'Testes Internos':         'bg-yellow-100 text-yellow-700',
  'Aprovação Interna':       'bg-orange-100 text-orange-700',
  'Aprovação QA':            'bg-purple-100 text-purple-700',
  'Aprovado para Produção':  'bg-green-100 text-green-700',
}

const etapaStep: Record<string, number> = {
  'Briefing/Conceito': 1,
  'Formulação em Bancada': 2,
  'Testes Internos': 3,
  'Aprovação Interna': 4,
  'Aprovação QA': 5,
  'Aprovado para Produção': 6,
}

const crmIcon: Record<string, string> = {
  green: '✅', yellow: '⚠️', red: '🚨', blue: 'ℹ️'
}

const crmColor: Record<string, string> = {
  green: 'text-green-600', yellow: 'text-yellow-600', red: 'text-red-600', blue: 'text-blue-600'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const [stats, projetosAtivos, alertasDocs, crmRecente, profile] = await Promise.all([
    getLabStats(),
    getProjetosAtivos(),
    getAlertaDocumentos(),
    getCRMRecente(),
    getProfile(),
  ])

  const { mps, fornecedores, projetos, mpsCount, formulasCount, produtosAtivos, formulasReais, formulasPorMarca, produtosPorMarca, formulasPrecisamAnvisa, formulasComAnvisa, bidDecididosCount, bidAHomologarCount, savingDecidido, savingPotencial, pdHomologPendentes } = stats
  const coberturaAnvisaPct = formulasPrecisamAnvisa > 0 ? Math.round((formulasComAnvisa / formulasPrecisamAnvisa) * 100) : 0
  const coberturaPct = produtosAtivos > 0 ? Math.round((formulasReais / produtosAtivos) * 100) : 0

  // KPIs calculados
  const homologadas = mps.filter((m: any) => m.homolog === 'Homologada').length
  const mpsNaturais = mps.filter((m: any) => m.origem_natural).length
  const fornHomologados = fornecedores.filter((f: any) => f.status === 'Homologado').length
  const fornComISO = fornecedores.filter((f: any) => f.iso22716).length
  const projetosAtivosCount = projetos.filter((p: any) => p.etapa !== 'Aprovado para Produção').length
  const docsVencendo = alertasDocs.filter((d: any) => {
    if (!d.validade) return false
    const diff = (new Date(d.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff < 30
  }).length

  // Distribuição por etapa do kanban
  const etapaCount: Record<string, number> = {}
  for (const p of projetos) {
    etapaCount[(p as any).etapa] = (etapaCount[(p as any).etapa] ?? 0) + 1
  }

  const marcaCount: Record<string, number> = {}
  for (const p of projetos) {
    marcaCount[(p as any).marca] = (marcaCount[(p as any).marca] ?? 0) + 1
  }

  // Cobertura por marca
  const coberturaByMarca: Record<string, { formulas: number; produtos: number }> = {}
  for (const f of formulasPorMarca) {
    const m = (f as any).marca
    if (!coberturaByMarca[m]) coberturaByMarca[m] = { formulas: 0, produtos: 0 }
    coberturaByMarca[m].formulas++
  }
  for (const p of produtosPorMarca) {
    const m = (p as any).marca
    if (!coberturaByMarca[m]) coberturaByMarca[m] = { formulas: 0, produtos: 0 }
    coberturaByMarca[m].produtos++
  }

  const nomeUsuario = profile?.nome?.split(' ')[0] ?? 'Usuário'
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 md:space-y-6">

      {/* ── Hero Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 md:w-6 md:h-6 text-brand-500" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lab Gobeaute P&D</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {saudacao}, {nomeUsuario}. Aqui está o resumo do laboratório.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {docsVencendo > 0 && (
            <a href="/dashboard/documentos" className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition">
              <AlertTriangle className="w-3.5 h-3.5" />
              {docsVencendo} doc{docsVencendo > 1 ? 's' : ''} vencendo
            </a>
          )}
          <a href="/dashboard/projetos" className="flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1.5 rounded-lg font-medium hover:bg-brand-100 transition">
            <Zap className="w-3.5 h-3.5" />
            {projetosAtivosCount} projetos ativos
          </a>
        </div>
      </div>

      {/* ── Painel de Pendências do P&D — destaque pós-login ── */}
      <PainelPendencias />

      {/* ── Sourcing 2026 (BID) → P&D ── */}
      {(bidDecididosCount > 0 || bidAHomologarCount > 0) && (
        <a
          href="/dashboard/homologacoes"
          className="block bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 rounded-xl border border-rose-200 shadow-sm p-4 md:p-5 hover:shadow-md transition group"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Sourcing 2026 — Decisões do BID</p>
                <p className="text-xs text-gray-500">{bidDecididosCount} fornecedores ativos · {bidAHomologarCount} pares MP×fornecedor aguardando homologação P&D</p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6 flex-wrap">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Saving decidido</p>
                <p className="text-lg md:text-xl font-bold text-emerald-700">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(savingDecidido)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-rose-700/70">Saving potencial</p>
                <p className="text-lg md:text-xl font-bold text-rose-700">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(savingPotencial)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-amber-700/70">Homologações pendentes</p>
                <p className="text-lg md:text-xl font-bold text-amber-700">{pdHomologPendentes}</p>
              </div>
              <ChevronRight className="self-center w-5 h-5 text-gray-400 group-hover:text-rose-600 transition" />
            </div>
          </div>
        </a>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Matérias-Primas', value: mpsCount, sub: `${homologadas} homologadas`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', href: '/dashboard/mps' },
          { label: 'Fornecedores', value: fornecedores.length, sub: `${fornHomologados} aprovados`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/dashboard/fornecedores' },
          { label: 'Projetos P&D', value: projetos.length, sub: `${projetosAtivosCount} em andamento`, icon: FolderKanban, color: 'text-purple-600', bg: 'bg-purple-50', href: '/dashboard/projetos' },
          { label: 'Fórmulas', value: formulasCount, sub: `${formulasReais} validadas`, icon: Beaker, color: 'text-teal-600', bg: 'bg-teal-50', href: '/dashboard/formulas' },
          { label: 'ISO 22716', value: fornComISO, sub: `de ${fornecedores.length} forn.`, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/dashboard/fornecedores' },
          { label: 'Naturais', value: mpsNaturais, sub: 'MPs origem natural', icon: Leaf, color: 'text-lime-600', bg: 'bg-lime-50', href: '/dashboard/mps' },
        ].map(kpi => (
          <a
            key={kpi.label}
            href={kpi.href}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition group"
          >
            <div className={`w-8 h-8 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
          </a>
        ))}
      </div>

      {/* ── Banner duplo: Cobertura de Fórmulas + Cobertura ANVISA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

      {/* Cobertura ANVISA */}
      <a href="/dashboard/formulas" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 hover:border-emerald-200 hover:shadow-md transition">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Cobertura ANVISA</p>
            <p className="text-xs text-gray-400">Fórmulas validadas com nº de processo cadastrado</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${coberturaAnvisaPct >= 80 ? 'text-green-600' : coberturaAnvisaPct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
              {coberturaAnvisaPct}%
            </p>
            <p className="text-xs text-gray-400">{formulasComAnvisa}/{formulasPrecisamAnvisa}</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${coberturaAnvisaPct >= 80 ? 'bg-green-400' : coberturaAnvisaPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${Math.min(coberturaAnvisaPct, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {formulasPrecisamAnvisa - formulasComAnvisa > 0
            ? `${formulasPrecisamAnvisa - formulasComAnvisa} fórmula${formulasPrecisamAnvisa - formulasComAnvisa > 1 ? 's' : ''} sem nº ANVISA cadastrado`
            : 'Todas as fórmulas têm nº ANVISA cadastrado ✓'}
        </p>
      </a>

      {/* Cobertura SKU x Fórmula */}
      <a href="/dashboard/produtos" className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 hover:border-teal-200 hover:shadow-md transition">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Cobertura de Fórmulas</p>
              <p className="text-xs text-gray-400">Clique para ver crossover por produto e marca →</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-4 sm:justify-end flex-wrap">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{produtosAtivos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-400">SKUs com fórmula</p>
            </div>
            <div className="w-px h-10 bg-gray-100 hidden sm:block" />
            <div className="text-right">
              <p className={`text-2xl font-bold ${coberturaPct >= 80 ? 'text-green-600' : coberturaPct >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                {coberturaPct}%
              </p>
              <p className="text-xs text-gray-400">documentadas</p>
            </div>

            {/* Breakdown por marca top 4 */}
            <div className="hidden lg:flex gap-3">
              {Object.entries(coberturaByMarca)
                .filter(([, v]) => v.produtos > 0)
                .sort(([, a], [, b]) => b.produtos - a.produtos)
                .slice(0, 4)
                .map(([marca, v]) => {
                  const pct = v.produtos > 0 ? Math.round((v.formulas / v.produtos) * 100) : 0
                  return (
                    <div key={marca} className="text-center">
                      <p className={`text-sm font-bold ${pct >= 80 ? 'text-green-600' : pct >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {pct}%
                      </p>
                      <p className="text-xs text-gray-400 truncate max-w-16">{marca}</p>
                    </div>
                  )
                })}
            </div>

            <div className="flex-1 max-w-xs hidden sm:block">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${coberturaPct >= 80 ? 'bg-green-400' : coberturaPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(coberturaPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{formulasReais} de {produtosAtivos} SKUs</p>
            </div>
          </div>
        </div>
      </a>

      </div>{/* fim banner duplo */}

      {/* ── Linha 2: Pipeline + CRM + Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Pipeline */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Pipeline P&D</h2>
            </div>
            <a href="/dashboard/projetos" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              Kanban <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['Formulação em Bancada', 'Testes Internos', 'Aprovação QA'].map(etapa => (
              <div key={etapa} className="text-center p-2.5 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-900">{etapaCount[etapa] ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{etapa.split(' ')[0]}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {projetosAtivos.slice(0, 4).map((p: any) => {
              const step = etapaStep[p.etapa] ?? 0
              return (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex gap-0.5 shrink-0">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className={`h-1.5 w-3 rounded-sm ${i <= step ? 'bg-brand-400' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{p.nome}</p>
                    <p className="text-xs text-gray-400">{p.marca}</p>
                  </div>
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${etapaColor[p.etapa] ?? 'bg-gray-100 text-gray-600'}`}>
                    {p.etapa?.split(' ')[0]}
                  </span>
                </div>
              )
            })}
            {projetosAtivos.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">Nenhum projeto ativo</p>
            )}
          </div>
        </div>

        {/* Feed de atividade CRM */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Atividade Recente</h2>
            </div>
            <a href="/dashboard/fornecedores" className="text-xs text-brand-500 hover:underline flex items-center gap-1">
              CRM <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {crmRecente.map((ev: any) => (
              <div key={ev.id} className="flex items-start gap-2.5">
                <span className="text-sm mt-0.5 shrink-0">{crmIcon[ev.tipo] ?? 'ℹ️'}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${crmColor[ev.tipo] ?? 'text-gray-600'}`}>{ev.titulo}</p>
                  <p className="text-xs text-gray-400">
                    {(ev.fornecedores as any)?.nome ?? '—'}
                    {ev.data_evento && ` · ${new Date(ev.data_evento).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              </div>
            ))}
            {crmRecente.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center py-4">Sem eventos recentes</p>
            )}
          </div>
        </div>

        {/* Feed de Notícias ANVISA/Cosméticos */}
        <FeedNoticias />
      </div>

      {/* ── Linha 3: Alertas + Marcas + Módulos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Alertas de documentos */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Docs Vencendo</h2>
            </div>
            <a href="/dashboard/documentos" className="text-xs text-brand-500 hover:underline">Ver todos</a>
          </div>
          {alertasDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-xs text-gray-500">Todos os documentos em dia</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alertasDocs.map((d: any) => {
                const diff = Math.ceil((new Date(d.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const urgent = diff < 15
                return (
                  <div key={d.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs ${urgent ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                    <div className="min-w-0">
                      <p className={`font-medium truncate ${urgent ? 'text-red-700' : 'text-amber-700'}`}>{d.nome}</p>
                      <p className="text-gray-400">{d.tipo}</p>
                    </div>
                    <span className={`shrink-0 font-semibold ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
                      {diff < 0 ? 'Vencido' : `${diff}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Cobertura por marca */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Cobertura por Marca</h2>
            </div>
            <a href="/dashboard/produtos" className="text-xs text-brand-500 hover:underline">Detalhes</a>
          </div>
          {Object.keys(coberturaByMarca).length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Sem dados de produtos</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(coberturaByMarca)
                .filter(([, v]) => v.produtos > 0)
                .sort(([, a], [, b]) => b.produtos - a.produtos)
                .slice(0, 7)
                .map(([marca, v]) => {
                  const pct = v.produtos > 0 ? Math.round((v.formulas / v.produtos) * 100) : 0
                  return (
                    <div key={marca}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-gray-700">{marca}</span>
                        <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                          {pct}% <span className="text-gray-400 font-normal">({v.formulas}/{v.produtos})</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-400' : pct >= 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Módulos do Lab */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Microscope className="w-4 h-4 text-teal-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Módulos do Lab</h2>
          </div>
          <div className="space-y-1">
            {[
              { label: 'Matérias-Primas', sub: `${mpsCount} MPs · ${homologadas} homologadas`, icon: Package, href: '/dashboard/mps', color: 'text-blue-500' },
              { label: 'Fornecedores & CRM', sub: `${fornecedores.length} fornec. · ${fornHomologados} aprovados`, icon: Users, href: '/dashboard/fornecedores', color: 'text-emerald-500' },
              { label: 'Projetos Kanban', sub: `${projetosAtivosCount} ativos · 6 etapas`, icon: FolderKanban, href: '/dashboard/projetos', color: 'text-purple-500' },
              { label: 'Biblioteca de Fórmulas', sub: `${formulasCount} fórmulas · ${formulasReais} validadas`, icon: Beaker, href: '/dashboard/formulas', color: 'text-teal-500' },
              { label: 'Documentos & Laudos', sub: `${stats.documentos.length} docs`, icon: FileText, href: '/dashboard/documentos', color: 'text-orange-500' },
              { label: 'Catálogo de Produtos', sub: `${produtosAtivos.toLocaleString('pt-BR')} SKUs ativos`, icon: Package, href: '/dashboard/produtos', color: 'text-gray-500' },
            ].map(m => (
              <a key={m.href} href={m.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition group">
                <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 shrink-0 transition" />
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
