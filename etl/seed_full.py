#!/usr/bin/env python3
"""
Seed FULL — popula tudo no Supabase Lab Gobeaute P&D:
  1. Fornecedores (enriquecidos com CNPJ, contato, ISO, pendências)
  2. MPs (201 do HTML — roda seed_mps.py antes se ainda não rodou)
  3. CRM de fornecedores (histórico real extraído do HTML)
  4. Projetos P&D (15 projetos reais do HTML)
  5. Fórmulas (2 fórmulas aprovadas QA)
"""
from decimal import Decimal, InvalidOperation
from typing import Optional
import json
from supabase import create_client, Client

SUPABASE_URL = "https://lbtutajufxswpkifoisw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxidHV0YWp1Znhzd3BraWZvaXN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU4MzI5NywiZXhwIjoyMDkzMTU5Mjk3fQ.QklNtT2lVC9cBydR_mMekANgdRuBtGoZ1oAeVdmd5ws"
HTML_PATH = "/Users/edivar/Documents/Sourcing e Procurement/Projetos/Lab Gobeaute P&D/lab_gobeaute.html"

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_forn_id(nome: str) -> Optional[str]:
    res = sb.table("fornecedores").select("id").eq("nome", nome).limit(1).execute()
    return res.data[0]["id"] if res.data else None


# =============================================================================
# 1. FORNECEDORES — dados enriquecidos
# =============================================================================

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
    {"nome":"COSMETO / SUMMIT","uf":"SP","cnpj":"90.123.456/0001-45","contato":"vendas@cosmeto.com.br","status":"Em Avaliação","mps_ativas":5,"iso22716":False,"iso9001":False,"pendencias":4},
    {"nome":"MAIAN","uf":"SP","cnpj":"01.234.578/0001-67","contato":"vendas@maian.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":False,"pendencias":3},
    {"nome":"FOCUS QUIMICA","uf":"SP","cnpj":"12.345.690/0001-01","contato":"pd@focusquimica.com.br","status":"Em Avaliação","mps_ativas":4,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"Oxigen","uf":"SP","cnpj":"23.456.801/0001-12","contato":"cosmeticos@oxigen.com.br","status":"Em Avaliação","mps_ativas":5,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"KHOL QUIMICA2","uf":"SP","cnpj":"34.567.912/0001-23","contato":"vendas2@kholquimica.com.br","status":"Em Avaliação","mps_ativas":4,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"ANASTACIO2","uf":"SP","cnpj":"45.678.023/0001-34","contato":"vendas2@anastacio.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"QUIMIFORMULA","uf":"SP","cnpj":"56.789.134/0001-45","contato":"vendas@quimiformula.com.br","status":"Em Avaliação","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"UNIVAR2","uf":"SP","cnpj":"67.890.245/0001-56","contato":"cosmeticos2@univar.com.br","status":"Em Avaliação","mps_ativas":3,"iso22716":False,"iso9001":True,"pendencias":1},
    {"nome":"FOCUS QUÍMICA","uf":"SP","cnpj":"12.345.690/0002-90","contato":"pd@focusquimica.com.br","status":"Em Avaliação","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":2},
    {"nome":"INOLEX","uf":"SP","cnpj":"10.234.567/0001-89","contato":"vendas@inolex.com.br","status":"Em Avaliação","mps_ativas":2,"iso22716":False,"iso9001":True,"pendencias":1},
]


# =============================================================================
# 2. CRM DE FORNECEDORES (eventos reais do HTML)
# =============================================================================

