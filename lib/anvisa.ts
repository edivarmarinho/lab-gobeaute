/**
 * Banco de substâncias ANVISA — substâncias proibidas, restritas e de uso limitado
 *
 * Fontes oficiais:
 * - RDC 44/2012 — Lista de Substâncias de Ação Conservante para Produtos de Higiene Pessoal, Cosméticos e Perfumes
 * - IN 39/2016 — Lista de Substâncias Permitidas com Restrições para Produtos de Higiene Pessoal, Cosméticos e Perfumes
 * - RDC 752/2022 — Regulamento Técnico de Produtos de Higiene Pessoal, Cosméticos e Perfumes
 * - EU Cosmetics Regulation 1223/2009 — Anexo II, III, V, VI (alérgenos declaráveis)
 */

export type AnvisaRestricao = {
  inci: string
  cas?: string
  tipo: 'proibida' | 'restrita' | 'permitida_limite' | 'alergeno_declaravel'
  concentracao_max?: string
  condicao?: string
  resolucao: string
  observacao?: string
}

// ─── PRESERVANTES (RDC 29/2012, Anexo) ────────────────────────────────────────
const PRESERVANTES: AnvisaRestricao[] = [
  { inci: 'Methylparaben',  cas: '99-76-3',  tipo: 'permitida_limite', concentracao_max: '0.4', condicao: 'isolado · 0.8% combinado com outros parabenos', resolucao: 'RDC 29/2012' },
  { inci: 'Ethylparaben',   cas: '120-47-8', tipo: 'permitida_limite', concentracao_max: '0.4', condicao: 'isolado · 0.8% combinado',  resolucao: 'RDC 29/2012' },
  { inci: 'Propylparaben',  cas: '94-13-3',  tipo: 'permitida_limite', concentracao_max: '0.14', condicao: 'isolado · não permitido em produtos para crianças <3 anos em área de fralda', resolucao: 'RDC 29/2012' },
  { inci: 'Butylparaben',   cas: '94-26-8',  tipo: 'permitida_limite', concentracao_max: '0.14', condicao: 'isolado · não permitido em produtos para crianças <3 anos em área de fralda', resolucao: 'RDC 29/2012' },
  { inci: 'Phenoxyethanol', cas: '122-99-6', tipo: 'permitida_limite', concentracao_max: '1.0', resolucao: 'RDC 29/2012' },
  { inci: 'Benzoic Acid',   cas: '65-85-0',  tipo: 'permitida_limite', concentracao_max: '0.5', condicao: 'enxaguáveis · 2.5% sabonetes', resolucao: 'RDC 29/2012' },
  { inci: 'Sodium Benzoate', cas: '532-32-1', tipo: 'permitida_limite', concentracao_max: '0.5', condicao: '2.5% para sabonetes; 1.7% enxaguáveis bucais', resolucao: 'RDC 29/2012' },
  { inci: 'Potassium Sorbate', cas: '24634-61-5', tipo: 'permitida_limite', concentracao_max: '0.6', resolucao: 'RDC 29/2012' },
  { inci: 'Sorbic Acid',    cas: '110-44-1', tipo: 'permitida_limite', concentracao_max: '0.6', resolucao: 'RDC 29/2012' },
  { inci: 'Triclosan',      cas: '3380-34-5',tipo: 'permitida_limite', concentracao_max: '0.3', condicao: 'apenas dentifrícios, sabonetes, géis de chuveiro, desodorantes (não em sprays), pó facial, anti-acne — proibido em produtos para crianças', resolucao: 'RDC 29/2012' },
  { inci: 'Methylisothiazolinone', cas: '2682-20-4', tipo: 'permitida_limite', concentracao_max: '0.0015', condicao: 'apenas em produtos enxaguáveis · proibido em leave-on', resolucao: 'RDC 50/2018' },
  { inci: 'Methylchloroisothiazolinone', cas: '26172-55-4', tipo: 'permitida_limite', concentracao_max: '0.0015', condicao: 'enxaguáveis apenas · mistura 3:1 com MIT', resolucao: 'RDC 29/2012' },
  { inci: 'DMDM Hydantoin', cas: '6440-58-0', tipo: 'permitida_limite', concentracao_max: '0.6', resolucao: 'RDC 29/2012' },
  { inci: 'Imidazolidinyl Urea', cas: '39236-46-9', tipo: 'permitida_limite', concentracao_max: '0.6', resolucao: 'RDC 29/2012' },
  { inci: 'Diazolidinyl Urea', cas: '78491-02-8', tipo: 'permitida_limite', concentracao_max: '0.5', resolucao: 'RDC 29/2012' },
  { inci: 'Quaternium-15',  cas: '4080-31-3',tipo: 'permitida_limite', concentracao_max: '0.2', resolucao: 'RDC 29/2012' },
  { inci: 'Iodopropynyl Butylcarbamate', cas: '55406-53-6', tipo: 'permitida_limite', concentracao_max: '0.02', condicao: 'até 0.05% em desodorantes/antitranspirantes não-spray · proibido em <3 anos exceto sabonetes/banho/shampoos', resolucao: 'RDC 29/2012' },
  { inci: 'Formaldehyde',   cas: '50-00-0',  tipo: 'restrita', concentracao_max: '0.2', condicao: 'apenas em produtos de higiene bucal · 5% em endurecedor de unhas; declaração obrigatória se >0.05%', resolucao: 'RDC 162/2001' },
]

