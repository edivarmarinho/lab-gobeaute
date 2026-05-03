'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/lib/types'

type ProfileContextValue = {
  profile: Profile | null
  modulesRead: string[]
  modulesWrite: string[]
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  modulesRead: [],
  modulesWrite: [],
})

export function ProfileProvider({
  profile,
  modulesRead = [],
  modulesWrite = [],
  children,
}: {
  profile: Profile | null
  modulesRead?: string[]
  modulesWrite?: string[]
  children: React.ReactNode
}) {
  return (
    <ProfileContext.Provider value={{ profile, modulesRead, modulesWrite }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): Profile | null {
  return useContext(ProfileContext).profile
}

export function useCanEdit(): boolean {
  const p = useContext(ProfileContext).profile
  return p?.role === 'admin' || p?.role === 'pd'
}

export function useIsAdmin(): boolean {
  return useContext(ProfileContext).profile?.role === 'admin'
}

export function useCanReadModule(moduleId: string): boolean {
  const ctx = useContext(ProfileContext)
  if (ctx.profile?.role === 'admin') return true
  return ctx.modulesRead.includes(moduleId)
}

export function useCanWriteModule(moduleId: string): boolean {
  const ctx = useContext(ProfileContext)
  if (ctx.profile?.role === 'admin') return true
  return ctx.modulesWrite.includes(moduleId)
}

export function useAllowedModules(): { read: string[]; write: string[] } {
  const ctx = useContext(ProfileContext)
  return { read: ctx.modulesRead, write: ctx.modulesWrite }
}
