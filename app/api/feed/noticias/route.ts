import { NextResponse } from 'next/server'
import { getFeedCacheado, type NoticiaProcessada } from '@/lib/feed/agent'

export type NoticiaItem = {
  id: string
  titulo: string
  resumo: string
  fonte: string
  categoria: 'regulatorio' | 'ingredientes' | 'industria' | 'tendencia'
  emoji: string
  url: string | null
  data: string
  destaque: boolean
}

// Notícias curadas — fallback sempre presente caso o agente automático falhe
// ou enquanto não há ANTHROPIC_API_KEY configurada
const NOTICIAS_CURADAS: NoticiaItem[] = [
  {
    id: 'anvisa-rdc-752',
    titulo: 'ANVISA — RDC 752/2022 em vigor: novos requisitos para cosméticos Grau 2',
    resumo: 'Produtos com claims terapêuticos ou indicações específicas exigem registro completo com safety assessment. Verifique sua carteira de produtos.',
    fonte: 'ANVISA',
    categoria: 'regulatorio',
    emoji: '⚖️',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/cosmeticos',
    data: '2026-04-15',
    destaque: true,
  },
  {
    id: 'anvisa-in-39',
    titulo: 'IN 39/2016 — Lista de preservantes permitidos atualizada',
    resumo: 'Concentrações máximas: Phenoxyethanol (1.0%), Parabenos (0.4% isolado / 0.8% combinado), MIT (0.0015% só rinse-off). Revisar fórmulas.',
    fonte: 'ANVISA',
    categoria: 'regulatorio',
    emoji: '⚠️',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/cosmeticos/normas-e-instrucoes-tecnicas',
    data: '2026-03-20',
    destaque: true,
  },
  {
    id: 'tendencia-peptideos',
    titulo: 'Tendência 2026: Peptídeos biomiméticos lideram inovação anti-aging',
    resumo: 'Hexapeptide-11, Palmitoyl Tripeptide-38 e Acetyl Hexapeptide-3 dominam launches premium. Demanda por mimetismo da matrix extracelular.',
    fonte: 'Cosmetics & Toiletries',
    categoria: 'ingredientes',
    emoji: '🧬',
    url: null,
    data: '2026-04-28',
    destaque: false,
  },
  {
    id: 'tendencia-prebioticos',
    titulo: 'Microbioma: prebióticos e pós-bióticos substituem conservantes tradicionais',
    resumo: 'Marcas premium eliminam parabenos em favor de Lactobacillus ferment + Gluconolactone/Sodium Benzoate. ANVISA: enquadramento livre.',
    fonte: 'in-cosmetics Global',
    categoria: 'ingredientes',
    emoji: '🦠',
    url: null,
    data: '2026-04-22',
    destaque: false,
  },
  {
    id: 'eu-annex-ii',
    titulo: 'EU Cosmetics Regulation — 4 substâncias adicionadas ao Anexo II (proibidas)',
    resumo: 'Octocrylene e 3 substâncias CMR adicionadas. Revisão necessária para marcas com perspectiva de exportação para Europa.',
    fonte: 'European Commission',
    categoria: 'regulatorio',
    emoji: '🇪🇺',
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32009R1223',
    data: '2026-04-10',
    destaque: false,
  },
  {
    id: 'sustentabilidade-biossurfactantes',
    titulo: 'Biossurfactantes de cana ganham espaço em formulações brasileiras',
    resumo: 'Rhamnolipídeos e sophorolipídeos com desempenho equivalente ao SLS, origem 100% natural e biodegradabilidade superior.',
    fonte: 'Cosmetics Business',
    categoria: 'ingredientes',
    emoji: '♻️',
    url: null,
    data: '2026-04-05',
    destaque: false,
  },
  {
    id: 'anvisa-guia-claim',
    titulo: 'ANVISA publica guia técnico sobre comprovação de claims cosméticos',
    resumo: 'Define metodologias aceitas para "reduz rugas em X%", "hidratação em Y horas". Impacta produtos Grau 2 e safety assessment.',
    fonte: 'ANVISA',
    categoria: 'regulatorio',
    emoji: '📋',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/cosmeticos',
    data: '2026-03-30',
    destaque: false,
  },
  {
    id: 'tendencia-solares',
    titulo: 'Filtros solares 2026: Bemotrizinol em alta',
    resumo: 'Aprovado ANVISA. Alta proteção UVA-UVB, fotostável, compatível com aquosas e anidras. Máximo 10% no Brasil.',
    fonte: 'Cosmetics & Toiletries',
    categoria: 'ingredientes',
    emoji: '☀️',
    url: null,
    data: '2026-03-15',
    destaque: false,
  },
]

export async function GET(req: Request) {
  const url = new URL(req.url)
  const modo = url.searchParams.get('modo') ?? 'auto' // 'auto' | 'curado' | 'forcar'

  // Modo "curado": só retorna as fixas
  if (modo === 'curado') {
    return NextResponse.json(
      { noticias: NOTICIAS_CURADAS, fonte: 'curado', atualizado_em: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } }
    )
  }

  // Modo "auto": tenta agente automático e mistura com curadas
  try {
    const { noticias: noticiasAuto, cached, updatedAt } = await getFeedCacheado()

    // Combinar: curadas em destaque (sempre presentes) + automáticas top 12 não-duplicadas
    const noticiasCombinadas: NoticiaItem[] = [...NOTICIAS_CURADAS]
    const titulosCurados = new Set(NOTICIAS_CURADAS.map(n => n.titulo.toLowerCase().slice(0, 30)))

    for (const auto of noticiasAuto) {
      const key = auto.titulo.toLowerCase().slice(0, 30)
      if (titulosCurados.has(key)) continue
      noticiasCombinadas.push({
        id: auto.id,
        titulo: auto.titulo,
        resumo: auto.resumo,
        fonte: auto.fonte,
        categoria: auto.categoria,
        emoji: auto.emoji,
        url: auto.url,
        data: auto.data,
        destaque: auto.destaque,
      })
      if (noticiasCombinadas.length >= 20) break
    }

    return NextResponse.json(
      {
        noticias: noticiasCombinadas,
        fonte: noticiasAuto.length > 0 ? 'auto+curado' : 'curado',
        cached,
        atualizado_em: updatedAt,
        agente_ativo: !!process.env.ANTHROPIC_API_KEY,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch (err) {
    console.error('[feed-noticias] Erro:', err)
    return NextResponse.json(
      { noticias: NOTICIAS_CURADAS, fonte: 'curado-fallback', atualizado_em: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=600' } }
    )
  }
}
