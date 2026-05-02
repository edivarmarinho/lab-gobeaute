import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { enriquecerMP } from '@/lib/mp-intelligence'
import { registrarAuditoria } from '@/lib/audit'

export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const profile = await getProfile()
  if (!profile) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  if (profile.role !== 'admin' && profile.role !== 'pd') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data: mp, error } = await supabase
    .from('mps')
    .select('id, nome, inci, cas, categoria')
    .eq('id', params.id)
    .single()

  if (error || !mp) {
    return NextResponse.json({ error: 'MP não encontrada' }, { status: 404 })
  }

  const intel = await enriquecerMP({
    nome: mp.nome,
    inci: mp.inci,
    cas: mp.cas,
    categoria: mp.categoria,
  })

  if (!intel) {
    return NextResponse.json(
      { error: 'Falha ao gerar inteligência. Verifique se ANTHROPIC_API_KEY está configurada.' },
      { status: 500 }
    )
  }

  await supabase
    .from('mps')
    .update({
      inteligencia_tecnica: intel,
      inteligencia_atualizada_em: new Date().toISOString(),
    })
    .eq('id', params.id)

  await registrarAuditoria({
    entidade: 'mps',
    entidade_id: params.id,
    acao: 'update',
    campo: 'inteligencia_tecnica',
    valor_depois: `Ficha técnica gerada por IA (confiança ${(intel.confianca * 100).toFixed(0)}%)`,
    usuario_id: profile.id,
    usuario_nome: profile.nome,
    usuario_email: profile.email,
  })

  return NextResponse.json({ ok: true, intel })
}
