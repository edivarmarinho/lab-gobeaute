import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import FormulasClient from './FormulasClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FormulasPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const [{ data: formulas }, { data: fornecedores }, { data: mps }] = await Promise.all([
    supabase
      .from('formulas')
      .select('*, formula_ingredientes(*), formula_versoes(*)')
      .order('marca', { ascending: true })
      .order('codigo', { ascending: true }),
    supabase
      .from('fornecedores')
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabase
      .from('mps')
      .select('id, codigo, nome, inci, categoria, homolog')
      .order('codigo', { ascending: true }),
  ])

  return (
    <FormulasClient
      formulas={formulas ?? []}
      fornecedores={fornecedores ?? []}
      mps={mps ?? []}
      canEdit={canEdit}
    />
  )
}
