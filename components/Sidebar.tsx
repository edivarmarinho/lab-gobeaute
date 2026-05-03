'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FlaskConical, Package, Users, FolderKanban,
  FileText, LogOut, ShieldCheck, Beaker, Map, Menu, X,
  LayoutDashboard, KeyRound, History, ClipboardCheck,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { ROLE_LABEL, ROLE_BADGE_COLOR } from '@/lib/types'
import { clsx } from 'clsx'

export default function Sidebar({ user, profile, modulesRead = [] }: { user: User; profile: Profile | null; modulesRead?: string[] }) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = profile?.role === 'admin'
  const [open, setOpen] = useState(false)

  // Fecha drawer ao navegar
  useEffect(() => { setOpen(false) }, [pathname])

  // Fecha drawer ao pressionar Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fallback resiliente: se vier vazio e usuário tem profile válido, mostra todos
  // (admin sempre vê tudo; demais roles veem tudo se permissões ainda não foram setadas)
  const noPermsConfigured = modulesRead.length === 0
  const allowed = (moduleId: string) =>
    isAdmin || noPermsConfigured || modulesRead.includes(moduleId)

  const navAll = [
    { module: 'dashboard',       label: 'Dashboard',        href: '/dashboard',                      icon: FlaskConical },
    { module: 'homologacoes',    label: 'Homologações',     href: '/dashboard/homologacoes',         icon: ClipboardCheck },
    { module: 'projetos',        label: 'Projetos P&D',     href: '/dashboard/projetos',             icon: FolderKanban },
    { module: 'mps',             label: 'Matérias-Primas',  href: '/dashboard/mps',                  icon: Package },
    { module: 'formulas',        label: 'Fórmulas',         href: '/dashboard/formulas',             icon: Beaker },
    { module: 'fornecedores',    label: 'Fornecedores',     href: '/dashboard/fornecedores',         icon: Users },
    { module: 'documentos',      label: 'Documentos',       href: '/dashboard/documentos',           icon: FileText },
    { module: 'produtos',        label: 'Produtos',         href: '/dashboard/produtos',             icon: Package },
    { module: 'roadmap',         label: 'Roadmap',          href: '/dashboard/roadmap',              icon: Map },
    { module: 'admin_usuarios',  label: 'Usuários',         href: '/dashboard/admin/usuarios',       icon: ShieldCheck, adminOnly: true },
    { module: 'admin_acessos',   label: 'Acessos',          href: '/dashboard/admin/acessos',        icon: KeyRound, adminOnly: true },
    { module: 'admin_auditoria', label: 'Auditoria',        href: '/dashboard/admin/auditoria',      icon: History, adminOnly: true },
  ]

  const nav = navAll.filter(n => {
    if (n.adminOnly && !isAdmin) return false
    return allowed(n.module)
  })

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1.5 rounded-lg">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Lab Gobeaute</p>
            <p className="text-xs text-gray-400">P&D</p>
          </div>
        </div>
        {/* Botão fechar — só aparece no drawer mobile */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition"
          aria-label="Fechar menu"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <a
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                active
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </a>
          )
        })}
      </nav>

      {/* User + role */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          {user.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} className="w-7 h-7 rounded-full shrink-0" alt="" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
              <span className="text-brand-600 font-bold text-xs">
                {(profile?.nome ?? user.email ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {profile?.nome ?? user.user_metadata?.full_name ?? user.email}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>

        {profile && (
          <div className="mb-3 space-y-1">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', ROLE_BADGE_COLOR[profile.role])}>
              {ROLE_LABEL[profile.role]}
            </span>
            {profile.marcas.length > 0 && profile.role !== 'admin' && (
              <p className="text-xs text-gray-400 truncate pl-0.5">{profile.marcas.join(' · ')}</p>
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
    </div>
  )

  return (
    <>
      {/* ── Topbar mobile ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-2.5">
        <button
          onClick={() => setOpen(true)}
          className="p-2.5 -ml-1 hover:bg-gray-100 rounded-lg transition active:bg-gray-200"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-brand-500 p-1 rounded-md">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-900">Lab Gobeaute</p>
        </div>
      </div>

      {/* ── Overlay mobile ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer mobile ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* ── Sidebar desktop (sempre visível) ── */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col h-full shrink-0">
        <SidebarContent />
      </aside>
    </>
  )
}
