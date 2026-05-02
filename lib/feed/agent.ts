/**
 * Agente Filtrador de Notícias do Lab Gobeaute
 *
 * Pipeline:
 * 1. Busca RSS das fontes configuradas (parser XML simples sem dependência externa)
 * 2. Claude (Haiku — rápido e barato) classifica cada item:
 *    - relevância para P&D cosmético (0-10)
 *    - categoria
 *    - resumo executivo em PT-BR (2 linhas)
 *    - se é destaque (alerta regulatório, mudança importante)
 * 3. Retorna apenas itens com relevância ≥ 6
 */

import Anthropic from '@anthropic-ai/sdk'
import { FONTES_RSS } from './sources'

export type NoticiaProcessada = {
  id: string
  titulo: string
  resumo: string
  fonte: string
  categoria: 'regulatorio' | 'ingredientes' | 'industria' | 'tendencia'
  emoji: string
  url: string | null
  data: string
  destaque: boolean
  relevancia: number
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// ─── Parser RSS simples ─────────────────────────────────────────────────────

type ItemRSS = {
  titulo: string
  link: string
  descricao: string
  data: string
}

function parseRSS(xml: string): ItemRSS[] {
  const items: ItemRSS[] = []
  // Match <item>...</item> ou <entry>...</entry> (Atom)
  const itemRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null && items.length < 50) {
    const block = match[2]
    const titulo = extractTag(block, 'title')
    const link = extractTag(block, 'link') || extractAttr(block, 'link', 'href')
    const descricao = extractTag(block, 'description') || extractTag(block, 'summary') || ''
    const data = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || ''
    if (titulo) {
      items.push({
        titulo: cleanText(titulo),
        link: cleanText(link),
        descricao: cleanText(descricao).slice(0, 500),
        data: data,
      })
    }
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}\\b[^>]*${attr}=["']([^"']+)["']`, 'i')
  const m = xml.match(re)
  return m ? m[1] : ''
}

function cleanText(t: string): string {
  return t
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Buscar RSS ─────────────────────────────────────────────────────────────

async function fetchFonte(fonte: typeof FONTES_RSS[number]): Promise<ItemRSS[]> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(fonte.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LabGobeauteFeedBot/1.0; +https://lab.gobeaute.com.br)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
      },
      next: { revalidate: 3600 },
    })
    clearTimeout(t)
    if (!res.ok) return []
    const xml = await res.text()
    const items = parseRSS(xml)
    // Pegar 8 mais recentes por fonte
    return items.slice(0, 8)
  } catch {
    return []
  }
}

// ─── Classificação por Claude (Haiku) ───────────────────────────────────────

type ItemClassificado = {
  relevancia: number // 0-10
  categoria: 'regulatorio' | 'ingredientes' | 'industria' | 'tendencia'
  resumo_pt: string
  emoji: string
  destaque: boolean
}

async function classificarLote(itens: { fonte: string; item: ItemRSS }[]): Promise<(ItemClassificado | null)[]> {
  if (!anthropic) {
    // Fallback sem IA: heurística simples
    return itens.map(({ item }) => heuristicaSimples(item))
  }

  const lista = itens.map((p, i) => ({
    n: i + 1,
    fonte: p.fonte,
    titulo: p.item.titulo,
    descricao: p.item.descricao.slice(0, 300),
  }))

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: `Você é um curador de conteúdo do Lab Gobeaute, laboratório de P&D de cosméticos brasileiro.
Sua tarefa é classificar notícias quanto à relevância para um time de P&D cosmético no Brasil.

CRITÉRIOS DE RELEVÂNCIA (0-10):
- 9-10: ANVISA publica nova RDC/IN sobre cosméticos, mudança em lista de ingredientes proibidos/restritos no Brasil
- 7-8: Tendências de ingredientes (peptídeos, biomateriais, ativos), mudanças regulatórias EU/FDA que afetam exportação
- 5-6: Lançamentos de matérias-primas, eventos da indústria, releases de empresas grandes (BASF, Givaudan, Croda)
- 3-4: Notícias gerais da indústria cosmética sem ação técnica direta
- 0-2: Beleza/marketing/varejo/celebridades — IGNORAR (relevância 0)

CATEGORIAS:
- "regulatorio": ANVISA, FDA, EU, leis, normas, registros
- "ingredientes": novas MPs, ativos, naturais, biotech, INCI
- "industria": indústria, fabricantes, M&A, eventos, supply chain
- "tendencia": clean beauty, sustentabilidade, microbioma, etc.

DESTAQUE = true APENAS se for alerta regulatório que demande ação imediata (ex: ingrediente proibido em uso).

EMOJI: escolha 1 emoji apropriado (⚖️ regulatório, 🧬 ativo, 🌿 natural, 🦠 microbioma, ☀️ filtro UV, ⚠️ alerta, 🔬 pesquisa, etc.)

RESPONDA APENAS com JSON válido no formato:
[{"n":1,"relevancia":0-10,"categoria":"regulatorio|ingredientes|industria|tendencia","resumo_pt":"resumo 2 linhas","emoji":"X","destaque":true|false}, ...]

NUNCA traduza títulos, apenas o resumo. Resumo em PT-BR deve ser executivo, focado em "o que isso significa para o lab".`,
      messages: [
        { role: 'user', content: `Classifique estas notícias:\n\n${JSON.stringify(lista, null, 2)}` },
      ],
    })

    const txt = res.content
      .filter(c => c.type === 'text')
      .map(c => (c as any).text)
      .join('')

    // Extrair JSON
    const match = txt.match(/\[[\s\S]*\]/)
    if (!match) return itens.map(({ item }) => heuristicaSimples(item))

    const parsed = JSON.parse(match[0]) as Array<{
      n: number
      relevancia: number
      categoria: 'regulatorio' | 'ingredientes' | 'industria' | 'tendencia'
      resumo_pt: string
      emoji: string
      destaque: boolean
    }>

    // Mapear de volta na ordem
    return itens.map((_, i) => {
      const found = parsed.find(p => p.n === i + 1)
      return found ?? heuristicaSimples(itens[i].item)
    })
  } catch (err) {
    console.error('[feed-agent] Erro ao classificar lote:', err)
    return itens.map(({ item }) => heuristicaSimples(item))
  }
}

function heuristicaSimples(item: ItemRSS): ItemClassificado {
  const t = (item.titulo + ' ' + item.descricao).toLowerCase()
  let relevancia = 5
  let categoria: ItemClassificado['categoria'] = 'industria'
  let emoji = '📰'
  let destaque = false

  if (t.match(/anvisa|rdc|in \d|registro|notifica|cosmovigil/)) {
    relevancia = 9
    categoria = 'regulatorio'
    emoji = '⚖️'
    destaque = true
  } else if (t.match(/proibid|banid|restritiv|alert/)) {
    relevancia = 8
    categoria = 'regulatorio'
    emoji = '⚠️'
    destaque = true
  } else if (t.match(/ingredient|active|peptide|peptíd|botanical|natural|sustainab|biotech|microbiome/)) {
    relevancia = 7
    categoria = 'ingredientes'
    emoji = '🌿'
  } else if (t.match(/sunscreen|spf|uv filter|filtro solar/)) {
    relevancia = 7
    categoria = 'ingredientes'
    emoji = '☀️'
  } else if (t.match(/trend|tendência|inovaç|innovation|launch|launching/)) {
    relevancia = 6
    categoria = 'tendencia'
    emoji = '✨'
  }

  return {
    relevancia,
    categoria,
    resumo_pt: item.descricao.slice(0, 200) || item.titulo,
    emoji,
    destaque,
  }
}

// ─── Pipeline Principal ─────────────────────────────────────────────────────

export async function gerarFeedAutomatico(): Promise<NoticiaProcessada[]> {
  // 1. Buscar todas as fontes em paralelo
  const fontesComItens = await Promise.all(
    FONTES_RSS.map(async fonte => ({
      fonte,
      itens: await fetchFonte(fonte),
    }))
  )

  // 2. Achatar e preparar para classificação
  const todosItens: { fonte: string; item: ItemRSS }[] = []
  for (const { fonte, itens } of fontesComItens) {
    for (const item of itens) {
      todosItens.push({ fonte: fonte.nome, item })
    }
  }

  if (todosItens.length === 0) return []

  // 3. Classificar em lotes de 15 (limite token Claude Haiku)
  const lotes: typeof todosItens[] = []
  for (let i = 0; i < todosItens.length; i += 15) {
    lotes.push(todosItens.slice(i, i + 15))
  }

  const classificacoes = (await Promise.all(lotes.map(lote => classificarLote(lote)))).flat()

  // 4. Combinar e filtrar por relevância
  const noticias: NoticiaProcessada[] = todosItens.map((p, i) => {
    const c = classificacoes[i] ?? heuristicaSimples(p.item)
    const dataIso = new Date(p.item.data).toISOString().split('T')[0]
    return {
      id: `auto-${Buffer.from(p.item.link || p.item.titulo).toString('base64').slice(0, 16)}`,
      titulo: p.item.titulo,
      resumo: c.resumo_pt,
      fonte: p.fonte,
      categoria: c.categoria,
      emoji: c.emoji,
      url: p.item.link || null,
      data: dataIso || new Date().toISOString().split('T')[0],
      destaque: c.destaque,
      relevancia: c.relevancia,
    }
  })

  // 5. Ordenar por relevância e data (decrescente)
  return noticias
    .filter(n => n.relevancia >= 6)
    .sort((a, b) => {
      if (b.destaque !== a.destaque) return b.destaque ? 1 : -1
      if (b.relevancia !== a.relevancia) return b.relevancia - a.relevancia
      return b.data.localeCompare(a.data)
    })
    .slice(0, 20) // top 20
}

// ─── Cache em memória ───────────────────────────────────────────────────────

let cache: { noticias: NoticiaProcessada[]; updatedAt: number } | null = null
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 horas

export async function getFeedCacheado(): Promise<{ noticias: NoticiaProcessada[]; cached: boolean; updatedAt: string }> {
  const agora = Date.now()
  if (cache && (agora - cache.updatedAt) < CACHE_TTL) {
    return {
      noticias: cache.noticias,
      cached: true,
      updatedAt: new Date(cache.updatedAt).toISOString(),
    }
  }
  const noticias = await gerarFeedAutomatico()
  cache = { noticias, updatedAt: agora }
  return {
    noticias,
    cached: false,
    updatedAt: new Date(agora).toISOString(),
  }
}

export function invalidarCache() {
  cache = null
}
