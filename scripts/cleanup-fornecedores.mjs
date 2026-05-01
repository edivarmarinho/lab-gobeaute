/**
 * Script de limpeza da base de fornecedores — Lab Gobeaute
 * Executa via: node scripts/cleanup-fornecedores.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Ler .env.local manualmente
const envContent = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const [k, ...vs] = line.split('=')
  if (k && vs.length) env[k.trim()] = vs.join('=').trim()
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// IDs dos fornecedores (mapeados da query anterior)
const IDS = {
  // Fornecedores principais (destino das migrações)
  ANASTACIO:        'add9937f-414e-4275-8531-1ce9e86f5bf0',
  KHOL_QUIMICA:     '8ab7cb96-fda4-4cbd-9917-1a6e9619733b',
  UNIVAR:           'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4',
  FOCUS_QUIMICA:    '5818f8ab-4c17-43cc-b4e1-475af8a18933',

  // Duplicatas a mesclar e deletar
  ANASTACIO2:       '534bfd92-b4f8-4f31-97bc-e459273e82ac',
  KHOL_QUIMICA2:    '4ddd9ea7-266f-4159-9cb5-238e2335e496',
  UNIVAR2:          '3b2938b8-88d9-426d-bca3-40eef4fc777d',
  FOCUS_QUIMICA2:   '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16',
  ALPHA_QUIMICA2:   '943ffd08-c9ff-44c5-a09e-aba4824149c4',
  THOR2:            'd18c229b-c71a-4e3c-9479-1243c88c2ab5',

  // Registros BID comparativos a deletar
  AN_DINACO:        '891438e3-972b-4718-8fbf-036fb7cad606',
  AN_KHOL:          '26de6188-2964-40f1-a95f-2d57043ec5ae',
  AN_MCASSAB:       '4aea41c8-514d-4d5e-95e2-add9056793c9',
  AQ_MAIAN:         'ea1fa396-4cc3-475c-98a3-2650502f8d91',
  AQIA_AQ:          'd6bad0da-3554-4c74-9c11-64082d0b8973',
  CITRAL_INS:       '934c518d-b48c-4df8-bead-196630ae8c00',
  CITRAL_ROB:       '6ae4d499-072a-4e10-8e58-5829364d4b8b',
  DIER_ROB:         'e53ffa1a-317a-44df-99f2-683722147d50',
  GLAMIR_ROB:       '24456453-9c48-4473-9d4e-e4fcce975549',
  KH2_PHYTO:        'a2de2be3-adca-40e6-b08f-16f1745963a3',
  KH2_SARFAM:       '628bb6c5-3678-4861-b01a-879b721331ae',
  MAIAN_KHOL:       'cf381122-55f6-4ab1-a13b-98ee436390be',
  MC_BRENNTAG:      '7d7a872f-73f6-4831-a7ee-eec0b932981e',
  MC_OXIGEN:        'd95b7e13-e173-43fb-b627-ecc7a850ccc1',
  OX_AN:            '92085f86-3c87-49e4-a932-7cc180c7768b',
  OX_MAIAN:         '16fca014-3970-459d-80e7-545e10db509e',
  OX_MC:            '7533fad3-fe06-42de-8f82-37a5f1cd5830',
  PHYTO_BARU_KHOL:  '42e282c2-89e3-4cd9-ba3d-031110eb6399',
}

async function migrateRefs(fromId, toId, label) {
  console.log(`  ↳ Migrando referências ${label}...`)
  const tables = [
    { table: 'mps', col: 'forn_hom_id' },
    { table: 'documentos', col: 'fornecedor_id' },
    { table: 'fornecedor_crm', col: 'fornecedor_id' },
    { table: 'fornecedor_contatos', col: 'fornecedor_id' },
  ]

  for (const { table, col } of tables) {
    const { error } = await supabase
      .from(table)
      .update({ [col]: toId })
      .eq(col, fromId)
    if (error) console.warn(`    ⚠️  ${table}.${col}: ${error.message}`)
  }

  // mp_fornecedores: evitar conflito de chave primária
  const { data: mpForn } = await supabase
    .from('mp_fornecedores')
    .select('mp_id')
    .eq('fornecedor_id', fromId)

  for (const row of (mpForn ?? [])) {
    // Verificar se já existe no destino
    const { data: exists } = await supabase
      .from('mp_fornecedores')
      .select('mp_id')
      .eq('fornecedor_id', toId)
      .eq('mp_id', row.mp_id)
      .maybeSingle()

    if (!exists) {
      await supabase
        .from('mp_fornecedores')
        .update({ fornecedor_id: toId })
        .eq('fornecedor_id', fromId)
        .eq('mp_id', row.mp_id)
    } else {
      // Já existe no destino — só deletar a duplicata
      await supabase
        .from('mp_fornecedores')
        .delete()
        .eq('fornecedor_id', fromId)
        .eq('mp_id', row.mp_id)
    }
  }
}

async function deleteFornecedor(id, nome) {
  const { error } = await supabase.from('fornecedores').delete().eq('id', id)
  if (error) {
    console.error(`  ❌ Erro ao deletar ${nome}: ${error.message}`)
  } else {
    console.log(`  ✓ Deletado: ${nome}`)
  }
}

async function updateNome(id, novoNome) {
  const { error } = await supabase.from('fornecedores').update({ nome: novoNome }).eq('id', id)
  if (error) {
    console.error(`  ❌ Erro ao renomear ${id}: ${error.message}`)
  } else {
    console.log(`  ✓ Renomeado → ${novoNome}`)
  }
}

async function recalcMpsAtivas() {
  console.log('\n4. Recalculando mps_ativas...')
  // Buscar todos os fornecedores
  const { data: fornecedores } = await supabase.from('fornecedores').select('id, nome')
  for (const f of (fornecedores ?? [])) {
    const { count } = await supabase
      .from('mps')
      .select('id', { count: 'exact', head: true })
      .eq('forn_hom_id', f.id)
    await supabase.from('fornecedores').update({ mps_ativas: count ?? 0 }).eq('id', f.id)
  }
  console.log(`  ✓ ${(fornecedores ?? []).length} fornecedores atualizados`)
}

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Lab Gobeaute — Limpeza da Base de Fornecedores')
  console.log('═══════════════════════════════════════════════════════\n')

  // ── ETAPA 1: Normalizar nomes ────────────────────────────────────────────
  console.log('1. Normalizando nomes...')
  await updateNome('40d711fd-0bbd-4378-840e-e3d2b462819e', 'TARUMA')  // taruma → TARUMA
  await updateNome('493a76f1-1a4d-47d3-bdb2-d3dd9b26be05', 'OXIGEN')  // Oxigen → OXIGEN
  await updateNome('92085f86-3c87-49e4-a932-7cc180c7768b', 'OXIGEN | ANASTACIO')
  await updateNome('16fca014-3970-459d-80e7-545e10db509e', 'OXIGEN | MAIAN')
  await updateNome('7533fad3-fe06-42de-8f82-37a5f1cd5830', 'OXIGEN | MCASSAB')
  await updateNome(IDS.THOR2, 'THOR')  // THOR2 → THOR

  // ── ETAPA 2: Mesclar duplicatas ──────────────────────────────────────────
  console.log('\n2. Mesclando duplicatas...')

  // ANASTACIO2 → ANASTACIO
  console.log('\n  ANASTACIO2 → ANASTACIO')
  await migrateRefs(IDS.ANASTACIO2, IDS.ANASTACIO, 'ANASTACIO')
  await deleteFornecedor(IDS.ANASTACIO2, 'ANASTACIO2')

  // KHOL QUIMICA2 → KHOL QUIMICA
  console.log('\n  KHOL QUIMICA2 → KHOL QUIMICA')
  await migrateRefs(IDS.KHOL_QUIMICA2, IDS.KHOL_QUIMICA, 'KHOL QUIMICA')
  await deleteFornecedor(IDS.KHOL_QUIMICA2, 'KHOL QUIMICA2')

  // UNIVAR2 → UNIVAR
  console.log('\n  UNIVAR2 → UNIVAR')
  await migrateRefs(IDS.UNIVAR2, IDS.UNIVAR, 'UNIVAR')
  await supabase.from('fornecedores').update({
    observacoes: 'Segundo canal: cosmeticos2@univar.com.br / CNPJ 67.890.245/0001-56'
  }).eq('id', IDS.UNIVAR)
  await deleteFornecedor(IDS.UNIVAR2, 'UNIVAR2')

  // FOCUS QUIMICA (com acento) → FOCUS QUIMICA (sem acento)
  console.log('\n  FOCUS QUÍMICA → FOCUS QUIMICA (mesclando filial)')
  await migrateRefs(IDS.FOCUS_QUIMICA2, IDS.FOCUS_QUIMICA, 'FOCUS QUIMICA')
  await supabase.from('fornecedores').update({
    observacoes: 'Filial: CNPJ 12.345.690/0002-90'
  }).eq('id', IDS.FOCUS_QUIMICA)
  await deleteFornecedor(IDS.FOCUS_QUIMICA2, 'FOCUS QUÍMICA (filial)')

  // ALPHA QUIMICA2 — sem MPs, deletar direto
  console.log('\n  ALPHA QUIMICA2 — sem MPs, deletando')
  await deleteFornecedor(IDS.ALPHA_QUIMICA2, 'ALPHA QUIMICA2')

  // ── ETAPA 3: Deletar registros BID comparativos ──────────────────────────
  console.log('\n3. Deletando registros BID comparativos ("FORN_A | FORN_B")...')
  const bidRecords = [
    [IDS.AN_DINACO,       'ANASTACIO | DINACO'],
    [IDS.AN_KHOL,         'ANASTACIO | KHOL QUIMICA'],
    [IDS.AN_MCASSAB,      'ANASTACIO | MCASSAB'],
    [IDS.AQ_MAIAN,        'ALPHA QUIMICA | MAIAN'],
    [IDS.AQIA_AQ,         'AQIA | ALPHA QUIMICA'],
    [IDS.CITRAL_INS,      'CITRAL | INSPIRATION'],
    [IDS.CITRAL_ROB,      'CITRAL | ROBERTET'],
    [IDS.DIER_ROB,        'DIERBERGER | ROBERTET'],
    [IDS.GLAMIR_ROB,      'GLAMIR | ROBERTET'],
    [IDS.KH2_PHYTO,       'KHOL QUIMICA2 | PHYTOVITAL'],
    [IDS.KH2_SARFAM,      'KHOL QUIMICA2 | SARFAM'],
    [IDS.MAIAN_KHOL,      'MAIAN | KHOL QUIMICA'],
    [IDS.MC_BRENNTAG,     'MCASSAB | BRENNTAG'],
    [IDS.MC_OXIGEN,       'MCASSAB | Oxigen'],
    [IDS.OX_AN,           'OXIGEN | ANASTACIO'],
    [IDS.OX_MAIAN,        'OXIGEN | MAIAN'],
    [IDS.OX_MC,           'OXIGEN | MCASSAB'],
    [IDS.PHYTO_BARU_KHOL, 'PHYTOVITAL | BARUQUIMICA | KHOL QUIMICA'],
  ]

  for (const [id, nome] of bidRecords) {
    await deleteFornecedor(id, nome)
  }

  // ── ETAPA 4: Recalcular mps_ativas ──────────────────────────────────────
  await recalcMpsAtivas()

  // ── VERIFICAÇÃO FINAL ────────────────────────────────────────────────────
  console.log('\n5. Verificação final...')
  const { data: resultado, count } = await supabase
    .from('fornecedores')
    .select('nome, mps_ativas, status', { count: 'exact' })
    .order('nome')

  console.log(`\n  Total de fornecedores após limpeza: ${count}`)
  console.log('\n  Listagem completa:')
  for (const f of (resultado ?? [])) {
    const flag = f.nome.includes('|') ? ' ⚠️  (AINDA TEM |)' : ''
    const flag2 = /\d$/.test(f.nome) ? ' ⚠️  (AINDA TEM NÚMERO)' : ''
    console.log(`  ${f.nome.padEnd(35)} MPs: ${String(f.mps_ativas).padStart(2)}${flag}${flag2}`)
  }

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  Limpeza concluída!')
  console.log('═══════════════════════════════════════════════════════')
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
