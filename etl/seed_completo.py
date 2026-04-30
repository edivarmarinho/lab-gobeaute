#!/usr/bin/env python3
"""
Seed COMPLETO — insere todos os dados restantes no Supabase Lab Gobeaute P&D:
  1. CRM completo (todos os fornecedores, ~80 eventos, limpa duplicatas)
  2. 5 fórmulas com ingredientes e versões
  3. 44 documentos
  4. 3 registros de homologação em andamento (coluna extra em mps)
"""
from supabase import create_client, Client
from datetime import date

SUPABASE_URL = "https://lbtutajufxswpkifoisw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidHV0YWp1Znhzd3BraWZvaXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU4MzI5NywiZXhwIjoyMDkzMTU5Mjk3fQ.QklNtT2lVC9cBydR_mMekANgdRuBtGoZ1oAeVdmd5ws"

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_forn_id(nome: str):
    r = sb.table("fornecedores").select("id").eq("nome", nome).limit(1).execute()
    return r.data[0]["id"] if r.data else None

def get_mp_id(codigo: str):
    r = sb.table("mps").select("id").eq("codigo", codigo).limit(1).execute()
    return r.data[0]["id"] if r.data else None

def parse_date(s: str):
    if not s or s == "—": return None
    try:
        d, m, y = s.split("/")
        return f"{y}-{m}-{d}"
    except: return None


# =============================================================================
# 1. CRM COMPLETO (substitui os 30 parciais já inseridos)
# =============================================================================

