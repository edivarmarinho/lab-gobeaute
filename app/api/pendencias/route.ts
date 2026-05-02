import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ pendencias: [] }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('pendencias_pd')
    .select('*')
    .order('prioridade', { ascending: true })
    .limit(500)

  let pendencias = data ?? []

  // Filtrar por marca se usuário não-admin
  if (profile.role !== 'admin' && profile.marcas.length > 0) {
    pendencias = pendencias.filter((p: any) => !p.marca || profile.marcas.includes(p.marca))
  }

  return NextResponse.json({ pendencias })
}
