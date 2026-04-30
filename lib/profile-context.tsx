'use client'

import { createContext, useContext } from 'react'
import type { Profile } from '@/lib/types'

const ProfileContext = createContext<Profile | null>(null)

export function ProfileProvider({
  profile,
  children,
}: {
  profile: Profile | null
  children: React.ReactNode
}) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile(): Profile | null {
  return useContext(ProfileContext)
}

export function useCanEdit(): boolean {
  const p = useProfile()
  return p?.role === 'admin' || p?.role === 'pd'
}

export function useIsAdmin(): boolean {
  return useProfile()?.role === 'admin'
}
