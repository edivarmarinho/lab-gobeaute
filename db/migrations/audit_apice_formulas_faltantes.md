# Auditoria — Fórmulas Apice faltantes

**Diagnóstico** (rodado em 2026-05-02 contra Lab Supabase `lbtutajufxswpkifoisw`):

- **406 produtos Apice ativos** (164 com fórmula esperada, 242 kit/brinde/acessório)
- **133 fórmulas Apice cadastradas** no Lab
- **Gap: ~31 produtos com fórmula esperada sem fórmula correspondente**

## Padrão observado

Os 31 produtos sem match são predominantemente **variantes de embalagem do mesmo produto-base**:

```
AP01010  COND ATIV ANTI-FRIZZ CCH NUTRITIVO 1000ML
AP01011  COND ATIV ANTI-FRIZZ CCH NUTRITIVO 500G    ← mesma fórmula
AP01015  COND ATV CCH NUTRITIVO 80g                 ← idem (provável)

AP01026  COND CRM PT AF BA 1000ml
AP01027  COND CRM PT AF BA 500g                     ← mesma fórmula
AP01028  COND CRM PT AF BA 80 g                     ← idem
```

## Hipótese

A fórmula está cadastrada (em `formulas`) sob **um único produto/SKU** (ex: `AP01010`), e os outros 2 tamanhos (500g, 80g) deveriam apontar pra mesma fórmula via tabela de mapeamento, mas:

1. Nem o nome do produto bate (`COND ATIV ANTI-FRIZZ CCH NUTRITIVO 1000ML` ≠ `COND ATV CCH NUTRITIVO 80g`)
2. Nem o `codigo` da fórmula contém o SKU dos tamanhos menores

## Validação necessária com o usuário (Edivar)

Antes de qualquer correção em massa:

1. **Variantes de tamanho compartilham fórmula?** Ex: COND CRM PT AF BA 1000ml / 500g / 80g → 1 fórmula só ou 3?
2. **Se compartilham**: cadastrar uma `formula_variantes` (N:N entre fórmula e SKU) ou criar 1 fórmula por SKU mesmo?
3. **Convenção de nomenclatura**: padrão "COND ATV" vs "COND ATIV ANTI-FRIZZ" — qual é o canônico? Sigla "ATV" significa o quê?
4. **SKUs como `AP01001`, `AP01002`...** são novos códigos Apice ou os antigos `10314`, `20159`? Há de-para entre eles?

## Candidatos a re-vincular (parciais — top 10)

Os SKUs abaixo TÊM correspondência por similaridade textual mas não foi possível garantir match automático:

| SKU                | Descrição produto                          | Possível fórmula candidata        |
|--------------------|--------------------------------------------|-----------------------------------|
| AP01006 / AP01007  | COND ACQUACREAM 100ML / 260 ML             | Fórmula com base "Acquacream"     |
| AP01016 / AP01017  | COND ATV MIRRA FIX 500g / 80 G             | Fórmula com base "Mirra Fix"      |
| AP01010 / AP01011 / AP01015 | COND ATIV ANTI-FRIZZ CCH NUTRITIVO  | Fórmula "Anti-Frizz Nutritivo"   |
| AP01026 / AP01027 / AP01028 | COND CRM PT AF BA (3 tamanhos)      | Fórmula "Cream Pot Anti-Frizz"   |
| AP01029 / AP01030 / AP01031 / AP01032 | COND CRM PT CRS PW (4 tamanhos) | Fórmula "Cream Cachos Power"  |

## Ação recomendada (depois da validação)

- Criar tabela `formula_skus` (N:N: 1 fórmula → muitos SKUs/tamanhos) OU adicionar coluna `skus text[]` em `formulas`
- Rodar dedup por similaridade fuzzy entre `produtos.descricao` e `formulas.produto`
- Manual review caso a caso (não automático)
