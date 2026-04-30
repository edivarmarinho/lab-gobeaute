import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/get-profile'
import KanbanBoard from './KanbanBoard'
import HomologBoard from './HomologBoard'

export default async function ProjetosPage() {
  const supabase = createClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const { data: projetos } = await supabase
    .from('pd_projetos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-full">
      {/* Kanban P&D */}
      <KanbanBoard projetos={projetos ?? []} canEdit={canEdit} />

      {/* Divisor */}
      <div className="my-10 border-t border-gray-200" />

      {/* Homologação */}
      <HomologBoard canEdit={canEdit} />
    </div>
  )
}
