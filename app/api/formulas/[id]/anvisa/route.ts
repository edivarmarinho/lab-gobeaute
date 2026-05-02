import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarAuditoria } from '@/lib/audit'

/**
 * Gerenciar registro ANVISA da fórmula
 *
 * PATCH: atualiza dados ANVISA (Grau, nº processo, data protocolo, vencimento)
 * POST com action="lock": trava a fórmula (após registro ANVISA)
 * POST com action="unlock": destrava (admin only — para casos excepcionais)
 */

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (profile.role !== 'admin' && profile.role !== 'pd') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const { anvisa_grau, anvisa_processo, anvisa_data_protocolo, anvisa_data_vencimento, forma_cosmetica } = body

  const supabase = createAdminClient()
  const { data: antes } = await supabase.from('formulas').select('*').eq('id', params.id).single()

  if (!antes) return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 })

  // Bloquear edição se fórmula está locked
  if (antes.anvisa_locked) {
    return NextResponse.json(
      { error: 'Fórmula está travada (registrada ANVISA). Para alterar, é preciso destravar (admin) e isso requer abertura de novo processo ANVISA.' },
      { status: 403 }
    )
  }

  const updates: any = {}
  if (anvisa_grau !== undefined) updates.anvisa_grau = anvisa_grau
  if (anvisa_processo !== undefined) updates.anvisa_processo = anvisa_processo
  if (anvisa_data_protocolo !== undefined) updates.anvisa_data_protocolo = anvisa_data_protocolo
  if (anvisa_data_vencimento !== undefined) updates.anvisa_data_vencimento = anvisa_data_vencimento
  if (forma_cosmetica !== undefined) updates.forma_cosmetica = forma_cosmetica

  await supabase.from('formulas').update(updates).eq('id', params.id)

  // Audit
  for (const [campo, valor] of Object.entries(updates)) {
    await registrarAuditoria({
      entidade: 'formulas',
      entidade_id: params.id,
      acao: 'update',
      campo,
      valor_antes: (antes as any)[campo],
      valor_depois: valor,
      usuario_id: profile.id,
      usuario_nome: profile.nome,
      usuario_email: profile.email,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { action } = body as { action: 'lock' | 'unlock' }

  if (action === 'unlock' && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem destravar fórmulas' }, { status: 403 })
  }
  if (action === 'lock' && profile.role !== 'admin' && profile.role !== 'pd') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data: formula } = await supabase.from('formulas').select('*').eq('id', params.id).single()
  if (!formula) return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 })

  if (action === 'lock') {
    // Pré-requisitos: precisa ter nº processo ANVISA + grau + status apropriado
    if (!formula.anvisa_processo) {
      return NextResponse.json(
        { error: 'Para travar a fórmula é obrigatório informar o número do processo ANVISA' },
        { status: 400 }
      )
    }
    if (!formula.anvisa_grau) {
      return NextResponse.json(
        { error: 'Para travar a fórmula é obrigatório classificar o Grau ANVISA (1 ou 2)' },
        { status: 400 }
      )
    }
    if (formula.status !== 'Aprovada QA' && formula.status !== 'Aprovada Internamente') {
      return NextResponse.json(
        { error: `Fórmula precisa estar com status 'Aprovada QA' antes de registrar na ANVISA. Status atual: ${formula.status}` },
        { status: 400 }
      )
    }

    await supabase.from('formulas').update({
      anvisa_locked: true,
      anvisa_locked_em: new Date().toISOString(),
      anvisa_locked_por: profile.id,
      status: 'Registrada ANVISA',
    }).eq('id', params.id)

    await registrarAuditoria({
      entidade: 'formulas',
      entidade_id: params.id,
      acao: 'status_change',
      campo: 'anvisa_locked',
      valor_antes: 'false',
      valor_depois: 'true',
      usuario_id: profile.id,
      usuario_nome: profile.nome,
      usuario_email: profile.email,
    })
  } else if (action === 'unlock') {
    await supabase.from('formulas').update({
      anvisa_locked: false,
      anvisa_locked_em: null,
      anvisa_locked_por: null,
      status: 'Aprovada QA',
    }).eq('id', params.id)

    await registrarAuditoria({
      entidade: 'formulas',
      entidade_id: params.id,
      acao: 'status_change',
      campo: 'anvisa_locked',
      valor_antes: 'true',
      valor_depois: 'false',
      usuario_id: profile.id,
      usuario_nome: profile.nome,
      usuario_email: profile.email,
    })
  }

  return NextResponse.json({ ok: true })
}
