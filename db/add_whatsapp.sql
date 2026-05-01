-- Adicionar coluna whatsapp à tabela fornecedores
-- Executar no SQL Editor do Supabase

alter table fornecedores
  add column if not exists whatsapp text,
  add column if not exists site text,
  add column if not exists descricao text,
  add column if not exists especialidade text;