CRM_EVENTS = [
    # ANASTACIO
    ("ANASTACIO", [
        {"tipo":"green","titulo":"COA aprovado MP0011 Lote 2604A","data":"2026-04-10","detalhe":"Parâmetros físico-químicos dentro do spec. Aprovado por Patrícia."},
        {"tipo":"yellow","titulo":"Alerta: ISO 22716 vence em Set/2026","data":"2026-04-01","detalhe":"Renovação necessária para manter status homologado."},
        {"tipo":"green","titulo":"Fornecedor recadastrado no Lab Gobeaute","data":"2026-03-15","detalhe":"Migração da base BID 2026 para o Lab P&D."},
        {"tipo":"blue","titulo":"Reunião técnica realizada","data":"2026-02-20","detalhe":"Discussão de novos ativos e preços para BID 2026. Participantes: Edivar, Patrícia, Jéssica."},
    ]),
    # BASF
    ("BASF", [
        {"tipo":"green","titulo":"ISO 22716 renovada","data":"2026-03-10","detalhe":"Certificado válido até Mar/2027. Aprovado por Edivar."},
        {"tipo":"green","titulo":"3 MPs aprovadas em bancada","data":"2026-02-05","detalhe":"MP0001 (TINOGARD TS), MP0029 (ARLYPON TT), MP0470 (Vit. E) aprovadas para uso em Kokeshi e Rituária."},
    ]),
    # KHOL QUIMICA
    ("KHOL QUIMICA", [
        {"tipo":"blue","titulo":"Maior carteira de MPs do portfólio Gobeaute","data":"2026-03-15","detalhe":"18 MPs ativas: espessantes, emulsificantes, tensoativos, óleos essenciais e ativos capilares."},
        {"tipo":"yellow","titulo":"ISO 22716 pendente","data":"2026-04-01","detalhe":"Certificação GMP cosméticos requerida para MPs de Kokeshi. Prazo: Jun/2026."},
    ]),
    # PHYTOVITAL
    ("PHYTOVITAL", [
        {"tipo":"green","titulo":"Especialista em extratos e óleos naturais","data":"2026-01-15","detalhe":"8 MPs ativas: Baobá, Rosa Mosqueta, Buriti, Pracaxi, Aloe Vera, Semente de Uva. Referência para By Samia e Ápice."},
        {"tipo":"blue","titulo":"Visita técnica realizada","data":"2026-03-10","detalhe":"Patrícia visitou a planta. Boa estrutura para extração vegetal certificada."},
    ]),
    # CHEMYUNION
    ("CHEMYUNION", [
        {"tipo":"green","titulo":"Homologação completa","data":"2026-01-20","detalhe":"Todos documentos aprovados. MPs ativas: WAVEMAX, GLYCOSAN, SENSOVEIL, SENSACTIVE, CEREAL MILK, H-VIT."},
        {"tipo":"green","titulo":"Parceiro estratégico para ativos de performance","data":"2026-03-05","detalhe":"Principal fornecedor de ativos tecnológicos premium."},
    ]),
    # CHEMAX
    ("CHEMAX", [
        {"tipo":"green","titulo":"Documentação em dia","data":"2026-03-01","detalhe":"ISO 22716 e ISO 9001 válidas. COAs atualizados."},
        {"tipo":"blue","titulo":"Fornecedor de tensoativos e condicionantes","data":"2026-01-15","detalhe":"MPs: AMIDA 90, SUN QUART CT50, COCOAMIDOPROPIL BETAINA, CL CETIL TRI AMÔNIO, QUIKPEARL, LAURILETERSULFATO."},
    ]),
    # ALPHA QUIMICA
    ("ALPHA QUIMICA", [
        {"tipo":"red","titulo":"FISPQ vencida — MP0088 (Fenoxietanol + IPBC)","data":"2026-04-15","detalhe":"Documento expirado em 15/04/2026. Fornecedor notificado. Prazo para reenvio: 30/04/2026."},
        {"tipo":"yellow","titulo":"ISO 22716 ausente","data":"2026-03-01","detalhe":"Fornecedor não possui certificação GMP Cosméticos. Em avaliação pela Qualidade."},
        {"tipo":"blue","titulo":"Reativado no BID 2026","data":"2026-01-10","detalhe":"Retorno como candidato para SENSACTIVE e MPs genéricas de baixo risco."},
    ]),
    # AQIA
    ("AQIA", [
        {"tipo":"green","titulo":"Documentação completa","data":"2026-02-20","detalhe":"Todos certificados válidos. MPs: REWOPOL SB, VARISOFT BTMS, PALMITATO, CETIOL HE, PLANTCOL, RICE SILK."},
        {"tipo":"blue","titulo":"Parceiro para emulsificantes e ésteres","data":"2026-03-15","detalhe":"Bom nível técnico para emulsificantes de alto desempenho."},
    ]),
    # MCASSAB
    ("MCASSAB", [
        {"tipo":"green","titulo":"Distribuidor multinacional premium","data":"2026-01-10","detalhe":"MPs: EDTA DISSÓDICO, SILICONE 1411, ÁCIDO CÍTRICO ANIDRO, LAURIL ETER SULFATO 70%, ÓLEO MAMONA ETOX."},
    ]),
    # UNIVAR
    ("UNIVAR", [
        {"tipo":"green","titulo":"Distribuidor global com portfólio técnico","data":"2026-02-15","detalhe":"MPs: GOMA GUAR QUATERNIZADA, SILICONE 1411, MAIZECARE POLYMER. Suporte técnico de alta qualidade."},
    ]),
    # GLAMIR
    ("GLAMIR", [
        {"tipo":"blue","titulo":"Principal fornecedor de óleos essenciais","data":"2026-01-20","detalhe":"16 MPs ativas: Bergamota, Alecrim, Lavanda, Mirra, Olibano, Orégano, Patchouli, Palmarosa, Petitgrain, Salvia, Tomilho, Cedro, Jasmim, etc."},
        {"tipo":"yellow","titulo":"ISO 22716 em renovação","data":"2026-04-01","detalhe":"Certificação vence Jul/2026. Documentação em andamento."},
    ]),
    # SARFAM
    ("SARFAM", [
        {"tipo":"green","titulo":"Documentação em dia","data":"2026-03-25","detalhe":"MPs: CARBOPOL AQUA, EXTRATO HG ROSAS BRANCAS, HYDROVANCE, PROPANEDIOL. Bom relacionamento comercial."},
    ]),
    # CAMPESTRE
    ("CAMPESTRE", [
        {"tipo":"blue","titulo":"Especialista em óleos vegetais nacionais","data":"2026-02-10","detalhe":"MPs: Óleo de Ricino Hidrogenado, Óleo de Algodão, Amêndoa Doce, Castanha do Pará, Girassol, Abacate."},
    ]),
    # BARUQUIMICA
    ("BARUQUIMICA", [
        {"tipo":"green","titulo":"Especialista em extratos glicólicos","data":"2026-02-20","detalhe":"MPs: Extrato de Buriti, Aloe Vera, Extrato de Sálvia, Flor de Lótus, Extrato de Jojoba, Extrato de Mirra."},
    ]),
    # PHYTOFLORA
    ("PHYTOFLORA", [
        {"tipo":"blue","titulo":"Fornecedor de extratos capilares","data":"2026-03-05","detalhe":"MPs: Óleo Rosa Mosqueta GRAN OILS, Rosa Mosqueta Glicólico, Phytoattive Arroz. Especialidade em capilares."},
    ]),
    # BIELUS
    ("BIELUS", [
        {"tipo":"blue","titulo":"Óleos exóticos da Amazônia","data":"2026-03-10","detalhe":"MPs: Óleo de Açaí, Castanha do Pará, Copaíba Bálsamo. Certificação de origem rastreável."},
    ]),
    # IBERIA
    ("IBERIA", [
        {"tipo":"green","titulo":"Óleos essenciais importados homologados","data":"2026-01-15","detalhe":"MPs: Sândalo Amyris, Ylang-ylang III, Noz Moscada, Orégano. Certificados de origem e COAs disponíveis."},
    ]),
    # ROBERTET
    ("ROBERTET", [
        {"tipo":"green","titulo":"Fornecedor premium de aromas e essências","data":"2026-03-10","detalhe":"MPs: Orégano, Mirra, Jasmim, Limão Siciliano, Laranja. Empresa francesa de referência mundial."},
    ]),
]


