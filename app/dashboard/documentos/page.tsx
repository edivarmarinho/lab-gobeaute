import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'
import { FileText } from 'lucide-react'
import DriveSyncPanel from './DriveSyncPanel'

const statusColor: Record<string, string> = {
  'Aprovado':    'bg-green-100 text-green-700',
  'Em Revisão':  'bg-yellow-100 text-yellow-700',
  'Pendente':    'bg-gray-100 text-gray-600',
  'Vencido':     'bg-red-100 text-red-700',
  'Rejeitado':   'bg-red-100 text-red-700',
}

export default async function DocumentosPage() {
  const supabase = createAdminClient()
  const profile = await getProfile()
  const canSync = profile?.role === 'admin' || profile?.role === 'pd'

  const { data: documentos } = await supabase
    .from('documentos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-6 h-6 text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
        <span className="ml-auto text-sm text-gray-400">{documentos?.length ?? 0} documentos</span>
      </div>

      {/* Painel de sync com Google Drive */}
      <div className="mb-5">
        <DriveSyncPanel canSync={canSync} />
      </div>

      {documentos?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum documento ainda</p>
          <p className="text-sm text-gray-400 mt-1">
            Configure o Google Drive Sync para importar documentos automaticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">MP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fornecedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Validade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {documentos?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                    {d.drive_url
                      ? <a href={d.drive_url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-500 hover:underline">{d.nome}</a>
                      : d.nome
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.tipo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.mp_codigo ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.fornecedor_nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[d.status] ?? 'bg-gray-100'}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.data_validade ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
