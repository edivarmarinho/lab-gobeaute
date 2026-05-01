'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import {
  FlaskConical, Package, Users, FolderKanban,
  FileText, LogOut, ShieldCheck, Beaker, Map,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { clsx } from 'clsx'

export default function Sidebar({ user, profile }: { user: User; profile: Profile | null }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'

  const nav = [
    { label: 'Dashboard',        href: '/dashboard',                    icon: FlaskConical },
    { label: 'Projetos P&D',     href: '/dashboard/projetos',           icon: FolderKanban },
    { label: 'Matérias-Primas',  href: '/dashboard/mps',                icon: Package },
    { label: 'Fórmulas',         href: '/dashboard/formulas',           icon: Beaker },
    { label: 'Fornecedores',     href: '/dashboard/fornecedores',       icon: Users },
    { label: 'Documentos',       href: '/dashboard/documentos',         icon: FileText },
    { label: 'Roadmap',          href: '/dashboard/roadmap',            icon: Map },
    ...(isAdmin ? [{ label: 'Usuários', href: '/dashboard/admin/usuarios', icon: ShieldCheck }] : []),
  ]

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1.5 rounded-lg">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Lab Gobeaute</p>
            <p className="text-xs text-gray-400">P&D</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <a
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </a>
          )
        })}
      </nav>

      {/* User + role */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          {user.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full" alt="" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {profile?.nome ?? user.user_metadata?.full_name ?? user.email}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        {/* Badge de role + marcas */}
        {profile && (
          <div className="mb-3 space-y-1">
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              ROLE_BADGE_COLOR[profile.role]
            )}>
              {ROLE_LABEL[profile.role]}
            </span>
            {profile.marcas.length > 0 && profile.role !== 'admin' && (
              <p className="text-xs text-gray-400 truncate pl-0.5">
                {profile.marcas.join(' · ')}
              </p>
            )}
            {profile.role === 'admin' && (
              <p className="text-xs text-gray-400 pl-0.5">Acesso total</p>
            )}
          </div>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
