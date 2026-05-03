import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = (data as Profile & { status?: string }) ?? null

  // DomainShield + Ban: força logout se domínio errado, banido ou suspenso
  if (profile) {
    const domainOk = (user.email ?? '').toLowerCase().endsWith('@gobeaute.com.br')
    if (!domainOk || profile.status === 'BANNED' || profile.status === 'SUSPENDED') {
      await supabase.auth.signOut()
      return null
    }
  }

  return profile
}
