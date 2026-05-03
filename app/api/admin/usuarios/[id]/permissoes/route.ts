import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'

type Permission = { module_id: string; can_read: boolean; can_write: boolean }

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const caller = await getProfile()
  if (!caller || caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { permissions } = body as { permissions: Permission[] }
  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: 'permissions inválidas' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Apaga as atuais e re-insere (mais simples e atômico em prática pra esse volume)
  const { error: delErr } = await admin
    .from('user_module_permissions')
    .delete()
    .eq('user_id', params.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  const rows = permissions
    .filter(p => p.can_read || p.can_write)
    .map(p => ({
      user_id: params.id,
      module_id: p.module_id,
      can_read: p.can_read || p.can_write, // write implica read
      can_write: p.can_write,
      granted_by: caller.id,
    }))

  if (rows.length > 0) {
    const { error: insErr } = await admin.from('user_module_permissions').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, total: rows.length })
}