// ─── FILTROS UV (RDC 30/2012) ────────────────────────────────────────────────
const FILTROS_UV: AnvisaRestricao[] = [
  { inci: 'Avobenzone (Butyl Methoxydibenzoylmethane)', cas: '70356-09-1', tipo: 'permitida_limite', concentracao_max: '5', resolucao: 'RDC 30/2012' },
  { inci: 'Octocrylene',    cas: '6197-30-4', tipo: 'permitida_limite', concentracao_max: '10', resolucao: 'RDC 30/2012' },
  { inci: 'Octinoxate (Ethylhexyl Methoxycinnamate)', cas: '5466-77-3', tipo: 'permitida_limite', concentracao_max: '10', resolucao: 'RDC 30/2012' },
  { inci: 'Homosalate',     cas: '118-56-9', tipo: 'permitida_limite', concentracao_max: '15', resolucao: 'RDC 30/2012' },
  { inci: 'Octisalate (Ethylhexyl Salicylate)', cas: '118-60-5', tipo: 'permitida_limite', concentracao_max: '5', resolucao: 'RDC 30/2012' },
  { inci: 'Oxybenzone (Benzophenone-3)', cas: '131-57-7', tipo: 'permitida_limite', concentracao_max: '10', condicao: 'declaração obrigatória "contém oxibenzona" se >0.5%', resolucao: 'RDC 30/2012' },
  { inci: 'Titanium Dioxide', cas: '13463-67-7', tipo: 'permitida_limite', concentracao_max: '25', resolucao: 'RDC 30/2012' },
  { inci: 'Zinc Oxide',     cas: '1314-13-2', tipo: 'permitida_limite', concentracao_max: '25', resolucao: 'RDC 30/2012' },
  { inci: 'Bemotrizinol (Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine)', cas: '187393-00-6', tipo: 'permitida_limite', concentracao_max: '10', resolucao: 'RDC 30/2012' },
  { inci: 'Tinosorb S (Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine)', tipo: 'permitida_limite', concentracao_max: '10', resolucao: 'RDC 30/2012' },
  { inci: 'Bisoctrizole (Methylene Bis-Benzotriazolyl Tetramethylbutylphenol)', cas: '103597-45-1', tipo: 'permitida_limite', concentracao_max: '10', resolucao: 'RDC 30/2012' },
]

// ─── PROIBIDAS (RDC 528/2021 e atualizações) ─────────────────────────────────
const PROIBIDAS: AnvisaRestricao[] = [
  { inci: 'Hydroquinone', cas: '123-31-9', tipo: 'proibida', resolucao: 'RDC 528/2021', observacao: 'Proibida em produtos cosméticos no Brasil. Apenas com prescrição médica.' },
  { inci: 'Mercury', cas: '7439-97-6', tipo: 'proibida', resolucao: 'RDC 528/2021', observacao: 'Mercúrio e seus compostos proibidos em cosméticos.' },
  { inci: 'Lead Acetate', cas: '301-04-2', tipo: 'proibida', resolucao: 'RDC 528/2021' },
  { inci: 'Tretinoin', cas: '302-79-4', tipo: 'proibida', resolucao: 'RDC 528/2021', observacao: 'Medicamento — proibido em cosméticos.' },
  { inci: 'Hexachlorophene', cas: '70-30-4', tipo: 'proibida', resolucao: 'RDC 528/2021' },
  { inci: 'Bithionol', cas: '97-18-7', tipo: 'proibida', resolucao: 'RDC 528/2021' },
]

