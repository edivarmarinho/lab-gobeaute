# Guia de Setup — Lab Gobeaute P&D
**Execute nesta ordem. O que eu faço automaticamente está marcado com 🤖. O que você precisa fazer está marcado com 👤.**

---

## PARTE 1 — Google Cloud (Google Drive API)

### Passo 1 — Criar projeto no Google Cloud 👤
1. Acesse: https://console.cloud.google.com
2. Clique em **Select a project → New Project**
3. Nome: `lab-gobeaute`
4. Clique em **Create**

### Passo 2 — Ativar a Drive API 👤
1. No menu lateral: **APIs & Services → Library**
2. Busque `Google Drive API`
3. Clique em **Enable**

### Passo 3 — Criar Service Account 👤
1. **APIs & Services → Credentials → Create Credentials → Service Account**
2. Nome: `lab-gobeaute-drive`
3. Clique em **Create and Continue → Done**
4. Clique na service account criada → aba **Keys → Add Key → Create new key → JSON**
5. Salva o arquivo `.json` baixado (você vai precisar dele)

### Passo 4 — Compartilhar a pasta do Drive com a service account 👤
1. Abra a pasta do Drive que contém os documentos do Lab P&D
2. Clique em **Compartilhar**
3. Cole o e-mail da service account (ex: `lab-gobeaute-drive@lab-gobeaute.iam.gserviceaccount.com`)
4. Permissão: **Visualizador** (read-only é suficiente)
5. Clique em **Enviar**
6. **Copie o ID da pasta** — está na URL: `drive.google.com/drive/folders/`**`ESTE_ID_AQUI`**

> **Me manda:** o conteúdo do arquivo `.json` da service account + o ID da pasta do Drive

---

## PARTE 2 — Supabase

### Passo 5 — Criar projeto Supabase 👤
1. Acesse: https://supabase.com → **New project**
2. Nome: `lab-gobeaute`
3. Região: **South America (São Paulo)**
4. Anote a senha do banco (guarde bem)
5. Clique em **Create new project** (leva ~2 min)

### Passo 6 — Executar o schema SQL 👤
1. No Supabase: **SQL Editor → New query**
2. Cole o conteúdo de `db/schema.sql` (arquivo gerado neste projeto)
3. Clique em **Run**
4. Deve mostrar "Success" sem erros

### Passo 7 — Configurar autenticação Google (OAuth) 👤
1. No Supabase: **Authentication → Providers → Google**
2. **Enable Google provider**
3. Acesse o Google Cloud Console → **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorized redirect URIs: `https://SEU_PROJETO.supabase.co/auth/v1/callback`
6. Copie o **Client ID** e **Client Secret** e cole no Supabase
7. Em **Email Domains**: adicione `gobeaute.com.br` (restringe acesso ao domínio)

### Passo 8 — Pegar as chaves do Supabase 👤
1. **Settings → API**
2. Copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` *(não expor nunca no frontend)*

> **Me manda:** as 3 chaves acima para eu criar o arquivo `.env.local`

---

## PARTE 3 — GitHub

### Passo 9 — Criar repositório 👤
1. https://github.com/new
2. Nome: `lab-gobeaute`
3. **Private** (dados sensíveis de P&D)
4. Clique em **Create repository**

### Passo 10 — Subir o projeto 👤
```bash
cd "/Users/edivar/Documents/Sourcing e Procurement/Projetos/Lab Gobeaute P&D/lab-gobeaute-app"
git init
git add .
git commit -m "feat: setup inicial Lab Gobeaute P&D"
git remote add origin https://github.com/SEU_ORG/lab-gobeaute.git
git push -u origin main
```

### Passo 11 — Adicionar GitHub Secrets 👤
1. No repositório: **Settings → Secrets and variables → Actions → New repository secret**
2. Adicione estes 5 secrets:

| Nome | Valor |
|------|-------|
| `SUPABASE_URL` | https://xxx.supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhb... |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account",...}` (JSON inteiro numa linha) |
| `DRIVE_FOLDER_ID` | ID da pasta do Drive (Passo 4) |
| `VERCEL_DEPLOY_HOOK_URL` | (preenchido após o Passo 14) |

---

## PARTE 4 — Vercel (deploy)

### Passo 12 — Importar projeto no Vercel 👤
1. https://vercel.com → **Add New → Project**
2. Selecione o repositório `lab-gobeaute`
3. Framework: **Next.js** (detecta automaticamente)
4. Clique em **Deploy**

### Passo 13 — Adicionar variáveis de ambiente no Vercel 👤
1. **Settings → Environment Variables**
2. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Passo 14 — Criar Deploy Hook (para auto-deploy) 👤
1. **Settings → Git → Deploy Hooks → Create Hook**
2. Nome: `github-actions`
3. Branch: `main`
4. Copie a URL gerada
5. Volte ao GitHub → **Secrets** → atualize o secret `VERCEL_DEPLOY_HOOK_URL` com essa URL

---

## PARTE 5 — Seed inicial 🤖 (eu executo após você me mandar as chaves)

```bash
cd "/Users/edivar/Documents/Sourcing e Procurement/Projetos/Lab Gobeaute P&D/lab-gobeaute-app"
pip install supabase
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python etl/seed.py
```

---

## PARTE 6 — Testar Drive Sync 👤

Após tudo configurado, execute manualmente pela primeira vez:
1. GitHub → **Actions → Drive Sync — Lab Gobeaute P&D → Run workflow**
2. Aguarde ~2 minutos
3. Verifique no Supabase: **Table Editor → documentos** — os PDFs da pasta Drive devem aparecer com status "Em Revisão"

---

## Resumo do fluxo automático (pós-setup)

```
Google Drive (pasta P&D)
        ↓  (a cada 6h via GitHub Actions)
  drive_sync.py detecta arquivos novos
        ↓
  Supabase: tabela `documentos` atualizada
        ↓
  Vercel: deploy disparado automaticamente
        ↓
  Sistema atualizado em produção
```

---

## Convenção de nomenclatura dos arquivos no Drive

Para o ETL detectar automaticamente o tipo, MP e fornecedor:

```
FISPQ_MP0011_Glicerina_ANASTACIO.pdf
COA_MP0033_Lote2604A_CHEMAX.pdf
FT_MP0001_TINOGARD_BASF.pdf
ISO22716_BASF_2026.pdf
ISO9001_KHOL_QUIMICA_2026.pdf
LAUDO_MICRO_FKOK001_v3.pdf
```

---

## O que me pedir para continuar

- **"me manda o JSON da service account"** → eu crio o `.env.local` e configuro o resto
- **"supabase pronto"** → eu rodo o seed dos 201 MPs + 37 fornecedores
- **"vercel URL pronta"** → eu integro a URL no sistema mockup como link de acesso
- **"quero o frontend Next.js"** → eu construo as páginas com dados reais do Supabase
