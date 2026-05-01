import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'pd'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()

  // Registra evento CRM do tipo blue (informativo) para o fornecedor
  const { fornecedor_id, mp_codigo, mp_nome, responsavel, prazo } = body

  const { data, error } = await admin.from('fornecedor_crm').insert({
    fornecedor_id,
    tipo: 'blue',
    titulo: `Homologação iniciada — ${mp_codigo} ${mp_nome}`,
    detalhe: `Responsável: ${responsavel}. Prazo: ${prazo ?? 'a definir'}. Etapa: Aval. Documental.`,
    data_evento: new Date().toISOString().split('T')[0],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evento: data }, { status: 201 })
}
