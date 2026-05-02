-- =============================================================================
-- Lab Gobeaute P&D — Migration 001
-- Tabelas: audit_log, sessions, convites, compliance_flags
-- Executar no SQL Editor do Supabase Lab (lbtutajufxswpkifoisw)
-- =============================================================================

-- ── Audit Log Imutável ────────────────────────────────────────────────────────
-- Registra TODA alteração no sistema: entidade, campo, valor anterior/novo, usuário
CREATE TABLE IF NOT EXISTS audit_log (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entidade     text NOT NULL,                          -- 'formulas', 'mps', 'fornecedores', etc.
  entidade_id  uuid NOT NULL,                          -- ID do registro alterado
  acao         text NOT NULL                           -- 'create', 'update', 'delete', 'status_change', 'approve', 'reject'
                 CHECK (acao IN ('create','update','delete','status_change','approve','reject','view')),
  campo        text,                                   -- campo alterado (NULL para create/delete)
  valor_antes  text,                                   -- valor anterior (JSON serializado se necessário)
  valor_depois text,                                   -- novo valor
  usuario_id   uuid REFERENCES auth.users(id),
  usuario_nome text,
  usuario_email text,
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Audit log é append-only — sem update/delete
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario  ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_data     ON audit_log(created_at DESC);

-- RLS: somente leitura para autenticados; escrita apenas via service_role
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_leitura_admin" ON audit_log
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "audit_escrita_service" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ── Sessions / Histórico de Acesso ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    uuid NOT NULL REFERENCES auth.users(id),
  usuario_email text NOT NULL,
  ip_address    text,
  user_agent    text,
  signed_in_at  timestamptz NOT NULL DEFAULT now(),
  signed_out_at timestamptz,
  duracao_min   int GENERATED ALWAYS AS (
    CASE WHEN signed_out_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (signed_out_at - signed_in_at))::int / 60
      ELSE NULL
    END
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_sessions_usuario ON user_sessions(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessions_data    ON user_sessions(signed_in_at DESC);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_admin_leitura" ON user_sessions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sessions_service_escrita" ON user_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- ── Convites de Usuários ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_invites (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        text NOT NULL UNIQUE,
  role         text NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('admin','pd','viewer')),
  marcas       text[] DEFAULT '{}',
  token        text NOT NULL UNIQUE,                   -- token de convite (UUID)
  convidado_por uuid REFERENCES auth.users(id),
  convidado_por_nome text,
  status       text NOT NULL DEFAULT 'pendente'
                 CHECK (status IN ('pendente','aceito','expirado','cancelado')),
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invites_email  ON user_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token  ON user_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_status ON user_invites(status);

ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_admin_leitura" ON user_invites
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invites_service_escrita" ON user_invites
  FOR ALL USING (auth.role() = 'service_role');

-- ── Flags de Compliance por Fórmula ──────────────────────────────────────────
-- Resultado da verificação de compliance por ingrediente
CREATE TABLE IF NOT EXISTS formula_compliance (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_id        uuid NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  formula_versao    text NOT NULL DEFAULT 'v1',
  ingrediente_id    uuid REFERENCES formula_ingredientes(id) ON DELETE CASCADE,
  mp_nome           text NOT NULL,
  regra             text NOT NULL,                     -- ex: 'ANVISA_RESTRICAO', 'CONC_MAX', 'PROIBIDO', 'ALERGENO'
  severidade        text NOT NULL DEFAULT 'warning'
                      CHECK (severidade IN ('ok','info','warning','error')),
  descricao         text NOT NULL,
  resolucao_anvisa  text,                              -- ex: 'IN 39/2016', 'RDC 44/2012'
  valor_declarado   text,
  limite_maximo     text,
  ativo             boolean NOT NULL DEFAULT true,
  verificado_em     timestamptz NOT NULL DEFAULT now(),
  verificado_por    text DEFAULT 'sistema'
);

CREATE INDEX IF NOT EXISTS idx_compliance_formula ON formula_compliance(formula_id);
CREATE INDEX IF NOT EXISTS idx_compliance_sev     ON formula_compliance(severidade);

ALTER TABLE formula_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_leitura" ON formula_compliance
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "compliance_escrita" ON formula_compliance
  FOR ALL USING (auth.role() = 'service_role');

-- ── Substâncias Restritas / Proibidas ANVISA ─────────────────────────────────
CREATE TABLE IF NOT EXISTS anvisa_restricoes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_substancia text NOT NULL,
  inci           text,
  cas            text,
  tipo           text NOT NULL
                   CHECK (tipo IN ('proibida','restrita','permitida_limite','alergeno_declaravel')),
  concentracao_max text,                               -- ex: '0.4%' ou 'q.s.'
  condicao       text,                                 -- condições de uso permitido
  resolucao      text NOT NULL,                        -- ex: 'IN 39/2016 Anexo I', 'RDC 44/2012'
  observacao     text,
  ativo          boolean NOT NULL DEFAULT true,
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anvisa_nome ON anvisa_restricoes(nome_substancia);
CREATE INDEX IF NOT EXISTS idx_anvisa_inci ON anvisa_restricoes(inci);
CREATE INDEX IF NOT EXISTS idx_anvisa_tipo ON anvisa_restricoes(tipo);

ALTER TABLE anvisa_restricoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anvisa_restricoes_leitura" ON anvisa_restricoes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "anvisa_restricoes_admin" ON anvisa_restricoes
  FOR ALL USING (auth.role() = 'service_role');

-- ── Enriquecer tabela profiles ────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ultimo_acesso   timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_acessos   int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ativo           boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS convidado_por   uuid;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS departamento    text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargo           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefone        text;

-- ── Enriquecer tabela formulas ────────────────────────────────────────────────
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS anvisa_grau        text CHECK (anvisa_grau IN ('Grau 1','Grau 2'));
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS anvisa_num_reg     text;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS anvisa_data_reg    date;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS compliance_status  text DEFAULT 'nao_verificado'
  CHECK (compliance_status IN ('ok','warning','error','nao_verificado'));
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS forma_cosmetica    text;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS aprovado_por       uuid REFERENCES auth.users(id);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS aprovado_em        timestamptz;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS rejeitado_por      uuid REFERENCES auth.users(id);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS rejeitado_em       timestamptz;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS rejeicao_motivo    text;

-- ── Enriquecer tabela formula_ingredientes ────────────────────────────────────
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS fase           text DEFAULT 'Fase A';
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS percentual_min text;
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS percentual_max text;
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS percentual_anvisa text;  -- % conforme reg ANVISA
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS ordem          int DEFAULT 0;
ALTER TABLE formula_ingredientes ADD COLUMN IF NOT EXISTS compliance_flag text DEFAULT 'ok'
  CHECK (compliance_flag IN ('ok','warning','error','nao_verificado'));

-- ── Enriquecer tabela mps ─────────────────────────────────────────────────────
ALTER TABLE mps ADD COLUMN IF NOT EXISTS concentracao_max_br text;      -- máx ANVISA
ALTER TABLE mps ADD COLUMN IF NOT EXISTS concentracao_max_eu text;       -- máx EU
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_alergeno        boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_cmr             boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_nanomaterial    boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_preservante     boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_corante         boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS flag_filtro_uv       boolean DEFAULT false;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS funcao_cosmetica     text[];   -- ['Emoliente','Emulsificante']
ALTER TABLE mps ADD COLUMN IF NOT EXISTS composicao_qualitativa text;   -- disclosure fornecedor
ALTER TABLE mps ADD COLUMN IF NOT EXISTS ultimo_coa_data      date;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS proximo_coa_data     date;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS custo_kg_brl         numeric(12,4);
ALTER TABLE mps ADD COLUMN IF NOT EXISTS anvisa_restricao     text;     -- ref. à anvisa_restricoes

-- ── Índices de performance ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_formulas_compliance ON formulas(compliance_status);
CREATE INDEX IF NOT EXISTS idx_formulas_grau       ON formulas(anvisa_grau);
CREATE INDEX IF NOT EXISTS idx_mps_flags           ON mps(flag_alergeno, flag_cmr, flag_preservante);
