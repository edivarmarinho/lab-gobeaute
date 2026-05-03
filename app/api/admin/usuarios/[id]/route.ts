import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const callerProfile = await getProfile()
  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { role, marcas, ativo } = body as { role?: UserRole; marcas?: string[]; ativo?: boolean }

  if (role && !['admin', 'pd', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'role inválido' }, { status: 400 })
  }

  if (ativo === false && params.id === callerProfile.id) {
    return NextResponse.json({ error: 'Você não pode desativar a si mesmo' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (role !== undefined) updates.role = role
  if (marcas !== undefined) updates.marcas = marcas
  if (ativo !== undefined) {
    updates.ativo = ativo
    updates.desativado_em = ativo ? null : new Date().toISOString()
    updates.desativado_por = ativo ? null : callerProfile.id
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
