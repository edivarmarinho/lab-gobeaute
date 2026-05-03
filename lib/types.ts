export type UserRole = 'admin' | 'pd' | 'viewer'

export type Profile = {
  id: string
  email: string
  nome: string | null
  avatar_url: string | null
  role: UserRole
  marcas: string[]
  ativo?: boolean
  desativado_em?: string | null
  desativado_por?: string | null
  created_at: string
  updated_at: string
}

export type Module = {
  id: string
  label: string
  descricao: string | null
  ordem: number
  admin_only: boolean
  ativo: boolean
}

export type ModulePermission = {
  user_id: string
  module_id: string
  can_read: boolean
  can_write: boolean
}

export const MARCAS_DISPONIVEIS = [
  'Kokeshi',
  'Apice',
  'Barbours',
  'Yenzah',
  'By Samia',
  'Rituaria',
  'Lescent',
  'Aua Natural',
] as const

export type MarcaDisponivel = (typeof MARCAS_DISPONIVEIS)[number]

export const ROLE_LABEL: Record<UserRole, string> = {
  admin:  'Admin',
  pd:     'P&D',
  viewer: 'Visualizador',
}

export const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  admin:  'bg-red-100 text-red-700',
  pd:     'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}
