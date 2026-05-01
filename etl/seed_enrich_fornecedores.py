#!/usr/bin/env python3
"""
Enriquece tabela fornecedores com: whatsapp, site, descricao, especialidade.
Dados pesquisados de fontes abertas (sites oficiais, CNPJ, ABIHPEC).
Execute APÓS rodar db/add_whatsapp.sql no Supabase SQL Editor.
"""
from supabase import create_client, Client

SUPABASE_URL = "https://lbtutajufxswpkifoisw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidHV0YWp1Znhzd3BraWZvaXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU4MzI5NywiZXhwIjoyMDkzMTU5Mjk3fQ.QklNtT2lVC9cBydR_mMekANgdRuBtGoZ1oAeVdmd5ws"

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Formato whatsapp: "5511XXXXXXXX" → abre wa.me/5511XXXXXXXX
ENRICHED = [
    {
        "nome": "ANASTACIO",
        "whatsapp": "551121336619",
        "site": "https://anastacio.com",
        "descricao": "Uma das maiores distribuidoras de químicos da América Latina, fundada em 1941. Conecta ~400 fornecedores globais a clientes em cosméticos, saúde humana, nutrição e aromas. Mais de 10 CDs no Brasil.",
        "especialidade": "Distribuição multissegmento de MP químicas para cosméticos, farma, nutrição, aromas e domissanitários",
        "contatos_extras": [
            {"nome": "José Coimbra", "cargo": "Gerente Comercial", "email": "jose.coimbra@quimicaanastacio.com.br", "telefone": "(11) 2133-6619", "whatsapp": "551121336619"}
        ],
    },
    {
        "nome": "BASF",
        "whatsapp": "551120392273",
        "site": "https://www.basf.com/br/pt",
        "descricao": "Divisão Care Chemicals da BASF SE, líder mundial em insumos para cuidados pessoais. Lab de co-criação em SP. Portfólio: Luviquat, Cremophor, Kollicoat, UV filters.",
        "especialidade": "Ativos, emolientes, tensoativos, polímeros e ingredientes funcionais para Personal Care e Home Care",
        "contatos_extras": [],
    },
    {
        "nome": "CHEMYUNION",
        "whatsapp": "551521022000",
        "site": "https://www.chemyunion.com",
        "descricao": "Maior fabricante nacional de ativos cosméticos, fundada em 1992. Exporta para +50 países. Premiada na in-cosmetics Global 2025 (Silver Sensory Bar Award). P&D próprio robusto.",
        "especialidade": "Ativos cosméticos funcionais: clareadores, antioxidantes, antienvelhecimento, capilares e ativos de alta performance",
        "contatos_extras": [],
    },
    {
        "nome": "CHEMAX",
        "whatsapp": None,
        "site": "https://chemax.com.br",
        "descricao": "Empresa 100% nacional fundada em 1998, especializada em insumos para cosméticos, domissanitários e lubrificantes. Certificação ISO 9001. +25 anos. Portfólio vegan-friendly.",
        "especialidade": "Insumos para cosméticos veganos, domissanitários e lubrificantes; tensoativos, emolientes, conservantes e ativos",
        "contatos_extras": [],
    },
    {
        "nome": "ALPHA QUIMICA",
        "whatsapp": None,
        "site": "https://alphaquimica.com.br",
        "descricao": "Distribuidora de insumos químicos desde 1990, com 3 unidades no Brasil e exportação para ~40 países. Linha própria 'Alpha' com formulações exclusivas. Suporte técnico e personalização.",
        "especialidade": "Distribuição de insumos químicos fracionados, bases e formulações exclusivas para cuidados pessoais",
        "contatos_extras": [],
    },
    {
        "nome": "AQIA",
        "whatsapp": None,
        "site": "https://aqia.net",
        "descricao": "Indústria química 100% brasileira desde 1984. Cria, desenvolve e fabrica ingredientes para cosmético, farma, alimentício e veterinário. Exporta para +20 países. Planta em Guarulhos/SP.",
        "especialidade": "Fabricação de ingredientes cosméticos, excipientes farmacêuticos e ativos para higiene pessoal",
        "contatos_extras": [],
    },
    {
        "nome": "MCASSAB",
        "whatsapp": None,
        "site": "https://distribuicao.mcassab.com.br",
        "descricao": "Braço de distribuição do Grupo MCassab — um dos maiores grupos de distribuição de especialidades do Brasil. 8 unidades de negócio incluindo Personal Care, Farma e Nutrição. Presença na América Latina.",
        "especialidade": "Distribuição de MP e especialidades cosméticas importadas; representação exclusiva de fabricantes globais",
        "contatos_extras": [],
    },
    {
        "nome": "UNIVAR SOLUTIONS",
        "whatsapp": None,
        "site": "https://discover.univarsolutions.com/pt-br",
        "descricao": "Maior distribuidora global de produtos químicos especiais. Operações no Brasil desde 1995, com CDs em SP, PE, SC e Manaus. Distribuidora autorizada de filtros solares Croda.",
        "especialidade": "Distribuição global de ingredientes especiais para Personal Care: filtros UV, emolientes, ativos, tensoativos e polímeros",
        "contatos_extras": [],
    },
    {
        "nome": "GLAMIR",
        "whatsapp": None,
        "site": None,
        "descricao": "Importadora e fabricante de óleos essenciais e produtos aromáticos desde 1966. Produz óleos essenciais (citronela, canela, petit grain, safrol), extratos naturais e resinoides. CNPJ 61.347.167/0001-18.",
        "especialidade": "Óleos essenciais, extratos aromáticos naturais, resinoides e misturas odoriferas para cosméticos e domissanitários",
        "contatos_extras": [],
    },
    {
        "nome": "SARFAM",
        "whatsapp": None,
        "site": "https://sarfam.com.br",
        "descricao": "Distribuidora certificada ISO 9001:2015 de ingredientes cosméticos de alta performance. Representa fabricantes globais premium e distribui bioativos e especialidades para marcas que valorizam ciência.",
        "especialidade": "Distribuição de bioativos, ingredientes funcionais e especialidades cosméticas para skin care e hair care",
        "contatos_extras": [],
    },
    {
        "nome": "CAMPESTRE",
        "whatsapp": "551141780255",
        "site": "https://www.campestre.com.br",
        "descricao": "Especialista em óleos vegetais, animais e minerais desde 1974. Atende cosméticos, alimentício, farma e nutrição animal. Laboratório de controle de qualidade próprio. São Bernardo do Campo/SP.",
        "especialidade": "Óleos vegetais (girassol, palma, soja e especiais), óleos animais e óleo mineral branco para cosméticos",
        "contatos_extras": [],
    },
    {
        "nome": "BARUQUIMICA",
        "whatsapp": "551142478319",
        "site": "https://www.baruquimica.com.br",
        "descricao": "Fabricante e distribuidora de MP para cosméticos e limpeza. Foco em grandes volumes com qualidade. Portfólio: extratos glicólicos, óleos vegetais, manteigas, queratinas, vitaminas. Barueri/SP.",
        "especialidade": "Extratos glicólicos, óleos vegetais, manteigas, queratinas, vitaminas e ativos para cosméticos e limpeza",
        "contatos_extras": [],
    },
    {
        "nome": "ROBERTET BRASIL",
        "whatsapp": None,
        "site": "https://www.robertet.com/en/blog/site/robertet-do-brasil/",
        "descricao": "Subsidiária brasileira do Grupo Robertet (França), no Brasil desde 1963. Nova planta em Barueri/SP com R$ 48 mi de investimento. Clientes: Avon, L'Oréal, Hinode, Embelleza. CNPJ 60.888.260/0001-77.",
        "especialidade": "Fragrâncias naturais e sintéticas, ingredientes aromáticos e matérias-primas naturais para perfumaria e cosméticos",
        "contatos_extras": [],
    },
    {
        "nome": "SYMRISE BRASIL",
        "whatsapp": None,
        "site": "https://www.symrise.com/pt/",
        "descricao": "Subsidiária da Symrise AG (Alemanha), empresa B Corp certificada. Fábrica de ingredientes naturais no Pará e centro criativo de fragrâncias em SP. CNPJ 43.940.758/0001-12.",
        "especialidade": "Fragrâncias, aromas, ingredientes cosméticos ativos, extratos naturais e ingredientes para nutrição de pets",
        "contatos_extras": [],
    },
    {
        "nome": "BRENNTAG BRASIL",
        "whatsapp": None,
        "site": "https://www.brenntag.com/pt-br/",
        "descricao": "Maior distribuidora global de produtos químicos e ingredientes especiais. No Brasil desde 1995, com sites em SE, NE e Sul. Parceiros: IFF, Croda, Evonik, DSM. Referência em conformidade química.",
        "especialidade": "Distribuição global de ingredientes para Personal Care: emolientes, filtros UV, tensoativos, conservantes e polímeros",
        "contatos_extras": [],
    },
    {
        "nome": "BARENTZ BRASIL",
        "whatsapp": "551129747474",
        "site": "https://brasil.barentz.com",
        "descricao": "Distribuidora global de ingredientes especiais para Life Science. Resultado da fusão com Tovani Benzaquen (histórico desde 1992). Adquiriu Volp (2023) e Metachem. Lab de formulação próprio em SP.",
        "especialidade": "Distribuição de ingredientes premium para cosméticos, nutracêuticos, farma e nutrição animal",
        "contatos_extras": [],
    },
    {
        "nome": "PHYTOVITAL",
        "whatsapp": None,
        "site": "https://phytovital.com.br",
        "descricao": "Fornecedor de matérias-primas naturais desde 2000. Portfólio: óleos vegetais, essenciais, extratos, hidrolatos, manteigas, proteínas e vitaminas. Foco em qualidade e rastreabilidade. Duque de Caxias/RJ.",
        "especialidade": "Óleos vegetais, óleos essenciais, extratos vegetais, hidrolatos, manteigas, proteínas hidrolisadas e vitaminas",
        "contatos_extras": [],
    },
    {
        "nome": "KHOL QUIMICA",
        "whatsapp": None,
        "site": None,
        "descricao": "Distribuidora de matérias-primas e ingredientes para a indústria cosmética e química. Atuação B2B em São Paulo, com foco em relacionamento direto com indústrias de cosméticos.",
        "especialidade": "Distribuição de ingredientes cosméticos e químicos especiais",
        "contatos_extras": [],
    },
]

updated = 0
not_found = []

for f in ENRICHED:
    nome = f["nome"]
    r = sb.table("fornecedores").select("id, nome").eq("nome", nome).limit(1).execute()

    if not r.data:
        # tenta match parcial
        r2 = sb.table("fornecedores").select("id, nome").ilike("nome", f"%{nome.split()[0]}%").limit(1).execute()
        if not r2.data:
            not_found.append(nome)
            print(f"  ⚠ Não encontrado: {nome}")
            continue
        row = r2.data[0]
        print(f"  ~ Match parcial: {nome} → {row['nome']}")
    else:
        row = r.data[0]

    payload = {k: v for k, v in {
        "whatsapp": f.get("whatsapp"),
        "site": f.get("site"),
        "descricao": f.get("descricao"),
        "especialidade": f.get("especialidade"),
    }.items() if v is not None}

    sb.table("fornecedores").update(payload).eq("id", row["id"]).execute()
    print(f"  ✓ {row['nome']} — {len(payload)} campos atualizados")
    updated += 1

print(f"\nTotal: {updated} atualizados | {len(not_found)} não encontrados: {not_found}")