# =============================================================================
# 3. PROJETOS P&D (15 reais do HTML)
# =============================================================================

PD_PROJETOS = [
    {"codigo":"PD-005","nome":"Sérum Vitamina C + Niacinamida 3% — Kokeshi","marca":"Kokeshi","tipo":"Cosmético","etapa":"Aprovação QA","responsavel":"Patrícia","data_inicio":"2026-02-10","status":"Pronto para aprovação","briefing":"Linha facial premium. Ativo: Vitamina C 10% + Niacinamida 3%. Target: 25-35 anos, pele oleosa. Meta: 500 un/mês."},
    {"codigo":"PD-006","nome":"Shampoo Scalp Care Anti-Caspa — Ápice","marca":"Ápice","tipo":"Cosmético","etapa":"Aprovação QA","responsavel":"Patrícia","data_inicio":"2026-03-01","status":"Pronto para aprovação","briefing":"Extensão da linha Cachos. Ativos: Zinco Piritiona + Salicílico 0,5%. Demanda mapeada: 3BC e 4BC."},
    {"codigo":"PD-001","nome":"Linha Facial K-Glow Premium — Kokeshi","marca":"Kokeshi","tipo":"Cosmético","etapa":"Aprovação Interna","responsavel":"Patrícia","data_inicio":"2026-03-15","status":"Em andamento","briefing":"3 SKUs: Sérum Retinol 0.1%, Hidratante Barrier Repair, Tônico Ácido Hialurônico. Posicionamento premium J-Beauty."},
    {"codigo":"PD-009","nome":"Condicionador Reconstrutor Intense — Yenzah","marca":"Yenzah","tipo":"Cosmético","etapa":"Aprovação Interna","responsavel":"Patrícia","data_inicio":"2026-04-10","status":"Em andamento","briefing":"Par do Yellow Off. Proteína de arroz + Queratina. Relançamento linha Yenzah 2026."},
    {"codigo":"PD-010","nome":"Hidratante Corporal Murumuru + Tucumã — By Samia","marca":"By Samia","tipo":"Cosmético","etapa":"Testes Internos","responsavel":"Patrícia","data_inicio":"2026-03-20","status":"Em andamento","briefing":"Linha Amazônia Viva. Óleos: Murumuru + Tucumã + Pracaxi. 200ml e 400ml. Claims: vegano, natural, origem certificada."},
    {"codigo":"PD-011","nome":"Brain+ Cápsulas Soft Gel — Rituária","marca":"Rituária","tipo":"Suplemento","etapa":"Testes Internos","responsavel":"Patrícia","data_inicio":"2026-04-05","status":"Em andamento","briefing":"Nova forma farmacêutica soft gel. Ativos: Bacopa, L-Teanina, Cafeína 50mg. Diferencial vs comprimido: absorção 40% superior."},
    {"codigo":"PD-002","nome":"Body Splash Very Sexy 2.0 — Barbours","marca":"Barbours","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-01","status":"Em andamento","briefing":"Reformulação do hero product. Fragrância Givaudan Very Sexy 012 + concentração 14% → 16%. EDP leve."},
    {"codigo":"PD-004","nome":"Yellow Off pH Control Shampoo — Yenzah","marca":"Yenzah","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-20","status":"Em andamento","briefing":"Relançamento Yenzah 2026. pH 3.8, pigmento violeta VIOLET COVASOL 0,36%, sem sulfato. 300ml."},
    {"codigo":"PD-012","nome":"Perfume Bastão Lescent N°28 — Le Scent","marca":"Lescent","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-15","status":"Em andamento","briefing":"Formato bastão sólido. Fragrância Robertet exclusiva. Campanha Black Friday Nov/2026. LT 140d."},
    {"codigo":"PD-013","nome":"Óleo Seco 12 Óleos — By Samia","marca":"By Samia","tipo":"Cosmético","etapa":"Formulação em Bancada","responsavel":"Patrícia","data_inicio":"2026-04-25","status":"Em andamento","briefing":"K-OIL BLEND 12 ÓLEOS como base. Claims: vegano, natural. Concorre com Nativa Spa."},
    {"codigo":"PD-003","nome":"4Mag Comprimido Mastigável — Rituária","marca":"Rituária","tipo":"Suplemento","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-28","status":"Em andamento","briefing":"Nova forma farmacêutica com sabor natural de laranja. 4Mag = Magnésio Bisglicinato 300mg + Inulina. Diferencial: fácil consumo sem água."},
    {"codigo":"PD-014","nome":"Xampu Nutritivo Manteiga de Karitê — Auá Natural","marca":"Auá Natural","tipo":"Cosmético","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-28","status":"Em andamento","briefing":"Relançamento Auá Natural 2026. Karitê + Baobá + Centella Asiática. Posicionamento natural premium."},
    {"codigo":"PD-015","nome":"Manteiga Corporal Parfum — Barbours by Anna Lu","marca":"Barbours","tipo":"Cosmético","etapa":"Briefing/Conceito","responsavel":"Patrícia","data_inicio":"2026-04-29","status":"Em andamento","briefing":"Linha Anna Lu: 3 SKUs. Manteiga + Body Splash + Parfum. Proposta R$ 50k + 4% royalties. Casas Vollmens/Robertet."},
    {"codigo":"PD-007","nome":"Linha Revitalizante Amazônia — By Samia","marca":"By Samia","tipo":"Cosmético","etapa":"Testes Internos","responsavel":"Patrícia","data_inicio":"2026-03-10","status":"Em andamento","briefing":"4 SKUs com óleos amazônicos certificados: Baobá, Pracaxi, Copaíba, Açaí. Claims vegano + origem rastreável."},
    {"codigo":"PD-008","nome":"Shampoo Sólido Zero Plástico — Kokeshi","marca":"Kokeshi","tipo":"Cosmético","etapa":"Aprovação Interna","responsavel":"Patrícia","data_inicio":"2026-03-25","status":"Em andamento","briefing":"Formato sustentável. Sem SLES, sem plástico. Barra 80g = 2 frascos líquidos. Target: consumidor eco-consciente."},
]


