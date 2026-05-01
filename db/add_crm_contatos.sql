-- Migração: campos CRM enriquecidos na tabela fornecedores
-- + tabela de múltiplos contatos por fornecedor
-- Executar no SQL Editor do Supabase

-- 1. Campos adicionais em fornecedores (enriquecimento CRM)
alter table fornecedores
  add column if not exists whatsapp text,
  add column if not exists site text,
  add column if not exists descricao text,
  add column if not exists especialidade text,
  add column if not exists linkedin text,
  add column if not exists instagram text,
  add column if not exists cnae text,
  add column if not exists porte text check (porte in ('micro', 'pequeno', 'medio', 'grande', 'multinacional')),
  add column if not exists segmento text,
  add column if not exists categoria_fornecedor text check (categoria_fornecedor in ('fabricante', 'distribuidor', 'importador', 'representante', 'outro')),
  add column if not exists avaliacao_geral smallint check (avaliacao_geral between 1 and 5),
  add column if not exists prazo_entrega_dias integer,
  add column if not exists moeda_negociacao text default 'BRL',
  add column if not exists incoterm text,
  add column if not exists condicao_pagamento text,
  add column if not exists observacoes text,
  add column if not exists ultima_atualizacao timestamptz default now();

-- 2. Tabela de múltiplos contatos por fornecedor (estilo CRM)
create table if not exists fornecedor_contatos (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores(id) on delete cascade,
  nome text not null,
  cargo text,
  email text,
  telefone text,
  whatsapp text,
  linkedin text,
  tipo text check (tipo in ('comercial', 'tecnico', 'financeiro', 'diretoria', 'outro')) default 'comercial',
  principal boolean default false,
  ativo boolean default true,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS para fornecedor_contatos
alter table fornecedor_contatos enable row level security;

create policy "contatos: leitura autenticada"
  on fornecedor_contatos for select
  using (auth.role() = 'authenticated');

create policy "contatos: escrita para pd e admin"
  on fornecedor_contatos for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'pd')
    )
  );

-- Índice para busca por fornecedor
create index if not exists idx_fornecedor_contatos_forn on fornecedor_contatos(fornecedor_id);
