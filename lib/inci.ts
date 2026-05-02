/**
 * Gerador de Lista INCI (International Nomenclature of Cosmetic Ingredients)
 *
 * Regras (EU 1223/2009 + RDC 7/2015 / RDC 752/2022):
 * 1. Ingredientes em ordem decrescente de concentração
 * 2. Ingredientes com concentração ≤ 1% podem ser listados em qualquer ordem após os >1%
 * 3. Corantes vão no final, prefixados com "CI" + 5 dígitos (ex: CI 77891)
 * 4. Fragrâncias e aromas: "Parfum" / "Fragrance" / "Aroma"
 * 5. Alérgenos da fragrância >0.001% leave-on ou >0.01% rinse-off devem ser declarados
 * 6. Nomes devem usar nomenclatura INCI oficial (não nome comercial)
 */

import { buscarRestricao } from './anvisa'

export type IngredienteINCI = {
  mp_nome?: string | null
  inci?: string | null
  percentual?: string | number | null
  funcao?: string | null
  ordem?: number | null
}

const ALERGENOS_FRAGRANCIA = new Set([
  'limonene','linalool','citronellol','geraniol','eugenol','coumarin',
  'cinnamal','benzyl alcohol','benzyl salicylate','benzyl benzoate',
  'hexyl cinnamal','isoeugenol',
])

