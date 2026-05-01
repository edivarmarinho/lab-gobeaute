-- =============================================================================
-- Lab Gobeaute P&D — Schema Supabase
-- Executar no SQL Editor do Supabase (em ordem)
-- =============================================================================

-- ── Extensões ─────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- =============================================================================
-- TABELAS PRINCIPAIS
-- =============================================================================

-- ── Fornecedores ──────────────────────────────────────────────────────────────
create table if not exists fornecedores (
  id          uuid primary key default uuid_generate_v4(),
  nome        text not null,
  uf          text not null default 'SP',
  cnpj        text,
  contato     text,
  status      text not null default 'Em Avaliação'
                check (status in ('Homologado','Em Avaliação','Reprovado','Inativo')),
  iso22716    boolean not null default false,
  iso9001     boolean not null default false,
  pendencias  int not null default 0,
  mps_ativas  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Matérias-Primas ───────────────────────────────────────────────────────────
create table if not exists mps (
  id                    uuid primary key default uuid_generate_v4(),
  codigo                text not null unique,          -- MP0001
  nome                  text not null,
  inci                  text,
  cas                   text,
  categoria             text,
  anvisa                text not null default 'Livre'
                          check (anvisa in ('Livre','Restrito','Proibido')),
  homolog               text not null default 'Pendente'
                          check (homolog in ('Homologada','Em Processo','Pendente','Reprovada')),
  vegano                boolean not null default false,
  cf                    boolean not null default false,
  origem_natural        boolean not null default false,
  testado_animal        boolean not null default false,
  parabenos             boolean not null default false,
  preco_ref_usd         numeric(12,4),
  melhor_preco_usd      numeric(12,4),
  forn_hom_id           uuid references fornecedores(id),
  forn_candidato        text,                          -- nome livre, pode virar FK depois
  forn_hom_bid          text,
  status_analise        text,
  aprovacao_comparativo text,
  conflito_bid          text,
  origem                text not null default 'patricia'
                          check (origem in ('patricia','bid','patricia+bid')),
  marcas                text[] default '{}',           -- array: ['Kokeshi','Ápice']
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── MP × Fornecedor (N:N — fornecedores homologados por MP) ──────────────────
create table if not exists mp_fornecedores (
  mp_id          uuid not null references mps(id) on delete cascade,
  fornecedor_id  uuid not null references fornecedores(id) on delete cascade,
  primary key (mp_id, fornecedor_id)
);

-- ── Fórmulas ──────────────────────────────────────────────────────────────────
create table if not exists formulas (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text not null,                         -- F-KOK-001
  versao        text not null default 'v1',
  produto       text not null,
  marca         text not null,
  tipo          text not null default 'Cosmético'
                  check (tipo in ('Cosmético','Suplemento')),
  categoria     text,
  n_mps         int not null default 0,
  status        text not null default 'Em Desenvolvimento'
                  check (status in ('Em Desenvolvimento','Aprovada Internamente','Em Estabilidade','Aprovada QA','Arquivada')),
  responsavel   text,
  link_produto  text,
  grau          int,
  fase          text,
  obs           text,
  vendas_mes    int default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (codigo, versao)
);

-- ── Ingredientes de fórmula (N:N fórmula × MP) ───────────────────────────────
create table if not exists formula_ingredientes (
  id          uuid primary key default uuid_generate_v4(),
  formula_id  uuid not null references formulas(id) on delete cascade,
  mp_id       uuid references mps(id),
  mp_codigo   text,                                    -- fallback se MP não estiver cadastrada
  mp_nome     text,
  inci        text,
  percentual  text,
  funcao      text
);

-- ── Versões de fórmula ────────────────────────────────────────────────────────
create table if not exists formula_versoes (
  id          uuid primary key default uuid_generate_v4(),
  formula_id  uuid not null references formulas(id) on delete cascade,
  versao      text not null,
  data_versao date,
  descricao   text,
  por         text,
  created_at  timestamptz not null default now()
);

-- ── Documentos ────────────────────────────────────────────────────────────────
create table if not exists documentos (
  id              uuid primary key default uuid_generate_v4(),
  nome            text not null,
  tipo            text not null
                    check (tipo in ('FISPQ','COA','Ficha Técnica','ISO 22716','ISO 9001','Laudo Microbiológico','Decl. Conformidade','Outro')),
  mp_codigo       text,                                -- ex: MP0011
  mp_id           uuid references mps(id),
  fornecedor_id   uuid references fornecedores(id),
  fornecedor_nome text,
  versao_lote     text,
  data_upload     date,
  data_validade   date,
  status          text not null default 'Pendente'
                    check (status in ('Aprovado','Em Revisão','Pendente','Vencido','Rejeitado')),
  revisor         text,
  drive_file_id   text unique,                         -- ID do arquivo no Google Drive
  drive_url       text,                                -- link direto para visualização
  drive_nome      text,                                -- nome original do arquivo no Drive
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Projetos P&D ──────────────────────────────────────────────────────────────
create table if not exists pd_projetos (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text not null unique,                   -- PD-001
  nome         text not null,
  marca        text not null,
  tipo         text not null default 'Cosmético'
                 check (tipo in ('Cosmético','Suplemento')),
  etapa        text not null default 'Briefing/Conceito'
                 check (etapa in ('Briefing/Conceito','Formulação em Bancada','Testes Internos','Aprovação Interna','Aprovação QA','Aprovado para Produção')),
  responsavel  text,
  data_inicio  date,
  status       text not null default 'Em andamento'
                 check (status in ('Em andamento','Pronto para aprovação','Pausado','Concluído')),
  briefing     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── CRM de Fornecedores ───────────────────────────────────────────────────────
create table if not exists fornecedor_crm (
  id             uuid primary key default uuid_generate_v4(),
  fornecedor_id  uuid not null references fornecedores(id) on delete cascade,
  tipo           text not null check (tipo in ('green','yellow','red','blue')),
  titulo         text not null,
  detalhe        text,
  data_evento    date,
  created_at     timestamptz not null default now()
);

-- ── Log de sincronização Drive ────────────────────────────────────────────────
create table if not exists drive_sync_log (
  id              uuid primary key default uuid_generate_v4(),
  executado_em    timestamptz not null default now(),
  arquivos_novos  int not null default 0,
  arquivos_total  int not null default 0,
  status          text not null check (status in ('ok','erro')),
  detalhe         text
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================
create index if not exists idx_mps_codigo      on mps(codigo);
create index if not exists idx_mps_homolog     on mps(homolog);
create index if not exists idx_mps_categoria   on mps(categoria);
create index if not exists idx_docs_status     on documentos(status);
create index if not exists idx_docs_drive      on documentos(drive_file_id);
create index if not exists idx_formulas_marca  on formulas(marca);
create index if not exists idx_pd_etapa        on pd_projetos(etapa);

-- =============================================================================
-- UPDATED_AT AUTOMÁTICO
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_mps_updated_at
  before update on mps
  for each row execute function set_updated_at();

create or replace trigger trg_fornecedores_updated_at
  before update on fornecedores
  for each row execute function set_updated_at();

create or replace trigger trg_formulas_updated_at
  before update on formulas
  for each row execute function set_updated_at();

create or replace trigger trg_documentos_updated_at
  before update on documentos
  for each row execute function set_updated_at();

create or replace trigger trg_pd_updated_at
  before update on pd_projetos
  for each row execute function set_updated_at();

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================
alter table mps              enable row level security;
alter table fornecedores     enable row level security;
alter table formulas         enable row level security;
alter table documentos       enable row level security;
alter table pd_projetos      enable row level security;
alter table fornecedor_crm   enable row level security;
alter table drive_sync_log   enable row level security;

-- Leitura liberada para usuários autenticados (@gobeaute.com.br via Google OAuth)
create policy "leitura autenticada" on mps
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on fornecedores
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on formulas
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on documentos
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on pd_projetos
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on fornecedor_crm
  for select using (auth.role() = 'authenticated');
create policy "leitura autenticada" on drive_sync_log
  for select using (auth.role() = 'authenticated');

-- Escrita apenas via service_role (ETL, seed, backend)
create policy "escrita service_role" on mps
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on fornecedores
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on formulas
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on documentos
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on pd_projetos
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on fornecedor_crm
  for all using (auth.role() = 'service_role');
create policy "escrita service_role" on drive_sync_log
  for all using (auth.role() = 'service_role');

-- =============================================================================
-- ATUALIZAÇÃO 2026-05-01 — Tabelas de Produtos e De-Para + fix de constraint
-- =============================================================================

-- Adicionado 'Importada BID' ao check constraint de formulas.status
-- ALTER TABLE formulas DROP CONSTRAINT IF EXISTS formulas_status_check;
-- ALTER TABLE formulas ADD CONSTRAINT formulas_status_check
--   CHECK (status IN ('Em Desenvolvimento','Aprovada Internamente','Em Estabilidade','Aprovada QA','Arquivada','Importada BID'));

-- ── Tabela de Produtos (fonte de verdade: Google Sheets 1Ma2ynNyv0nNzLU58lVq0R9LKwEGbYr2Pkrbq3V5GB94)
CREATE TABLE IF NOT EXISTS produtos (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku         text NOT NULL UNIQUE,
  sku_tiny    text,
  sku_prot    text,
  marca       text NOT NULL,
  descricao   text NOT NULL,
  status      text NOT NULL DEFAULT 'Ativo',
  pmv         numeric(12,2),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_produtos_sku   ON produtos(sku);
CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos(marca);

-- ── Tabela de De-Para de SKUs
CREATE TABLE IF NOT EXISTS sku_depara (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  marca       text NOT NULL,
  sku_antigo  text NOT NULL,
  sku_novo    text NOT NULL,
  descricao   text,
  fonte       text NOT NULL,
  UNIQUE (marca, sku_antigo)
);

-- Trigger updated_at para produtos
-- CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- GRANTs necessários
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos   TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.sku_depara TO service_role;
