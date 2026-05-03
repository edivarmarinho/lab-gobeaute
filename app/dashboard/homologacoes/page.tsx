import { createAdminClient } from '@/lib/supabase/admin'
import HomologacoesClient, { type ProjetoHom } from './HomologacoesClient'
import { requireModuleRead } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function HomologacoesPage() {
  await requireModuleRead('homologacoes')
  const supabase = createAdminClient()

  // Projetos de homologação criados a partir do BID
  const { data: projetos } = await supabase
    .from('pd_projetos')
    .select(`
      id, codigo, nome, etapa, status, briefing,
      mp_codigo, mp_id, fornecedor_nome, fornecedor_id,
      saving_estimado_usd, saving_pct, bid_decisao_id,
      created_at, updated_at,
      bid_decisoes (
        preco_referencia_usd, preco_decidido_usd, volume_anual_kg,
        moq, lead_time_estoque, lead_time_sem_estoque,
        acao_observacao, data_decisao, estado_fornecedor, homologado_no_bid
      )
    `)
    .eq('tipo_projeto', 'Homologação MP')
    .order('saving_estimado_usd', { ascending: true, nullsFirst: false })

  // KPIs agregados (DECIDIDO e A HOMOLOGAR)
  const { data: bidStats } = await supabase
    .from('bid_decisoes')
    .select('status_bid, saving_total_usd, saving_unitario_pct, fornecedor_normalizado, mp_codigo')

  const decididos = (bidStats ?? []).filter(b => b.status_bid === 'DECIDIDO')
  const aHomologar = (bidStats ?? []).filter(b => b.status_bid === 'A HOMOLOGAR')

  const savingDecidido = decididos.reduce((acc, b) => acc + (Number(b.saving_total_usd) || 0), 0)
  const savingPotencial = aHomologar.reduce((acc, b) => acc + (Number(b.saving_total_usd) || 0), 0)
  const savingDecididoAbs = Math.abs(Math.min(savingDecidido, 0))
  const savingPotencialAbs = Math.abs(Math.min(savingPotencial, 0))

  const fornecedoresUnicos = new Set(aHomologar.map(b => b.fornecedor_normalizado).filter(Boolean))
  const mpsUnicos = new Set(aHomologar.map(b => b.mp_codigo).filter(Boolean))

  const items: ProjetoHom[] = (projetos ?? []).map(p => {
    const bd = Array.isArray(p.bid_decisoes) ? p.bid_decisoes[0] : p.bid_decisoes
    return {
      id: p.id,
      codigo: p.codigo,
      nome: p.nome,
      mp_codigo: p.mp_codigo ?? '—',
      fornecedor_nome: p.fornecedor_nome ?? '—',
      etapa: p.etapa,
      status: p.status,
      saving_estimado_usd: p.saving_estimado_usd ? Number(p.saving_estimado_usd) : null,
      saving_pct: p.saving_pct ? Number(p.saving_pct) : null,
      preco_referencia_usd: bd?.preco_referencia_usd ? Number(bd.preco_referencia_usd) : null,
      preco_decidido_usd: bd?.preco_decidido_usd ? Number(bd.preco_decidido_usd) : null,
      volume_anual_kg: bd?.volume_anual_kg ? Number(bd.volume_anual_kg) : null,
      moq: bd?.moq ?? null,
      lead_time_estoque: bd?.lead_time_estoque ?? null,
      lead_time_sem_estoque: bd?.lead_time_sem_estoque ?? null,
      acao_observacao: bd?.acao_observacao ?? null,
      data_decisao: bd?.data_decisao ?? null,
      estado_fornecedor: bd?.estado_fornecedor ?? null,
      homologado_no_bid: bd?.homologado_no_bid ?? null,
      created_at: p.created_at,
    }
  })

  return (
    <HomologacoesClient
      items={items}
      kpis={{
        totalAHomologar: aHomologar.length,
        totalDecididos: decididos.length,
        savingDecididoAbs,
        savingPotencialAbs,
        fornecedoresUnicos: fornecedoresUnicos.size,
        mpsUnicos: mpsUnicos.size,
      }}
    />
  )
}
