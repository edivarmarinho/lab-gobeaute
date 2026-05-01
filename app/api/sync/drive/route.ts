import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDriveClient } from '@/lib/google-drive'
import { parseFileName } from '@/lib/drive-parser'

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID

// Chamada pelo Vercel Cron (sem auth header) ou manualmente por admin
export async function POST(request: NextRequest) {
  // Verifica se é cron (header do Vercel) ou usuário admin
  const isCron = request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`

  if (!isCron) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin' && profile?.role !== 'pd') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!FOLDER_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      error: 'Google Drive não configurado. Adicione GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_DRIVE_FOLDER_ID nas variáveis de ambiente do Vercel.'
    }, { status: 503 })
  }

  const admin = createAdminClient()
  const started = new Date().toISOString()
  let novos = 0
  let total = 0
  let erros: string[] = []

  try {
    const drive = getDriveClient()

    // Lista todos os arquivos PDF/imagem dentro da pasta (recursivo via query)
    const res = await drive.files.list({
      q: `'${FOLDER_ID}' in parents and trashed=false and (mimeType='application/pdf' or mimeType contains 'image/')`,
      fields: 'files(id,name,mimeType,modifiedTime,webViewLink,webContentLink)',
      pageSize: 500,
      orderBy: 'modifiedTime desc',
    })

    const files = res.data.files ?? []
    total = files.length

    // Busca todos os IDs já importados para evitar re-processar
    const { data: existentes } = await admin
      .from('documentos')
      .select('drive_file_id, id')
    const existentesMap = new Map(existentes?.map(d => [d.drive_file_id, d.id]) ?? [])

    // Busca MPs e fornecedores para vinculação
    const [{ data: mps }, { data: fornecedores }] = await Promise.all([
      admin.from('mps').select('id, codigo'),
      admin.from('fornecedores').select('id, nome'),
    ])

    const mpMap = new Map(mps?.map(m => [m.codigo.toUpperCase(), m.id]) ?? [])
    // Índice de fornecedor por nome normalizado
    const fornMap = new Map(
      fornecedores?.map(f => [f.nome.toUpperCase().trim(), f.id]) ?? []
    )

    function findFornecedor(nome: string | null): string | null {
      if (!nome) return null
      const key = nome.toUpperCase().trim()
      // Busca exata
      if (fornMap.has(key)) return fornMap.get(key)!
      // Busca parcial (nome do arquivo pode ser abreviado)
      for (const [k, v] of fornMap) {
        if (k.includes(key) || key.includes(k.substring(0, 4))) return v
      }
      return null
    }

    for (const file of files) {
      if (!file.id || !file.name) continue

      try {
        const parsed = parseFileName(file.name)
        const mp_id = parsed.mp_codigo ? (mpMap.get(parsed.mp_codigo) ?? null) : null
        const fornecedor_id = findFornecedor(parsed.fornecedor_nome)

        const doc = {
          drive_file_id: file.id,
          drive_url: file.webViewLink ?? null,
          drive_nome: file.name,
          nome: parsed.nome_limpo,
          tipo: parsed.tipo,
          mp_codigo: parsed.mp_codigo,
          mp_id,
          fornecedor_id,
          fornecedor_nome: parsed.fornecedor_nome,
          versao_lote: parsed.lote,
          data_upload: file.modifiedTime ? file.modifiedTime.split('T')[0] : null,
          status: 'Pendente' as const,
        }

        if (existentesMap.has(file.id)) {
          // Atualiza metadados se o arquivo foi modificado no Drive
          await admin.from('documentos').update(doc).eq('drive_file_id', file.id)
        } else {
          await admin.from('documentos').insert(doc)
          novos++
        }
      } catch (e: any) {
        erros.push(`${file.name}: ${e.message}`)
      }
    }

    // Registra no log
    await admin.from('drive_sync_log').insert({
      executado_em: started,
      arquivos_novos: novos,
      arquivos_total: total,
      status: 'ok',
      detalhe: erros.length > 0 ? erros.slice(0, 5).join(' | ') : null,
    })

    return NextResponse.json({ ok: true, total, novos, erros: erros.length })
  } catch (e: any) {
    await admin.from('drive_sync_log').insert({
      executado_em: started,
      arquivos_novos: 0,
      arquivos_total: 0,
      status: 'erro',
      detalhe: e.message,
    })

    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: retorna status da última sync
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: logs } = await admin
    .from('drive_sync_log')
    .select('*')
    .order('executado_em', { ascending: false })
    .limit(1)

  const isConfigured = !!(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  )

  return NextResponse.json({
    isConfigured,
    lastSync: logs?.[0] ?? null,
  })
}
