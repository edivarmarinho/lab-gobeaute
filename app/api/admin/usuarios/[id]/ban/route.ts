import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile } from '@/lib/supabase/get-profile'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 403 })
  }
  if (profile.id === params.id) {
    return NextResponse.json({ error: 'CANNOT_BAN_SELF' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({})) as { reason?: string }
  const reason = (body.reason ?? '').trim()
  if (reason.length < 5) {
    return NextResponse.json({ error: 'BAN_REASON_REQUIRED' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('ban_user', {
    p_target_id: params.id,
    p_reason: reason,
    p_actor_id: profile.id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const profile = await getProfile()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'NOT_AUTHORIZED' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { error } = await admin.rpc('unban_user', {
    p_target_id: params.id,
    p_actor_id: profile.id,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
