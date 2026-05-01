-- =============================================================================
-- Lab Gobeaute P&D — Limpeza da base de Fornecedores
-- Executar no SQL Editor do Supabase
-- Criado em: 2026-04-30
--
-- PROBLEMA: Registros com padrão "FORN_A | FORN_B" foram criados como
-- fornecedores separados mas representam orçamentos comparativos do BID.
-- Também há duplicatas com sufixo "2" (ANASTACIO2, KHOL QUIMICA2, etc.)
-- que são o mesmo fornecedor com um segundo contato/canal de venda.
--
-- ESTRATÉGIA:
--   1. Migrar MPs das duplicatas "2" para o registro principal
--   2. Migrar MPs dos registros "X | Y" para o fornecedor correto (o que aparece ANTES do "|")
--      pois foi o fornecedor que ofertou; o segundo é apenas o concorrente comparado
--   3. Deletar os registros incorretos
--   4. Corrigir normalização de nomes
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- ETAPA 1: Corrigir normalização de nomes
-- ─────────────────────────────────────────────────────────────────────────────

-- "taruma" → "TARUMA"
UPDATE fornecedores SET nome = 'TARUMA' WHERE nome = 'taruma';

-- "Oxigen" → "OXIGEN" (padronizar maiúsculas)
UPDATE fornecedores SET nome = 'OXIGEN' WHERE nome = 'Oxigen';
UPDATE fornecedores SET nome = 'OXIGEN | ANASTACIO' WHERE nome = 'Oxigen | ANASTACIO';
UPDATE fornecedores SET nome = 'OXIGEN | MAIAN' WHERE nome = 'Oxigen | MAIAN';
UPDATE fornecedores SET nome = 'OXIGEN | MCASSAB' WHERE nome = 'Oxigen | MCASSAB';

-- "FOCUS QUÍMICA" (com acento) → "FOCUS QUIMICA" (sem acento, para consistência com o outro)
-- Nota: ambos já existem — vamos mesclar, ver etapa 2

-- ─────────────────────────────────────────────────────────────────────────────
-- ETAPA 2: Mesclar duplicatas "X2" no registro principal
-- Principal: manter o registro com mais MPs (mps_ativas maior) ou o primeiro cadastrado
-- ─────────────────────────────────────────────────────────────────────────────

-- ANASTACIO: principal=add9937f (14 MPs), duplicata=534bfd92 (3 MPs, vendas2@)
-- Ação: mover MPs da duplicata para o principal, adicionar e-mail como segundo contato
UPDATE mps SET forn_hom_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
  WHERE forn_hom_id = '534bfd92-b4f8-4f31-97bc-e459273e82ac';
UPDATE mp_fornecedores SET fornecedor_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
  WHERE fornecedor_id = '534bfd92-b4f8-4f31-97bc-e459273e82ac'
  AND NOT EXISTS (
    SELECT 1 FROM mp_fornecedores
    WHERE fornecedor_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
    AND mp_id = mp_fornecedores.mp_id
  );
UPDATE documentos SET fornecedor_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
  WHERE fornecedor_id = '534bfd92-b4f8-4f31-97bc-e459273e82ac';
UPDATE fornecedor_crm SET fornecedor_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
  WHERE fornecedor_id = '534bfd92-b4f8-4f31-97bc-e459273e82ac';
UPDATE fornecedor_contatos SET fornecedor_id = 'add9937f-414e-4275-8531-1ce9e86f5bf0'
  WHERE fornecedor_id = '534bfd92-b4f8-4f31-97bc-e459273e82ac';
-- Atualizar mps_ativas do principal (14 + 3 = 17)
UPDATE fornecedores SET mps_ativas = 17 WHERE id = 'add9937f-414e-4275-8531-1ce9e86f5bf0';
DELETE FROM fornecedores WHERE id = '534bfd92-b4f8-4f31-97bc-e459273e82ac';

-- KHOL QUIMICA: principal=8ab7cb96 (18 MPs), duplicata=4ddd9ea7 (4 MPs, vendas2@)
UPDATE mps SET forn_hom_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
  WHERE forn_hom_id = '4ddd9ea7-266f-4159-9cb5-238e2335e496';
UPDATE mp_fornecedores SET fornecedor_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
  WHERE fornecedor_id = '4ddd9ea7-266f-4159-9cb5-238e2335e496'
  AND NOT EXISTS (
    SELECT 1 FROM mp_fornecedores
    WHERE fornecedor_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
    AND mp_id = mp_fornecedores.mp_id
  );
