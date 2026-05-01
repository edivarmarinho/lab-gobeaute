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

  const allowed = ['codigo', 'nome', 'marca', 'tipo', 'etapa', 'responsavel', 'data_inicio', 'status', 'briefing']
  const insert: Record<string, any> = {}
  for (const k of allowed) {
    if (k in body) insert[k] = body[k] === '' ? null : body[k]
  }

  const { data, error } = await admin.from('pd_projetos').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ projeto: data }, { status: 201 })
}
