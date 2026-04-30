import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/get-profile'
import FornecedoresClient from './FornecedoresClient'

export default async function FornecedoresPage() {
  const supabase = createClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const [{ data: fornecedores }, { data: crm }] = await Promise.all([
    supabase
      .from('fornecedores')
      .select('*')
      .order('status', { ascending: true })
      .order('nome', { ascending: true }),
    supabase
      .from('fornecedor_crm')
      .select('*')
      .order('data_evento', { ascending: false }),
  ])

  return (
    <FornecedoresClient
      fornecedores={fornecedores ?? []}
      crm={crm ?? []}
      canEdit={canEdit}
    />
  )
}