FORNECEDORES_CRM = [
    ("ANASTACIO", [
        {"tipo":"green","titulo":"COA aprovado MP0011 Lote 2604A","data":"10/04/2026","detalhe":"Parâmetros físico-químicos dentro do spec. Aprovado por Patrícia."},
        {"tipo":"yellow","titulo":"Alerta: ISO 22716 vence em Set/2026","data":"01/04/2026","detalhe":"Renovação necessária para manter status homologado."},
        {"tipo":"green","titulo":"Fornecedor recadastrado no Lab Gobeaute","data":"15/03/2026","detalhe":"Migração da base BID 2026 para o Lab P&D."},
        {"tipo":"blue","titulo":"Reunião técnica realizada","data":"20/02/2026","detalhe":"Discussão de novos ativos e preços para BID 2026. Participantes: Edivar, Patrícia, Jéssica."},
    ]),
    ("BASF", [
        {"tipo":"green","titulo":"ISO 22716 renovada","data":"10/03/2026","detalhe":"Certificado válido até Mar/2027. Aprovado por Edivar."},
        {"tipo":"green","titulo":"3 MPs aprovadas em bancada","data":"05/02/2026","detalhe":"MP0001 (TINOGARD TS), MP0029 (ARLYPON TT), MP0470 (Vit. E) aprovadas para uso em Kokeshi e Rituária."},
    ]),
    ("KHOL QUIMICA", [
        {"tipo":"blue","titulo":"Maior carteira de MPs do portfólio Gobeaute","data":"15/03/2026","detalhe":"18 MPs ativas: espessantes, emulsificantes, tensoativos, óleos essenciais e ativos capilares."},
        {"tipo":"yellow","titulo":"ISO 22716 pendente","data":"01/04/2026","detalhe":"Certificação GMP cosméticos requerida para MPs de Kokeshi. Prazo: Jun/2026."},
    ]),
    ("PHYTOVITAL", [
        {"tipo":"green","titulo":"Especialista em extratos e óleos naturais","data":"15/01/2026","detalhe":"8 MPs ativas: Baobá, Rosa Mosqueta, Buriti, Pracaxi, Aloe Vera, Semente de Uva. Referência para By Samia e Ápice."},
        {"tipo":"blue","titulo":"Visita técnica realizada","data":"10/03/2026","detalhe":"Patrícia visitou a planta. Boa estrutura para extração vegetal certificada."},
    ]),
    ("CHEMYUNION", [
        {"tipo":"green","titulo":"Homologação completa","data":"20/01/2026","detalhe":"Todos documentos aprovados. MPs ativas: WAVEMAX, GLYCOSAN, SENSOVEIL, SENSACTIVE, CEREAL MILK, H-VIT."},
        {"tipo":"green","titulo":"Parceiro estratégico para ativos de performance","data":"05/03/2026","detalhe":"Principal fornecedor de ativos tecnológicos premium."},
    ]),
    ("CHEMAX", [
        {"tipo":"green","titulo":"Documentação em dia","data":"01/03/2026","detalhe":"ISO 22716 e ISO 9001 válidas. COAs atualizados."},
        {"tipo":"blue","titulo":"Fornecedor de tensoativos e condicionantes","data":"15/01/2026","detalhe":"MPs: AMIDA 90, SUN QUART CT50, COCOAMIDOPROPIL BETAINA, CL CETIL TRI AMÔNIO, QUIKPEARL, LAURILETERSULFATO."},
    ]),
    ("ALPHA QUIMICA", [
        {"tipo":"red","titulo":"FISPQ vencida — MP0088 (Fenoxietanol + IPBC)","data":"15/04/2026","detalhe":"Documento expirado em 15/04/2026. Fornecedor notificado. Prazo para reenvio: 30/04/2026."},
        {"tipo":"yellow","titulo":"ISO 22716 ausente","data":"01/03/2026","detalhe":"Fornecedor não possui certificação GMP Cosméticos. Em avaliação pela Qualidade."},
        {"tipo":"blue","titulo":"Reativado no BID 2026","data":"10/01/2026","detalhe":"Retorno como candidato para SENSACTIVE e MPs genéricas de baixo risco."},
    ]),
    ("AQIA", [
        {"tipo":"green","titulo":"Documentação completa","data":"20/02/2026","detalhe":"Todos certificados válidos. MPs: REWOPOL SB, VARISOFT BTMS, PALMITATO, CETIOL HE, PLANTCOL, RICE SILK."},
        {"tipo":"blue","titulo":"Parceiro para emulsificantes e ésteres","data":"15/03/2026","detalhe":"Bom nível técnico para emulsificantes de alto desempenho."},
    ]),
    ("MCASSAB", [
        {"tipo":"green","titulo":"Multinacional distribuidor premium","data":"10/01/2026","detalhe":"MPs: EDTA DISSÓDICO, SILICONE 1411, ÁCIDO CÍTRICO ANIDRO, LAURIL ETER SULFATO 70%, ÓLEO MAMONA ETOX."},
    ]),
    ("UNIVAR", [
        {"tipo":"green","titulo":"Distribuidor global com portfolio técnico","data":"15/02/2026","detalhe":"MPs: GOMA GUAR QUATERNIZADA, SILICONE 1411, MAIZECARE POLYMER. Suporte técnico de alta qualidade."},
    ]),
    ("GLAMIR", [
        {"tipo":"blue","titulo":"Principal fornecedor de óleos essenciais","data":"20/01/2026","detalhe":"16 MPs ativas: Bergamota, Alecrim, Lavanda, Mirra, Olibano, Orégano, Patchouli, Palmarosa, Petitgrain, Salvia, Tomilho, Cedro, Jasmim, etc."},
        {"tipo":"yellow","titulo":"ISO 22716 em renovação","data":"01/04/2026","detalhe":"Certificação vence Jul/2026. Documentação em andamento."},
    ]),
    ("SARFAM", [
        {"tipo":"green","titulo":"Documentação em dia","data":"25/03/2026","detalhe":"MPs: CARBOPOL AQUA, EXTRATO HG ROSAS BRANCAS, HYDROVANCE, PROPANEDIOL. Bom relacionamento comercial."},
    ]),
    ("CAMPESTRE", [
        {"tipo":"blue","titulo":"Especialista em óleos vegetais nacionais","data":"10/02/2026","detalhe":"MPs: Óleo de Ricino Hidrogenado, Óleo de Algodão, Amêndoa Doce, Castanha do Pará, Girassol, Abacate."},
    ]),
    ("BARUQUIMICA", [
        {"tipo":"green","titulo":"Especialista em extratos glicólicos","data":"20/02/2026","detalhe":"MPs: Extrato de Buriti, Aloe Vera, Extrato de Sálvia, Flor de Lótus, Extrato de Jojoba, Extrato de Mirra."},
    ]),
    ("PHYTOFLORA", [
        {"tipo":"blue","titulo":"Fornecedor de extratos capilares","data":"05/03/2026","detalhe":"MPs: Óleo Rosa Mosqueta GRAN OILS, Rosa Mosqueta Glicólico, Phytoattive Arroz. Especialidade em capilares."},
    ]),
    ("BIELUS", [
        {"tipo":"blue","titulo":"Óleos exóticos da Amazônia","data":"10/03/2026","detalhe":"MPs: Óleo de Açaí, Castanha do Pará, Copaíba Bálsamo. Certificação de origem rastreável."},
    ]),
    ("IBERIA", [
        {"tipo":"green","titulo":"Óleos essenciais importados homologados","data":"15/01/2026","detalhe":"MPs: Sândalo Amyris, Ylang-ylang III, Noz Moscada, Orégano. Certificados de origem e COAs disponíveis."},
    ]),
    ("ROBERTET", [
        {"tipo":"green","titulo":"Fornecedor premium de aromas e essências","data":"10/03/2026","detalhe":"MPs: Orégano, Mirra, Jasmim, Limão Siciliano, Laranja. Empresa francesa de referência mundial."},
    ]),
    ("CITROFLAVOR", [
        {"tipo":"blue","titulo":"Especialista em cítricos e aromas naturais","data":"20/02/2026","detalhe":"MPs: Laranja, Mirra, Gengibre, Lavanda Francesa. Boa relação custo-benefício."},
    ]),
    ("DIERBERGER", [
        {"tipo":"green","titulo":"Distribuidor premium de óleos naturais","data":"10/04/2026","detalhe":"MPs: Alecrim, Bergamota, Palmarosa. Empresa tradicional com certificação de origem."},
    ]),
    ("SYMRISE", [
        {"tipo":"green","titulo":"Multinacional de fragrâncias e especialidades","data":"15/02/2026","detalhe":"MPs: PARSOL MCX, BENZOFENONA 3, FARNESOL PLUS. Suporte técnico-regulatório completo."},
    ]),
    ("DINACO", [
        {"tipo":"blue","titulo":"MPs específicas de alta especificidade","data":"05/03/2026","detalhe":"MPs: CAPILMAX, CARBOPOL ULTREZ 21, TREALOSE. Nicho de ativos especiais."},
    ]),
    ("BIESTERFELD", [
        {"tipo":"green","titulo":"Distribuidor especializado","data":"20/03/2026","detalhe":"MP: GENENCARE OSMS BA. Distribuidor europeu de alta performance."},
    ]),
    ("BRENNTAG", [
        {"tipo":"green","titulo":"Multinacional distribuidora global","data":"15/03/2026","detalhe":"MPs candidatas: ARLAMOL PS 15E, LIPOCOL SC-20, DIMETHICONE. Excelente suporte regulatório."},
    ]),
    ("BARENTZ", [
        {"tipo":"green","titulo":"Especialista em emulsificantes e umectantes","data":"10/04/2026","detalhe":"MPs: CETEARETH-20, AJIDEW NL-50, POLAWAX NF. Boa qualidade técnica."},
    ]),
    ("VANTAGE", [
        {"tipo":"blue","titulo":"Especialista em conservantes e ésteres","data":"05/04/2026","detalhe":"MPs: MICROCARE PEHG, ARLAMOL PS 15E, FIX VIC. Portfolio de conservantes não-parabênicos."},
    ]),
    ("INTERLAB", [
        {"tipo":"blue","titulo":"Reagentes e ativos de alta pureza","data":"20/03/2026","detalhe":"MPs: AMIDO DE MILHO LT, TREALOSE. Especialidade em ingredientes de pureza analítica."},
    ]),
    ("LEGEE", [
        {"tipo":"blue","titulo":"Óleos essenciais aromáticos","data":"10/02/2026","detalhe":"MPs: Óleo Essencial de Orégano, Lavanda Francesa. Bom custo-benefício."},
    ]),
    ("CITRAL", [
        {"tipo":"blue","titulo":"Óleos cítricos e florais","data":"15/02/2026","detalhe":"MPs: Lavanda 40/42, Jasmim. Parceiro histórico da Rituária e Lescent."},
    ]),
    ("SQ QUIMICA", [
        {"tipo":"blue","titulo":"Silicones especiais","data":"20/03/2026","detalhe":"MPs: SILICONE DC 245, SILICONE DC 193. Distribuidor exclusivo de Dow/Elkem."},
    ]),
    ("LABSYNTH", [
        {"tipo":"blue","titulo":"Reagente de alta pureza","data":"10/01/2026","detalhe":"MP: TRIETANOLAMINA 99. Fornecimento pontual para ajustador de pH grau pureza analítica."},
    ]),
    ("THOR2", [
        {"tipo":"yellow","titulo":"Conservantes com restrição regulatória","data":"15/03/2026","detalhe":"MPs: MISTURA DE ISOTIAZOLINONA, IMIDAZOLIDINYL UREA. Atenção ao limite ANVISA para isotiazolinonas."},
    ]),
    ("PIC", [
        {"tipo":"blue","titulo":"Emulsificante grau cosméticos","data":"05/02/2026","detalhe":"MP: POLAWAX NF. Fornecimento regular para linha de cremes e loções."},
    ]),
    ("VM", [
        {"tipo":"blue","titulo":"Óleo de Rosa Mosqueta GRAN OILS","data":"20/03/2026","detalhe":"MP: MP0480. Qualidade verificada em bancada por Patrícia."},
    ]),
    ("EUCALIPTOS", [
        {"tipo":"blue","titulo":"Óleos essenciais nacionais","data":"15/01/2026","detalhe":"MP: Óleo Essencial de Pimenta Negra. Origem certificada nacional."},
    ]),
    ("VERIS", [
        {"tipo":"blue","titulo":"Óleos essenciais especiais","data":"10/02/2026","detalhe":"MP: Óleo Essencial de Sálvia Esclareia. Fornecedor de nicho."},
    ]),
    ("COSMETO / SUMMIT", [
        {"tipo":"yellow","titulo":"Em processo de homologação","data":"20/04/2026","detalhe":"MPs candidatas: VARISOFT BTMS, TEGO AMID S18, MICA PRATA, VARISOFT BT85, HARMONIE SOFT. 4 documentos pendentes. Prazo: 15/05/2026."},
    ]),
    ("MAIAN", [
        {"tipo":"yellow","titulo":"Candidato para múltiplas MPs","data":"28/04/2026","detalhe":"Candidato para: AMIDA 90, POLÍMERO W-25, LAURIL SULFOSUCCINATO, QUIKPEARL, CL CETIL TRIAMÔNIO, CARBOPOL 980. Aguardando FISPQ e FT."},
    ]),
    ("FOCUS QUIMICA", [
        {"tipo":"yellow","titulo":"Em avaliação para ativos regulatórios","data":"25/04/2026","detalhe":"Candidato para: CARBOPOL ULTREZ 21, MICA PRATA, SILICONE DC 245, LAURIL SULFOSUCCINATO. ISO 22716 pendente."},
    ]),
    ("Oxigen", [
        {"tipo":"yellow","titulo":"Candidato expressivo no BID 2026","data":"10/04/2026","detalhe":"Candidato para Ácido Lático, BHT, Álcool Cetílico, Ácido Cítrico, Glicerina, Vaselina, Vitamina C, Carbopol. Volume relevante no BID."},
    ]),
    ("KHOL QUIMICA2", [
        {"tipo":"yellow","titulo":"Filial/divisão candidata de Khol Química","data":"15/04/2026","detalhe":"Candidata para MPs de óleos vegetais, condicionantes e especialidades. Aguardando segregação CNPJ com matriz."},
    ]),
    ("ANASTACIO2", [
        {"tipo":"yellow","titulo":"Segunda linha comercial da Anastacio","data":"20/04/2026","detalhe":"Candidata para: GLASIK 700, ÁLCOOL CETO ESTERAILICO, VARISOFT BT85, PROPANEDIOL. Definição de carteira em andamento."},
    ]),
    ("QUIMIFORMULA", [
        {"tipo":"yellow","titulo":"Candidato para álcoois e solventes","data":"25/04/2026","detalhe":"Candidato para: ETANOL 96%, EXCEPARL LM-LC. Aguardando análise de preço e qualidade."},
    ]),
    ("UNIVAR2", [
        {"tipo":"yellow","titulo":"Divisão de silicones e polímeros","data":"15/04/2026","detalhe":"Candidato para: DC 200/350, DIMETHICONE, SOFTCAT POLYMER, DC 9040. Aguardando proposta comercial definitiva."},
    ]),
]


