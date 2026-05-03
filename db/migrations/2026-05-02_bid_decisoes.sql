-- =============================================================================
-- Migration 2026-05-02 — Decisões BID & Pipeline de Homologação
-- =============================================================================
-- Aditiva: cria tabelas/colunas novas. Não altera dados existentes.
-- Reflete a importação do CSV final do BID (decisoes_bid2026_2026-04-23.csv).
-- =============================================================================

-- ── bid_decisoes: 1 linha por decisão BID (DECIDIDO ou A HOMOLOGAR) ───────────
create table if not exists bid_decisoes (
  id                  uuid primary key default uuid_generate_v4(),
  mp_codigo           text not null,                  -- MP0005 (não FK p/ permitir import antes do MP existir)
  mp_nome             text not null,
  fornecedor_nome     text,                           -- nome bruto do CSV (KHOL QUIMICA2 etc)
  fornecedor_normalizado text,                        -- KHOL QUIMICA (sem sufixo numérico)
  fornecedor_id       uuid references fornecedores(id),
  estado_fornecedor   text,                           -- SP, ES
  homologado_no_bid   text,                           -- 'Sim' / 'Não' / 'Não - Homologar'
  preco_referencia_usd numeric(12,4),                 -- alvo BID
  preco_decidido_usd  numeric(12,4),                  -- preço fechado
  custo_projetado_usd numeric(14,2),
  saving_unitario_usd numeric(12,4),
  saving_unitario_pct numeric(8,2),
  saving_total_usd    numeric(14,2),
  volume_anual_kg     numeric(14,2),
  moq                 text,                           -- string livre (40kg, 1000l, etc)
  lead_time_estoque   text,
  lead_time_sem_estoque text,
  status_bid          text not null check (status_bid in ('DECIDIDO','A HOMOLOGAR')),
  acao_observacao     text,
  data_decisao        date,
  fonte_csv           text not null default 'decisoes_bid2026_2026-04-23.csv',
  created_at          timestamptz not null default now(),
  unique (mp_codigo, fornecedor_nome, status_bid)
);

create index if not exists idx_bid_decisoes_mp     on bid_decisoes(mp_codigo);
create index if not exists idx_bid_decisoes_status on bid_decisoes(status_bid);
create index if not exists idx_bid_decisoes_forn   on bid_decisoes(fornecedor_normalizado);

-- ── pd_projetos: ampliar pra suportar projeto-de-homologação ────────────────
alter table pd_projetos
  add column if not exists mp_id uuid references mps(id),
  add column if not exists mp_codigo text,
  add column if not exists fornecedor_id uuid references fornecedores(id),
  add column if not exists fornecedor_nome text,
  add column if not exists tipo_projeto text not null default 'P&D'
    check (tipo_projeto in ('P&D','Homologação MP','Homologação Fornecedor')),
  add column if not exists bid_decisao_id uuid references bid_decisoes(id),
  add column if not exists saving_estimado_usd numeric(14,2),
  add column if not exists saving_pct numeric(8,2);

-- A coluna 'marca' do pd_projetos é NOT NULL no schema original.
-- Pra homologações de MP a marca é sintética ('Homologação' / 'Sourcing').
-- Manter NOT NULL e atribuir 'Homologação' nos novos registros via ETL.

create index if not exists idx_pd_tipo on pd_projetos(tipo_projeto);
create index if not exists idx_pd_mp on pd_projetos(mp_id);

-- ── RLS pra bid_decisoes (mesmo padrão das outras) ──────────────────────────
alter table bid_decisoes enable row level security;
create policy "leitura autenticada" on bid_decisoes
  for select using (auth.role() = 'authenticated');
create policy "escrita service_role" on bid_decisoes
  for all using (auth.role() = 'service_role');
