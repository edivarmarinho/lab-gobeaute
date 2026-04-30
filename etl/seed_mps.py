#!/usr/bin/env python3
"""
Seed completo: extrai 201 MPs do lab_gobeaute.html e insere no Supabase.
Também insere todos os fornecedores únicos encontrados nos dados.
"""
import re
import json
from decimal import Decimal, InvalidOperation
from typing import Optional
from supabase import create_client, Client

SUPABASE_URL = "https://lbtutajufxswpkifoisw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidHV0YWp1Znhzd3BraWZvaXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU4MzI5NywiZXhwIjoyMDkzMTU5Mjk3fQ.QklNtT2lVC9cBydR_mMekANgdRuBtGoZ1oAeVdmd5ws"
HTML_PATH = "/Users/edivar/Documents/Sourcing e Procurement/Projetos/Lab Gobeaute P&D/lab_gobeaute.html"

BOOL_FIELDS = ["vegano", "cf", "natural", "testadoAnimal", "parabenos"]


def parse_price(val) -> Optional[float]:
    if not val or val == "":
        return None
    try:
        return float(Decimal(str(val)))
    except InvalidOperation:
        return None


def extract_mps(html_path: str) -> list[dict]:
    mps = []
    with open(html_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip().rstrip(",")
            if stripped.startswith('{"codigo": "MP'):
                try:
                    obj = json.loads(stripped)
                    mps.append(obj)
                except json.JSONDecodeError as e:
                    print(f"  ERRO parsing: {e} — linha: {stripped[:80]}")
    return mps


def collect_fornecedores(mps: list[dict]) -> set[str]:
    nomes = set()
    for mp in mps:
        for f in mp.get("fornecedores", []):
            if f:
                nomes.add(f.strip())
        cand = mp.get("fornecedor_candidato", "").strip()
        if cand:
            nomes.add(cand)
        hom = mp.get("forn_hom_bid", "").strip()
        if hom:
            nomes.add(hom)
    return nomes


def upsert_fornecedores(sb: Client, nomes: set[str]) -> dict[str, str]:
    """Upserta fornecedores e retorna mapa nome→id."""
    id_map: dict[str, str] = {}
    rows = [{"nome": n, "uf": "SP", "status": "Em Avaliação"} for n in sorted(nomes)]
    print(f"\nInserindo {len(rows)} fornecedores...")
    for row in rows:
        try:
            res = sb.table("fornecedores").upsert(row, on_conflict="nome").execute()
            if res.data:
                id_map[res.data[0]["nome"]] = res.data[0]["id"]
        except Exception as e:
            print(f"  ERRO fornecedor '{row['nome']}': {e}")

    # Buscar todos para garantir mapa completo (inclui os já existentes)
    all_forn = sb.table("fornecedores").select("id,nome").execute()
    for f in all_forn.data:
        id_map[f["nome"]] = f["id"]
    print(f"  Mapa com {len(id_map)} fornecedores.")
    return id_map


def map_origem(val: str) -> str:
    if val in ("patricia", "bid", "patricia+bid"):
        return val
    return "bid"


def upsert_mps(sb: Client, mps: list[dict], forn_map: dict[str, str]):
    print(f"\nInserindo {len(mps)} MPs...")
    ok = 0
    erros = 0

    for mp in mps:
        for col in BOOL_FIELDS:
            mp.setdefault(col, False)

        forn_hom_nome = (mp.get("forn_hom_bid") or "").strip()
        forn_hom_id = forn_map.get(forn_hom_nome) if forn_hom_nome else None

        row = {
            "codigo":                mp["codigo"],
            "nome":                  mp["nome"],
            "inci":                  mp.get("inci") or None,
            "cas":                   mp.get("cas") or None,
            "categoria":             mp.get("categoria") or None,
            "anvisa":                mp.get("anvisa") or "Livre",
            "homolog":               mp.get("homolog") or "Pendente",
            "vegano":                bool(mp["vegano"]),
            "cf":                    bool(mp["cf"]),
            "origem_natural":        bool(mp["natural"]),
            "testado_animal":        bool(mp["testadoAnimal"]),
            "parabenos":             bool(mp["parabenos"]),
            "preco_ref_usd":         parse_price(mp.get("preco_ref_usd")),
            "melhor_preco_usd":      parse_price(mp.get("melhor_preco_usd")),
            "forn_hom_id":           forn_hom_id,
            "forn_candidato":        mp.get("fornecedor_candidato") or None,
            "forn_hom_bid":          forn_hom_nome or None,
            "status_analise":        mp.get("status_analise") or None,
            "aprovacao_comparativo": mp.get("aprovacao_comparativo") or None,
            "conflito_bid":          mp.get("conflito_bid") or None,
            "origem":                map_origem(mp.get("origem", "bid")),
            "marcas":                mp.get("marcas") or [],
        }

        try:
            sb.table("mps").upsert(row, on_conflict="codigo").execute()
            ok += 1
        except Exception as e:
            print(f"  ERRO MP {mp['codigo']}: {e}")
            erros += 1

    print(f"  MPs: {ok} OK, {erros} erros.")


def upsert_mp_fornecedores(sb: Client, mps: list[dict], forn_map: dict[str, str]):
    """Insere relações MP × Fornecedor na tabela junction."""
    print("\nInserindo relações MP × Fornecedor...")

    # Buscar mapa codigo→id das MPs inseridas
    all_mps = sb.table("mps").select("id,codigo").execute()
    mp_id_map = {m["codigo"]: m["id"] for m in all_mps.data}

    ok = 0
    for mp in mps:
        mp_id = mp_id_map.get(mp["codigo"])
        if not mp_id:
            continue
        for forn_nome in mp.get("fornecedores", []):
            forn_nome = forn_nome.strip()
            forn_id = forn_map.get(forn_nome)
            if not forn_id:
                continue
            try:
                sb.table("mp_fornecedores").upsert(
                    {"mp_id": mp_id, "fornecedor_id": forn_id}
                ).execute()
                ok += 1
            except Exception as e:
                print(f"  ERRO junction {mp['codigo']}×{forn_nome}: {e}")

    print(f"  Relações: {ok} inseridas.")


def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("Extraindo MPs do HTML...")
    mps = extract_mps(HTML_PATH)
    print(f"  {len(mps)} MPs extraídas.")

    nomes_forn = collect_fornecedores(mps)
    forn_map = upsert_fornecedores(sb, nomes_forn)

    upsert_mps(sb, mps, forn_map)
    upsert_mp_fornecedores(sb, mps, forn_map)

    # Atualizar contadores de MPs ativas por fornecedor
    print("\nAtualizando contadores mps_ativas...")
    all_mps = sb.table("mps").select("id").execute()
    total = len(all_mps.data)
    print(f"\nConcluído! {total} MPs no banco.")


if __name__ == "__main__":
    main()
