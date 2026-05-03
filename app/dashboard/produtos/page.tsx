import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import ProdutosClient from './ProdutosClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProdutosComFormula() {
  const supabase = createAdminClient()

  const [{ data: produtos }, { data: formulas }] = await Promise.all([
    supabase
      .from('v_produtos_canonicos')
      .select('id, sku, descricao, marca, status, pmv, aliases')
      .order('marca')
      .order('descricao'),
    supabase
      .from('formulas')
      .select('id, codigo, produto, marca, status, n_mps, responsavel, sku_produto, sku_gobeaute, skus_relacionados')
      .order('marca'),
  ])

  return { produtos: produtos ?? [], formulas: formulas ?? [] }
}

export default async function ProdutosPage() {
  const [{ produtos, formulas }, profile] = await Promise.all([
    getProdutosComFormula(),
    getProfile(),
  ])

  return <ProdutosClient produtos={produtos} formulas={formulas} profile={profile} />
}
