'use client'

import { useState } from 'react'
import { FolderKanban, Plus, ChevronRight, FlaskConical } from 'lucide-react'
import { clsx } from 'clsx'

const ETAPAS = [
  'Briefing/Conceito',
  'Formulação em Bancada',
  'Testes Internos',
  'Aprovação Interna',
  'Aprovação QA',
  'Aprovado para Produção',
] as const

type Etapa = typeof ETAPAS[number]

const ETAPA_CONFIG: Record<Etapa, { color: string; dot: string; header: string }> = {
  'Briefing/Conceito':      { color: 'bg-gray-50 border-gray-200',   dot: 'bg-gray-400',   header: 'text-gray-600' },
  'Formulação em Bancada':  { color: 'bg-blue-50 border-blue-200',   dot: 'bg-blue-500',   header: 'text-blue-700' },
  'Testes Internos':        { color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500', header: 'text-yellow-700' },
  'Aprovação Interna':      { color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500', header: 'text-orange-700' },
  'Aprovação QA':           { color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', header: 'text-purple-700' },
  'Aprovado para Produção': { color: 'bg-green-50 border-green-200',  dot: 'bg-green-500',  header: 'text-green-700' },
}

const MARCA_COLOR: Record<string, string> = {
  'Kokeshi':    'bg-pink-100 text-pink-700',
  'Ápice':      'bg-emerald-100 text-emerald-700',
  'Barbours':   'bg-orange-100 text-orange-700',
  'Yenzah':     'bg-sky-100 text-sky-700',
  'By Samia':   'bg-teal-100 text-teal-700',
  'Rituária':   'bg-purple-100 text-purple-700',
  'Lescent':    'bg-rose-100 text-rose-700',
  'Auá Natural':'bg-lime-100 text-lime-700',
}

const STATUS_COLOR: Record<string, string> = {
  'Em andamento':          'bg-blue-100 text-blue-700',
  'Pronto para aprovação': 'bg-green-100 text-green-700',
  'Pausado':               'bg-gray-100 text-gray-600',
  'Concluído':             'bg-emerald-100 text-emerald-700',
}

export default function KanbanBoard({ projetos, canEdit }: { projetos: any[]; canEdit: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const byEtapa = ETAPAS.reduce<Record<string, any[]>>((acc, etapa) => {
    acc[etapa] = projetos.filter(p => p.etapa === etapa)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FolderKanban className="w-6 h-6 text-purple-500" />
        <h1 className="text-xl font-bold text-gray-900">Projetos P&D</h1>
        <span className="text-sm text-gray-400 ml-1">{projetos.length} projetos</span>
        {canEdit && (
          <button className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition font-medium">
            <Plus className="w-3.5 h-3.5" />
            Novo Projeto
          </button>
        )}
      </div>

      {/* Kanban grid */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
        {ETAPAS.map(etapa => {
          const cards = byEtapa[etapa] ?? []
          const cfg = ETAPA_CONFIG[etapa]
          return (
            <div key={etapa} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-t-xl border border-b-0', cfg.color)}>
                <span className={clsx('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                <span className={clsx('text-xs font-semibold truncate', cfg.header)}>{etapa}</span>
                <span className="ml-auto text-xs text-gray-400 font-medium">{cards.length}</span>
              </div>

              {/* Cards */}
              <div className={clsx('border border-t-0 rounded-b-xl p-2 space-y-2 min-h-32', cfg.color)}>
                {cards.map(p => (
                  <ProjectCard
                    key={p.id}
                    projeto={p}
                    expanded={expanded === p.id}
                    onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
                    canEdit={canEdit}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-16 text-xs text-gray-300">
                    Nenhum projeto
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProjectCard({ projeto: p, expanded, onToggle, canEdit }: {
  projeto: any
  expanded: boolean
  onToggle: () => void
  canEdit: boolean
}) {
  return (
    <div
      onClick={onToggle}
      className="bg-white rounded-lg border border-gray-100 p-3 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all group"
    >
      {/* Código + tipo */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="font-mono text-xs text-gray-400">{p.codigo}</span>
        <span className={clsx('ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium',
          p.tipo === 'Suplemento' ? 'bg-teal-50 text-teal-600' : 'bg-pink-50 text-pink-600'
        )}>
          {p.tipo === 'Suplemento' ? '💊' : '🧴'} {p.tipo}
        </span>
      </div>

      {/* Nome */}
      <p className="text-xs font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">{p.nome}</p>

      {/* Marca + status */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium',
          MARCA_COLOR[p.marca] ?? 'bg-gray-100 text-gray-600'
        )}>
          {p.marca}
        </span>
        <span className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium',
          STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-600'
        )}>
          {p.status}
        </span>
      </div>

      {/* Expandido */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-2" onClick={e => e.stopPropagation()}>
          {p.briefing && (
            <p className="text-xs text-gray-500 leading-relaxed">{p.briefing}</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400">
            {p.responsavel && <span>👤 {p.responsavel}</span>}
            {p.data_inicio && <span>📅 {new Date(p.data_inicio).toLocaleDateString('pt-BR')}</span>}
          </div>
          {canEdit && (
            <button className="w-full text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1 mt-1">
              Editar projeto <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
