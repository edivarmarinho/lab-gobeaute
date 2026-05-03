// Resolução canônica de SKU. Toda comparação de produto/fórmula DEVE passar daqui.
// Regra: SKU não é único globalmente — chave é sempre (marca, sku). E o sku canônico é o
// sku_novo do de-para quando existe; senão, o próprio sku.

export type Depara = { marca: string; sku_antigo: string; sku_novo: string }

export type ProdutoCanonico = {
  marca: string
  sku: string
  aliases: string[] | null
}

export type FormulaLike = {
  marca: string
  sku_produto: string | null
  sku_gobeaute: string | null
  skus_relacionados: string[] | null
}

export function resolveCanonicalSku(marca: string, sku: string, depara: Depara[]): string {
  const m = depara.find(d => d.marca === marca && d.sku_antigo === sku)
  return m ? m.sku_novo : sku
}

// Conjunto de todos os SKUs equivalentes ao informado (canônico + aliases) na mesma marca.
export function expandSkuFamily(marca: string, sku: string, depara: Depara[]): string[] {
  const fam = new Set<string>([sku])
  const canonical = resolveCanonicalSku(marca, sku, depara)
  fam.add(canonical)
  for (const d of depara) {
    if (d.marca !== marca) continue
    if (d.sku_novo === canonical) fam.add(d.sku_antigo)
  }
  return [...fam]
}

// Match estrito de fórmula para um produto. Cruza marca + família de SKUs equivalentes.
export function findFormulaForProduto<F extends FormulaLike>(
  produto: ProdutoCanonico,
  formulas: F[],
  depara: Depara[] = []
): F | null {
  const marcaFormulas = formulas.filter(f => f.marca === produto.marca)
  const family = new Set<string>([
    produto.sku,
    ...(produto.aliases ?? []),
    ...expandSkuFamily(produto.marca, produto.sku, depara),
  ])

  for (const f of marcaFormulas) {
    if (f.sku_produto && family.has(f.sku_produto)) return f
    if (f.sku_gobeaute && family.has(f.sku_gobeaute)) return f
    if (f.skus_relacionados?.some(s => family.has(s))) return f
  }
  return null
}