// ─── ALÉRGENOS DECLARÁVEIS (EU Anexo III — adotado também no Brasil) ─────────
const ALERGENOS: AnvisaRestricao[] = [
  { inci: 'Limonene',       cas: '5989-27-5', tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Linalool',       cas: '78-70-6',   tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Citronellol',    cas: '106-22-9',  tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Geraniol',       cas: '106-24-1',  tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Eugenol',        cas: '97-53-0',   tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Coumarin',       cas: '91-64-5',   tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Cinnamal',       cas: '104-55-2',  tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Benzyl Alcohol', cas: '100-51-6',  tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off · também usado como conservante (max 1.0%)', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Benzyl Salicylate', cas: '118-58-1', tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Benzyl Benzoate', cas: '120-51-4', tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Hexyl Cinnamal', cas: '101-86-0',  tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
  { inci: 'Isoeugenol',     cas: '97-54-1',   tipo: 'alergeno_declaravel', condicao: 'declarar se >0.001% leave-on ou >0.01% rinse-off · max 0.02% leave-on / 0.2% rinse-off', resolucao: 'EU 1223/2009 Anexo III' },
]

// ─── SUBSTÂNCIAS RESTRITAS DIVERSAS ──────────────────────────────────────────
const RESTRITAS: AnvisaRestricao[] = [
  { inci: 'Hydrogen Peroxide', cas: '7722-84-1', tipo: 'permitida_limite', concentracao_max: '12', condicao: '12% em descolorantes capilares; 6% em fixadores; 4% em descolorantes de pelos faciais; 0.1% em produtos para cavidade bucal', resolucao: 'RDC 35/2009' },
  { inci: 'Salicylic Acid', cas: '69-72-7', tipo: 'permitida_limite', concentracao_max: '3.0', condicao: '3% em produtos enxaguáveis (shampoos); 2% em outros produtos · proibido em produtos para crianças <3 anos exceto shampoos', resolucao: 'RDC 7/2015' },
  { inci: 'Retinol', cas: '68-26-8', tipo: 'permitida_limite', concentracao_max: '0.3', condicao: 'cosméticos sem alegação medicamentosa', resolucao: 'IN 39/2016' },
  { inci: 'Niacinamide', cas: '98-92-0', tipo: 'permitida_limite', concentracao_max: '5.0', resolucao: 'IN 39/2016', observacao: 'Concentrações até 5% em cosméticos sem alegação terapêutica' },
  { inci: 'Glycolic Acid', cas: '79-14-1', tipo: 'permitida_limite', concentracao_max: '10', condicao: 'pH ≥3.5 · uso em casa; >10% apenas para uso profissional', resolucao: 'IN 39/2016' },
  { inci: 'Lactic Acid', cas: '50-21-5', tipo: 'permitida_limite', concentracao_max: '10', condicao: 'pH ≥3.5', resolucao: 'IN 39/2016' },
  { inci: 'Kojic Acid', cas: '501-30-4', tipo: 'permitida_limite', concentracao_max: '1.0', resolucao: 'IN 39/2016' },
  { inci: 'Sodium Lauryl Sulfate', cas: '151-21-3', tipo: 'permitida_limite', concentracao_max: '20', condicao: 'até 20% em produtos enxaguáveis', resolucao: 'IN 39/2016' },
  { inci: 'Cocamide DEA', cas: '68603-42-9', tipo: 'permitida_limite', concentracao_max: '10', condicao: 'limite de NDELA <50 ppb', resolucao: 'IN 39/2016' },
]

// ─── CONJUNTO COMPLETO ───────────────────────────────────────────────────────
export const ANVISA_RESTRICOES: AnvisaRestricao[] = [
  ...PROIBIDAS,
  ...PRESERVANTES,
  ...FILTROS_UV,
  ...RESTRITAS,
  ...ALERGENOS,
]

// ─── BUSCA NORMALIZADA ───────────────────────────────────────────────────────
function normalizar(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Busca uma restrição por nome INCI ou CAS — busca fuzzy (case insensitive, ignora pontuação)
 */
export function buscarRestricao(nomeOuInci: string, cas?: string): AnvisaRestricao | null {
  if (!nomeOuInci) return null
  const norm = normalizar(nomeOuInci)
  for (const r of ANVISA_RESTRICOES) {
    if (cas && r.cas === cas) return r
    const inciNorm = normalizar(r.inci)
    if (norm === inciNorm) return r
    // match parcial (substring)
    if (norm.length >= 5 && (inciNorm.includes(norm) || norm.includes(inciNorm))) return r
  }
  return null
}

/**
 * Avalia compliance de um ingrediente: retorna severidade + descrição
 */
export type ComplianceCheck = {
  severidade: 'ok' | 'info' | 'warning' | 'error'
  mensagem: string | null
  resolucao: string | null
  restricao: AnvisaRestricao | null
}

export function avaliarCompliance(
  nomeOuInci: string,
  percentual: number | null,
  cas?: string,
  tipoProduto: 'leave-on' | 'rinse-off' = 'leave-on'
): ComplianceCheck {
  const restricao = buscarRestricao(nomeOuInci, cas)
  if (!restricao) {
    return { severidade: 'ok', mensagem: null, resolucao: null, restricao: null }
  }

  // Proibida — sempre erro
  if (restricao.tipo === 'proibida') {
    return {
      severidade: 'error',
      mensagem: `${restricao.inci} é PROIBIDA em cosméticos no Brasil.${restricao.observacao ? ' ' + restricao.observacao : ''}`,
      resolucao: restricao.resolucao,
      restricao,
    }
  }

  // Limite máximo
  if (restricao.tipo === 'permitida_limite' || restricao.tipo === 'restrita') {
    if (percentual !== null && restricao.concentracao_max) {
      const max = parseFloat(restricao.concentracao_max)
      if (!isNaN(max) && percentual > max) {
        return {
          severidade: 'error',
          mensagem: `${restricao.inci}: ${percentual}% excede o máximo permitido (${max}%).${restricao.condicao ? ' Condição: ' + restricao.condicao : ''}`,
          resolucao: restricao.resolucao,
          restricao,
        }
      }
      // Próximo do limite (>80%)
      if (!isNaN(max) && percentual >= max * 0.8) {
        return {
          severidade: 'warning',
          mensagem: `${restricao.inci}: ${percentual}% próximo ao máximo (${max}%).`,
          resolucao: restricao.resolucao,
          restricao,
        }
      }
    }
    return {
      severidade: 'info',
      mensagem: `${restricao.inci}: uso permitido com restrições. Máx ${restricao.concentracao_max ?? 'q.s.'}%${restricao.condicao ? ' · ' + restricao.condicao : ''}`,
      resolucao: restricao.resolucao,
      restricao,
    }
  }

  // Alérgeno declarável
  if (restricao.tipo === 'alergeno_declaravel') {
    if (percentual === null) {
      return {
        severidade: 'info',
        mensagem: `${restricao.inci}: alérgeno — verificar se requer declaração obrigatória no rótulo.`,
        resolucao: restricao.resolucao,
        restricao,
      }
    }
    const limite = tipoProduto === 'leave-on' ? 0.001 : 0.01
    if (percentual > limite) {
      return {
        severidade: 'info',
        mensagem: `${restricao.inci}: alérgeno — declaração obrigatória no rótulo (>${limite}% em ${tipoProduto}).`,
        resolucao: restricao.resolucao,
        restricao,
      }
    }
  }

  return { severidade: 'ok', mensagem: null, resolucao: null, restricao: null }
}

// ─── STATS ───────────────────────────────────────────────────────────────────
export const ANVISA_STATS = {
  total: ANVISA_RESTRICOES.length,
  proibidas: PROIBIDAS.length,
  preservantes: PRESERVANTES.length,
  filtrosUv: FILTROS_UV.length,
  restritas: RESTRITAS.length,
  alergenos: ALERGENOS.length,
}
