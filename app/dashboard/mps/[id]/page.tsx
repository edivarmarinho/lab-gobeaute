import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import MPDetalhe from './MPDetalhe'


export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getMP(id: string) {
  const supabase = createAdminClient()
  const { data: mp } = await supabase.from('mps').select('*').eq('id', id).single()
  if (!mp) return null

  // Uso em fórmulas (rastreabilidade bidirecional via view)
  const { data: usoData } = await supabase
    .from('mp_uso_em_formulas')
    .select('*')
    .eq('mp_id', id)
    .maybeSingle()

  // Lista de fórmulas que usam essa MP
  const { data: formulas } = await supabase
    .from('formula_ingredientes')
    .select('formula_id, percentual, fase, formulas(id, codigo, produto, marca, status, n_mps)')
    .eq('mp_id', id)
    .limit(100)

  return {
    mp,
    uso: usoData,
    formulas: formulas ?? [],
  }
}

export default async function MPDetalhePage({ params }: { params: { id: string } }) {
  const [data, profile] = await Promise.all([
    getMP(params.id),
    getProfile(),
  ])

  if (!data) notFound()

  return <MPDetalhe mp={data.mp} uso={data.uso} formulas={data.formulas} profile={profile} />
}
