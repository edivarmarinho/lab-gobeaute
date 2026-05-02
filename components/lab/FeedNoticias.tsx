'use client'

import { useEffect, useState } from 'react'
import { Newspaper, ExternalLink, RefreshCw, AlertTriangle, Beaker, Globe, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'
import type { NoticiaItem } from '@/app/api/feed/noticias/route'

const CATEGORIA_CONFIG = {
  regulatorio: { label: 'Regulatório',  color: 'bg-red-50 text-red-700 border-red-100',   icon: AlertTriangle },
  ingredientes: { label: 'Ingredientes', color: 'bg-green-50 text-green-700 border-green-100', icon: Beaker },
  industria:   { label: 'Indústria',    color: 'bg-blue-50 text-blue-700 border-blue-100',  icon: Globe },
  tendencia:   { label: 'Tendência',    color: 'bg-purple-50 text-purple-700 border-purple-100', icon: TrendingUp },
}

export default function FeedNoticias() {
  const [noticias, setNoticias] = useState<NoticiaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<string>('todos')
  const [expandido, setExpandido] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/feed/noticias')
      const json = await res.json()
      setNoticias(json.noticias ?? [])
    } catch {
      setNoticias([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtradas = filtro === 'todos'
    ? noticias
    : noticias.filter(n => n.categoria === filtro)

  const destaques = noticias.filter(n => n.destaque)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-gray-900 text-sm">Feed do Setor</h2>
          <span className="text-xs text-gray-400">ANVISA · Cosméticos · Ingredientes</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          title="Atualizar"
        >
          <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Alertas ANVISA em destaque */}
      {destaques.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Alertas regulatórios
          </p>
          <div className="space-y-1.5">
            {destaques.map(n => (
              <div key={n.id} className="flex items-start gap-2 text-xs">
                <span className="shrink-0 text-sm">{n.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-800 truncate">{n.titulo}</p>
                  <p className="text-amber-600 mt-0.5 line-clamp-1">{n.resumo}</p>
                </div>
                {n.url && (
                  <a href={n.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-amber-500 hover:text-amber-700 transition">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros por categoria */}
      <div className="flex gap-1 px-4 pt-3 pb-2 flex-wrap">
        {['todos', 'regulatorio', 'ingredientes', 'industria'].map(cat => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={clsx(
              'text-xs px-2.5 py-1 rounded-full font-medium transition border',
              filtro === cat
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300 hover:text-brand-600'
            )}
          >
            {cat === 'todos' ? 'Todos' : CATEGORIA_CONFIG[cat as keyof typeof CATEGORIA_CONFIG]?.label ?? cat}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-1.5">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-full" />
                <div className="h-2.5 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">Nenhuma notícia encontrada</div>
        ) : (
          filtradas.map(n => {
            const catConfig = CATEGORIA_CONFIG[n.categoria as keyof typeof CATEGORIA_CONFIG]
            const isOpen = expandido === n.id
            return (
              <div
                key={n.id}
                className="px-5 py-3 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setExpandido(isOpen ? null : n.id)}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">{n.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx('text-xs font-semibold text-gray-900 leading-snug', !isOpen && 'line-clamp-2')}>
                        {n.titulo}
                      </p>
                      {n.url && (
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="shrink-0 text-gray-300 hover:text-brand-500 transition mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {isOpen && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.resumo}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {catConfig && (
                        <span className={clsx('text-xs px-1.5 py-0.5 rounded border font-medium', catConfig.color)}>
                          {catConfig.label}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{n.fonte}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {new Date(n.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400">
          Fontes: ANVISA · Cosmetics & Toiletries · in-cosmetics · Cosmetics Business
        </p>
      </div>
    </div>
  )
}
