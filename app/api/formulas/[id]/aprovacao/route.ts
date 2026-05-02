import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarAuditoria } from '@/lib/audit'

/**
 * Workflow de aprovação de fórmulas
 *
 * POST /api/formulas/[id]/aprovacao
 * Body: { acao: 'aprovar' | 'rejeitar' | 'enviar_validacao' | 'arquivar', motivo?: string }
 *
 * Transições permitidas:
 * - Em Desenvolvimento → Em Estabilidade (enviar_validacao)
 * - Em Estabilidade    → Aprovada Internamente (aprovar interno)
 * - Aprovada Internamente → Aprovada QA (aprovar)
 * - Em Estabilidade / Aprovada Internamente → Em Desenvolvimento (rejeitar)
 * - Importada BID → Em Desenvolvimento (validar BID)
 * - Qualquer → Arquivada (arquivar)
 */

const TRANSICOES: Record<string, Record<string, string>> = {
  'Em Desenvolvimento':    { enviar_validacao: 'Em Estabilidade', arquivar: 'Arquivada' },
  'Em Estabilidade':       { aprovar: 'Aprovada Internamente', rejeitar: 'Em Desenvolvimento', arquivar: 'Arquivada' },
  'Aprovada Internamente': { aprovar: 'Aprovada QA', rejeitar: 'Em Desenvolvimento', arquivar: 'Arquivada' },
  'Aprovada QA':           { rejeitar: 'Em Desenvolvimento', arquivar: 'Arquivada' },
  'Importada BID':         { aprovar: 'Em Desenvolvimento', rejeitar: 'Arquivada', arquivar: 'Arquivada' },
  'Arquivada':             {},
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  if (profile.role !== 'admin' && profile.role !== 'pd') {
    return NextResponse.json({ error: 'Sem permissão para aprovar fórmulas' }, { status: 403 })
  }

  const body = await req.json()
  const { acao, motivo } = body as { acao: string; motivo?: string }

  if (!['aprovar', 'rejeitar', 'enviar_validacao', 'arquivar'].includes(acao)) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Buscar fórmula atual
  const { data: formula, error: errBuscar } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', params.id)
    .single()

  if (errBuscar || !formula) {
    return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 })
  }

  // Validar marca (P&D só aprova fórmulas das marcas que tem acesso)
  if (profile.role === 'pd' && profile.marcas.length > 0 && !profile.marcas.includes(formula.marca)) {
    return NextResponse.json({ error: 'Sem permissão para esta marca' }, { status: 403 })
  }

  // Validar transição
  const novoStatus = TRANSICOES[formula.status]?.[acao]
  if (!novoStatus) {
    return NextResponse.json(
      { error: `Transição inválida: ${formula.status} → ${acao}` },
      { status: 400 }
    )
  }

  // Rejeitar requer motivo
  if (acao === 'rejeitar' && !motivo) {
    return NextResponse.json({ error: 'Motivo obrigatório ao rejeitar' }, { status: 400 })
  }

  // Atualizar
  const updates: any = {
    status: novoStatus,
    updated_at: new Date().toISOString(),
  }
  if (acao === 'aprovar') {
    updates.aprovado_por = profile.id
    updates.aprovado_em = new Date().toISOString()
  }
  if (acao === 'rejeitar') {
    updates.rejeitado_por = profile.id
    updates.rejeitado_em = new Date().toISOString()
    updates.rejeicao_motivo = motivo
  }

  const { error: errUpd } = await supabase
    .from('formulas')
    .update(updates)
    .eq('id', params.id)

  if (errUpd) {
    return NextResponse.json({ error: errUpd.message }, { status: 500 })
  }

  // Audit
  await registrarAuditoria({
    entidade: 'formulas',
    entidade_id: params.id,
    acao: acao === 'aprovar' ? 'approve' : acao === 'rejeitar' ? 'reject' : 'status_change',
    campo: 'status',
    valor_antes: formula.status,
    valor_depois: novoStatus,
    usuario_id: profile.id,
    usuario_nome: profile.nome,
    usuario_email: profile.email,
  })

  return NextResponse.json({
    ok: true,
    statusAnterior: formula.status,
    statusNovo: novoStatus,
    motivo: motivo ?? null,
  })
}
