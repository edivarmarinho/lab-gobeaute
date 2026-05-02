/**
 * Fontes confiáveis para o feed do Lab Gobeaute
 *
 * Critério de seleção: publicações oficiais, mídia especializada estabelecida,
 * e órgãos reguladores. Sem blogs, fóruns ou conteúdo gerado por usuário.
 */

export type FonteRSS = {
  nome: string
  url: string
  homepage: string
  categoria: 'regulatorio' | 'industria' | 'ingredientes' | 'tendencia'
  pais: 'BR' | 'EU' | 'US' | 'GLOBAL'
  prioridade: 1 | 2 | 3 // 1 = alta (sempre incluir), 3 = baixa (só se relevante)
}

export const FONTES_RSS: FonteRSS[] = [
  // ── BRASIL · Regulatório ────────────────────────────────────────────────
  {
    nome: 'ANVISA — Notícias',
    url: 'https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/RSS',
    homepage: 'https://www.gov.br/anvisa/pt-br',
    categoria: 'regulatorio',
    pais: 'BR',
    prioridade: 1,
  },
  {
    nome: 'ABIHPEC — Associação Brasileira',
    url: 'https://abihpec.org.br/feed/',
    homepage: 'https://abihpec.org.br',
    categoria: 'industria',
    pais: 'BR',
    prioridade: 1,
  },

  // ── GLOBAL · Indústria de Cosméticos ──────────────────────────────────────
  {
    nome: 'Cosmetics Design',
    url: 'https://www.cosmeticsdesign.com/Info/RSS',
    homepage: 'https://www.cosmeticsdesign.com',
    categoria: 'industria',
    pais: 'GLOBAL',
    prioridade: 1,
  },
  {
    nome: 'Cosmetics Business',
    url: 'https://cosmeticsbusiness.com/news/feed',
    homepage: 'https://cosmeticsbusiness.com',
    categoria: 'industria',
    pais: 'GLOBAL',
    prioridade: 2,
  },
  {
    nome: 'Cosmetics & Toiletries',
    url: 'https://www.cosmeticsandtoiletries.com/rss.xml',
    homepage: 'https://www.cosmeticsandtoiletries.com',
    categoria: 'ingredientes',
    pais: 'GLOBAL',
    prioridade: 1,
  },
  {
    nome: 'Premium Beauty News',
    url: 'https://www.premiumbeautynews.com/spip.php?page=backend',
    homepage: 'https://www.premiumbeautynews.com',
    categoria: 'tendencia',
    pais: 'GLOBAL',
    prioridade: 2,
  },

  // ── EUROPA · Regulatório ──────────────────────────────────────────────────
  {
    nome: 'Cosmetics Europe',
    url: 'https://www.cosmeticseurope.eu/rss',
    homepage: 'https://www.cosmeticseurope.eu',
    categoria: 'regulatorio',
    pais: 'EU',
    prioridade: 2,
  },

  // ── EUA · Regulatório ─────────────────────────────────────────────────────
  {
    nome: 'FDA — Cosmetics News',
    url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/cosmetics/rss.xml',
    homepage: 'https://www.fda.gov/cosmetics',
    categoria: 'regulatorio',
    pais: 'US',
    prioridade: 3,
  },
]
