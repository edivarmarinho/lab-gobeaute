/**
 * Agente de Inteligência Técnica de Matérias-Primas
 *
 * Para cada MP, Claude pesquisa e estrutura informações que um formulador
 * cosmético sênior precisa ter à mão durante o desenvolvimento de fórmula.
 *
 * Fontes de conhecimento:
 * - INCI Decoder, Cosmetics Info, PubChem (training data Claude)
 * - Documentação técnica de fornecedores (BASF, Croda, Givaudan, Evonik, DSM)
 * - Literatura científica em cosmetologia
 * - Padrões IFRA, ECOSING, regulamentações
 */

import Anthropic from '@anthropic-ai/sdk'

export type IntelMP = {
  /** Função primária na fórmula (ex: "Emoliente oclusivo") */
  funcao_primaria: string

  /** Funções secundárias (até 3) */
  funcoes_secundarias: string[]

  /** Descrição técnica do efeito sensorial — o que o consumidor vai sentir */
  efeito_sensorial: string

  /** Mecanismo de ação cosmético — POR QUE funciona */
  mecanismo_acao: string

  /** Concentração típica de uso em formulações (range) */
  concentracao_tipica: {
    min: number
    max: number
    unidade: '%' | 'ppm'
    contexto: string // ex: "creme facial", "shampoo"
  }

  /** Solubilidade — em que veículos se dissolve */
  solubilidade: {
    agua: 'soluvel' | 'parcial' | 'insoluvel'
    oleo: 'soluvel' | 'parcial' | 'insoluvel'
    alcool: 'soluvel' | 'parcial' | 'insoluvel' | 'na'
    notas?: string
  }

  /** pH ideal de uso (faixa) */
  ph_ideal: {
    min: number
    max: number
    sensibilidade: 'alta' | 'media' | 'baixa'
    notas?: string
  }

  /** Estabilidade — fatores que degradam o ingrediente */
  estabilidade: {
    sensivel_calor: boolean
    sensivel_luz: boolean
    sensivel_oxigeno: boolean
    sensivel_metais: boolean
    temp_max_processo_c?: number
    notas: string
  }

  /** Compatibilidades — com quais classes de ingredientes pode/não pode combinar */
  compatibilidades: {
    bom_com: string[]   // ex: ["Vitamina E", "Antioxidantes"]
    cuidado_com: string[]
    incompativel_com: string[]
    sinergias_conhecidas: string[] // ex: "potencializa efeito de X"
  }

  /** Em qual fase adicionar (A=aquosa, B=oleosa, C=resfriamento, D=ajuste) */
  fase_recomendada: 'A' | 'B' | 'C' | 'D' | 'qualquer'

  /** Procedimento — como adicionar/manipular */
  procedimento: string

  /** Benefícios para o consumidor (claims marketing aceitáveis) */
  beneficios_consumidor: string[]

  /** Aplicações ideais (tipos de produto onde brilha) */
  aplicacoes_ideais: string[]

  /** Produtos onde NÃO recomendar */
  contraindicacoes: string[]

  /** Tom de pele / tipo de cabelo / etc — para qual público */
  publico_alvo: string[]

  /** Origem da matéria-prima */
  origem: 'sintetica' | 'natural' | 'semi_sintetica' | 'biotec' | 'mineral' | 'desconhecida'

  /** Sustentabilidade & ética */
  sustentabilidade: {
    biodegradavel: boolean | 'parcial' | 'desconhecido'
    vegano: boolean | 'desconhecido'
    cruelty_free: boolean | 'desconhecido'
    notas?: string
  }

  /** Fornecedores de referência globais (não exclusivos) */
  fornecedores_referencia: string[]

  /** Notas adicionais relevantes (curiosidades, históricos, alertas técnicos) */
  notas_adicionais: string

  /** Score de confiança da pesquisa (0-1) — quão certo Claude está */
  confianca: number

  /** Versão do agente que gerou */
  agente_versao: string
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const SYSTEM_PROMPT = `Você é um cosmetólogo sênior com 20 anos de experiência em formulação cosmética e profundo conhecimento de matérias-primas.

Sua tarefa é gerar uma ficha técnica completa de uma matéria-prima cosmética para uso em um sistema de P&D do Lab Gobeaute (Brasil).

REQUISITOS:
1. Seja preciso. Se não tem certeza sobre algum dado, deixe o campo vazio ou marque confiança baixa.
2. Use linguagem técnica de cosmetologia (formulador entende).
3. Considere REALIDADE BRASILEIRA: regulamentação ANVISA, condições climáticas (calor/umidade), preferências do consumidor brasileiro.
4. Para concentração típica, dê o range realista usado na indústria (ex: Glicerina 3-15%, Niacinamida 2-10%, Phenoxyethanol 0.5-1.0%).
5. Compatibilidades: cite POR CLASSE de ingrediente ou ingredientes específicos famosos por interação (ex: "Vitamina C de baixo pH" para AHAs).
6. Mecanismo de ação: explique cientificamente como o ingrediente atua na pele/cabelo.
7. Origem: 'sintetica' (síntese química), 'natural' (extração natural), 'semi_sintetica' (modificação química de natural), 'biotec' (fermentação/biotecnologia), 'mineral' (mineral inorgânico).
8. Use português brasileiro. Termos técnicos em inglês quando padrão (ex: "rinse-off", "leave-on", "INCI").

RESPONDA APENAS COM JSON VÁLIDO no formato exato pedido. Sem comentários, sem markdown.`

const SCHEMA_JSON = `{
  "funcao_primaria": "string",
  "funcoes_secundarias": ["string"],
  "efeito_sensorial": "string (2-3 linhas)",
  "mecanismo_acao": "string (2-4 linhas)",
  "concentracao_tipica": {"min": number, "max": number, "unidade": "%", "contexto": "string"},
  "solubilidade": {"agua": "soluvel|parcial|insoluvel", "oleo": "soluvel|parcial|insoluvel", "alcool": "soluvel|parcial|insoluvel|na", "notas": "string ou null"},
  "ph_ideal": {"min": number, "max": number, "sensibilidade": "alta|media|baixa", "notas": "string ou null"},
  "estabilidade": {"sensivel_calor": bool, "sensivel_luz": bool, "sensivel_oxigeno": bool, "sensivel_metais": bool, "temp_max_processo_c": number ou null, "notas": "string"},
  "compatibilidades": {"bom_com": ["string"], "cuidado_com": ["string"], "incompativel_com": ["string"], "sinergias_conhecidas": ["string"]},
  "fase_recomendada": "A|B|C|D|qualquer",
  "procedimento": "string (instrução técnica de manipulação)",
  "beneficios_consumidor": ["string (claim aceitável)"],
  "aplicacoes_ideais": ["string (tipo de produto)"],
  "contraindicacoes": ["string"],
  "publico_alvo": ["string"],
  "origem": "sintetica|natural|semi_sintetica|biotec|mineral|desconhecida",
  "sustentabilidade": {"biodegradavel": bool ou "parcial" ou "desconhecido", "vegano": bool ou "desconhecido", "cruelty_free": bool ou "desconhecido", "notas": "string ou null"},
  "fornecedores_referencia": ["string (nomes globais como BASF, Croda, etc)"],
  "notas_adicionais": "string",
  "confianca": number (0-1)
}`

export async function enriquecerMP(mp: {
  nome: string
  inci?: string | null
  cas?: string | null
  categoria?: string | null
}): Promise<IntelMP | null> {
  if (!anthropic) {
    console.warn('[mp-intel] ANTHROPIC_API_KEY não configurado')
    return null
  }

  const dadosMP = [
    `Nome comercial/técnico: ${mp.nome}`,
    mp.inci ? `INCI: ${mp.inci}` : null,
    mp.cas ? `CAS: ${mp.cas}` : null,
    mp.categoria ? `Categoria interna: ${mp.categoria}` : null,
  ].filter(Boolean).join('\n')

  const userMsg = `Gere a ficha técnica completa para esta matéria-prima cosmética:

${dadosMP}

Use o schema EXATO abaixo. Responda APENAS com o JSON, sem markdown:

${SCHEMA_JSON}`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    })

    const txt = res.content
      .filter(c => c.type === 'text')
      .map(c => (c as any).text)
      .join('')

    const match = txt.match(/\{[\s\S]*\}/)
    if (!match) {
      console.error('[mp-intel] Resposta sem JSON:', txt.slice(0, 200))
      return null
    }

    const parsed = JSON.parse(match[0]) as Omit<IntelMP, 'agente_versao'>
    return { ...parsed, agente_versao: 'v1-sonnet-4.6' }
  } catch (err) {
    console.error('[mp-intel] Erro ao enriquecer MP:', mp.nome, err)
    return null
  }
}

/**
 * Enriquece um lote de MPs em paralelo (com concorrência controlada)
 */
export async function enriquecerLoteMPs(
  mps: Array<{ id: string; nome: string; inci?: string | null; cas?: string | null; categoria?: string | null }>,
  concorrencia = 3
): Promise<Array<{ id: string; intel: IntelMP | null }>> {
  const resultados: Array<{ id: string; intel: IntelMP | null }> = []
  for (let i = 0; i < mps.length; i += concorrencia) {
    const lote = mps.slice(i, i + concorrencia)
    const r = await Promise.all(
      lote.map(async mp => ({
        id: mp.id,
        intel: await enriquecerMP(mp),
      }))
    )
    resultados.push(...r)
  }
  return resultados
}