# =============================================================================
# 2. FÓRMULAS COMPLETAS
# =============================================================================

FORMULAS = [
    {
        "formula": {"codigo":"F-KOK-001","versao":"v3","produto":"Hidratante Facial Pele de Porcelana 30g","marca":"Kokeshi","tipo":"Cosmético","categoria":"Hidratante Facial","n_mps":8,"status":"Aprovada QA","responsavel":"Patrícia"},
        "ingredientes": [
            {"mp_codigo":"MP0011","nome":"Glicerina Vegetal USP","inci":"GLYCERIN","pct":"5.0","funcao":"Umectante"},
            {"mp_codigo":"MP0038","nome":"Ácido Hialurônico","inci":"SODIUM HYALURONATE","pct":"1.0","funcao":"Ativo Hidratante"},
            {"mp_codigo":"MP0031","nome":"Niacinamida 99%","inci":"NIACINAMIDE","pct":"3.0","funcao":"Ativo Iluminador"},
            {"mp_codigo":"MP0055","nome":"Fenoxietanol","inci":"PHENOXYETHANOL","pct":"0.9","funcao":"Conservante"},
        ],
        "versoes": [
            {"versao":"v3","data":"10/03/2026","descricao":"Ajuste Niacinamida 2%→3%. Aprovação QA.","por":"Patrícia"},
            {"versao":"v2","data":"15/01/2026","descricao":"Troca conservante: Parabeno → Fenoxietanol.","por":"Patrícia"},
            {"versao":"v1","data":"10/08/2025","descricao":"Versão inicial em bancada.","por":"Equipe P&D anterior"},
        ],
    },
    {
        "formula": {"codigo":"F-APC-018","versao":"v3","produto":"Sérum Cachos Essence 2BC 200ml","marca":"Ápice","tipo":"Cosmético","categoria":"Sérum Capilar","n_mps":10,"status":"Aprovada QA","responsavel":"Patrícia"},
        "ingredientes": [
            {"mp_codigo":"MP0003","nome":"Óleo de Coco Refinado","inci":"COCOS NUCIFERA OIL","pct":"3.0","funcao":"Emoliente"},
            {"mp_codigo":"MP0044","nome":"Pantenol USP","inci":"PANTHENOL","pct":"1.5","funcao":"Condicionante"},
            {"mp_codigo":"MP0095","nome":"Proteína de Arroz","inci":"HYDROLYZED RICE PROTEIN","pct":"2.0","funcao":"Proteína Capilar"},
            {"mp_codigo":"MP0055","nome":"Fenoxietanol","inci":"PHENOXYETHANOL","pct":"0.9","funcao":"Conservante"},
        ],
        "versoes": [
            {"versao":"v3","data":"22/04/2026","descricao":"Inclusão proteína de arroz. Aprovação QA.","por":"Patrícia"},
            {"versao":"v2","data":"10/02/2026","descricao":"Reformulação pH 4.0→3.8 Low Poo.","por":"Patrícia"},
            {"versao":"v1","data":"05/06/2025","descricao":"Versão inicial.","por":"Equipe P&D anterior"},
        ],
    },
    {
        "formula": {"codigo":"F-RIT-009","versao":"v1","produto":"4Mag Magnésio 30 doses","marca":"Rituária","tipo":"Suplemento","categoria":"Suplemento Mineral","n_mps":3,"status":"Em Desenvolvimento","responsavel":"Patrícia"},
        "ingredientes": [
            {"mp_codigo":"MP0072","nome":"Magnésio Bisglicinato","inci":"MAGNESIUM BISGLYCINATE","pct":"300mg/dose","funcao":"Ativo Principal"},
            {"mp_codigo":"MP0110","nome":"Inulina","inci":"INULIN","pct":"50mg/dose","funcao":"Prebiótico"},
        ],
        "versoes": [
            {"versao":"v1","data":"15/04/2026","descricao":"Primeira versão em bancada.","por":"Patrícia"},
        ],
    },
    {
        "formula": {"codigo":"F-BAR-022","versao":"v2","produto":"Body Splash Roses 250ml","marca":"Barbours","tipo":"Cosmético","categoria":"Body Splash","n_mps":6,"status":"Aprovada QA","responsavel":"Patrícia"},
        "ingredientes": [
            {"mp_codigo":"MP0081","nome":"Fragrância Roses 002","inci":"PARFUM","pct":"12.0","funcao":"Fragrância"},
            {"mp_codigo":"MP0011","nome":"Glicerina Vegetal","inci":"GLYCERIN","pct":"2.0","funcao":"Umectante"},
            {"mp_codigo":"MP0055","nome":"Fenoxietanol","inci":"PHENOXYETHANOL","pct":"0.5","funcao":"Conservante"},
        ],
        "versoes": [
            {"versao":"v2","data":"01/03/2026","descricao":"Concentração fragrância 10%→12%.","por":"Patrícia"},
            {"versao":"v1","data":"20/10/2025","descricao":"Versão original.","por":"Equipe P&D anterior"},
        ],
    },
    {
        "formula": {"codigo":"F-YNZ-001","versao":"v1","produto":"Yellow Off Matizante 300ml","marca":"Yenzah","tipo":"Cosmético","categoria":"Shampoo Matizante","n_mps":9,"status":"Em Desenvolvimento","responsavel":"Patrícia"},
        "ingredientes": [
            {"mp_codigo":"MP0044","nome":"Pantenol USP","inci":"PANTHENOL","pct":"1.0","funcao":"Condicionante"},
            {"mp_codigo":"MP0095","nome":"Proteína de Arroz","inci":"HYDROLYZED RICE PROTEIN","pct":"1.5","funcao":"Proteína Capilar"},
            {"mp_codigo":"MP0055","nome":"Fenoxietanol","inci":"PHENOXYETHANOL","pct":"0.8","funcao":"Conservante"},
        ],
        "versoes": [
            {"versao":"v1","data":"28/04/2026","descricao":"Primeira versão Lab Gobeaute. Yenzah relançamento.","por":"Patrícia"},
        ],
    },
]


