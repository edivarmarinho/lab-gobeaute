/**
 * Parser de nomes de arquivo do Google Drive.
 *
 * Convenção esperada:
 *   TIPO_MPCODIGO_NomeMp_FORNECEDOR.pdf
 *   TIPO_MPCODIGO_NomeMp_Lote-XXX_FORNECEDOR.pdf
 *   TIPO_FORNECEDOR_Ano.pdf  (para certificações sem MP)
 *
 * Exemplos:
 *   FISPQ_MP0011_Glicerina_BASF.pdf
 *   COA_MP0045_AcidoHialuronico_Lote-2024A_MCASSAB.pdf
 *   ISO22716_BASF_2025.pdf
 *   Laudo-Micro_MP0011_Mar2024.pdf
 */

export type TipoDocumento =
  | 'FISPQ'
  | 'COA'
  | 'Ficha Técnica'
  | 'ISO 22716'
  | 'ISO 9001'
  | 'Laudo Microbiológico'
  | 'Decl. Conformidade'
  | 'Outro'

export type ParsedDoc = {
  tipo: TipoDocumento
  mp_codigo: string | null
  fornecedor_nome: string | null
  lote: string | null
  ano: number | null
  nome_limpo: string
}

const TIPO_MAP: Record<string, TipoDocumento> = {
  fispq:        'FISPQ',
  coa:          'COA',
  'ficha-tec':  'Ficha Técnica',
  'ficha-tecnica': 'Ficha Técnica',
  fichatecnica: 'Ficha Técnica',
  iso22716:     'ISO 22716',
  iso9001:      'ISO 9001',
  'laudo-micro': 'Laudo Microbiológico',
  laudomicro:   'Laudo Microbiológico',
  laudo:        'Laudo Microbiológico',
  decl:         'Decl. Conformidade',
  declaracao:   'Decl. Conformidade',
}

export function parseFileName(filename: string): ParsedDoc {
  // Remove extensão
  const base = filename.replace(/\.[^.]+$/, '')
  const parts = base.split('_')

  // Detecta tipo pelo primeiro token
  const tipoRaw = parts[0].toLowerCase().replace(/\s+/g, '')
  const tipo: TipoDocumento = TIPO_MAP[tipoRaw] ?? 'Outro'

  // Detecta código de MP (padrão MP\d+)
  const mpPart = parts.find(p => /^MP\d+$/i.test(p))
  const mp_codigo = mpPart ? mpPart.toUpperCase() : null

  // Detecta lote (padrão Lote-XXX)
  const lotePart = parts.find(p => /^lote/i.test(p))
  const lote = lotePart ? lotePart.replace(/^lote-?/i, '') : null

  // Detecta ano (4 dígitos isolados)
  const anoPart = parts.find(p => /^(20\d{2})$/.test(p))
  const ano = anoPart ? parseInt(anoPart) : null

  // Fornecedor: último token que não seja MP, Lote ou Ano
  const skip = new Set([parts[0], mpPart, lotePart, anoPart].filter(Boolean) as string[])
  const fornPart = [...parts].reverse().find(p => !skip.has(p) && p.length > 1)
  const fornecedor_nome = fornPart ?? null

  return {
    tipo,
    mp_codigo,
    fornecedor_nome,
    lote,
    ano,
    nome_limpo: base.replace(/_/g, ' '),
  }
}
