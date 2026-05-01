import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSheetsClient, PRODUTOS_SHEET_ID } from '@/lib/google-sheets'

// Aba canônica da planilha [GoBeaute] Base de Cadastros de Produtos
const ABA_CONSOLIDADA = 'Base Consolidada '

const MARCA_NORM: Record<string, string> = {
  'auá': 'Auá Natural', 'aua': 'Auá Natural', 'auá natural': 'Auá Natural',
  'ápice': 'Ápice', 'apice': 'Ápice',
  'barbours': 'Barbours',
  'by samia': 'By Samia', 'by sâmia': 'By Samia',
  'kokeshi': 'Kokeshi',
  'lescent': 'Lescent',
  'rituária': 'Rituária', 'rituaria': 'Rituária',
  'yenzah': 'Yenzah',
}

function normalizeText(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s === '' || s === '-' ? null : s
}

function normalizeNumber(v: unknown): number | null {
  const n = parseFloat(String(v ?? '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim())
  return isNaN(n) ? null : n
}

function col(headers: string[], names: string[]): number {
  for (const n of names) {
    const i = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()))
    if (i >= 0) return i
  }
  return -1
}

export async function POST(request: NextRequest) {
  const isCron = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden — apenas admin' }, { status: 403 })
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      error: 'Google não configurado.',
      hint: `Compartilhe a planilha com: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? 'service account'}`,
    }, { status: 503 })
  }

  const admin = createAdminClient()
  const erros: string[] = []
  let inseridos = 0
  let atualizados = 0
  let total = 0

  try {
    const sheets = getSheetsClient()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: PRODUTOS_SHEET_ID,
      range: `'${ABA_CONSOLIDADA}'!A1:Z3000`,
    })

    const rows = res.data.values ?? []
    if (rows.length < 2) {
      return NextResponse.json({ error: `Aba "${ABA_CONSOLIDADA}" vazia ou não encontrada` }, { status: 400 })
    }

    const headers = rows[0].map((h: string) => String(h).trim())
    const iMarca  = col(headers, ['Marca'])
    const iSku    = col(headers, ['SKU'])
    const iAntigo = col(headers, ['Cód Antigo', 'Cod Antigo'])
    const iDesc   = col(headers, ['Descricao', 'Descrição'])
    const iStatus = col(headers, ['Status'])
    const iPmv    = col(headers, ['Preco Venda', 'Preço Venda', 'PMV'])

    if (iSku < 0) {
      return NextResponse.json({ error: 'Coluna SKU não encontrada na aba Base Consolidada' }, { status: 400 })
    }

    // Deduplicar SKUs (a planilha pode ter repetições)
    const seen = new Set<string>()

    for (const row of rows.slice(1)) {
      const sku = normalizeText(row[iSku])
      if (!sku || seen.has(sku)) continue
      seen.add(sku)

      const marcaRaw = (iMarca >= 0 ? normalizeText(row[iMarca]) : null) ?? ''
      const marca    = MARCA_NORM[marcaRaw.toLowerCase()] ?? marcaRaw
      if (!marca) continue

      const descricao = (iDesc >= 0 ? normalizeText(row[iDesc]) : null) ?? sku
      const status    = (iStatus >= 0 ? normalizeText(row[iStatus]) : null) ?? 'Ativo'
      const sku_tiny  = iAntigo >= 0 ? normalizeText(row[iAntigo]) : null
      const pmv       = iPmv >= 0 ? normalizeNumber(row[iPmv]) : null

      total++

      const { data: existing } = await admin
        .from('produtos')
        .select('id')
        .eq('sku', sku)
        .maybeSingle()

      if (existing) {
        await admin.from('produtos').update({ descricao, status, pmv, sku_tiny, marca }).eq('sku', sku)
        atualizados++
      } else {
        const { error } = await admin.from('produtos').insert({ sku, sku_tiny, marca, descricao, status, pmv })
        if (error) erros.push(`${sku}: ${error.message}`)
        else inseridos++
      }
    }

    return NextResponse.json({ ok: true, total, inseridos, atualizados, erros: erros.slice(0, 10) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: status da configuração + contagem atual do banco
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { count: total }  = await admin.from('produtos').select('*', { count: 'exact', head: true })
  const { count: ativos } = await admin.from('produtos').select('*', { count: 'exact', head: true }).eq('status', 'Ativo')

  const configured = !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)

  return NextResponse.json({
    configured,
    sheetId: PRODUTOS_SHEET_ID,
    aba: ABA_CONSOLIDADA,
    serviceAccount: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null,
    banco: { total: total ?? 0, ativos: ativos ?? 0 },
  })
}
