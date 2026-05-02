import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { enriquecerLoteMPs } from '@/lib/mp-intelligence'

export const maxDuration = 300

/**
 * Enriquece em lote MPs que ainda não têm inteligência técnica.
 * Body: { limite?: number, force?: boolean }
 *
 * - limite: máximo de MPs nesta chamada (default 10, max 50)
 * - force: se true, regera mesmo as que já têm
 */
export async function POST(req: NextRequest) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem rodar lote' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const limite = Math.min(50, Math.max(1, body.limite ?? 10))
  const force = body.force === true

  const supabase = createAdminClient()
  let query = supabase
    .from('mps')
    .select('id, nome, inci, cas, categoria, inteligencia_tecnica')
    .order('homolog', { ascending: true }) // homologadas primeiro
    .limit(limite)

  if (!force) {
    query = query.is('inteligencia_tecnica', null)
  }

  const { data: mps } = await query
  if (!mps || mps.length === 0) {
    return NextResponse.json({ ok: true, processadas: 0, mensagem: 'Nenhuma MP para processar' })
  }

  const resultados = await enriquecerLoteMPs(mps as any, 3)

  let sucessos = 0
  for (const r of resultados) {
    if (r.intel) {
      await supabase
        .from('mps')
        .update({
          inteligencia_tecnica: r.intel,
          inteligencia_atualizada_em: new Date().toISOString(),
        })
        .eq('id', r.id)
      sucessos++
    }
  }

  return NextResponse.json({
    ok: true,
    total: mps.length,
    sucessos,
    falhas: mps.length - sucessos,
  })
}
