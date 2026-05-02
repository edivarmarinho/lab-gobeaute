import { NextResponse } from 'next/server'
import { invalidarCache, gerarFeedAutomatico } from '@/lib/feed/agent'

/**
 * Endpoint para forçar atualização do feed (cron job ou manual)
 *
 * GET  /api/feed/atualizar?secret=XXX  → invalida cache e regenera
 *
 * Configurar cron no vercel.json ou Cloudflare Cron Triggers para chamar a cada 6h
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')

  // Proteger endpoint com CRON_SECRET (mesmo que sync de produtos)
  const expected = process.env.CRON_SECRET
  if (expected && secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    invalidarCache()
    const noticias = await gerarFeedAutomatico()
    return NextResponse.json({
      ok: true,
      total: noticias.length,
      destaque: noticias.filter(n => n.destaque).length,
      atualizado_em: new Date().toISOString(),
      agente_ativo: !!process.env.ANTHROPIC_API_KEY,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro' }, { status: 500 })
  }
}
