import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import { FileText } from 'lucide-react'
import DriveSyncPanel from './DriveSyncPanel'
import DocumentosClient from './DocumentosClient'

export default async function DocumentosPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canSync = profile?.role === 'admin' || profile?.role === 'pd'

  const { data: documentos } = await supabase
    .from('documentos')
    .select('id, nome, tipo, mp_codigo, fornecedor_nome, status, data_validade, drive_url')
    .order('created_at', { ascending: false })

  const docs = documentos ?? []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
        <span className="ml-auto text-sm text-gray-400">{docs.length} documentos</span>
      </div>

      <div className="mb-5">
        <DriveSyncPanel canSync={canSync} />
      </div>

      {docs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum documento ainda</p>
          <p className="text-sm text-gray-400 mt-1">
            Configure o Google Drive Sync para importar documentos automaticamente.
          </p>
        </div>
      ) : (
        <DocumentosClient documentos={docs} />
      )}
    </div>
  )
}
