import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role para leitura do banco nas tools
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Definições das ferramentas para o Claude
export const TOOL_DEFINITIONS: Anthropic.Messages.Tool[] = [
  {
    name: 'search_anvisa',
    description: 'Busca publicações, resoluções (RDC, IN, CP), consultas públicas e informações oficiais da ANVISA sobre cosméticos, suplementos e ingredientes. Use para responder dúvidas sobre normas vigentes, restrições recentes ou atualizar-se sobre novas regulamentações.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca. Ex: "RDC conservantes cosméticos 2024", "restrição retinol ANVISA", "notificação suplementos alimentares"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_market_news',
    description: 'Busca notícias e tendências de mercado de cosméticos e suplementos: novos ativos, tecnologias emergentes, tendências globais, inovações de ingredientes, movimento clean beauty, regulações internacionais (UE, FDA, CTFA).',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca. Ex: "trending skincare ingredients 2025", "prebiotics cosmetics trend", "retinol alternative regulation Europe"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_formula',
    description: 'Busca uma fórmula do Lab Gobeaute pelo código (ex: F-KOK-001) ou ID, retornando todos os ingredientes com INCI, percentuais e funções. Use antes de analisar conformidade ou gerar INCI list.',
    input_schema: {
      type: 'object',
      properties: {
        formula_ref: {
          type: 'string',
          description: 'Código da fórmula (ex: F-KOK-001, F-APR-003) ou UUID. Use o código quando disponível.',
        },
      },
      required: ['formula_ref'],
    },
  },
  {
    name: 'check_ingredient_anvisa',
    description: 'Verifica o status regulatório de um ingrediente específico no banco do Lab Gobeaute: status ANVISA (Livre/Restrito/Proibido), INCI, CAS, homologação interna. Útil para checar rapidamente um ingrediente antes de incluir numa fórmula.',
    input_schema: {
      type: 'object',
      properties: {
        inci_or_name: {
          type: 'string',
          description: 'Nome INCI ou nome comercial do ingrediente. Ex: "Phenoxyethanol", "Glicerina", "Sodium Hyaluronate", "Butylparaben"',
        },
      },
      required: ['inci_or_name'],
    },
  },
  {
    name: 'generate_inci_list',
    description: 'Gera a INCI list completa e ordenada de uma fórmula para uso em rótulo conforme RDC 752/2022: ingredientes em ordem decrescente de concentração (>1%), seguidos dos <1% em qualquer ordem, com corantes ao final. Retorna texto pronto para o rótulo.',
    input_schema: {
      type: 'object',
      properties: {
        formula_ref: {
          type: 'string',
          description: 'Código da fórmula (ex: F-KOK-001) ou UUID.',
        },
      },
      required: ['formula_ref'],
    },
  },
  {
    name: 'get_mps_by_status',
    description: 'Lista matérias-primas do portfólio do Lab Gobeaute filtradas por status ANVISA ou de homologação. Útil para levantamentos de risco, revisões de portfólio e identificar MPs pendentes.',
    input_schema: {
      type: 'object',
      properties: {
        anvisa_status: {
          type: 'string',
          enum: ['Livre', 'Restrito', 'Proibido'],
          description: 'Filtrar por status ANVISA da MP.',
        },
        homolog_status: {
          type: 'string',
          enum: ['Homologada', 'Em Processo', 'Pendente', 'Reprovada'],
          description: 'Filtrar por status de homologação interna.',
        },
        marca: {
          type: 'string',
          description: 'Filtrar por marca (opcional). Ex: "Kokeshi", "Rituária", "Ápice"',
        },
      },
      required: [],
    },
  },
]

// Executores das ferramentas
export async function executeTool(
  toolName: string,
  toolInput: Record<string, string>
): Promise<string> {
  switch (toolName) {
    case 'search_anvisa':
      return await searchAnvisa(toolInput.query)
    case 'search_market_news':
      return await searchMarketNews(toolInput.query)
    case 'get_formula':
      return await getFormula(toolInput.formula_ref)
    case 'check_ingredient_anvisa':
      return await checkIngredient(toolInput.inci_or_name)
    case 'generate_inci_list':
      return await generateInciList(toolInput.formula_ref)
    case 'get_mps_by_status':
      return await getMpsByStatus(toolInput)
    default:
      return `Ferramenta desconhecida: ${toolName}`
  }
}

