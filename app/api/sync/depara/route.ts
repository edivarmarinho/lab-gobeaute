import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSheetsClient } from '@/lib/google-sheets'

// Planilha de cadastros (aba "de-para")
const DEPARA_SHEET_ID = '1bSEMw3fpo56DfCGoQiQwOW09FDXCrryh'

// Normalizações
function norm(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return !s || s === '-' ? null : s
}

function stripAccents(v: string | null): string | null {
  if (!v) return v
  return v.normalize('NFKD').replace(/[̀-ͯ]/g, '')
}

const MARCA_NORM: Record<string, string> = {
  'apice': 'Apice', 'ápice': 'Apice',
  'aua': 'Aua Natural', 'auá': 'Aua Natural', 'auá natural': 'Aua Natural', 'aua natural': 'Aua Natural',
  'barbours': 'Barbours', 'barbours beauty': 'Barbours',
  'by samia': 'By Samia', 'by sâmia': 'By Samia',
  'kokeshi': 'Kokeshi',
  'lescent': 'Lescent',
  'rituaria': 'Rituaria', 'rituária': 'Rituaria',
  'yenzah': 'Yenzah',
}

function normalizeMarca(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  return MARCA_NORM[s] ?? (stripAccents(s) ?? s).replace(/\b\w/g, c => c.toUpperCase())
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
    return NextResponse.json({ error: 'Google Sheets não configurado' }, { status: 503 })
  }

  const sheets = getSheetsClient()
  const admin = createAdminClient()

  // 1. Lista todas as abas pra encontrar a "de-para"
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: DEPARA_SHEET_ID,
    fields: 'sheets.properties',
  })
  const allTabs = (meta.data.sheets ?? []).map(s => s.properties?.title ?? '')

  // Match case-insensitive: aba que contém "de-para" ou "de para" ou "depara"
  const deparaTab = allTabs.find(t => /de[\s\-]?para/i.test(t))
  if (!deparaTab) {
    return NextResponse.json({
      error: 'Aba "de-para" não encontrada',
      abas_disponiveis: allTabs,
    }, { status: 404 })
  }

  // 2. Lê a aba inteira
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: DEPARA_SHEET_ID,
    range: `'${deparaTab}'`,
  })
  const rows = res.data.values ?? []
  if (rows.length < 2) {
    return NextResponse.json({ error: 'Aba vazia', aba: deparaTab }, { status: 400 })
  }

  // 3. Mapeia cabeçalhos com tolerância
  const headers = rows[0].map(h => String(h ?? '').trim())
  const findCol = (...needles: string[]) => {
    for (const n of needles) {
      const i = headers.findIndex(h => h.toLowerCase().includes(n.toLowerCase()))
      if (i >= 0) return i
    }
    return -1
  }
  const idxMarca = findCol('marca')
  const idxSkuAntigo = findCol('antigo', 'sku antigo', 'cód antigo', 'cod antigo', 'codigo antigo')
  const idxSkuNovo = findCol('novo', 'sku novo', 'sku tiny', 'tiny', 'cód novo', 'cod novo', 'codigo novo')
  const idxDescricao = findCol('descricao', 'descrição', 'produto', 'nome')

  if (idxMarca < 0 || idxSkuAntigo < 0 || idxSkuNovo < 0) {
    return NextResponse.json({
      error: 'Cabeçalho inesperado — não achei colunas marca/sku_antigo/sku_novo',
      headers,
      esperado: ['marca', 'sku antigo (ou similar)', 'sku novo / tiny (ou similar)'],
    }, { status: 400 })
  }

  // 4. Itera linhas e popula sku_depara
  let processadas = 0, inseridas = 0, atualizadas = 0
  const erros: string[] = []
  const porMarca: Record<string, number> = {}

  for (const row of rows.slice(1)) {
    const marca = normalizeMarca(row[idxMarca])
    const skuAntigo = norm(row[idxSkuAntigo])
    const skuNovo = norm(row[idxSkuNovo])
    const descricao = idxDescricao >= 0 ? norm(row[idxDescricao]) : null

    if (!marca || !skuAntigo || !skuNovo) continue
    processadas++
    porMarca[marca] = (porMarca[marca] ?? 0) + 1

    const { data: existing } = await admin
      .from('sku_depara')
      .select('id')
      .eq('marca', marca)
      .eq('sku_antigo', skuAntigo)
      .maybeSingle()

    if (existing) {
      const { error } = await admin
        .from('sku_depara')
        .update({ sku_novo: skuNovo, descricao, fonte: 'google-sheets-de-para' })
        .eq('id', existing.id)
      if (error) erros.push(`${marca}/${skuAntigo}: ${error.message}`)
      else atualizadas++
    } else {
      const { error } = await admin
        .from('sku_depara')
        .insert({ marca, sku_antigo: skuAntigo, sku_novo: skuNovo, descricao, fonte: 'google-sheets-de-para' })
      if (error) erros.push(`${marca}/${skuAntigo}: ${error.message}`)
      else inseridas++
    }
  }

  return NextResponse.json({
    ok: true,
    aba: deparaTab,
    headers_detectados: { marca: headers[idxMarca], sku_antigo: headers[idxSkuAntigo], sku_novo: headers[idxSkuNovo], descricao: idxDescricao >= 0 ? headers[idxDescricao] : null },
    processadas,
    inseridas,
    atualizadas,
    por_marca: porMarca,
    erros: erros.slice(0, 10),
  })
}

// GET: status (admin) ou disparo via cron
export async function GET(request: NextRequest) {
  const isCron =
    request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` ||
    request.headers.get('user-agent')?.includes('vercel-cron')

  if (isCron) return POST(request)

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { count: total } = await admin.from('sku_depara').select('*', { count: 'exact', head: true })
  return NextResponse.json({
    sheetId: DEPARA_SHEET_ID,
    banco: { total: total ?? 0 },
    configurado: !!(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY),
  })
}