function parsePerc(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[%\s]/g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

/**
 * Identifica o melhor nome INCI para um ingrediente
 * Prioridade: campo `inci` > nome técnico se for INCI conhecido > mp_nome
 */
function nomeINCI(ing: IngredienteINCI): string {
  if (ing.inci && ing.inci.trim()) return ing.inci.trim()

  // Tentar buscar no banco ANVISA (que usa INCI)
  if (ing.mp_nome) {
    const r = buscarRestricao(ing.mp_nome)
    if (r) return r.inci
  }

  // Mapeamentos comuns português → INCI
  const mp = (ing.mp_nome ?? '').toLowerCase().trim()
  const map: Record<string, string> = {
    'agua desmineralizada': 'Aqua',
    'agua': 'Aqua',
    'água': 'Aqua',
    'glicerina vegetal': 'Glycerin',
    'glicerina vegetal usp': 'Glycerin',
    'glicerina vegetal bidestilada': 'Glycerin',
    'glicerina': 'Glycerin',
    'fenoxietanol': 'Phenoxyethanol',
    'álcool cetílico': 'Cetyl Alcohol',
    'alcool cetilico': 'Cetyl Alcohol',
    'edta dissódico': 'Disodium EDTA',
    'edta dissodico': 'Disodium EDTA',
    'óleo de coco': 'Cocos Nucifera Oil',
    'oleo de coco': 'Cocos Nucifera Oil',
    'goma xantana': 'Xanthan Gum',
    'pantenol': 'Panthenol',
    'pantenol usp': 'Panthenol',
    'd panthenol': 'Panthenol',
    'd-panthenol': 'Panthenol',
    'ácido lático 85%': 'Lactic Acid',
    'acido latico 85%': 'Lactic Acid',
    'ácido cítrico anidro': 'Citric Acid',
    'acido citrico anidro': 'Citric Acid',
    'niacinamida 99%': 'Niacinamide',
    'niacinamida': 'Niacinamide',
    'ácido hialurônico': 'Sodium Hyaluronate',
    'acido hialuronico': 'Sodium Hyaluronate',
    'magnésio bisglicinato': 'Magnesium Bisglycinate',
    'magnesio bisglicinato': 'Magnesium Bisglycinate',
    'inulina': 'Inulin',
    'óleo de coco refinado': 'Cocos Nucifera Oil',
    'oleo de coco refinado': 'Cocos Nucifera Oil',
    'proteína de arroz': 'Hydrolyzed Rice Protein',
    'proteina de arroz': 'Hydrolyzed Rice Protein',
    'bht': 'BHT',
    'butileno glicol': 'Butylene Glycol',
    'propileno glicol usp': 'Propylene Glycol',
    'propilenoglicol': 'Propylene Glycol',
    'hidroxido de sodio': 'Sodium Hydroxide',
    'hidróxido de sódio': 'Sodium Hydroxide',
    'trietanolamina 99': 'Triethanolamine',
    'carbopol 990/980': 'Carbomer',
    'carbomer': 'Carbomer',
    'polissorbato 20': 'Polysorbate 20',
    'tween 20': 'Polysorbate 20',
    'acetato de tocoferol': 'Tocopheryl Acetate',
  }

  if (map[mp]) return map[mp]

  // Fallback: usar mp_nome em title case
  return ing.mp_nome ?? '—'
}

/**
 * Detecta se é corante (CI XXXXX)
 */
function ehCorante(nome: string): boolean {
  return /^ci\s*\d{4,5}/i.test(nome) || nome.toLowerCase().includes('amarelo') || nome.toLowerCase().includes('corante')
}

/**
 * Detecta se é fragrância/aroma
 */
function ehFragrancia(ing: IngredienteINCI): boolean {
  const nome = (ing.mp_nome ?? '').toLowerCase()
  return nome.includes('essencia') || nome.includes('essência') ||
         nome.includes('fragrance') || nome.includes('parfum') ||
         nome.includes('óleo essencial') || nome.includes('oleo essencial') ||
         (ing.funcao?.toLowerCase().includes('fragran') ?? false)
}

export type INCIResult = {
  /** Lista INCI formatada (string única separada por vírgulas, padrão rótulo) */
  texto: string
  /** Lista estruturada com cada item */
  itens: { inci: string; percentual: number | null; corante: boolean; fragrancia: boolean }[]
  /** Avisos sobre a geração */
  avisos: string[]
  /** Alérgenos detectados que devem ser declarados */
  alergenos_declaraveis: string[]
}

/**
 * Gera lista INCI a partir de ingredientes da fórmula
 */
export function gerarINCI(
  ingredientes: IngredienteINCI[],
  tipoProduto: 'leave-on' | 'rinse-off' = 'leave-on'
): INCIResult {
  const avisos: string[] = []
  const alergenos: string[] = []

  // Mapear cada ingrediente
  const itens = ingredientes.map(ing => {
    const inci = nomeINCI(ing)
    const percentual = parsePerc(ing.percentual)
    const corante = ehCorante(inci) || ehCorante(ing.mp_nome ?? '')
    const fragrancia = ehFragrancia(ing)

    if (percentual === null && !fragrancia && inci !== 'Aqua') {
      avisos.push(`${inci}: percentual não informado — ordem pode estar incorreta`)
    }

    // Detectar alérgeno declarável
    if (ALERGENOS_FRAGRANCIA.has(inci.toLowerCase()) && percentual !== null) {
      const limite = tipoProduto === 'leave-on' ? 0.001 : 0.01
      if (percentual > limite) {
        alergenos.push(inci)
      }
    }

    return { inci, percentual, corante, fragrancia }
  })

  // Separar em grupos
  const principais = itens.filter(i => !i.corante && !i.fragrancia)
  const fragranciasItems = itens.filter(i => i.fragrancia)
  const corantes = itens.filter(i => i.corante)

  // Ordenar principais por % decrescente (com ≤1% em qualquer ordem)
  const acima1 = principais.filter(i => (i.percentual ?? 0) > 1).sort((a, b) => (b.percentual ?? 0) - (a.percentual ?? 0))
  const abaixo1 = principais.filter(i => (i.percentual ?? 0) <= 1).sort((a, b) => a.inci.localeCompare(b.inci))

  // Construir lista final
  const ordenados = [
    ...acima1,
    ...abaixo1,
    // Fragrâncias colapsam em "Parfum" se houver mais de uma essência
    ...(fragranciasItems.length > 0
      ? [{ inci: 'Parfum', percentual: null, corante: false, fragrancia: true }]
      : []),
    ...corantes,
  ]

  // Remover duplicatas mantendo a ordem
  const seen = new Set<string>()
  const unique = ordenados.filter(i => {
    const k = i.inci.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  // Adicionar alérgenos declaráveis após "Parfum" se for o caso
  if (alergenos.length > 0 && fragranciasItems.length > 0) {
    const idx = unique.findIndex(u => u.inci === 'Parfum')
    if (idx >= 0) {
      const alergenosUnicos = [...new Set(alergenos)]
      const insercoes = alergenosUnicos.map(a => ({
        inci: a, percentual: null, corante: false, fragrancia: true,
      }))
      unique.splice(idx + 1, 0, ...insercoes)
    }
  }

  const texto = unique.map(i => i.inci).join(', ')

  return {
    texto,
    itens: unique,
    avisos,
    alergenos_declaraveis: [...new Set(alergenos)],
  }
}
