import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/supabase/get-profile'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const callerProfile = await getProfile()
  if (!callerProfile || callerProfile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, role, marcas } = body as { email: string; role: UserRole; marcas: string[] }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }
  if (!['admin', 'pd', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
  }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const adminClient = createAdminClient()

  // Verificar se já existe convite pendente para este e-mail
  const { data: existing } = await adminClient
    .from('user_invites')
    .select('id')
    .eq('email', email)
    .eq('status', 'pendente')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Já existe um convite pendente para este e-mail' }, { status: 409 })
  }

  const { data, error } = await adminClient
    .from('user_invites')
    .insert({
      email,
      role,
      marcas: role === 'admin' ? [] : (marcas ?? []),
      token,
      convidado_por: callerProfile.id,
      convidado_por_nome: callerProfile.nome ?? callerProfile.email,
      expires_at: expiresAt,
      status: 'pendente',
    })
    .select()
    .single()

  if (error) {
    // Tabela pode não existir ainda — retornar 404 claro para o frontend
    if (error.code === '42P01') {
      return NextResponse.json(
        { error: 'Tabela user_invites não encontrada. Execute a migration 001 no Supabase SQL Editor.' },
        { status: 404 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invite: data }, { status: 201 })
}