# =============================================================================
# 3. DOCUMENTOS (44 registros)
# =============================================================================

DOCUMENTOS = [
    # Aprovados
    {"nome":"ISO 22716 — ANASTACIO","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"ANASTACIO","versao_lote":"2024-2026","data_upload":"05/01/2026","data_validade":"05/09/2026","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 9001 — ANASTACIO","tipo":"ISO 9001","mp_codigo":None,"fornecedor_nome":"ANASTACIO","versao_lote":"2024-2026","data_upload":"05/01/2026","data_validade":"05/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Glicerina Vegetal (MP0013)","tipo":"FISPQ","mp_codigo":"MP0013","fornecedor_nome":"ALPHA QUIMICA","versao_lote":"v3.0","data_upload":"10/01/2026","data_validade":"10/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — BASF SP","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"BASF","versao_lote":"2025-2027","data_upload":"10/03/2026","data_validade":"10/03/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 9001 — BASF SP","tipo":"ISO 9001","mp_codigo":None,"fornecedor_nome":"BASF","versao_lote":"2025-2027","data_upload":"10/03/2026","data_validade":"10/03/2027","status":"Aprovado","revisor":"Edivar"},
    {"nome":"FISPQ — TINOGARD TS (MP0001)","tipo":"FISPQ","mp_codigo":"MP0001","fornecedor_nome":"BASF","versao_lote":"v1.2","data_upload":"15/01/2026","data_validade":"15/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"Ficha Técnica — TINOGARD TS (MP0001)","tipo":"Ficha Técnica","mp_codigo":"MP0001","fornecedor_nome":"BASF","versao_lote":"FT-2025-11","data_upload":"15/01/2026","data_validade":"15/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — CHEMYUNION","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"CHEMYUNION","versao_lote":"2025-2027","data_upload":"20/01/2026","data_validade":"20/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — CHEMAX","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"CHEMAX","versao_lote":"2025-2026","data_upload":"05/02/2026","data_validade":"05/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Cocoamidopropil Betaína (MP0033)","tipo":"FISPQ","mp_codigo":"MP0033","fornecedor_nome":"CHEMAX","versao_lote":"v2.0","data_upload":"05/02/2026","data_validade":"05/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"COA Lote 2604A — Glicerina Vegetal (MP0011)","tipo":"COA","mp_codigo":"MP0011","fornecedor_nome":"ANASTACIO","versao_lote":"Lote 2604A","data_upload":"10/04/2026","data_validade":"10/04/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — AQIA","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"AQIA","versao_lote":"2025-2026","data_upload":"20/02/2026","data_validade":"20/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — MCASSAB","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"MCASSAB","versao_lote":"2025-2027","data_upload":"15/01/2026","data_validade":"15/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — UNIVAR","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"UNIVAR","versao_lote":"2025-2026","data_upload":"20/01/2026","data_validade":"20/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Óleo de Buriti (MP0073)","tipo":"FISPQ","mp_codigo":"MP0073","fornecedor_nome":"PHYTOVITAL","versao_lote":"v1.1","data_upload":"10/02/2026","data_validade":"10/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Óleo Argan (MP0077)","tipo":"FISPQ","mp_codigo":"MP0077","fornecedor_nome":"PHYTOVITAL","versao_lote":"v1.0","data_upload":"10/02/2026","data_validade":"10/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Extrato Aloe Vera (MP0026)","tipo":"FISPQ","mp_codigo":"MP0026","fornecedor_nome":"PHYTOVITAL","versao_lote":"v2.0","data_upload":"10/02/2026","data_validade":"10/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — SYMRISE","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"SYMRISE","versao_lote":"2025-2027","data_upload":"15/02/2026","data_validade":"15/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — PARSOL MCX (MP0246)","tipo":"FISPQ","mp_codigo":"MP0246","fornecedor_nome":"SYMRISE","versao_lote":"v1.0","data_upload":"15/02/2026","data_validade":"15/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — ROBERTET","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"ROBERTET","versao_lote":"2025-2027","data_upload":"10/03/2026","data_validade":"10/03/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — IBERIA","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"IBERIA","versao_lote":"2025-2026","data_upload":"15/01/2026","data_validade":"15/01/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — BARENTZ","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"BARENTZ","versao_lote":"2025-2027","data_upload":"10/04/2026","data_validade":"10/04/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — BRENNTAG","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"BRENNTAG","versao_lote":"2025-2027","data_upload":"15/03/2026","data_validade":"15/03/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"ISO 22716 — VANTAGE","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"VANTAGE","versao_lote":"2025-2026","data_upload":"05/04/2026","data_validade":"05/04/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"Laudo Microbiológico — F-KOK-001 v3","tipo":"Laudo Microbiológico","mp_codigo":None,"fornecedor_nome":"Lab Interno","versao_lote":"LM-2026-04","data_upload":"25/04/2026","data_validade":"25/04/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"Laudo Microbiológico — F-APC-018 v3","tipo":"Laudo Microbiológico","mp_codigo":None,"fornecedor_nome":"Lab Interno","versao_lote":"LM-2026-03","data_upload":"22/04/2026","data_validade":"22/04/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Óleo Essencial Lavanda 40/42 (MP0179)","tipo":"FISPQ","mp_codigo":"MP0179","fornecedor_nome":"CITRAL","versao_lote":"v1.0","data_upload":"20/02/2026","data_validade":"20/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Carbopol Aqua (MP0031)","tipo":"FISPQ","mp_codigo":"MP0031","fornecedor_nome":"SARFAM","versao_lote":"v1.2","data_upload":"25/03/2026","data_validade":"25/03/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Óleo Ricino Hidrogenado (MP0080)","tipo":"FISPQ","mp_codigo":"MP0080","fornecedor_nome":"CAMPESTRE","versao_lote":"v1.0","data_upload":"10/02/2026","data_validade":"10/02/2027","status":"Aprovado","revisor":"Patrícia"},
    {"nome":"FISPQ — Extrato Flor de Lótus (MP0491)","tipo":"FISPQ","mp_codigo":"MP0491","fornecedor_nome":"BARUQUIMICA","versao_lote":"v1.0","data_upload":"20/02/2026","data_validade":"20/02/2027","status":"Aprovado","revisor":"Patrícia"},
    # Em Revisão
    {"nome":"COA — Ácido Lático 85% (MP0002)","tipo":"COA","mp_codigo":"MP0002","fornecedor_nome":"ANASTACIO","versao_lote":"Lote 2603B","data_upload":"20/04/2026","data_validade":"20/04/2027","status":"Em Revisão","revisor":None},
    {"nome":"COA — Manteiga de Karité (MP0023)","tipo":"COA","mp_codigo":"MP0023","fornecedor_nome":"AQIA","versao_lote":"Lote 2604C","data_upload":"15/04/2026","data_validade":"15/04/2027","status":"Em Revisão","revisor":None},
    {"nome":"FISPQ — Óleo Essencial Bergamota (MP0126)","tipo":"FISPQ","mp_codigo":"MP0126","fornecedor_nome":"GLAMIR","versao_lote":"v2.0","data_upload":"18/04/2026","data_validade":"18/04/2027","status":"Em Revisão","revisor":None},
    # Pendentes
    {"nome":"COA — GOMA GUAR QUATERNIZADA (MP0022)","tipo":"COA","mp_codigo":"MP0022","fornecedor_nome":"ANASTACIO","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    {"nome":"ISO 22716 — KHOL QUIMICA","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"KHOL QUIMICA","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    {"nome":"ISO 22716 — PHYTOVITAL","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"PHYTOVITAL","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    {"nome":"ISO 22716 — GLAMIR","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"GLAMIR","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    {"nome":"FISPQ — IMIDAZOLIDINYL UREA (MP0460)","tipo":"FISPQ","mp_codigo":"MP0460","fornecedor_nome":"THOR2","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    {"nome":"Decl. Conformidade — COSMETO / SUMMIT","tipo":"Decl. Conformidade","mp_codigo":None,"fornecedor_nome":"COSMETO / SUMMIT","versao_lote":None,"data_upload":None,"data_validade":None,"status":"Pendente","revisor":None},
    # Vencidos
    {"nome":"FISPQ — Fenoxietanol + IPBC (MP0046)","tipo":"FISPQ","mp_codigo":"MP0046","fornecedor_nome":"ALPHA QUIMICA","versao_lote":"v1.0","data_upload":"15/02/2026","data_validade":"15/04/2026","status":"Vencido","revisor":"Patrícia"},
    {"nome":"COA — SENSACTIVE L-30 (MP0093)","tipo":"COA","mp_codigo":"MP0093","fornecedor_nome":"ALPHA QUIMICA","versao_lote":"Lote 2501A","data_upload":"10/01/2026","data_validade":"10/04/2026","status":"Vencido","revisor":"Patrícia"},
    {"nome":"ISO 22716 — ALPHA QUIMICA","tipo":"ISO 22716","mp_codigo":None,"fornecedor_nome":"ALPHA QUIMICA","versao_lote":"2023-2025","data_upload":"15/01/2024","data_validade":"15/01/2026","status":"Vencido","revisor":None},
    {"nome":"Laudo Microbiológico — F-BAR-022 v1","tipo":"Laudo Microbiológico","mp_codigo":None,"fornecedor_nome":"Lab Interno","versao_lote":"LM-2025-10","data_upload":"20/10/2025","data_validade":"20/04/2026","status":"Vencido","revisor":None},
    {"nome":"FISPQ — Mistura Isotiazolinona (MP0017)","tipo":"FISPQ","mp_codigo":"MP0017","fornecedor_nome":"THOR2","versao_lote":"v1.0","data_upload":"10/01/2026","data_validade":"10/04/2026","status":"Vencido","revisor":None},
]


# =============================================================================
# EXECUÇÃO
# =============================================================================

def run():
    print("=" * 60)
    print("SEED COMPLETO — Lab Gobeaute P&D")
    print("=" * 60)

    # ── 1. CRM completo (limpa e re-insere tudo) ─────────────────────────────
    print("\n[1/4] Rebuilding CRM completo...")
    sb.table("fornecedor_crm").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    crm_ok = 0
    for forn_nome, eventos in FORNECEDORES_CRM:
        forn_id = get_forn_id(forn_nome)
        if not forn_id:
            print(f"  AVISO: '{forn_nome}' não encontrado")
            continue
        for ev in eventos:
            try:
                sb.table("fornecedor_crm").insert({
                    "fornecedor_id": forn_id,
                    "tipo": ev["tipo"],
                    "titulo": ev["titulo"],
                    "detalhe": ev.get("detalhe"),
                    "data_evento": parse_date(ev.get("data", "")),
                }).execute()
                crm_ok += 1
            except Exception as e:
                print(f"  ERRO CRM {forn_nome}: {e}")
    print(f"  {crm_ok} eventos CRM inseridos.")

    # ── 2. Fórmulas + ingredientes + versões ─────────────────────────────────
    print("\n[2/4] Inserindo fórmulas completas com ingredientes e versões...")
    # Limpar tudo relacionado a fórmulas
    try:
        sb.table("formula_versoes").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        sb.table("formula_ingredientes").delete().neq("formula_id", "00000000-0000-0000-0000-000000000000").execute()
        sb.table("formulas").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        print(f"  Limpeza: {e}")

    form_ok = 0
    for item in FORMULAS:
        f = item["formula"]
        try:
            res = sb.table("formulas").insert(f).execute()
            formula_id = res.data[0]["id"]
            form_ok += 1

            # Ingredientes
            for ing in item["ingredientes"]:
                mp_id = get_mp_id(ing["mp_codigo"])
                sb.table("formula_ingredientes").insert({
                    "formula_id": formula_id,
                    "mp_id": mp_id,
                    "mp_codigo": ing["mp_codigo"],
                    "mp_nome": ing["nome"],
                    "inci": ing["inci"],
                    "percentual": ing["pct"],
                    "funcao": ing["funcao"],
                }).execute()

            # Versões
            for v in item["versoes"]:
                sb.table("formula_versoes").insert({
                    "formula_id": formula_id,
                    "versao": v["versao"],
                    "data_versao": parse_date(v["data"]),
                    "descricao": v["descricao"],
                    "por": v["por"],
                }).execute()

        except Exception as e:
            print(f"  ERRO fórmula {f['codigo']}: {e}")

    print(f"  {form_ok}/{len(FORMULAS)} fórmulas + ingredientes + versões inseridos.")

    # ── 3. Documentos ─────────────────────────────────────────────────────────
    print("\n[3/4] Inserindo 44 documentos...")
    try:
        sb.table("documentos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    except Exception as e:
        print(f"  Limpeza docs: {e}")

    doc_ok = 0
    for d in DOCUMENTOS:
        mp_id = get_mp_id(d["mp_codigo"]) if d["mp_codigo"] else None
        forn_id = get_forn_id(d["fornecedor_nome"])
        try:
            sb.table("documentos").insert({
                "nome": d["nome"],
                "tipo": d["tipo"],
                "mp_id": mp_id,
                "mp_codigo": d["mp_codigo"],
                "fornecedor_id": forn_id,
                "fornecedor_nome": d["fornecedor_nome"],
                "versao_lote": d["versao_lote"],
                "data_upload": parse_date(d["data_upload"]),
                "data_validade": parse_date(d["data_validade"]),
                "status": d["status"],
                "revisor": d["revisor"],
            }).execute()
            doc_ok += 1
        except Exception as e:
            print(f"  ERRO doc '{d['nome']}': {e}")
    print(f"  {doc_ok}/44 documentos inseridos.")

    # ── 4. Resumo ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("RESUMO FINAL:")
    for t in ["fornecedores","mps","mp_fornecedores","pd_projetos","formulas",
              "formula_ingredientes","formula_versoes","documentos","fornecedor_crm"]:
        try:
            r = sb.table(t).select("*", count="exact", head=True).execute()
            print(f"  {t:30s}: {r.count:4d} registros")
        except Exception as e:
            print(f"  {t}: erro — {e}")
    print("=" * 60)
    print("SEED COMPLETO finalizado!")


if __name__ == "__main__":
    run()
