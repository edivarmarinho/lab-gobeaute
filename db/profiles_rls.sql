-- =============================================================================
-- Lab Gobeaute P&D — Controle de Acesso: Profiles + RLS granular por marca
-- Executar no SQL Editor do Supabase em 3 blocos, em ordem
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 1 — Tabela profiles + trigger de auto-criação no signup
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nome        text,
  avatar_url  text,
  role        text not null default 'viewer'
                check (role in ('admin', 'pd', 'viewer')),
  marcas      text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role  on profiles(role);

create or replace trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Trigger: cria profile automaticamente quando usuário faz OAuth
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'viewer';
begin
  if new.email = 'edivar@gobeaute.com.br' then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, nome, avatar_url, role, marcas)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    '{}'
  )
  on conflict (id) do update set
    email      = excluded.email,
    nome       = coalesce(excluded.nome, profiles.nome),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Retroativo: criar profiles para usuários já existentes
insert into public.profiles (id, email, nome, avatar_url, role, marcas)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'avatar_url',
  case when u.email = 'edivar@gobeaute.com.br' then 'admin' else 'viewer' end,
  case when u.email = 'edivar@gobeaute.com.br'
    then array['Kokeshi','Ápice','Barbours','Yenzah','By Samia','Rituária','Lescent','Auá Natural']
    else '{}'
  end
from auth.users u
on conflict (id) do update set
  role   = excluded.role,
  marcas = excluded.marcas;


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 2 — Funções helper (evitam recursão no RLS) + RLS em profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Funções security definer: bypassam RLS ao ler a própria tabela (evita recursão)
create or replace function get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function get_my_marcas()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select marcas from profiles where id = auth.uid();
$$;

-- RLS em profiles
alter table profiles enable row level security;

drop policy if exists "profiles: leitura" on profiles;
drop policy if exists "profiles: update" on profiles;

-- Leitura: admin vê todos; usuário vê apenas o próprio
create policy "profiles: leitura"
  on profiles for select
  using (
    get_my_role() = 'admin'
    or auth.uid() = id
  );

-- Update: admin atualiza qualquer; usuário atualiza apenas o próprio
create policy "profiles: update"
  on profiles for update
  using (
    get_my_role() = 'admin'
    or auth.uid() = id
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCO 3 — RLS granular em mps e pd_projetos (filtro por marca)
-- ─────────────────────────────────────────────────────────────────────────────

-- mps: remover policy genérica e criar filtro por marcas
drop policy if exists "leitura autenticada" on mps;
drop policy if exists "mps: leitura com filtro de marca" on mps;
drop policy if exists "mps: escrita pd e admin" on mps;

create policy "mps: leitura com filtro de marca"
  on mps for select
  using (
    get_my_role() = 'admin'
    or marcas = '{}'                   -- MPs sem marca: todos veem
    or marcas && get_my_marcas()       -- && = arrays com intersecção
  );

create policy "mps: escrita pd e admin"
  on mps for all
  using (
    get_my_role() = 'admin'
    or (
      get_my_role() = 'pd'
      and (marcas = '{}' or marcas && get_my_marcas())
    )
  );

-- pd_projetos: filtro por marca do projeto
drop policy if exists "leitura autenticada" on pd_projetos;
drop policy if exists "pd_projetos: leitura com filtro de marca" on pd_projetos;
drop policy if exists "pd_projetos: escrita pd e admin" on pd_projetos;

create policy "pd_projetos: leitura com filtro de marca"
  on pd_projetos for select
  using (
    get_my_role() = 'admin'
    or marca = any(get_my_marcas())
  );

create policy "pd_projetos: escrita pd e admin"
  on pd_projetos for all
  using (
    get_my_role() = 'admin'
    or (
      get_my_role() = 'pd'
      and marca = any(get_my_marcas())
    )
  );

-- formulas e documentos: pd pode editar (sem filtro de marca)
drop policy if exists "formulas: pd edita" on formulas;
drop policy if exists "documentos: pd edita" on documentos;

create policy "formulas: pd edita"
  on formulas for all
  using (get_my_role() in ('admin', 'pd'));

create policy "documentos: pd edita"
  on documentos for all
  using (get_my_role() in ('admin', 'pd'));

-- fornecedores e fornecedor_crm: leitura para todos autenticados (já existe)
-- Manter as policies "leitura autenticada" existentes nessas tabelas
