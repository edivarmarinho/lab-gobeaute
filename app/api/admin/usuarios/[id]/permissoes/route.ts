import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import { audit, extractRequestInfo } from '@/lib/audit/logger'

type Permission = { module_id: string; can_read: boolean; can_write: boolean }

function permsToMap(rows: Array<{ module_id: string; can_read: boolean; can_write: boolean }>) {
  return rows.reduce<Record<string, string>>((acc, r) => {
    acc[r.module_id] = r.can_write ? 'WRITE' : r.can_read ? 'READ' : 'NONE'
    return acc
  }, {})
}

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
  const { data: target } = await admin.from('profiles').select('email').eq('id', params.id).single()
  const { data: beforeRows } = await admin.from('user_module_permissions').select('module_id,can_read,can_write').eq('user_id', params.id)

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
      can_read: p.can_read || p.can_write,
      can_write: p.can_write,
      granted_by: caller.id,
    }))

  if (rows.length > 0) {
    const { error: insErr } = await admin.from('user_module_permissions').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  const { ip, user_agent } = extractRequestInfo(request)
  await audit({
    module: 'usuarios',
    entidade: 'user_module_permissions',
    entidade_id: params.id,
    acao: 'PERMISSION_CHANGE',
    actor: caller,
    before: permsToMap(beforeRows ?? []),
    after: permsToMap(rows),
    metadata: { target_email: target?.email, total: rows.length },
    ip, user_agent,
  })

  return NextResponse.json({ ok: true, total: rows.length })
}
