import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'

const statusColor: Record<string, string> = {
  'Homologado':   'bg-green-100 text-green-700',
  'Em Avaliação': 'bg-yellow-100 text-yellow-700',
  'Reprovado':    'bg-red-100 text-red-700',
  'Inativo':      'bg-gray-100 text-gray-500',
}

export default async function FornecedoresPage() {
  const supabase = createClient()
  const { data: fornecedores } = await supabase
    .from('fornecedores')
    .select('*')
    .order('nome', { ascending: true })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-emerald-500" />
        <h1 className="text-xl font-bold text-gray-900">Fornecedores</h1>
        <span className="ml-auto text-sm text-gray-400">{fornecedores?.length ?? 0} registros</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">UF</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">ISO 22716</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">ISO 9001</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">MPs Ativas</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Pendências</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {fornecedores?.map((f: any) => (
              <tr key={f.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{f.nome}</td>
                <td className="px-4 py-3 text-gray-500">{f.uf}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[f.status] ?? 'bg-gray-100'}`}>
                    {f.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{f.iso22716 ? '✅' : '—'}</td>
                <td className="px-4 py-3 text-center">{f.iso9001 ? '✅' : '—'}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-700">{f.mps_ativas}</td>
                <td className="px-4 py-3 text-center">
                  {f.pendencias > 0
                    ? <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">{f.pendencias}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