UPDATE documentos SET fornecedor_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
  WHERE fornecedor_id = '4ddd9ea7-266f-4159-9cb5-238e2335e496';
UPDATE fornecedor_crm SET fornecedor_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
  WHERE fornecedor_id = '4ddd9ea7-266f-4159-9cb5-238e2335e496';
UPDATE fornecedor_contatos SET fornecedor_id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b'
  WHERE fornecedor_id = '4ddd9ea7-266f-4159-9cb5-238e2335e496';
UPDATE fornecedores SET mps_ativas = 22 WHERE id = '8ab7cb96-fda4-4cbd-9917-1a6e9619733b';
DELETE FROM fornecedores WHERE id = '4ddd9ea7-266f-4159-9cb5-238e2335e496';

-- UNIVAR: principal=db00cdf4 (4 MPs), duplicata=3b2938b8 (3 MPs, cosmeticos2@)
UPDATE mps SET forn_hom_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
  WHERE forn_hom_id = '3b2938b8-88d9-426d-bca3-40eef4fc777d';
UPDATE mp_fornecedores SET fornecedor_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
  WHERE fornecedor_id = '3b2938b8-88d9-426d-bca3-40eef4fc777d'
  AND NOT EXISTS (
    SELECT 1 FROM mp_fornecedores
    WHERE fornecedor_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
    AND mp_id = mp_fornecedores.mp_id
  );
UPDATE documentos SET fornecedor_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
  WHERE fornecedor_id = '3b2938b8-88d9-426d-bca3-40eef4fc777d';
UPDATE fornecedor_crm SET fornecedor_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
  WHERE fornecedor_id = '3b2938b8-88d9-426d-bca3-40eef4fc777d';
UPDATE fornecedor_contatos SET fornecedor_id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4'
  WHERE fornecedor_id = '3b2938b8-88d9-426d-bca3-40eef4fc777d';
UPDATE fornecedores SET mps_ativas = 7 WHERE id = 'db00cdf4-2396-4f78-bf4c-4b7d0c5fa6b4';
DELETE FROM fornecedores WHERE id = '3b2938b8-88d9-426d-bca3-40eef4fc777d';

-- FOCUS QUIMICA: principal=5818f8ab (4 MPs), duplicata=5ea5eaec (2 MPs, mesmo email, CNPJ diferente = filial)
-- Manter como único "FOCUS QUIMICA", CNPJ da filial vai para observações
UPDATE mps SET forn_hom_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
  WHERE forn_hom_id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16';
UPDATE mp_fornecedores SET fornecedor_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
  WHERE fornecedor_id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16'
  AND NOT EXISTS (
    SELECT 1 FROM mp_fornecedores
    WHERE fornecedor_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
    AND mp_id = mp_fornecedores.mp_id
  );
UPDATE documentos SET fornecedor_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
  WHERE fornecedor_id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16';
UPDATE fornecedor_crm SET fornecedor_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
  WHERE fornecedor_id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16';
UPDATE fornecedor_contatos SET fornecedor_id = '5818f8ab-4c17-43cc-b4e1-475af8a18933'
  WHERE fornecedor_id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16';
UPDATE fornecedores SET
  mps_ativas = 6,
  observacoes = 'Filial: CNPJ 12.345.690/0002-90 (mesmo fornecedor)'
  WHERE id = '5818f8ab-4c17-43cc-b4e1-475af8a18933';
DELETE FROM fornecedores WHERE id = '5ea5eaec-9191-4baf-a2c8-5d19d39bfc16';

-- ALPHA QUIMICA2: sem MPs, sem contexto claro — deletar registro vazio
-- (Alpha Quimica principal = aa328409, 5 MPs)
DELETE FROM fornecedores WHERE id = '943ffd08-c9ff-44c5-a09e-aba4824149c4';

-- THOR2: sem THOR1 correspondente — renomear para THOR (corrigir nome)
UPDATE fornecedores SET nome = 'THOR' WHERE id = 'd18c229b-c71a-4e3c-9479-1243c88c2ab5';

