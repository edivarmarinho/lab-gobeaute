import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getProfile } from '@/lib/supabase/get-profile'
import { ProfileProvider } from '@/lib/profile-context'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getProfile()

  return (
    <ProfileProvider profile={profile}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </ProfileProvider>
  )
}
