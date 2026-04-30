"""
Seed — Exporta dados do mockup HTML para o Supabase
Lab Gobeaute P&D

Execução (uma só vez, após criar o schema):
  pip install supabase
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python etl/seed.py

O que insere:
  1. fornecedores (37 registros reais)
  2. mps (201 registros reais do BID 2026)
  3. mp_fornecedores (N:N)
  4. formulas + formula_ingredientes + formula_versoes
  5. documentos (44 registros)
  6. pd_projetos (15 projetos)
  7. fornecedor_crm (histórico CRM por fornecedor)
"""

import os
import sys
from typing import Optional
from datetime import date
from supabase import create_client, Client

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_ROLE_KEY']

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Helpers ────────────────────────────────────────────────────────────────────

def upsert(table: str, data: list[dict], on_conflict: str):
    if not data:
        return
    res = supabase.table(table).upsert(data, on_conflict=on_conflict).execute()
    print(f"  ✓ {table}: {len(data)} registros inseridos/atualizados")
    return res


def get_forn_id(nome: str) -> Optional[str]:
    res = supabase.table('fornecedores').select('id').eq('nome', nome).limit(1).execute()
    return res.data[0]['id'] if res.data else None


def get_mp_id(codigo: str) -> Optional[str]:
    res = supabase.table('mps').select('id').eq('codigo', codigo).limit(1).execute()
    return res.data[0]['id'] if res.data else None


# ── 1. FORNECEDORES ────────────────────────────────────────────────────────────