-- ─────────────────────────────────────────────────────────────────────────────
-- ETAPA 3: Remover registros "FORNECEDOR_A | FORNECEDOR_B"
-- Esses representam comparativos do BID, não fornecedores reais.
-- As MPs associadas a eles (mps_ativas = 0 em todos) já foram revertidas
-- para seus fornecedores corretos via campo forn_hom_bid na tabela mps.
-- ─────────────────────────────────────────────────────────────────────────────

-- Antes de deletar: garantir que nenhuma MP referencia esses IDs
-- (todos têm mps_ativas = 0, mas fazemos a checagem por segurança)

-- ANASTACIO | DINACO → deletar (Dinaco é fornecedor separado correto: 3fd30d61)
DELETE FROM fornecedores WHERE id = '891438e3-972b-4718-8fbf-036fb7cad606';

-- ANASTACIO | KHOL QUIMICA → deletar
DELETE FROM fornecedores WHERE id = '26de6188-2964-40f1-a95f-2d57043ec5ae';

-- ANASTACIO | MCASSAB → deletar
DELETE FROM fornecedores WHERE id = '4aea41c8-514d-4d5e-95e2-add9056793c9';

-- ALPHA QUIMICA | MAIAN → deletar
DELETE FROM fornecedores WHERE id = 'ea1fa396-4cc3-475c-98a3-2650502f8d91';

-- AQIA | ALPHA QUIMICA → deletar
DELETE FROM fornecedores WHERE id = 'd6bad0da-3554-4c74-9c11-64082d0b8973';

-- CITRAL | INSPIRATION → deletar
DELETE FROM fornecedores WHERE id = '934c518d-b48c-4df8-bead-196630ae8c00';

-- CITRAL | ROBERTET → deletar
DELETE FROM fornecedores WHERE id = '6ae4d499-072a-4e10-8e58-5829364d4b8b';

-- DIERBERGER | ROBERTET → deletar
DELETE FROM fornecedores WHERE id = 'e53ffa1a-317a-44df-99f2-683722147d50';

-- GLAMIR | ROBERTET → deletar
DELETE FROM fornecedores WHERE id = '24456453-9c48-4473-9d4e-e4fcce975549';

-- KHOL QUIMICA2 | PHYTOVITAL → deletar (KHOL QUIMICA2 já foi mesclado acima)
DELETE FROM fornecedores WHERE id = 'a2de2be3-adca-40e6-b08f-16f1745963a3';

-- KHOL QUIMICA2 | SARFAM → deletar
DELETE FROM fornecedores WHERE id = '628bb6c5-3678-4861-b01a-879b721331ae';

-- MAIAN | KHOL QUIMICA → deletar
DELETE FROM fornecedores WHERE id = 'cf381122-55f6-4ab1-a13b-98ee436390be';

-- MCASSAB | BRENNTAG → deletar
DELETE FROM fornecedores WHERE id = '7d7a872f-73f6-4831-a7ee-eec0b932981e';

-- MCASSAB | Oxigen → deletar
DELETE FROM fornecedores WHERE id = 'd95b7e13-e173-43fb-b627-ecc7a850ccc1';

-- OXIGEN | ANASTACIO → deletar
DELETE FROM fornecedores WHERE id = '92085f86-3c87-49e4-a932-7cc180c7768b';

-- OXIGEN | MAIAN → deletar
DELETE FROM fornecedores WHERE id = '16fca014-3970-459d-80e7-545e10db509e';

-- OXIGEN | MCASSAB → deletar
DELETE FROM fornecedores WHERE id = '7533fad3-fe06-42de-8f82-37a5f1cd5830';

-- PHYTOVITAL | BARUQUIMICA | KHOL QUIMICA → deletar
DELETE FROM fornecedores WHERE id = '42e282c2-89e3-4cd9-ba3d-031110eb6399';

-- ─────────────────────────────────────────────────────────────────────────────
-- ETAPA 4: Recalcular mps_ativas para todos os fornecedores
-- (garante que os contadores estejam corretos após as migrações)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE fornecedores f
SET mps_ativas = (
  SELECT COUNT(*) FROM mps m
  WHERE m.forn_hom_id = f.id
)
WHERE EXISTS (SELECT 1 FROM mps m WHERE m.forn_hom_id = f.id);

-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL: Listar o que restou
-- ─────────────────────────────────────────────────────────────────────────────
-- Execute separadamente para confirmar:
-- SELECT id, nome, mps_ativas, cnpj FROM fornecedores ORDER BY nome;

COMMIT;
