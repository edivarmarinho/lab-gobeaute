'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { FlaskConical, Package, Users, FolderKanban, FileText, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { clsx } from 'clsx'

const nav = [
  { label: 'Dashboard',     href: '/dashboard',              icon: FlaskConical },
  { label: 'Projetos P&D',  href: '/dashboard/projetos',     icon: FolderKanban },
  { label: 'Matérias-Primas', href: '/dashboard/mps',        icon: Package },
  { label: 'Fornecedores',  href: '/dashboard/fornecedores', icon: Users },
  { label: 'Documentos',    href: '/dashboard/documentos',   icon: FileText },
]

export default function Sidebar({ user }: { user: User }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

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

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          {user.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full" alt="" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{user.user_metadata?.full_name ?? user.email}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
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
