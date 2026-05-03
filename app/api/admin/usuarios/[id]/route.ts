import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { audit, extractRequestInfo } from '@/lib/audit/logger'
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
  const { data: before } = await adminClient
    .from('profiles')
    .select('role,marcas,ativo,email')
    .eq('id', params.id)
    .single()

  const { error } = await adminClient
    .from('profiles')
    .update(updates)
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { ip, user_agent } = extractRequestInfo(request)
  await audit({
    module: 'usuarios',
    entidade: 'profiles',
    entidade_id: params.id,
    acao: 'UPDATE',
    actor: callerProfile,
    before: { role: before?.role, marcas: before?.marcas, ativo: before?.ativo },
    after:  { role: role ?? before?.role, marcas: marcas ?? before?.marcas, ativo: ativo ?? before?.ativo },
    metadata: { target_email: before?.email },
    ip, user_agent,
  })

  return NextResponse.json({ ok: true })
}
