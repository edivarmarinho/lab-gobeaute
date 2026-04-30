import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { Package, ShieldAlert } from 'lucide-react'

const homologColor: Record<string, string> = {
  'Homologada':  'bg-green-100 text-green-700',
  'Em Processo': 'bg-yellow-100 text-yellow-700',
  'Pendente':    'bg-gray-100 text-gray-600',
  'Reprovada':   'bg-red-100 text-red-700',
}

const anvisaColor: Record<string, string> = {
  'Livre':    'bg-green-50 text-green-600',
  'Restrito': 'bg-orange-50 text-orange-600',
  'Proibido': 'bg-red-50 text-red-600',
}

export default async function MPsPage() {
  const supabase = createClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  // RLS filtra automaticamente por marcas do usuário
  const { data: mps } = await supabase
    .from('mps')
    .select('*')
    .order('codigo', { ascending: true })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-blue-500" />
        <h1 className="text-xl font-bold text-gray-900">Matérias-Primas</h1>
        <span className="ml-auto text-sm text-gray-400">{mps?.length ?? 0} registros</span>
        {/* Indica se há filtro de marca ativo */}
        {profile && profile.role !== 'admin' && profile.marcas.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
            <ShieldAlert className="w-3 h-3" />
            {profile.marcas.join(', ')}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ANVISA</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Homologação</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Fornecedor</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Preço Ref. (USD)</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mps?.map((mp: any) => (
              <tr key={mp.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{mp.codigo}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{mp.nome}</td>
                <td className="px-4 py-3 text-gray-500">{mp.categoria ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${anvisaColor[mp.anvisa] ?? 'bg-gray-100'}`}>
                    {mp.anvisa}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${homologColor[mp.homolog] ?? 'bg-gray-100'}`}>
                    {mp.homolog}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{mp.forn_candidato ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700 font-mono">
                  {mp.preco_ref_usd ? `$ ${Number(mp.preco_ref_usd).toFixed(2)}` : '—'}
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-gray-400 hover:text-brand-600 cursor-pointer transition">
                      Editar
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