async function searchAnvisa(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return 'TAVILY_API_KEY não configurada. Configure a variável de ambiente para busca web.'

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `ANVISA cosméticos regulamentação ${query}`,
        search_depth: 'advanced',
        include_domains: ['anvisa.gov.br', 'in.gov.br', 'cosmeticosbrasil.com.br', 'abihpec.org.br'],
        max_results: 5,
        include_answer: true,
      }),
    })

    if (!response.ok) return `Erro na busca ANVISA: ${response.statusText}`

    const data = await response.json()
    const results = data.results || []

    if (results.length === 0) return 'Nenhum resultado encontrado para essa busca ANVISA.'

    const formatted = results.map((r: { title: string; url: string; content: string }) =>
      `**${r.title}**\n${r.url}\n${r.content?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n')

    return `Resultados da busca ANVISA para "${query}":\n\n${formatted}`
  } catch (err) {
    return `Erro ao buscar ANVISA: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function searchMarketNews(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY
  if (!tavilyKey) return 'TAVILY_API_KEY não configurada.'

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `cosmetics beauty market trends ${query}`,
        search_depth: 'basic',
        include_domains: ['cosmeticsdesign.com', 'in-cosmetics.com', 'mintel.com', 'beautyindependent.com', 'happi.com', 'chemistscorner.com'],
        max_results: 5,
        include_answer: true,
      }),
    })

    if (!response.ok) return `Erro na busca de mercado: ${response.statusText}`

    const data = await response.json()
    const results = data.results || []

    if (results.length === 0) return 'Nenhum resultado de mercado encontrado.'

    const formatted = results.map((r: { title: string; url: string; content: string }) =>
      `**${r.title}**\n${r.url}\n${r.content?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n')

    return `Tendências de mercado para "${query}":\n\n${formatted}`
  } catch (err) {
    return `Erro ao buscar notícias: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function getFormula(formulaRef: string): Promise<string> {
  const supabase = getSupabaseAdmin()

  // Busca por código ou UUID
  const isUUID = /^[0-9a-f-]{36}$/i.test(formulaRef)
  const query = supabase
    .from('formulas')
    .select('*, formula_ingredientes(*)')

  const { data: formulas, error } = isUUID
    ? await query.eq('id', formulaRef).limit(1)
    : await query.ilike('codigo', formulaRef).limit(1)

  if (error) return `Erro ao buscar fórmula: ${error.message}`
  if (!formulas || formulas.length === 0) return `Fórmula "${formulaRef}" não encontrada no banco.`

  const formula = formulas[0]
  const ingredientes = formula.formula_ingredientes || []

  const ingredientesStr = ingredientes.length > 0
    ? ingredientes.map((ing: { mp_nome: string; inci: string; percentual: string; funcao: string }) =>
        `  - ${ing.mp_nome} | INCI: ${ing.inci || 'N/A'} | ${ing.percentual || '?'}% | ${ing.funcao || ''}`
      ).join('\n')
    : '  (sem ingredientes cadastrados)'

  return `**Fórmula: ${formula.codigo} — ${formula.produto}**
Marca: ${formula.marca}
Tipo: ${formula.tipo}
Status: ${formula.status}
Responsável: ${formula.responsavel || 'N/A'}
Fase: ${formula.fase || 'N/A'}

**Ingredientes (${ingredientes.length}):**
${ingredientesStr}`
}

async function checkIngredient(inciOrName: string): Promise<string> {
  const supabase = getSupabaseAdmin()

  const { data: mps, error } = await supabase
    .from('mps')
    .select('codigo, nome, inci, cas, anvisa, homolog, categoria, vegano, cf, origem_natural, parabenos')
    .or(`inci.ilike.%${inciOrName}%,nome.ilike.%${inciOrName}%`)
    .limit(5)

  if (error) return `Erro ao buscar ingrediente: ${error.message}`
  if (!mps || mps.length === 0) {
    return `Ingrediente "${inciOrName}" não encontrado no banco do Lab. Verifique o nome INCI ou consulte diretamente a lista ANVISA.`
  }

  return mps.map(mp => `**${mp.nome}** (${mp.codigo})
INCI: ${mp.inci || 'N/A'}
CAS: ${mp.cas || 'N/A'}
Status ANVISA: **${mp.anvisa || 'Não classificado'}**
Homologação: ${mp.homolog || 'N/A'}
Categoria: ${mp.categoria || 'N/A'}
Atributos: ${[mp.vegano && 'Vegano', mp.cf && 'Cruelty-free', mp.origem_natural && 'Natural', mp.parabenos && '⚠️ Parabeno'].filter(Boolean).join(', ') || '—'}`
  ).join('\n\n---\n\n')
}

async function generateInciList(formulaRef: string): Promise<string> {
  const supabase = getSupabaseAdmin()

  const isUUID = /^[0-9a-f-]{36}$/i.test(formulaRef)
  const query = supabase
    .from('formulas')
    .select('codigo, produto, marca, tipo, formula_ingredientes(mp_nome, inci, percentual)')

  const { data: formulas, error } = isUUID
    ? await query.eq('id', formulaRef).limit(1)
    : await query.ilike('codigo', formulaRef).limit(1)

  if (error) return `Erro: ${error.message}`
  if (!formulas || formulas.length === 0) return `Fórmula "${formulaRef}" não encontrada.`

  const formula = formulas[0]
  const ingredientes = (formula.formula_ingredientes || []) as Array<{
    mp_nome: string
    inci: string
    percentual: string
  }>

  if (ingredientes.length === 0) return 'Fórmula sem ingredientes cadastrados. Cadastre os ingredientes primeiro.'

  // Separar >1% dos <=1%
  const parsePercent = (p: string) => {
    const n = parseFloat((p || '0').replace(',', '.'))
    return isNaN(n) ? 0 : n
  }

  const acima1 = ingredientes
    .filter(i => parsePercent(i.percentual) > 1)
    .sort((a, b) => parsePercent(b.percentual) - parsePercent(a.percentual))

  const abaixo1 = ingredientes
    .filter(i => parsePercent(i.percentual) <= 1)

  const semPercentual = ingredientes.filter(i => !i.percentual || i.percentual === '')

  const allOrdered = [...acima1, ...abaixo1, ...semPercentual]

  const inciList = allOrdered
    .map(i => i.inci || i.mp_nome)
    .filter(Boolean)
    .join(', ')

  const alertas: string[] = []
  if (semPercentual.length > 0) {
    alertas.push(`⚠️ ${semPercentual.length} ingrediente(s) sem percentual cadastrado — posição na lista pode estar incorreta.`)
  }

  const totalPercent = [...acima1, ...abaixo1].reduce((sum, i) => sum + parsePercent(i.percentual), 0)
  if (totalPercent < 95 || totalPercent > 105) {
    alertas.push(`⚠️ Soma dos percentuais: ${totalPercent.toFixed(1)}% — verifique se a fórmula está completa (deve fechar em ~100%).`)
  }

  return `**INCI List — ${formula.codigo}: ${formula.produto} (${formula.marca})**
*Conforme RDC 752/2022 — ordem decrescente de concentração*

${inciList}

---
Total de ingredientes: ${allOrdered.length}
Ingredientes >1%: ${acima1.length} | Ingredientes ≤1%: ${abaixo1.length}
${alertas.length > 0 ? '\n' + alertas.join('\n') : ''}`
}

async function getMpsByStatus(input: { anvisa_status?: string; homolog_status?: string; marca?: string }): Promise<string> {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('mps')
    .select('codigo, nome, inci, anvisa, homolog, categoria, marcas')
    .limit(50)

  if (input.anvisa_status) query = query.eq('anvisa', input.anvisa_status)
  if (input.homolog_status) query = query.eq('homolog', input.homolog_status)
  if (input.marca) query = query.contains('marcas', [input.marca])

  const { data: mps, error } = await query

  if (error) return `Erro: ${error.message}`
  if (!mps || mps.length === 0) return 'Nenhuma MP encontrada com os filtros aplicados.'

  const header = `**MPs filtradas** (${mps.length} resultados):`
  const rows = mps.map(mp =>
    `${mp.codigo} | ${mp.nome} | ANVISA: ${mp.anvisa || '—'} | Homolog: ${mp.homolog || '—'} | ${(mp.marcas || []).join(', ') || 'nenhuma marca'}`
  ).join('\n')

  return `${header}\n\n${rows}`
}