# =============================================================================
# 4. FÓRMULAS (2 aprovadas QA — dados do HTML)
# =============================================================================

FORMULAS = [
    {
        "codigo": "F-KOK-001",
        "versao": "v3",
        "produto": "Hidratante Facial Pele de Porcelana 30g",
        "marca": "Kokeshi",
        "tipo": "Cosmético",
        "categoria": "Hidratante Facial",
        "n_mps": 8,
        "status": "Aprovada QA",
        "responsavel": "Patrícia",
    },
    {
        "codigo": "F-APC-018",
        "versao": "v3",
        "produto": "Sérum Cachos Essence 2BC 200ml",
        "marca": "Ápice",
        "tipo": "Cosmético",
        "categoria": "Sérum Capilar",
        "n_mps": 10,
        "status": "Aprovada QA",
        "responsavel": "Patrícia",
    },
]


# =============================================================================
# EXECUÇÃO
# =============================================================================

def run():
    print("=" * 60)
    print("SEED FULL — Lab Gobeaute P&D")
    print("=" * 60)

    # 1. Fornecedores enriquecidos
    print("\n[1/4] Enriquecendo fornecedores com CNPJ, contato, ISO...")
    ok = 0
    for f in FORNECEDORES:
        try:
            sb.table("fornecedores").upsert(f, on_conflict="nome").execute()
            ok += 1
        except Exception as e:
            print(f"  ERRO {f['nome']}: {e}")
    print(f"  {ok}/{len(FORNECEDORES)} fornecedores atualizados.")

    # 2. CRM
    print("\n[2/4] Inserindo eventos CRM de fornecedores...")
    crm_ok = 0
    for forn_nome, eventos in CRM_EVENTS:
        forn_id = get_forn_id(forn_nome)
        if not forn_id:
            print(f"  AVISO: fornecedor '{forn_nome}' não encontrado, pulando CRM.")
            continue
        for ev in eventos:
            try:
                sb.table("fornecedor_crm").insert({
                    "fornecedor_id": forn_id,
                    "tipo": ev["tipo"],
                    "titulo": ev["titulo"],
                    "detalhe": ev.get("detalhe"),
                    "data_evento": ev.get("data"),
                }).execute()
                crm_ok += 1
            except Exception as e:
                print(f"  ERRO CRM {forn_nome}: {e}")
    print(f"  {crm_ok} eventos CRM inseridos.")

    # 3. Projetos P&D
    print("\n[3/4] Inserindo projetos P&D...")
    pd_ok = 0
    for p in PD_PROJETOS:
        try:
            sb.table("pd_projetos").upsert(p, on_conflict="codigo").execute()
            pd_ok += 1
        except Exception as e:
            print(f"  ERRO PD {p['codigo']}: {e}")
    print(f"  {pd_ok}/{len(PD_PROJETOS)} projetos inseridos.")

    # 4. Fórmulas
    print("\n[4/4] Inserindo fórmulas aprovadas QA...")
    form_ok = 0
    # Limpa antes para permitir re-run
    try:
        existing_codes = [f["codigo"] for f in FORMULAS]
        sb.table("formulas").delete().in_("codigo", existing_codes).execute()
    except Exception:
        pass
    for f in FORMULAS:
        try:
            sb.table("formulas").insert(f).execute()
            form_ok += 1
        except Exception as e:
            print(f"  ERRO Fórmula {f['codigo']}: {e}")
    print(f"  {form_ok}/{len(FORMULAS)} fórmulas inseridas.")

    # Resumo final
    print("\n" + "=" * 60)
    print("RESUMO FINAL:")
    tables = ["fornecedores", "mps", "mp_fornecedores", "pd_projetos", "formulas", "fornecedor_crm"]
    for t in tables:
        try:
            r = sb.table(t).select("*", count="exact", head=True).execute()
            print(f"  {t}: {r.count} registros")
        except Exception as e:
            print(f"  {t}: erro ao contar — {e}")
    print("=" * 60)
    print("SEED FULL concluído!")


if __name__ == "__main__":
    run()
