import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import FormulasClient from './FormulasClient'

export default async function FormulasPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const [{ data: formulas }, { data: fornecedores }] = await Promise.all([
    supabase
      .from('formulas')
      .select('*, formula_ingredientes(*), formula_versoes(*)')
      .order('marca', { ascending: true })
      .order('codigo', { ascending: true }),
    supabase
      .from('fornecedores')
      .select('id, nome')
      .order('nome', { ascending: true }),
  ])

  return (
    <FormulasClient
      formulas={formulas ?? []}
      fornecedores={fornecedores ?? []}
      canEdit={canEdit}
    />
  )
}
