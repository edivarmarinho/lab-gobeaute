import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import FormulaDetalhe from './FormulaDetalhe'

async function getFormula(id: string) {
  const supabase = createAdminClient()
  const { data: formula } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', id)
    .single()

  if (!formula) return null

  const { data: ingredientes } = await supabase
    .from('formula_ingredientes')
    .select('*')
    .eq('formula_id', id)
    .order('id')

  const { data: versoes } = await supabase
    .from('formula_versoes')
    .select('*')
    .eq('formula_id', id)
    .order('data_versao', { ascending: false })

  return {
    formula,
    ingredientes: ingredientes ?? [],
    versoes: versoes ?? [],
  }
}

export default async function FormulaDetalhePage({ params }: { params: { id: string } }) {
  const [data, profile] = await Promise.all([
    getFormula(params.id),
    getProfile(),
  ])

  if (!data) notFound()

  return (
    <FormulaDetalhe
      formula={data.formula}
      ingredientes={data.ingredientes}
      versoes={data.versoes}
      profile={profile}
    />
  )
}
