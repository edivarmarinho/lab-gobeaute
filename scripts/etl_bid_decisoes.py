"""
ETL — CSV de decisões BID 2026 → Supabase Lab Gobeaute.

Uso:
    python scripts/etl_bid_decisoes.py --dry-run            # mostra o que faria
    python scripts/etl_bid_decisoes.py                      # gera SQL stdout pra revisar
    python scripts/etl_bid_decisoes.py --output bid.sql     # grava SQL em arquivo

Lê: db/decisoes_bid_2026-04-23.csv (encoding cp1252/latin-1, separador ';')
Gera: SQL idempotente (INSERT ... ON CONFLICT DO NOTHING/UPDATE) para:
  - bid_decisoes (1 linha por linha do CSV)
  - fornecedores (cria os que faltam, deduplicados)
  - mps (atualiza forn_hom_bid, preco_ref_usd, melhor_preco_usd, homolog quando faltam)
  - pd_projetos (1 por linha A HOMOLOGAR; cria se não existe)
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


def strip_accents(s: str | None) -> str | None:
    if not s:
        return s
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join(c for c in nfkd if not unicodedata.combining(c))

# ─── Configuração ──────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = REPO_ROOT / "db" / "decisoes_bid_2026-04-23.csv"

# CSV vem com mojibake (UTF-8 lido como latin-1 e regravado). Tentamos cp1252 primeiro.
CSV_ENCODINGS = ["utf-8-sig", "utf-8", "cp1252", "latin-1"]
CSV_DELIMITER = ";"


# ─── Normalização de fornecedor ────────────────────────────────────────────────

# Remove sufixo numérico no fim ("KHOL QUIMICA2" → "KHOL QUIMICA").
# Ignora casos onde número é parte legítima do nome (ex: "BARENTZ-1" não existe).
_SUFFIX_RE = re.compile(r"(\d+)\s*$")

def normalize_fornecedor(raw: str | None) -> str | None:
    """Chave de dedup: uppercase, sem acentos, sem sufixo numérico."""
    if not raw:
        return None
    s = raw.strip()
    if not s or s.lower() in {"null", "#ref!"}:
        return None
    s = _SUFFIX_RE.sub("", s).strip()
    s = strip_accents(s) or s
    return s.upper()


def fornecedor_apresentacao(raw: str | None) -> str | None:
    """Versão pra exibir/gravar — uppercase, sem acentos, sem sufixo numérico."""
    return normalize_fornecedor(raw)


def normalize_mp_nome(raw: str | None) -> str | None:
    """Nome de MP: tira acentos, mantém uppercase como veio."""
    if not raw:
        return None
    s = raw.strip()
    if not s:
        return None
    s = strip_accents(s) or s
    return s.upper()


# ─── Parsing numérico ──────────────────────────────────────────────────────────

def parse_num(v: str | None) -> float | None:
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in {"null", "#ref!", "x"}:
        return None
    # CSV brasileiro: vírgula é decimal
    s = s.replace(".", "").replace(",", ".") if s.count(",") == 1 and s.count(".") <= 1 else s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def parse_date_br(v: str | None) -> str | None:
    """DD/MM/YYYY → YYYY-MM-DD"""
    if not v:
        return None
    try:
        return datetime.strptime(v.strip(), "%d/%m/%Y").date().isoformat()
    except ValueError:
        return None


# ─── SQL escape ────────────────────────────────────────────────────────────────

def sql_str(v: str | None) -> str:
    if v is None or v == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def sql_num(v: float | None) -> str:
    if v is None:
        return "NULL"
    return f"{v:.4f}"


# ─── Modelos ───────────────────────────────────────────────────────────────────

@dataclass
class Decisao:
    mp_codigo: str
    mp_nome: str
    fornecedor_raw: str | None
    fornecedor_norm: str | None
    fornecedor_disp: str | None
    estado: str | None
    homologado_no_bid: str | None
    preco_ref: float | None
    preco_dec: float | None
    custo_proj: float | None
    saving_uni_usd: float | None
    saving_uni_pct: float | None
    saving_total: float | None
    volume_anual: float | None
    moq: str | None
    lead_estoque: str | None
    lead_sem_estoque: str | None
    status_bid: str
    acao_obs: str | None
    data_decisao: str | None


# ─── Leitura do CSV ────────────────────────────────────────────────────────────

def read_csv() -> list[Decisao]:
    rows: list[Decisao] = []
    text = None
    used_encoding = None
    for enc in CSV_ENCODINGS:
        try:
            text = CSV_PATH.read_text(encoding=enc)
            used_encoding = enc
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise RuntimeError("Não consegui decodificar o CSV em nenhum encoding.")
    # Remove BOM se presente
    if text.startswith("﻿"):
        text = text[1:]

    reader = csv.DictReader(text.splitlines(), delimiter=CSV_DELIMITER)
    for row in reader:
        # Normaliza cabeçalhos (vieram com mojibake)
        # No CSV original: "Código MP", "Nome MP", "Volume Anual (kg)", "Preço Referência (USD)",
        # "Fornecedor Selecionado", "Estado Fornecedor", "Homologado", "Preço (USD)",
        # "Custo Projetado (USD)", "Saving Unitário (USD)", "Saving Unitário (%)",
        # "Saving Total (USD)", "Lote Mínimo (MOQ)", "Lead Time c/ Estoque",
        # "Lead Time s/ Estoque", "Status", "Ação / Observação", "Data Decisão"
        # Pode haver variação em alguns chars; pegamos por busca tolerante.
        def get(key_substring: str) -> str | None:
            for k, v in row.items():
                if k and key_substring.lower() in k.lower():
                    return v.strip() if v else None
            return None

        mp_cod = get("digo MP") or get("Código MP")
        mp_nome = get("Nome MP")
        if not mp_cod or not mp_nome:
            continue
        if not mp_cod.startswith("MP"):
            continue

        forn_raw = get("Fornecedor Selecionado") or get("Selecionado")
        status = get("Status")
        if not status:
            continue
        status = status.strip().upper()
        if status not in {"DECIDIDO", "A HOMOLOGAR"}:
            continue

        rows.append(Decisao(
            mp_codigo=mp_cod,
            mp_nome=mp_nome,
            fornecedor_raw=forn_raw,
            fornecedor_norm=normalize_fornecedor(forn_raw),
            fornecedor_disp=fornecedor_apresentacao(forn_raw),
            estado=get("Estado"),
            homologado_no_bid=get("Homologado"),
            preco_ref=parse_num(get("Refer")),
            preco_dec=parse_num(get("Pre") and "Preço (USD)"),  # placeholder
            custo_proj=parse_num(get("Projetado")),
            saving_uni_usd=parse_num(get("Saving Unit") if get("Unit") else None),
            saving_uni_pct=parse_num(get("Saving Unit") if get("Unit") else None),
            saving_total=parse_num(get("Saving Total")),
            volume_anual=parse_num(get("Volume Anual")),
            moq=get("MOQ") or get("Mínimo"),
            lead_estoque=get("Lead Time c/"),
            lead_sem_estoque=get("Lead Time s/"),
            status_bid=status,
            acao_obs=get("Observa"),
            data_decisao=parse_date_br(get("Data")),
        ))
    return rows


# Dado o problema do parser tolerante acima ter limitação com chaves duplicadas
# por nome similar, vamos reescrever leitura mais explícita:
def read_csv_v2() -> tuple[list[Decisao], str]:
    text = None
    used_encoding = None
    for enc in CSV_ENCODINGS:
        try:
            text = CSV_PATH.read_text(encoding=enc)
            used_encoding = enc
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise RuntimeError("Não consegui decodificar o CSV.")
    if text.startswith("﻿"):
        text = text[1:]

    lines = text.splitlines()
    if not lines:
        return [], used_encoding or "?"

    # Pega cabeçalho e tenta mapear posicionalmente
    header = [h.strip() for h in lines[0].split(CSV_DELIMITER)]

    # Mapeia índice de cada coluna pelo padrão esperado (case insensitive, ignora mojibake)
    def find_idx(*needles: str) -> int | None:
        for i, h in enumerate(header):
            hl = h.lower()
            if all(n.lower() in hl for n in needles):
                return i
        return None

    idx_mp_cod      = find_idx("digo", "mp")
    idx_mp_nome     = find_idx("nome", "mp")
    idx_volume      = find_idx("volume", "anual")
    idx_preco_ref   = find_idx("refer")
    idx_forn        = find_idx("fornecedor", "selecionado") or find_idx("selecionado")
    idx_estado      = find_idx("estado", "fornecedor") or find_idx("estado")
    idx_homologado  = find_idx("homologado")
    idx_preco_dec   = None
    # "Preço (USD)" — é o 8º campo, achamos depois do Homologado
    for i, h in enumerate(header):
        if "preço" in h.lower() and "usd" in h.lower() and "refer" not in h.lower() and "saving" not in h.lower():
            idx_preco_dec = i
            break
    idx_custo       = find_idx("custo", "projetado")
    idx_saving_uni_usd = None
    idx_saving_uni_pct = None
    # Saving Unitário (USD) e Saving Unitário (%)
    saving_uni_seen = []
    for i, h in enumerate(header):
        hl = h.lower()
        if "saving" in hl and ("unit" in hl or "unitário" in hl):
            saving_uni_seen.append((i, h))
    for i, h in saving_uni_seen:
        if "%" in h or "pct" in h.lower():
            idx_saving_uni_pct = i
        else:
            idx_saving_uni_usd = i
    idx_saving_total = find_idx("saving", "total")
    idx_moq          = find_idx("mínimo") or find_idx("moq")
    idx_lead_estoque = None
    idx_lead_sem     = None
    for i, h in enumerate(header):
        hl = h.lower()
        if "lead time" in hl:
            if "s/" in hl or "sem" in hl:
                idx_lead_sem = i
            else:
                idx_lead_estoque = i
    idx_status     = find_idx("status")
    idx_acao       = find_idx("observa") or find_idx("ação")
    idx_data       = find_idx("data", "deci") or find_idx("data")

    def at(parts: list[str], i: int | None) -> str | None:
        if i is None or i >= len(parts):
            return None
        v = parts[i].strip()
        return v if v else None

    rows: list[Decisao] = []
    for line in lines[1:]:
        if not line.strip():
            continue
        parts = line.split(CSV_DELIMITER)
        mp_cod = at(parts, idx_mp_cod)
        if not mp_cod or not mp_cod.startswith("MP"):
            continue
        status = at(parts, idx_status)
        if not status:
            continue
        status = status.strip().upper()
        if status not in {"DECIDIDO", "A HOMOLOGAR"}:
            continue

        forn_raw_orig = at(parts, idx_forn)
        # Trata 'null', '#REF!', strings vazias do CSV como ausência real
        if forn_raw_orig and forn_raw_orig.strip().lower() in {"null", "#ref!", ""}:
            forn_raw_orig = None
        forn_raw = strip_accents(forn_raw_orig.upper()) if forn_raw_orig else None
        rows.append(Decisao(
            mp_codigo=mp_cod,
            mp_nome=normalize_mp_nome(at(parts, idx_mp_nome)) or "",
            fornecedor_raw=forn_raw,  # já uppercase + sem acento (preserva sufixo numérico se houver)
            fornecedor_norm=normalize_fornecedor(forn_raw_orig),
            fornecedor_disp=fornecedor_apresentacao(forn_raw_orig),
            estado=at(parts, idx_estado),
            homologado_no_bid=at(parts, idx_homologado),
            preco_ref=parse_num(at(parts, idx_preco_ref)),
            preco_dec=parse_num(at(parts, idx_preco_dec)),
            custo_proj=parse_num(at(parts, idx_custo)),
            saving_uni_usd=parse_num(at(parts, idx_saving_uni_usd)),
            saving_uni_pct=parse_num(at(parts, idx_saving_uni_pct)),
            saving_total=parse_num(at(parts, idx_saving_total)),
            volume_anual=parse_num(at(parts, idx_volume)),
            moq=at(parts, idx_moq),
            lead_estoque=strip_accents(at(parts, idx_lead_estoque)),
            lead_sem_estoque=strip_accents(at(parts, idx_lead_sem)),
            status_bid=status,
            acao_obs=strip_accents(at(parts, idx_acao)),
            data_decisao=parse_date_br(at(parts, idx_data)),
        ))

    return rows, used_encoding or "?"


# ─── Geração de SQL ────────────────────────────────────────────────────────────

def gerar_sql(decisoes: list[Decisao]) -> tuple[str, dict]:
    fornecedores_unicos: dict[str, str] = {}  # norm → display
    for d in decisoes:
        if d.fornecedor_norm and d.fornecedor_disp:
            fornecedores_unicos.setdefault(d.fornecedor_norm, d.fornecedor_disp)

    sql_parts: list[str] = []
    sql_parts.append("-- =============================================================================")
    sql_parts.append(f"-- ETL BID Decisões → Lab — gerado em {datetime.now().isoformat(timespec='seconds')}")
    sql_parts.append(f"-- Linhas processadas: {len(decisoes)}")
    sql_parts.append(f"-- Fornecedores únicos (após normalização): {len(fornecedores_unicos)}")
    sql_parts.append("-- =============================================================================")
    sql_parts.append("")
    sql_parts.append("BEGIN;")
    sql_parts.append("")

    # 1. Fornecedores: insere os que não existem (match por nome ILIKE)
    sql_parts.append("-- 1. FORNECEDORES (cria os ausentes; match case-insensitive por nome)")
    for norm, disp in sorted(fornecedores_unicos.items()):
        sql_parts.append(
            f"INSERT INTO public.fornecedores (nome, status) "
            f"SELECT {sql_str(disp)}, 'Em Avaliação' "
            f"WHERE NOT EXISTS (SELECT 1 FROM public.fornecedores WHERE upper(nome) = {sql_str(norm)});"
        )
    sql_parts.append("")

    # 2. bid_decisoes: multi-row INSERT (mais compacto pra envio em batch)
    sql_parts.append("-- 2. BID_DECISOES (1 linha por linha do CSV — multi-row INSERT)")
    sql_parts.append(
        "INSERT INTO public.bid_decisoes "
        "(mp_codigo, mp_nome, fornecedor_nome, fornecedor_normalizado, "
        "estado_fornecedor, homologado_no_bid, preco_referencia_usd, preco_decidido_usd, "
        "custo_projetado_usd, saving_unitario_usd, saving_unitario_pct, saving_total_usd, "
        "volume_anual_kg, moq, lead_time_estoque, lead_time_sem_estoque, status_bid, "
        "acao_observacao, data_decisao) VALUES"
    )
    values_rows = []
    for d in decisoes:
        values_rows.append(
            "(" +
            f"{sql_str(d.mp_codigo)}, {sql_str(d.mp_nome)}, {sql_str(d.fornecedor_raw)}, "
            f"{sql_str(d.fornecedor_norm)}, "
            f"{sql_str(d.estado)}, {sql_str(d.homologado_no_bid)}, "
            f"{sql_num(d.preco_ref)}, {sql_num(d.preco_dec)}, {sql_num(d.custo_proj)}, "
            f"{sql_num(d.saving_uni_usd)}, {sql_num(d.saving_uni_pct)}, {sql_num(d.saving_total)}, "
            f"{sql_num(d.volume_anual)}, {sql_str(d.moq)}, "
            f"{sql_str(d.lead_estoque)}, {sql_str(d.lead_sem_estoque)}, "
            f"{sql_str(d.status_bid)}, {sql_str(d.acao_obs)}, "
            f"{sql_str(d.data_decisao) if d.data_decisao else 'NULL'}"
            ")"
        )
    sql_parts.append(",\n".join(values_rows))
    sql_parts.append("ON CONFLICT (mp_codigo, fornecedor_nome, status_bid) DO NOTHING;")
    sql_parts.append("")
    # Posteriormente preencher fornecedor_id num UPDATE batch:
    sql_parts.append("UPDATE public.bid_decisoes b SET fornecedor_id = f.id "
                     "FROM public.fornecedores f "
                     "WHERE b.fornecedor_id IS NULL "
                     "AND upper(f.nome) = b.fornecedor_normalizado;")
    sql_parts.append("")

    # 3. Atualizar mps com info do BID quando MP existe e campos estão vazios
    sql_parts.append("-- 3. MPS — atualizar campos vazios com dados BID (NUNCA sobrescreve não-nulos)")
    decididos_unicos: dict[str, Decisao] = {}
    for d in decisoes:
        if d.status_bid == "DECIDIDO" and d.fornecedor_norm:
            # Pega só a primeira decisão DECIDIDO por MP (deveria ser uma só)
            decididos_unicos.setdefault(d.mp_codigo, d)

    for mp_cod, d in sorted(decididos_unicos.items()):
        sql_parts.append(
            "UPDATE public.mps SET "
            f"preco_ref_usd = COALESCE(preco_ref_usd, {sql_num(d.preco_ref)}), "
            f"melhor_preco_usd = COALESCE(melhor_preco_usd, {sql_num(d.preco_dec)}), "
            f"forn_hom_bid = COALESCE(NULLIF(forn_hom_bid,''), {sql_str(d.fornecedor_disp)}), "
            f"forn_hom_id = COALESCE(forn_hom_id, "
            f"(SELECT id FROM public.fornecedores WHERE upper(nome) = {sql_str(d.fornecedor_norm)} LIMIT 1)), "
            f"homolog = CASE WHEN homolog IN ('Pendente','Em Processo') THEN 'Homologada' ELSE homolog END, "
            f"origem = CASE WHEN origem = 'patricia' THEN 'patricia+bid' ELSE origem END "
            f"WHERE codigo = {sql_str(mp_cod)};"
        )
    sql_parts.append("")

    # 4. pd_projetos: cria 1 projeto por linha A HOMOLOGAR (se não existe)
    sql_parts.append("-- 4. PD_PROJETOS — 1 projeto por linha A HOMOLOGAR")
    contador = 0
    for d in decisoes:
        if d.status_bid != "A HOMOLOGAR" or not d.fornecedor_norm:
            continue
        contador += 1
        # Código único: PD-HOM-{MP}-{FORN_SLUG}
        forn_slug = re.sub(r"[^A-Z0-9]+", "_", d.fornecedor_norm)[:30].strip("_")
        codigo = f"PD-HOM-{d.mp_codigo}-{forn_slug}"
        nome = f"Homologação {d.mp_nome} ({d.fornecedor_disp})"
        briefing = (
            f"Origem: BID 2026 ({d.data_decisao or 'sem data'}). "
            f"Preço alvo: USD {d.preco_ref or '-'}. "
            f"Preço fechado: USD {d.preco_dec or '-'}. "
            f"Saving estimado: {d.saving_uni_pct or 0}%. "
            f"Volume: {d.volume_anual or 0} kg/ano. "
            f"Ação: {d.acao_obs or '-'}"
        )
        sql_parts.append(
            "INSERT INTO public.pd_projetos "
            "(codigo, nome, marca, tipo, etapa, status, briefing, "
            "mp_codigo, mp_id, fornecedor_nome, fornecedor_id, tipo_projeto, "
            "bid_decisao_id, saving_estimado_usd, saving_pct) "
            "SELECT "
            f"{sql_str(codigo)}, {sql_str(nome)}, 'Homologação', 'Cosmético', "
            "'Briefing/Conceito', 'Em andamento', "
            f"{sql_str(briefing)}, "
            f"{sql_str(d.mp_codigo)}, "
            f"(SELECT id FROM public.mps WHERE codigo = {sql_str(d.mp_codigo)} LIMIT 1), "
            f"{sql_str(d.fornecedor_disp)}, "
            f"(SELECT id FROM public.fornecedores WHERE upper(nome) = {sql_str(d.fornecedor_norm)} LIMIT 1), "
            "'Homologação MP', "
            "(SELECT id FROM public.bid_decisoes "
            f"WHERE mp_codigo = {sql_str(d.mp_codigo)} "
            f"AND fornecedor_nome = {sql_str(d.fornecedor_raw)} "
            f"AND status_bid = 'A HOMOLOGAR' LIMIT 1), "
            f"{sql_num(d.saving_total)}, {sql_num(d.saving_uni_pct)} "
            f"WHERE NOT EXISTS (SELECT 1 FROM public.pd_projetos WHERE codigo = {sql_str(codigo)});"
        )
    sql_parts.append("")
    sql_parts.append(f"-- Total projetos P&D a criar (A HOMOLOGAR): {contador}")
    sql_parts.append("")
    sql_parts.append("COMMIT;")

    stats = {
        "linhas_csv": len(decisoes),
        "decididos": sum(1 for d in decisoes if d.status_bid == "DECIDIDO"),
        "a_homologar": sum(1 for d in decisoes if d.status_bid == "A HOMOLOGAR"),
        "fornecedores_unicos": len(fornecedores_unicos),
        "mps_unicos_decididos": len(decididos_unicos),
        "projetos_a_criar": contador,
    }
    return "\n".join(sql_parts), stats


# ─── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="só mostra estatísticas, não imprime SQL")
    ap.add_argument("--output", help="grava SQL em arquivo (default: stdout)")
    args = ap.parse_args()

    decisoes, encoding = read_csv_v2()
    sql_text, stats = gerar_sql(decisoes)

    print(f"# CSV decodificado com encoding: {encoding}", file=sys.stderr)
    print(f"# Estatísticas:", file=sys.stderr)
    for k, v in stats.items():
        print(f"#   {k}: {v}", file=sys.stderr)

    # Lista alguns fornecedores únicos pra verificação
    print("# Amostra de fornecedores normalizados:", file=sys.stderr)
    seen = set()
    for d in decisoes:
        if d.fornecedor_norm and d.fornecedor_norm not in seen:
            seen.add(d.fornecedor_norm)
            if len(seen) <= 15:
                print(f"#   {d.fornecedor_raw!r} → {d.fornecedor_norm!r}", file=sys.stderr)

    if args.dry_run:
        return 0

    if args.output:
        Path(args.output).write_text(sql_text, encoding="utf-8")
        print(f"# SQL gravado em: {args.output}", file=sys.stderr)
    else:
        print(sql_text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
