import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import MPsClient from './MPsClient'

export default async function MPsPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const { data: mps } = await supabase
    .from('mps')
    .select('*')
    .order('codigo', { ascending: true })

  return <MPsClient mps={mps ?? []} canEdit={canEdit} />
}
