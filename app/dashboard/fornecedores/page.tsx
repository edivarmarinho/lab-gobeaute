import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import FornecedoresClient from './FornecedoresClient'

export default async function FornecedoresPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const [{ data: fornecedores }, { data: crm }, { data: contatos }] = await Promise.all([
    supabase
      .from('fornecedores')
      .select('*')
      .order('status', { ascending: true })
      .order('nome', { ascending: true }),
    supabase
      .from('fornecedor_crm')
      .select('*')
      .order('data_evento', { ascending: false }),
    supabase
      .from('fornecedor_contatos')
      .select('*')
      .eq('ativo', true)
      .order('principal', { ascending: false }),
  ])

  return (
    <FornecedoresClient
      fornecedores={fornecedores ?? []}
      crm={crm ?? []}
      contatos={contatos ?? []}
      canEdit={canEdit}
    />
  )
}
