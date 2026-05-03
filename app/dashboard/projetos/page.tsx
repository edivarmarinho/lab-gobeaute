import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import KanbanBoard from './KanbanBoard'
import HomologBoard, { type HomologItem } from './HomologBoard'
import { requireModuleRead } from '@/lib/permissions'


export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProjetosPage() {
  await requireModuleRead('projetos')
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  const [{ data: projetos }, { data: crmEvents }, { data: fornecedores }] = await Promise.all([
    supabase.from('pd_projetos').select('*').order('created_at', { ascending: false }),
    supabase.from('fornecedor_crm').select('*').like('titulo', 'Homologação iniciada%').order('data_evento', { ascending: false }),
    supabase.from('fornecedores').select('id, nome'),
  ])

  const fornMap = Object.fromEntries((fornecedores ?? []).map(f => [f.id, f.nome]))

  const homologItems: HomologItem[] = (crmEvents ?? []).map(ev => {
    const match = ev.titulo?.match(/—\s*(MP\S+)\s+(.+)$/)
    const mpCodigo = match?.[1] ?? '—'
    const mpNome   = match?.[2] ?? '—'

    const detalheParts = (ev.detalhe ?? '').split('.')
    const responsavel  = detalheParts[0]?.replace('Responsável:', '').trim() || '—'
    const prazoRaw     = detalheParts[1]?.replace('Prazo:', '').trim() || null
    const prazoISO     = prazoRaw && prazoRaw !== 'a definir' ? prazoRaw : null

    return {
      id:              ev.id,
      mp_codigo:       mpCodigo,
      mp_nome:         mpNome,
      fornecedor_nome: fornMap[ev.fornecedor_id] ?? '—',
      etapa:           1,
      responsavel,
      data_inicio:     ev.data_evento ?? null,
      prazo:           prazoISO,
    }
  })

  return (
    <div className="p-4 md:p-6 max-w-full">
      <KanbanBoard projetos={projetos ?? []} canEdit={canEdit} />
      <div className="my-10 border-t border-gray-200" />
      <HomologBoard items={homologItems} canEdit={canEdit} />
    </div>
  )
}
