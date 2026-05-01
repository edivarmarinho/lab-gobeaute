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

  const { ingredientes, ...formulaFields } = body

  const allowed = ['codigo', 'versao', 'produto', 'marca', 'tipo', 'categoria',
    'status', 'responsavel', 'link_produto', 'grau', 'fase', 'obs', 'vendas_mes']

  const insert: Record<string, any> = { n_mps: ingredientes?.length ?? 0 }
  for (const k of allowed) {
    if (k in formulaFields) insert[k] = formulaFields[k] === '' ? null : formulaFields[k]
  }

  const { data: formula, error } = await admin.from('formulas').insert(insert).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(ingredientes) && ingredientes.length > 0) {
    const toInsert = ingredientes.filter((i: any) => i.mp_nome?.trim() || i.mp_codigo?.trim()).map((i: any) => ({
      formula_id: formula.id,
      mp_codigo: i.mp_codigo || null,
      mp_nome: i.mp_nome || null,
      inci: i.inci || null,
      percentual: i.percentual || null,
      funcao: i.funcao || null,
    }))
    if (toInsert.length > 0) await admin.from('formula_ingredientes').insert(toInsert)
  }

  const full = await admin.from('formulas').select('*, formula_ingredientes(*), formula_versoes(*)').eq('id', formula.id).single()
  return NextResponse.json({ formula: full.data }, { status: 201 })
}
