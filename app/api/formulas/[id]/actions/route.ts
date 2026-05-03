import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { postUpdate, BOARD_BY_MARCA } from '@/lib/monday/client'

export const dynamic = 'force-dynamic'

// POST /api/formulas/:id/actions
// body: { action: 'promote'|'approve'|'lock'|'link_monday'|'unlink_monday', ...args }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('id, role, nome').eq('id', user.id).single()
  if (!profile || !['admin', 'pd'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const action = body.action as string
  const admin = createAdminClient()

  const { data: formula } = await admin.from('formulas').select('*').eq('id', params.id).single()
  if (!formula) return NextResponse.json({ error: 'Fórmula não encontrada' }, { status: 404 })

  switch (action) {
    case 'promote': {
      // Tira do limbo BID → vai para Em Desenvolvimento
      if (formula.status !== 'Importada BID') {
        return NextResponse.json({ error: 'Fórmula não está em status BID' }, { status: 400 })
      }
      const { data, error } = await admin.from('formulas')
        .update({ status: 'Em Desenvolvimento' })
        .eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ formula: data })
    }

    case 'approve': {
      // P&D aprova → Aprovada QA
      if (!['Em Desenvolvimento', 'Em Estabilidade', 'Aprovada Internamente'].includes(formula.status)) {
        return NextResponse.json({ error: `Não é possível aprovar a partir de "${formula.status}"` }, { status: 400 })
      }
      const { data, error } = await admin.from('formulas').update({
        status: 'Aprovada QA',
        aprovada_pd_em: new Date().toISOString(),
        aprovada_pd_por: user.id,
      }).eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Se tem Monday vinculado, posta update
      if (formula.monday_item_id) {
        try {
          await postUpdate(formula.monday_item_id,
            `🔬 Fórmula <b>${formula.codigo}</b> aprovada por P&D (${profile.nome ?? 'P&D'})`)
        } catch (e) { /* não bloqueia */ }
      }
      return NextResponse.json({ formula: data })
    }

    case 'lock': {
      // Lock canônico — só admin pode
      if (profile.role !== 'admin') {
        return NextResponse.json({ error: 'Apenas admin pode aplicar lock canônico' }, { status: 403 })
      }
      if (formula.status !== 'Aprovada QA') {
        return NextResponse.json({ error: 'Apenas fórmulas em "Aprovada QA" podem ser bloqueadas' }, { status: 400 })
      }
      // Snapshot na tabela formula_versoes
      const versao = `LOCK-${new Date().toISOString().slice(0,10)}`
      await admin.from('formula_versoes').insert({
        formula_id: params.id,
        versao,
        descricao: `Lock canônico aplicado por ${profile.nome ?? user.email}`,
        por: profile.nome ?? user.email,
      })
      const { data, error } = await admin.from('formulas').update({
        status: 'Bloqueada',
        bloqueada_em: new Date().toISOString(),
        bloqueada_por: user.id,
      }).eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      if (formula.monday_item_id) {
        try {
          await postUpdate(formula.monday_item_id,
            `🔒 Fórmula <b>${formula.codigo}</b> bloqueada (lock canônico) por ${profile.nome ?? 'admin'} — versão ${versao}`)
        } catch (e) { /* não bloqueia */ }
      }
      return NextResponse.json({ formula: data })
    }

    case 'link_monday': {
      const { monday_item_id, monday_board_id } = body
      if (!monday_item_id) return NextResponse.json({ error: 'monday_item_id obrigatório' }, { status: 400 })
      const board = monday_board_id ?? BOARD_BY_MARCA[formula.marca] ?? null
      const { data, error } = await admin.from('formulas').update({
        monday_item_id: String(monday_item_id),
        monday_board_id: board ? String(board) : null,
      }).eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ formula: data })
    }

    case 'unlink_monday': {
      const { data, error } = await admin.from('formulas').update({
        monday_item_id: null, monday_board_id: null,
      }).eq('id', params.id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ formula: data })
    }

    default:
      return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  }
}
