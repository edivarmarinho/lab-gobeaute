import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getProjetoById } from '@/lib/monday/client'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const projeto = await getProjetoById(params.id)
    if (!projeto) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ projeto })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
