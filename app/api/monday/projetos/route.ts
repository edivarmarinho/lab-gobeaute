import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { listProjetosEmFormulacao, BOARD_BY_MARCA } from '@/lib/monday/client'

export const dynamic = 'force-dynamic'

// GET /api/monday/projetos?marca=Barbours  ou  ?boardId=18384262695
// Lista projetos em "Validação de fórmula" do board da marca.
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const marca = url.searchParams.get('marca')
  const boardId = url.searchParams.get('boardId') ?? (marca ? BOARD_BY_MARCA[marca] : null)
  if (!boardId) return NextResponse.json({ error: 'board não encontrado para a marca' }, { status: 400 })

  try {
    const projetos = await listProjetosEmFormulacao(boardId)
    return NextResponse.json({ projetos, boardId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
