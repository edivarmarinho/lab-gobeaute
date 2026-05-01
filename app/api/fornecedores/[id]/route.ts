import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'pd'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { fornecedor: fornData, contatos: contatosData } = body
  const id = params.id

  const admin = createAdminClient()

  // Campos permitidos para atualização
  const allowedFields = [
    'status', 'whatsapp', 'site', 'descricao', 'especialidade',
    'linkedin', 'instagram', 'porte', 'categoria_fornecedor',
    'avaliacao_geral', 'prazo_entrega_dias', 'condicao_pagamento',
    'observacoes', 'iso22716', 'iso9001', 'ultima_atualizacao',
  ]

  const patch: Record<string, any> = { ultima_atualizacao: new Date().toISOString() }
  for (const k of allowedFields) {
    if (k in (fornData ?? {}) && k !== 'ultima_atualizacao') {
      patch[k] = fornData[k] === '' ? null : fornData[k]
    }
  }

  const { data: fornecedor, error: fornErr } = await admin
    .from('fornecedores')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (fornErr) {
    return NextResponse.json({ error: fornErr.message }, { status: 500 })
  }

  // Sync de contatos: delete + re-insert
  let contatos: any[] = []
  if (Array.isArray(contatosData)) {
    await admin.from('fornecedor_contatos').delete().eq('fornecedor_id', id)

    const toInsert = contatosData
      .filter((c: any) => c.nome?.trim())
      .map((c: any) => ({
        fornecedor_id: id,
        nome: c.nome.trim(),
        cargo: c.cargo || null,
        email: c.email || null,
        telefone: c.telefone || null,
        whatsapp: c.whatsapp || null,
        linkedin: c.linkedin || null,
        tipo: c.tipo ?? 'comercial',
        principal: !!c.principal,
        ativo: true,
      }))

    if (toInsert.length > 0) {
      const { data: inserted } = await admin
        .from('fornecedor_contatos')
        .insert(toInsert)
        .select()
      contatos = inserted ?? []
    }
  }

  return NextResponse.json({ fornecedor, contatos })
}
