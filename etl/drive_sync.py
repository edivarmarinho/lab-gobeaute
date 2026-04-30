"""
ETL — Google Drive → Supabase
Lab Gobeaute P&D

O que faz:
  1. Autentica na Google Drive API via Service Account
  2. Lista todos os arquivos na pasta DRIVE_FOLDER_ID (e subpastas)
  3. Para cada arquivo novo (drive_file_id não existe no Supabase):
     - Extrai metadados: nome, tipo de documento, MP associada, fornecedor
     - Cria registro na tabela `documentos` com status 'Em Revisão'
  4. Registra execução na tabela `drive_sync_log`

Variáveis de ambiente necessárias (GitHub Secrets):
  GOOGLE_SERVICE_ACCOUNT_KEY  — JSON completo da service account (string)
  SUPABASE_URL                — https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY   — chave service_role do Supabase
  DRIVE_FOLDER_ID             — ID da pasta raiz no Google Drive
"""

import os
import json
import re
import sys
from datetime import datetime, date
from typing import Optional

# pip install google-api-python-client google-auth supabase
from googleapiclient.discovery import build
from google.oauth2 import service_account
from supabase import create_client, Client


# ── Configuração ───────────────────────────────────────────────────────────────

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']
DRIVE_FOLDER_ID = os.environ['DRIVE_FOLDER_ID']
SERVICE_ACCOUNT_JSON = os.environ['GOOGLE_SERVICE_ACCOUNT_KEY']


# ── Mapeamento de tipo de documento pelo nome do arquivo ──────────────────────
# Convençao de nomenclatura esperada na pasta Drive:
#   FISPQ_MP0011_Glicerina_ANASTACIO.pdf
#   COA_MP0033_Lote2604A_CHEMAX.pdf
#   ISO22716_BASF_2025.pdf
#   FT_MP0001_TINOGARD_BASF.pdf
#   LAUDO_MICRO_FKOK001_v3.pdf

TIPO_MAP = {
    r'^FISPQ_':           'FISPQ',
    r'^COA_':             'COA',
    r'^FT_':              'Ficha Técnica',
    r'^ISO22716_':        'ISO 22716',
    r'^ISO9001_':         'ISO 9001',
    r'^LAUDO_MICRO_':     'Laudo Microbiológico',
    r'^DECL_':            'Decl. Conformidade',
}

MP_PATTERN = re.compile(r'MP(\d{4})', re.IGNORECASE)


def detectar_tipo(nome_arquivo: str) -> str:
    for pattern, tipo in TIPO_MAP.items():
        if re.match(pattern, nome_arquivo, re.IGNORECASE):
            return tipo
    return 'Outro'


def extrair_mp_codigo(nome_arquivo: str) -> Optional[str]:
    m = MP_PATTERN.search(nome_arquivo)
    if m:
        return f"MP{m.group(1).zfill(4)}"
    return None


def extrair_fornecedor_nome(nome_arquivo: str, supabase: Client) -> Optional[str]:
    """Tenta identificar o fornecedor pelo nome do arquivo comparando com a base."""
    res = supabase.table('fornecedores').select('nome').execute()
    fornecedores = [f['nome'].upper() for f in res.data]
    nome_upper = nome_arquivo.upper()
    for forn in fornecedores:
        if forn in nome_upper:
            return forn
    return None


# ── Google Drive helpers ───────────────────────────────────────────────────────

def build_drive_service():
    info = json.loads(SERVICE_ACCOUNT_JSON)
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)


def listar_arquivos_drive(service, folder_id: str) -> list[dict]:
    """Lista todos os arquivos PDF/Excel da pasta e subpastas."""
    arquivos = []
    page_token = None

    while True:
        query = (
            f"'{folder_id}' in parents"
            " and mimeType != 'application/vnd.google-apps.folder'"
            " and trashed = false"
        )
        resp = service.files().list(
            q=query,
            spaces='drive',
            fields='nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, webViewLink)',
            pageToken=page_token,
            pageSize=200,
        ).execute()

        arquivos.extend(resp.get('files', []))
        page_token = resp.get('nextPageToken')
        if not page_token:
            break

    # Recursivo: percorre subpastas
    query_folders = f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    resp_folders = service.files().list(q=query_folders, fields='files(id, name)').execute()
    for subfolder in resp_folders.get('files', []):
        arquivos.extend(listar_arquivos_drive(service, subfolder['id']))

    return arquivos


# ── IDs já sincronizados ───────────────────────────────────────────────────────

def ids_ja_sincronizados(supabase: Client) -> set[str]:
    res = supabase.table('documentos').select('drive_file_id').not_.is_('drive_file_id', 'null').execute()
    return {row['drive_file_id'] for row in res.data}


# ── Resolve FK de fornecedor e MP ─────────────────────────────────────────────

def resolve_fornecedor_id(nome: Optional[str], supabase: Client) -> Optional[str]:
    if not nome:
        return None
    res = supabase.table('fornecedores').select('id').ilike('nome', nome).limit(1).execute()
    return res.data[0]['id'] if res.data else None


def resolve_mp_id(codigo: Optional[str], supabase: Client) -> Optional[str]:
    if not codigo:
        return None
    res = supabase.table('mps').select('id').eq('codigo', codigo).limit(1).execute()
    return res.data[0]['id'] if res.data else None


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print(f"[{datetime.now().isoformat()}] Iniciando Drive Sync — Lab Gobeaute P&D")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    service = build_drive_service()

    print("  → Listando arquivos no Google Drive...")
    arquivos = listar_arquivos_drive(service, DRIVE_FOLDER_ID)
    print(f"  → {len(arquivos)} arquivos encontrados no Drive")

    ja_sincronizados = ids_ja_sincronizados(supabase)
    novos = [a for a in arquivos if a['id'] not in ja_sincronizados]
    print(f"  → {len(novos)} arquivos novos para importar")

    inseridos = 0
    erros = 0

    for arquivo in novos:
        try:
            nome = arquivo['name']
            tipo = detectar_tipo(nome)
            mp_codigo = extrair_mp_codigo(nome)
            forn_nome = extrair_fornecedor_nome(nome, supabase)

            registro = {
                'nome':           nome.replace('.pdf', '').replace('.PDF', ''),
                'tipo':           tipo,
                'mp_codigo':      mp_codigo,
                'mp_id':          resolve_mp_id(mp_codigo, supabase),
                'fornecedor_id':  resolve_fornecedor_id(forn_nome, supabase),
                'fornecedor_nome':forn_nome,
                'status':         'Em Revisão',
                'drive_file_id':  arquivo['id'],
                'drive_url':      arquivo.get('webViewLink'),
                'drive_nome':     nome,
                'data_upload':    arquivo['createdTime'][:10] if arquivo.get('createdTime') else None,
            }

            supabase.table('documentos').insert(registro).execute()
            inseridos += 1
            print(f"    ✓ {nome} → {tipo} | MP: {mp_codigo or '—'} | Forn: {forn_nome or '—'}")

        except Exception as e:
            erros += 1
            print(f"    ✗ ERRO em {arquivo.get('name')}: {e}", file=sys.stderr)

    # Registrar log de execução
    supabase.table('drive_sync_log').insert({
        'arquivos_novos':  inseridos,
        'arquivos_total':  len(arquivos),
        'status':          'ok' if erros == 0 else 'erro',
        'detalhe':         f'{inseridos} inseridos, {erros} erros' if erros > 0 else f'{inseridos} novos documentos importados',
    }).execute()

    print(f"\n[✓] Concluído: {inseridos} inseridos, {erros} erros")
    if erros > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
