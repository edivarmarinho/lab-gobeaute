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

  // Buscar dados de MPs vinculadas (custo, INCI canônico, intel)
  const mpCodigos = (ingredientes ?? []).map(i => i.mp_codigo).filter(Boolean)
  const mpNomes   = (ingredientes ?? []).map(i => i.mp_nome).filter(Boolean)

  let mpsRelacionadas: any[] = []
  if (mpCodigos.length > 0 || mpNomes.length > 0) {
    const { data } = await supabase
      .from('mps')
      .select('id, codigo, nome, inci, preco_ref_usd, melhor_preco_usd, flag_alergeno, flag_cmr, flag_preservante, flag_filtro_uv, flag_corante, flag_nanomaterial, inteligencia_tecnica')
      .or(
        [
          mpCodigos.length > 0 ? `codigo.in.(${mpCodigos.map(c => `"${c}"`).join(',')})` : null,
          mpNomes.length > 0 ? `nome.in.(${mpNomes.map(n => `"${n.replace(/"/g, '""')}"`).join(',')})` : null,
        ].filter(Boolean).join(',')
      )
    mpsRelacionadas = data ?? []
  }

  return {
    formula,
    ingredientes: ingredientes ?? [],
    versoes: versoes ?? [],
    mpsRelacionadas,
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
      mpsRelacionadas={data.mpsRelacionadas}
      profile={profile}
    />
  )
}
