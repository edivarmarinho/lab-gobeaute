import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

const ETAPAS_VALIDAS = [
  'Briefing/Conceito',
  'Formulação em Bancada',
  'Testes Internos',
  'Aprovação Interna',
  'Aprovação QA',
  'Aprovado para Produção',
] as const

const CAMPOS_EDITAVEIS = ['codigo', 'nome', 'marca', 'tipo', 'etapa', 'responsavel', 'data_inicio', 'status', 'briefing']

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'pd'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const update: Record<string, any> = {}

  for (const k of CAMPOS_EDITAVEIS) {
    if (k in body) update[k] = body[k] === '' ? null : body[k]
  }

  if ('etapa' in update && !ETAPAS_VALIDAS.includes(update.etapa)) {
    return NextResponse.json({ error: 'Etapa inválida' }, { status: 400 })
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('pd_projetos')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projeto: data })
}
