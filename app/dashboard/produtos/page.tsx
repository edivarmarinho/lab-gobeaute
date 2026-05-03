import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import ProdutosClient from './ProdutosClient'

async function getProdutosComFormula() {
  const supabase = createAdminClient()

  const [{ data: produtos }, { data: formulas }] = await Promise.all([
    supabase
      .from('produtos')
      .select('id, sku, descricao, marca, status, pmv')
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
