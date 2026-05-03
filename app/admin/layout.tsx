import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getProfile } from '@/lib/supabase/get-profile'
import { ProfileProvider } from '@/lib/profile-context'
import { getUserPermissions } from '@/lib/permissions'
import RegulAIWidget from '@/components/regulai/RegulAIWidget'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  // Admin area: somente role=admin
  if (!profile || profile.role !== 'admin') redirect('/dashboard')
  if (profile.ativo === false) redirect('/login?error=desativado')

  const { canRead, canWrite } = await getUserPermissions(profile)
  const modulesRead = Array.from(canRead)
  const modulesWrite = Array.from(canWrite)

  return (
    <ProfileProvider profile={profile} modulesRead={modulesRead} modulesWrite={modulesWrite}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} profile={profile} modulesRead={modulesRead} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pt-14 md:pt-0">
          {children}
        </main>
      </div>
      <RegulAIWidget />
    </ProfileProvider>
  )
}
