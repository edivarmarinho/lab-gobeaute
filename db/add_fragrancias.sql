-- Campos específicos para categoria Fragrâncias
alter table mps
  add column if not exists familia_olfativa      text,
  add column if not exists notas_topo            text,
  add column if not exists notas_coracao         text,
  add column if not exists notas_fundo           text,
  add column if not exists ifra_categoria        text,
  add column if not exists ifra_limite_pct       numeric(6,3),
  add column if not exists ifra_compliance       boolean not null default false,
  add column if not exists iso_conformidade      text,
  add column if not exists substancias_alergenas text;
