import { createClient } from '@/lib/supabase/server'
import { FlaskConical, Package, Users, FolderKanban, FileText } from 'lucide-react'

async function getStats() {
  const supabase = createClient()
  const [mps, fornecedores, projetos, documentos] = await Promise.all([
    supabase.from('mps').select('*', { count: 'exact', head: true }),
    supabase.from('fornecedores').select('*', { count: 'exact', head: true }),
    supabase.from('pd_projetos').select('*', { count: 'exact', head: true }),
    supabase.from('documentos').select('*', { count: 'exact', head: true }),
  ])
  return {
    mps: mps.count ?? 0,
    fornecedores: fornecedores.count ?? 0,
    projetos: projetos.count ?? 0,
    documentos: documentos.count ?? 0,
  }
}

async function getProjetosRecentes() {
  const supabase = createClient()
  const { data } = await supabase
    .from('pd_projetos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

async function getMPsRecentes() {
  const supabase = createClient()
  const { data } = await supabase
    .from('mps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
  return data ?? []
}

const etapaColor: Record<string, string> = {
  'Briefing/Conceito':       'bg-gray-100 text-gray-600',
  'Formulação em Bancada':   'bg-blue-100 text-blue-700',
  'Testes Internos':         'bg-yellow-100 text-yellow-700',
  'Aprovação Interna':       'bg-orange-100 text-orange-700',
  'Aprovação QA':            'bg-purple-100 text-purple-700',
  'Aprovado para Produção':  'bg-green-100 text-green-700',
}

const homologColor: Record<string, string> = {
  'Homologada':   'bg-green-100 text-green-700',
  'Em Processo':  'bg-yellow-100 text-yellow-700',
  'Pendente':     'bg-gray-100 text-gray-600',
  'Reprovada':    'bg-red-100 text-red-700',
}

export default async function DashboardPage() {
  const [stats, projetos, mps] = await Promise.all([
    getStats(),
    getProjetosRecentes(),
    getMPsRecentes(),
  ])

  const cards = [
    { label: 'Matérias-Primas',  value: stats.mps,          icon: Package,       color: 'bg-blue-500',   href: '/dashboard/mps' },
    { label: 'Fornecedores',     value: stats.fornecedores,  icon: Users,         color: 'bg-emerald-500', href: '/dashboard/fornecedores' },
    { label: 'Projetos P&D',     value: stats.projetos,      icon: FolderKanban,  color: 'bg-purple-500',  href: '/dashboard/projetos' },
    { label: 'Documentos',       value: stats.documentos,    icon: FileText,      color: 'bg-orange-500',  href: '/dashboard/documentos' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-7 h-7 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Lab Gobeaute P&D</h1>
        </div>
        <p className="text-gray-500 text-sm">Gestão de matérias-primas, fornecedores e projetos de desenvolvimento</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <a key={c.label} href={c.href} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">{c.label}</span>
                <div className={`${c.color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">{c.value}</p>
            </a>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos P&D */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Projetos P&D Ativos</h2>
            <a href="/dashboard/projetos" className="text-sm text-brand-500 hover:underline">Ver todos →</a>
          </div>
          <div className="space-y-3">
            {projetos.map((p: any) => (
              <div key={p.id} className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.nome}</p>
                  <p className="text-xs text-gray-400">{p.marca} · {p.codigo}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${etapaColor[p.etapa] ?? 'bg-gray-100 text-gray-600'}`}>
                  {p.etapa}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MPs recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Matérias-Primas</h2>
            <a href="/dashboard/mps" className="text-sm text-brand-500 hover:underline">Ver todas →</a>
          </div>
          <div className="space-y-3">
            {mps.map((mp: any) => (
              <div key={mp.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{mp.nome}</p>
                  <p className="text-xs text-gray-400">{mp.codigo} · {mp.categoria ?? 'Sem categoria'}</p>
                </div>
                <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${homologColor[mp.homolog] ?? 'bg-gray-100'}`}>
                  {mp.homolog}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
