import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import FormulasClient from './FormulasClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function FormulasPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  // Listagem leve — sem joins de ingredientes/versões.
  // Com 300+ fórmulas × ~2.6k ingredientes, o SSR estourava 60s. Detalhes vêm
  // sob demanda quando o usuário expande a linha (GET /api/formulas/:id).
  const [{ data: formulas }, { data: fornecedores }, { data: mps }] = await Promise.all([
    supabase
      .from('formulas')
      .select('id, codigo, versao, produto, marca, tipo, categoria, n_mps, status, responsavel, link_produto, grau, fase, obs, vendas_mes, anvisa_processo')
      .order('marca', { ascending: true })
      .order('codigo', { ascending: true })
      .limit(2000),
    supabase
      .from('fornecedores')
      .select('id, nome')
      .order('nome', { ascending: true }),
    supabase
      .from('mps')
      .select('id, codigo, nome, inci, categoria, homolog')
      .order('codigo', { ascending: true })
      .limit(2000),
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
