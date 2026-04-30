import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { FolderKanban, ShieldAlert } from 'lucide-react'

const etapaColor: Record<string, string> = {
  'Briefing/Conceito':       'bg-gray-100 text-gray-600',
  'Formulação em Bancada':   'bg-blue-100 text-blue-700',
  'Testes Internos':         'bg-yellow-100 text-yellow-700',
  'Aprovação Interna':       'bg-orange-100 text-orange-700',
  'Aprovação QA':            'bg-purple-100 text-purple-700',
  'Aprovado para Produção':  'bg-green-100 text-green-700',
}

const statusColor: Record<string, string> = {
  'Em andamento':           'bg-blue-50 text-blue-600',
  'Pronto para aprovação':  'bg-green-50 text-green-600',
  'Pausado':                'bg-gray-50 text-gray-500',
  'Concluído':              'bg-emerald-50 text-emerald-600',
}

export default async function ProjetosPage() {
  const supabase = createClient()
  const profile = await getProfile()
  const canEdit = profile?.role === 'admin' || profile?.role === 'pd'

  // RLS filtra automaticamente projetos pelas marcas do usuário
  const { data: projetos } = await supabase
    .from('pd_projetos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FolderKanban className="w-6 h-6 text-purple-500" />
        <h1 className="text-xl font-bold text-gray-900">Projetos P&D</h1>
        <span className="ml-auto text-sm text-gray-400">{projetos?.length ?? 0} projetos</span>
        {profile && profile.role !== 'admin' && profile.marcas.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
            <ShieldAlert className="w-3 h-3" />
            {profile.marcas.join(', ')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projetos?.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-mono text-xs text-gray-400 mb-1">{p.codigo}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.nome}</h3>
              </div>
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${statusColor[p.status] ?? 'bg-gray-100'}`}>
                {p.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">{p.marca}</span>
              <span className="text-gray-300">·</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tipo === 'Suplemento' ? 'bg-teal-50 text-teal-600' : 'bg-pink-50 text-pink-600'}`}>
                {p.tipo}
              </span>
            </div>

            <div className="mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${etapaColor[p.etapa] ?? 'bg-gray-100'}`}>
                {p.etapa}
              </span>
            </div>

            {p.briefing && (
              <p className="text-xs text-gray-400 line-clamp-2">{p.briefing}</p>
            )}

            <div className="flex items-center justify-between mt-2">
              {p.responsavel && (
                <p className="text-xs text-gray-400">👤 {p.responsavel}</p>
              )}
              {canEdit && (
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-brand-600 cursor-pointer transition">
                  Editar →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