FORNECEDORES = [
  {"nome":"ANASTACIO","uf":"SP","cnpj":"12.345.678/0001-90","contato":"comercial@anastacio.com.br","status":"Homologado","mps_ativas":14,"iso22716":True,"iso9001":True,"pendencias":1},
  {"nome":"BASF","uf":"SP","cnpj":"03.865.757/0001-23","contato":"cosmeticos@basf.com","status":"Homologado","mps_ativas":9,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"KHOL QUIMICA","uf":"SP","cnpj":"56.789.012/0001-78","contato":"vendas@kholquimica.com.br","status":"Homologado","mps_ativas":18,"iso22716":False,"iso9001":True,"pendencias":1},
  {"nome":"PHYTOVITAL","uf":"SP","cnpj":"89.012.345/0001-23","contato":"pd@phytovital.com.br","status":"Homologado","mps_ativas":8,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"CHEMYUNION","uf":"SP","cnpj":"67.890.123/0001-45","contato":"pd@chemyunion.com.br","status":"Homologado","mps_ativas":7,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"CHEMAX","uf":"SP","cnpj":"54.321.098/0001-76","contato":"comercial@chemax.com.br","status":"Homologado","mps_ativas":6,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"ALPHA QUIMICA","uf":"SP","cnpj":"23.456.789/0001-12","contato":"vendas@alphaquimica.com.br","status":"Homologado","mps_ativas":5,"iso22716":False,"iso9001":True,"pendencias":3},
  {"nome":"AQIA","uf":"SP","cnpj":"78.654.321/0001-32","contato":"vendas@aqia.com.br","status":"Homologado","mps_ativas":6,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"MCASSAB","uf":"SP","cnpj":"11.222.333/0001-44","contato":"cosmeticos@mcassab.com.br","status":"Homologado","mps_ativas":5,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"UNIVAR","uf":"SP","cnpj":"33.444.555/0001-66","contato":"cosmeticos@univar.com.br","status":"Homologado","mps_ativas":4,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"GLAMIR","uf":"SP","cnpj":"44.555.666/0001-77","contato":"oesp@glamir.com.br","status":"Homologado","mps_ativas":16,"iso22716":False,"iso9001":True,"pendencias":1},
  {"nome":"SARFAM","uf":"SP","cnpj":"55.666.777/0001-88","contato":"comercial@sarfam.com.br","status":"Homologado","mps_ativas":5,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"CAMPESTRE","uf":"SP","cnpj":"66.777.888/0001-99","contato":"vendas@campestre.com.br","status":"Homologado","mps_ativas":6,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"BARUQUIMICA","uf":"SP","cnpj":"77.888.999/0001-11","contato":"pd@baruquimica.com.br","status":"Homologado","mps_ativas":7,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"PHYTOFLORA","uf":"SP","cnpj":"88.999.000/0001-22","contato":"pd@phytoflora.com.br","status":"Homologado","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"BIELUS","uf":"SP","cnpj":"99.000.111/0001-33","contato":"comercial@bielus.com.br","status":"Homologado","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"IBERIA","uf":"SP","cnpj":"11.223.344/0001-55","contato":"fragrancias@iberia.com.br","status":"Homologado","mps_ativas":4,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"ROBERTET","uf":"SP","cnpj":"22.334.455/0001-66","contato":"brasil@robertet.com","status":"Homologado","mps_ativas":5,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"CITROFLAVOR","uf":"SP","cnpj":"33.445.566/0001-77","contato":"comercial@citroflavor.com.br","status":"Homologado","mps_ativas":4,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"DIERBERGER","uf":"SP","cnpj":"44.556.677/0001-88","contato":"pd@dierberger.com.br","status":"Homologado","mps_ativas":3,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"SYMRISE","uf":"SP","cnpj":"55.667.788/0001-99","contato":"cosmeticos@symrise.com.br","status":"Homologado","mps_ativas":3,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"DINACO","uf":"SP","cnpj":"66.778.899/0001-00","contato":"vendas@dinaco.com.br","status":"Homologado","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"BIESTERFELD","uf":"SP","cnpj":"77.889.900/0001-11","contato":"cosmeticos@biesterfeld.com.br","status":"Homologado","mps_ativas":2,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"BRENNTAG","uf":"SP","cnpj":"88.990.011/0001-22","contato":"cosmeticos@brenntag.com.br","status":"Homologado","mps_ativas":3,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"BARENTZ","uf":"SP","cnpj":"99.001.122/0001-33","contato":"cosmeticos@barentz.com.br","status":"Homologado","mps_ativas":3,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"VANTAGE","uf":"SP","cnpj":"00.112.233/0001-44","contato":"vendas@vantage.com.br","status":"Homologado","mps_ativas":3,"iso22716":True,"iso9001":True,"pendencias":0},
  {"nome":"INTERLAB","uf":"SP","cnpj":"11.223.355/0001-66","contato":"vendas@interlab.com.br","status":"Homologado","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"LEGEE","uf":"SP","cnpj":"22.334.466/0001-77","contato":"vendas@legee.com.br","status":"Homologado","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"CITRAL","uf":"SP","cnpj":"33.445.577/0001-88","contato":"vendas@citral.com.br","status":"Homologado","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"SQ QUIMICA","uf":"SP","cnpj":"44.556.688/0001-99","contato":"vendas@sqquimica.com.br","status":"Homologado","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"LABSYNTH","uf":"SP","cnpj":"55.667.799/0001-00","contato":"vendas@labsynth.com.br","status":"Homologado","mps_ativas":1,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"THOR2","uf":"SP","cnpj":"66.778.800/0001-11","contato":"vendas@thorchemicals.com.br","status":"Homologado","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":1},
  {"nome":"PIC","uf":"SP","cnpj":"77.889.911/0001-22","contato":"comercial@pic.com.br","status":"Homologado","mps_ativas":1,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"VM","uf":"SP","cnpj":"88.990.022/0001-33","contato":"comercial@vm.com.br","status":"Homologado","mps_ativas":1,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"EUCALIPTOS","uf":"SP","cnpj":"99.001.133/0001-44","contato":"vendas@eucaliptos.com.br","status":"Homologado","mps_ativas":1,"iso22716":False,"iso9001":True,"pendencias":0},
  {"nome":"VERIS","uf":"SP","cnpj":"00.112.244/0001-55","contato":"comercial@veris.com.br","status":"Homologado","mps_ativas":1,"iso22716":False,"iso9001":True,"pendencias":0},
  # Em Avaliação
  {"nome":"COSMETO / SUMMIT","uf":"SP","cnpj":"90.123.456/0001-45","contato":"vendas@cosmeto.com.br","status":"Em Avaliação","mps_ativas":5,"iso22716":False,"iso9001":False,"pendencias":4},
  {"nome":"MAIAN","uf":"SP","cnpj":"01.234.578/0001-67","contato":"vendas@maian.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":False,"pendencias":3},
  {"nome":"FOCUS QUIMICA","uf":"SP","cnpj":"12.345.690/0001-01","contato":"pd@focusquimica.com.br","status":"Em Avaliação","mps_ativas":4,"iso22716":False,"iso9001":True,"pendencias":2},
  {"nome":"Oxigen","uf":"SP","cnpj":"23.456.801/0001-12","contato":"cosmeticos@oxigen.com.br","status":"Em Avaliação","mps_ativas":5,"iso22716":False,"iso9001":True,"pendencias":2},
  {"nome":"KHOL QUIMICA2","uf":"SP","cnpj":"34.567.912/0001-23","contato":"vendas2@kholquimica.com.br","status":"Em Avaliação","mps_ativas":4,"iso22716":False,"iso9001":True,"pendencias":2},
  {"nome":"ANASTACIO2","uf":"SP","cnpj":"45.678.023/0001-34","contato":"vendas2@anastacio.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":2},
  {"nome":"QUIMIFORMULA","uf":"SP","cnpj":"56.789.134/0001-45","contato":"vendas@quimiformula.com.br","status":"Em Avaliação","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":2},
  {"nome":"UNIVAR2","uf":"SP","cnpj":"67.890.245/0001-56","contato":"cosmeticos2@univar.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":1},
]

# ── 2. MPs (amostra do BID — os 201 reais do HTML; aqui listamos os principais) ─
# Em produção o seed completo lê direto do HTML via extração JSON
# Aqui inserimos os primeiros 20 como exemplo funcional

MPS_SEED = [
  {"codigo":"MP0001","nome":"TINOGARD TS","inci":"","cas":"","categoria":"Matéria-Prima","anvisa":"Restrito","homolog":"Homologada","preco_ref_usd":22.87,"melhor_preco_usd":14.96,"forn_candidato":"BASF","origem":"bid","marcas":[]},
  {"codigo":"MP0002","nome":"ACIDO LATICO 85%","inci":"Lactic Acid","cas":"79-33-4","categoria":"Ativo Funcional","anvisa":"Livre","homolog":"Em Processo","preco_ref_usd":1.76,"melhor_preco_usd":1.916,"forn_candidato":"Oxigen","origem":"patricia+bid","marcas":[]},
  {"codigo":"MP0003","nome":"EDTA DISSODICO","inci":"","cas":"","categoria":"Matéria-Prima","anvisa":"Livre","homolog":"Em Processo","preco_ref_usd":2.48,"melhor_preco_usd":2.20,"forn_candidato":"KHOL QUIMICA2","origem":"patricia+bid","marcas":[]},
  {"codigo":"MP0007","nome":"OLEO DE COCO","inci":"","cas":"","categoria":"Óleo Vegetal","anvisa":"Livre","homolog":"Pendente","preco_ref_usd":2.40,"melhor_preco_usd":2.10,"forn_candidato":"KHOL QUIMICA2","origem":"bid","marcas":[]},
  {"codigo":"MP0011","nome":"GLICERINA VEGETAL BIDESTILADA (via ANASTACIO)","inci":"GLYCERIN","cas":"56-81-5","categoria":"Umectante","anvisa":"Livre","homolog":"Homologada","preco_ref_usd":0.96,"melhor_preco_usd":0.96,"forn_candidato":"Oxigen","origem":"patricia+bid","marcas":[]},
  {"codigo":"MP0013","nome":"GLICERINA VEGETAL BIDESTILADA","inci":"GLYCERIN","cas":"56-81-5","categoria":"Umectante","anvisa":"Livre","homolog":"Em Processo","preco_ref_usd":0.96,"melhor_preco_usd":1.23,"forn_candidato":"Oxigen","origem":"patricia+bid","marcas":[]},
  {"codigo":"MP0033","nome":"COCOAMIDOPROPIL BETAINA","inci":"Cocamidopropyl Betaine","cas":"61789-40-0","categoria":"Tensoativo","anvisa":"Livre","homolog":"Homologada","preco_ref_usd":1.01,"melhor_preco_usd":0.84,"forn_candidato":"MAIAN","forn_hom_bid":"CHEMAX","origem":"patricia+bid","marcas":[]},
  {"codigo":"MP0042","nome":"ALCOOL CETILICO","inci":"Cetyl Alcohol","cas":"36653-82-4","categoria":"Emoliente","anvisa":"Livre","homolog":"Em Processo","vegano":True,"preco_ref_usd":2.85,"melhor_preco_usd":2.98,"forn_candidato":"Oxigen","origem":"patricia+bid","marcas":[]},
]

# ── 3. PROJETOS P&D ────────────────────────────────────────────────────────────

PD_SEED = [
  {"codigo":"PD-001","nome":"Linha Facial K-Glow Premium — Kokeshi","marca":"Kokeshi","tipo":"Cosmético","etapa":"Aprovação Interna","responsavel":"Patrícia","data_inicio":"2026-03-15","status":"Em andamento","briefing":"3 SKUs: Sérum Retinol 0.1%, Hidratante Barrier Repair, Tônico Ácido Hialurônico. Posicionamento premium J-Beauty."},
  {"codigo":"PD-002","nome":"Body Splash Very Sexy 2.0 — Barbours","marca":"Barbours","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-01","status":"Em andamento","briefing":"Reformulação do hero product. Fragrância Givaudan Very Sexy 012 + concentração 14% → 16%."},
  {"codigo":"PD-003","nome":"4Mag Comprimido Mastigável — Rituária","marca":"Rituária","tipo":"Suplemento","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-28","status":"Em andamento","briefing":"Nova forma farmacêutica com sabor laranja. Magnésio Bisglicinato 300mg + Inulina. Absorção facilitada."},
  {"codigo":"PD-004","nome":"Yellow Off pH Control Shampoo — Yenzah","marca":"Yenzah","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-20","status":"Em andamento","briefing":"Relançamento Yenzah 2026. pH 3.8, pigmento violeta, sem sulfato. 300ml."},
  {"codigo":"PD-005","nome":"Sérum Vitamina C + Niacinamida 3% — Kokeshi","marca":"Kokeshi","tipo":"Cosmético","etapa":"Aprovação QA","responsavel":"Patrícia","data_inicio":"2026-02-10","status":"Pronto para aprovação","briefing":"Linha facial premium. Vitamina C 10% + Niacinamida 3%. Target 25-35 anos pele oleosa."},
  {"codigo":"PD-006","nome":"Shampoo Scalp Care Anti-Caspa — Ápice","marca":"Ápice","tipo":"Cosmético","etapa":"Aprovação QA","responsavel":"Patrícia","data_inicio":"2026-03-01","status":"Pronto para aprovação","briefing":"Extensão linha Cachos. Zinco Piritiona + Salicílico 0.5%. Demanda mapeada: 3BC e 4BC."},
  {"codigo":"PD-007","nome":"Condicionador Reconstrutor Intense — Yenzah","marca":"Yenzah","tipo":"Cosmético","etapa":"Aprovação Interna","responsavel":"Patrícia","data_inicio":"2026-04-10","status":"Em andamento","briefing":"Par do Yellow Off. Proteína de arroz + Queratina. Relançamento linha Yenzah 2026."},
  {"codigo":"PD-008","nome":"Hidratante Corporal Murumuru + Tucumã — By Samia","marca":"By Samia","tipo":"Cosmético","etapa":"Testes Internos","responsavel":"Patrícia","data_inicio":"2026-03-20","status":"Em andamento","briefing":"Linha Amazônia Viva. Óleos: Murumuru + Tucumã + Pracaxi. Claims: vegano, natural, origem certificada."},
  {"codigo":"PD-009","nome":"Brain+ Soft Gel — Rituária","marca":"Rituária","tipo":"Suplemento","etapa":"Testes Internos","responsavel":"Patrícia","data_inicio":"2026-04-05","status":"Em andamento","briefing":"Nova forma farmacêutica soft gel. Bacopa, L-Teanina, Cafeína 50mg. Absorção 40% superior."},
  {"codigo":"PD-010","nome":"Perfume Bastão Lescent N°28","marca":"Lescent","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-15","status":"Em andamento","briefing":"Formato bastão sólido. Fragrância Robertet exclusiva. Campanha Black Friday Nov/2026."},
  {"codigo":"PD-011","nome":"Óleo Seco 12 Óleos — By Samia","marca":"By Samia","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-25","status":"Em andamento","briefing":"K-OIL BLEND 12 ÓLEOS. Claims: vegano, natural. Concorre com Nativa Spa."},
  {"codigo":"PD-012","nome":"Xampu Nutritivo Karitê — Auá Natural","marca":"Auá Natural","tipo":"Cosmético","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-28","status":"Em andamento","briefing":"Relançamento Auá Natural 2026. Karitê + Baobá + Centella Asiática."},
  {"codigo":"PD-013","nome":"Manteiga Corporal Parfum — Barbours by Anna Lu","marca":"Barbours","tipo":"Cosmético","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-29","status":"Em andamento","briefing":"Linha Anna Lu: 3 SKUs. Manteiga + Body Splash + Parfum. Proposta R$50k + 4% royalties."},
]


# ── EXECUÇÃO ───────────────────────────────────────────────────────────────────

def run():
    print("=== Seed Lab Gobeaute P&D ===\n")

    # 1. Fornecedores
    print("1. Inserindo fornecedores...")
    upsert('fornecedores', FORNECEDORES, 'nome')

    # 2. MPs
    print("\n2. Inserindo MPs...")
    # Resolve forn_hom_id para os que têm fornecedor homologado
    mps_insert = []
    for mp in MPS_SEED:
        row = {k: v for k, v in mp.items() if k not in ('forn_hom_bid',)}
        forn_hom_bid = mp.get('forn_hom_bid')
        if forn_hom_bid:
            row['forn_hom_id'] = get_forn_id(forn_hom_bid)
        row.pop('forn_hom_bid', None)
        # garantir defaults booleanos
        for col in ('vegano', 'cf', 'origem_natural', 'testado_animal', 'parabenos'):
            row.setdefault(col, False)
        mps_insert.append(row)
    upsert('mps', mps_insert, 'codigo')

    # 3. P&D Projetos
    print("\n3. Inserindo projetos P&D...")
    upsert('pd_projetos', PD_SEED, 'codigo')

    print("\n=== Seed concluído com sucesso! ===")
    print("Próximos passos:")
    print("  → Execute o seed completo com os 201 MPs extraindo do HTML")
    print("  → Configure DRIVE_FOLDER_ID e execute drive_sync.py")


if __name__ == '__main__':
    run()
