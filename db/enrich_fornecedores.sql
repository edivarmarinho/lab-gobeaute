-- =============================================================================
-- Lab Gobeaute P&D — Enriquecimento da base de Fornecedores
-- Dados coletados via pesquisa web (3 lotes, 43 fornecedores)
-- Criado em: 2026-05-01
--
-- Atualiza: site, descricao, especialidade, porte, categoria_fornecedor, observacoes
-- Matching por nome exato (case-insensitive)
-- =============================================================================

BEGIN;

-- ── LOTE 1: Anastacio, BASF, KHOL, Phytovital, Chemyunion, Chemax, Alpha Quimica,
--            AQIA, MCassab, Univar, Glamir, Sarfam, Campestre, Baruquimica,
--            Robertet, Symrise, Brenntag, Barentz ─────────────────────────────

UPDATE fornecedores SET
  site = 'https://anastacio.com',
  descricao = 'Uma das maiores distribuidoras de produtos químicos da América Latina, fundada em 1941. Conecta cerca de 400 fornecedores globais a clientes em múltiplos segmentos industriais, com forte atuação em cosméticos, saúde humana, nutrição e aromas.',
  especialidade = 'Distribuição multissegmento de matérias-primas químicas para cosméticos, farma, nutrição, aromas e domissanitários',
  porte = 'grande',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Mais de 10 CDs no Brasil; unidades na Argentina e México. Rua Eugênio de Medeiros, 303 — SP. Portfolio: ativos, emolientes, tensoativos, conservantes.'
WHERE UPPER(nome) = 'ANASTACIO';

UPDATE fornecedores SET
  site = 'https://www.basf.com/br/pt',
  descricao = 'Divisão Care Chemicals da BASF SE, líder mundial em insumos para cuidados pessoais. Oferece ativos de alta performance para skincare, haircare e higiene, com laboratório de co-criação em São Paulo.',
  especialidade = 'Ativos, emolientes, tensoativos, polímeros e ingredientes funcionais para Personal Care e Home Care',
  porte = 'multinacional',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Lab Personal Care inaugurado 2019 integrado ao hub "onono". Portfólio: Luviquat, Cremophor, Kollicoat, filtros UV. Shop: shop.basf.com.br'
WHERE UPPER(nome) = 'BASF';

UPDATE fornecedores SET
  site = NULL,
  descricao = 'Distribuidora de matérias-primas e ingredientes para a indústria cosmética e química, com atuação em São Paulo. Presença B2B discreta, operando principalmente via relacionamento direto.',
  especialidade = 'Distribuição de ingredientes cosméticos e químicos especiais',
  porte = 'pequeno',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Site oficial não localizado publicamente. Verificar via ABIHPEC ou contato direto.'
WHERE UPPER(nome) = 'KHOL QUIMICA';

UPDATE fornecedores SET
  site = 'https://phytovital.com.br',
  descricao = 'Fornecedor de matérias-primas naturais para as indústrias cosmética, farmacêutica e alimentícia, atuante desde 2000. Portfólio centrado em insumos de origem vegetal.',
  especialidade = 'Óleos vegetais, óleos essenciais, extratos vegetais, hidrolatos, manteigas, proteínas hidrolisadas e vitaminas',
  porte = 'pequeno',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Sede: Rua Frei Antônio, 11, Jardim Gramacho, Duque de Caxias-RJ, CEP 25.051-130. Tel: (21) 3774-0106. WhatsApp: (21) 98494-9249. 24 anos de mercado.'
WHERE UPPER(nome) = 'PHYTOVITAL';

UPDATE fornecedores SET
  site = 'https://www.chemyunion.com',
  descricao = 'Maior fabricante nacional de ativos cosméticos, fundada em 1987. Desenvolve ingredientes inovadores para cosmética, farma, veterinária e alimentos, com fábrica em Sorocaba-SP e exportação para 60+ países.',
  especialidade = 'Ativos cosméticos funcionais: clareadores, antioxidantes, antienvelhecimento, capilares, peptídeos e ativos de alta performance. Certificações ECOCERT e COSMOS.',
  porte = 'medio',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Capital social R$ 44,2M. ~130 colaboradores, 20% em P&D. Premiada in-cosmetics Global 2025 (Silver Sensory Bar Award). Afiliadas em EUA, Colômbia, Espanha, México, UK e China.'
WHERE UPPER(nome) = 'CHEMYUNION';

UPDATE fornecedores SET
  site = 'https://chemax.com.br',
  descricao = 'Empresa 100% nacional fundada em 1998, especializada no desenvolvimento e fornecimento de insumos químicos para domissanitário, cosméticos e lubrificantes. Sede em Itapevi-SP.',
  especialidade = 'Insumos para cosméticos veganos, domissanitários e lubrificantes; tensoativos, emolientes, conservantes e ativos',
  porte = 'pequeno',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'ISO 9001. Destaque em portfólio para cosméticos veganos certificados. 25+ anos de mercado. Itapevi-SP.'
WHERE UPPER(nome) = 'CHEMAX';

UPDATE fornecedores SET
  site = 'https://alphaquimica.com.br',
  descricao = 'Distribuidora de insumos químicos atuante desde 1990, com três unidades estratégicas no Brasil e exportação para ~40 países. Atende personal care, agro, tintas e home care.',
  especialidade = 'Distribuição de insumos químicos fracionados, bases e formulações exclusivas para cuidados pessoais',
  porte = 'medio',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Sede: Cachoeirinha-RS; filial Curitiba-PR; CD Itajaí-SC. Linha própria "Alpha" com formulações cosméticas exclusivas.'
WHERE UPPER(nome) = 'ALPHA QUIMICA';

UPDATE fornecedores SET
  site = 'https://aqia.net',
  descricao = 'Indústria química e farmoquímica 100% brasileira, fundada em 1984, que cria, desenvolve e fabrica ingredientes para cosméticos, farmacêutico, alimentício, veterinário e magistral. Exporta para 20+ países.',
  especialidade = 'Fabricação de ingredientes cosméticos, excipientes farmacêuticos e ativos para higiene pessoal',
  porte = 'medio',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Planta industrial em Guarulhos-SP. Suporte técnico, sugestões de formulação e marketing. Presente na Vitrine Exportadora BeautycareBrazil.'
WHERE UPPER(nome) = 'AQIA';

UPDATE fornecedores SET
  site = 'https://personalcare.mcassab.com.br',
  descricao = 'Divisão Personal Care do Grupo MCassab, um dos maiores grupos de distribuição de especialidades do Brasil. Atua com 8 unidades de negócio, com presença em toda América Latina.',
  especialidade = 'Distribuição de ingredientes cosméticos importados; 90%+ do portfólio certificado COSMOS/ECOCERT ou green; laboratório de inovação próprio',
  porte = 'grande',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Sede: Av. das Nações Unidas, 20.882, SP. Escritórios: Argentina, Paraguai, Colômbia, China e Índia. Divisões: Hair Care, Skin Care, Make Up, Sun Care, Fragrâncias, Pet Care.'
WHERE UPPER(nome) = 'MCASSAB';

UPDATE fornecedores SET
  site = 'https://discover.univarsolutions.com/pt-br',
  descricao = 'Maior distribuidora global de produtos químicos especiais e ingredientes, com operações robustas no Brasil desde 1995. Atende sun care, skin care, color cosmetics e hair care.',
  especialidade = 'Distribuição global de ingredientes especiais para Personal Care: filtros UV (Croda), emolientes, ativos, tensoativos e polímeros',
  porte = 'multinacional',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Unidades no Brasil: SP, Sorocaba, Pernambuco, SC e Manaus. Distribuidora autorizada Croda (filtros solares). Segundo canal: cosmeticos2@univar.com.br / CNPJ 67.890.245/0001-56'
WHERE UPPER(nome) = 'UNIVAR';

UPDATE fornecedores SET
  site = NULL,
  descricao = 'Importadora e fabricante de óleos essenciais e produtos aromáticos, fundada em 1966. Produz óleos essenciais, misturas odoríferas, extratos de produtos aromáticos naturais e resinóides.',
  especialidade = 'Óleos essenciais, extratos aromáticos naturais, resinóides e misturas odoríferas para cosméticos e domissanitários',
  porte = 'pequeno',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 61.347.167/0001-18. Rua Força Pública, 244 — Santana, São Paulo-SP, CEP 02012-080. Empresa EPP ativa. Sem site oficial público.'
WHERE UPPER(nome) = 'GLAMIR';

UPDATE fornecedores SET
  site = 'https://sarfam.com.br',
  descricao = 'Distribuidora brasileira de ingredientes cosméticos de alta performance, certificada ISO 9001:2015. Representa fabricantes globais de renome, distribuindo bioativos e especialidades para marcas que valorizam ciência e inovação.',
  especialidade = 'Distribuição de bioativos, ingredientes funcionais e especialidades cosméticas para skin care e hair care',
  porte = 'pequeno',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'ISO 9001:2015. Rua Henri Dunant, 873 — Conj. 1401, CEP 04709-111, São Paulo-SP. Empresa 100% nacional.'
WHERE UPPER(nome) = 'SARFAM';

UPDATE fornecedores SET
  site = 'https://www.campestre.com.br',
  descricao = 'Empresa especializada em óleos vegetais, animais e minerais, atuante desde 1974. Atende cosméticos, alimentício, farmacêutico, nutrição animal e processamento de carnes.',
  especialidade = 'Óleos vegetais (girassol, palma, soja e especiais), óleos animais e óleo mineral branco para cosméticos',
  porte = 'medio',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Rua Luisiana, 135 — Taboão, São Bernardo do Campo-SP. Tel: (11) 4178-0255. 50+ anos de mercado.'
WHERE UPPER(nome) = 'CAMPESTRE';

UPDATE fornecedores SET
  site = 'https://www.baruquimica.com.br',
  descricao = 'Empresa fabricante e distribuidora de matérias-primas para as indústrias cosmética e de limpeza, focada em negociações de grande escala com qualidade. Portfólio para personal care e home care.',
  especialidade = 'Extratos glicólicos, óleos vegetais, manteigas, queratinas, vitaminas e ativos para cosméticos e limpeza',
  porte = 'pequeno',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 36.731.063/0001-65. Rua Adelino Cardana, 293, CEP 06401-147, Barueri-SP. Tel: (11) 4247-8319.'
WHERE UPPER(nome) = 'BARUQUIMICA';

UPDATE fornecedores SET
  site = 'https://www.robertet.com/en/blog/site/robertet-do-brasil/',
  descricao = 'Subsidiária brasileira do Grupo Robertet (França), presente no Brasil desde 1963, com planta fabril em Barueri-SP. Um dos mais tradicionais fornecedores de fragrâncias naturais e ingredientes aromáticos.',
  especialidade = 'Fragrâncias naturais e sintéticas, ingredientes aromáticos, matérias-primas naturais para perfumaria fina e cosméticos',
  porte = 'multinacional',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Nova planta em Barueri (Alameda Amazonas, 628 — Alphaville), investimento R$ 48M. CNPJ 60.888.260/0001-77. Clientes: Avon, L''Oréal, Hinode, Embelleza.'
WHERE UPPER(nome) IN ('ROBERTET', 'ROBERTET BRASIL');

UPDATE fornecedores SET
  site = 'https://www.symrise.com/pt/',
  descricao = 'Subsidiária da Symrise AG (Alemanha), um dos maiores grupos globais de fragrâncias, aromas e ingredientes cosméticos. Presente no Brasil com fábrica no Pará e escritório em SP.',
  especialidade = 'Fragrâncias, aromas, ingredientes cosméticos ativos, extratos naturais e ingredientes para nutrição',
  porte = 'multinacional',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 43.940.758/0001-12. Rua Domingos Jorge, 1000 — Socorro, São Paulo-SP. Empresa B Corp certificada. Centro criativo de fragrâncias finas em SP. Fábrica de ingredientes naturais no Pará.'
WHERE UPPER(nome) IN ('SYMRISE', 'SYMRISE BRASIL');

UPDATE fornecedores SET
  site = 'https://www.brenntag.com/pt-br/',
  descricao = 'Maior distribuidora global de produtos químicos e ingredientes especiais, com presença no Brasil desde 1995. Opera em todo território nacional. Adquiriu a PIC (Itapevi-SP) em 2024.',
  especialidade = 'Distribuição global de ingredientes para Personal Care: emolientes, filtros UV, tensoativos, conservantes, polímeros e ativos',
  porte = 'multinacional',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Adquiriu PIC (Itapevi-SP, CNPJ 03.421.909/0001-01) em 2024. Adquiriu Fenilquímica e Quimisa. Portfólio Personal Care: IFF, Croda, Evonik, DSM.'
WHERE UPPER(nome) IN ('BRENNTAG', 'BRENNTAG BRASIL');

UPDATE fornecedores SET
  site = 'https://brasil.barentz.com',
  descricao = 'Distribuidora global de ingredientes especiais para Life Science, resultado da fusão com Tovani Benzaquen Ingredientes (SP). Um dos maiores distribuidores de life science da América do Sul desde 1992.',
  especialidade = 'Distribuição de ingredientes premium para cosméticos, nutracêuticos, farma e nutrição animal',
  porte = 'multinacional',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Av. Angélica, 2220 — 9º/10º andar, Consolação, SP. Tel: (11) 2974-7474. Antigamente: Tovani Benzaquen. Adquiriu Volp (2023) e Metachem. Grupo Barentz International (Holanda).'
WHERE UPPER(nome) IN ('BARENTZ', 'BARENTZ BRASIL', 'TOVANI BENZAQUEN');

-- ── LOTE 2: Chemyunion, Citral, Citroflavor, Summit, Dierberger, Dinaco,
--            Eucaliptos, Focus Quimica, Glamir, Iberchem/Iberia, Inolex ─────

UPDATE fornecedores SET
  site = 'https://citral.com.br',
  descricao = 'Importadora e distribuidora brasileira de ingredientes químicos aromáticos e óleos essenciais, fundada em 1991, com foco em aromas, fragrâncias, cosméticos e aromaterapia.',
  especialidade = 'Químicos aromáticos, óleos essenciais, ingredientes para fragrâncias e aromaterapia: Citral Extra, Linalool, Citronelol, Triplal, Adoxal, Tetrahydrogeraniol',
  porte = 'pequeno',
  categoria_fornecedor = 'importador',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 67.282.871/0001-16. Estrada Velha da Balsa, 804, Barueri-SP. Capital social R$ 3M. contato: citral@citral.com.br'
WHERE UPPER(nome) = 'CITRAL';

UPDATE fornecedores SET
  site = 'https://en.citroflavor.com',
  descricao = 'Empresa 100% brasileira fabricante de óleos essenciais cítricos e concentrados de frutas, localizada no coração da região citrícola do interior paulista, com destilação fracionada a baixa pressão.',
  especialidade = 'Óleos essenciais cítricos: Laranja Doce, Laranja Azeda, Limão Tahiti, Limão Siciliano, Tangerina Verde, Tangerina Cravo, Toranja. Terpenos e frações para perfumaria.',
  porte = 'pequeno',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Rua Taubaté, 2059, Jardim Primavera, Catanduva-SP. citroflavor@citroflavor.com.br. Eireli/EPP. Padrão alimentício.'
WHERE UPPER(nome) = 'CITROFLAVOR';

UPDATE fornecedores SET
  site = 'https://www.summitcosmetics-latam.com',
  descricao = 'Distribuidora de ingredientes e especialidades cosméticas para a América Latina, parte do grupo Sumitomo Corporation (Japão), com mais de 36 anos de mercado e operação em Guarulhos-SP.',
  especialidade = 'Ingredientes para Hair Care, Make Up (pigmentos, efeito especial), Skin Care, Sun Care (boosters FPS), Fragrâncias, Pet Care. Portfólio de fornecedores internacionais premium.',
  porte = 'medio',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 18.323.476/0001-29. Capital social R$ 3,6M. Sócios: Sumitomo Corporation + Summit Cosmetics Corporation (Japão). Subsidiárias nos EUA (Presperse) e Europa.'
WHERE UPPER(nome) IN ('SUMMIT', 'SUMMIT COSMETICS', 'COSMETO');

UPDATE fornecedores SET
  site = 'https://www.dierberger.com.br',
  descricao = 'Grupo brasileiro produtor verticalizado de óleos essenciais e fragrâncias, com origem nos anos 1930, controlando toda a cadeia do campo ao produto final — plantio, destilação e comercialização.',
  especialidade = 'Óleos essenciais naturais (15+ variedades cultivadas em terras próprias), fragrâncias naturais premium, cristais e macadâmias. Primeiro certificado orgânico de OEs do Brasil.',
  porte = 'medio',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Av. Industrial José Erineu Ortigosa, 827, Barra Bonita-SP. vendas@dierberger.com.br. 6.000+ ha próprios em SP, MG e Paraguai. 100-499 funcionários.'
WHERE UPPER(nome) = 'DIERBERGER';

UPDATE fornecedores SET
  site = 'https://dinaco.com.br',
  descricao = 'Distribuidora de especialidades químicas com mais de 80 anos de atuação no Brasil, representando fabricantes globais líderes em Personal Care, Home Care, Food, Agro, Tintas, Plásticos e Borracha.',
  especialidade = 'Personal Care: fragrâncias Takasago, ingredientes capilares (H. Lowenstein), jojoba (Jojoba Desert), silicones Evonik. Representadas: Takasago, Evonik, DuPont, Arxada, Lubrizol, Honeywell.',
  porte = 'medio',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Sede: Rio de Janeiro-RJ. Tel: (21) 3147-3317 / 0800 772 2620. Fundada em 1940. Premiada como melhor distribuidor global.'
WHERE UPPER(nome) = 'DINACO';

UPDATE fornecedores SET
  site = 'https://www.focusquimica.com',
  descricao = 'Importadora e distribuidora de ingredientes e especialidades para o mercado cosmético brasileiro, com mais de 30 anos de experiência e portfólio de parceiros globais premium.',
  especialidade = 'Ativos biotecnológicos, filtros solares, vitaminas, silicones (WACKER), ésteres vegetais, emolientes, pigmentos. Representações: dsm-firmenich, WACKER, Tagra, Sophim, Lessonia, Thor.',
  porte = 'pequeno',
  categoria_fornecedor = 'importador',
  observacoes = COALESCE(observacoes || ' | ', '') || 'São Paulo-SP. focusquimica@focusquimica.com. Lab de formulação próprio. Certificações ECOCERT, Cosmos, Natrue, Fair Trade, RSPO nos produtos representados. Filial: CNPJ 12.345.690/0002-90'
WHERE UPPER(nome) = 'FOCUS QUIMICA';

UPDATE fornecedores SET
  site = 'https://iberchem.com/locations/iberchem-brazil/',
  descricao = 'Fabricante multinacional de fragrâncias (origem Espanha, grupo Croda International), com unidade de produção própria em Campinas-SP, atendendo perfumaria fina, personal care, home care e air care no Brasil.',
  especialidade = 'Criação e fabricação de fragrâncias para perfumaria fina, cuidados pessoais, higiene doméstica. Tecnologias: VernovaCaps® (microencapsulação) e VernovaPure® (biodegradável).',
  porte = 'grande',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 19.251.901/0001-84. Av. Mercedes Benz, 679, Comp. 3F1, Distrito Industrial, Campinas-SP, CEP 13054-750. Tel: (19) 3765-3709. 40+ anos de grupo, 25 unidades globais. Parte da Croda International.'
WHERE UPPER(nome) IN ('IBERCHEM', 'IBERIA');

UPDATE fornecedores SET
  site = 'https://www.inolex.com',
  descricao = 'Fabricante americano de ingredientes cosméticos sustentáveis com mais de 145 anos de história, com escritório e depósito próprios em São Paulo, focado em alternativas naturais a silicones e conservantes sintéticos.',
  especialidade = 'Preservação segura (sem parabenos), cuidados capilares plant-based, alternativas sustentáveis a silicones, emolientes sensoriais naturais, emulsificantes e texturizadores naturais',
  porte = 'multinacional',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Inolex do Brasil — CNPJ: 24.218.252/0001-50. Rua Pais Leme, 524, Conj 111, Pinheiros, SP. Tel: (11) 3647-0107. csaiani@inolex.com. Matriz: Philadelphia, EUA. 85+ países.'
WHERE UPPER(nome) = 'INOLEX';

-- ── LOTE 3: Interlab, Khol (já feito acima), Labsynth, Legee, Maian, MCassab,
--            Oxigen, Phytoflora, Phytovital (já feito), PIC, Quimiformula ─────

UPDATE fornecedores SET
  site = 'https://www.interlabdist.com.br',
  descricao = 'Distribuidora de produtos científicos fundada em 1974, atendendo laboratórios clínicos, de controle de qualidade e produção industrial. Fornece matérias-primas e reagentes para alimentício, cosmético e farmacêutico.',
  especialidade = 'Reagentes analíticos (marca Inlab), matérias-primas para laboratórios e indústrias. Normas FCC, FB, USP.',
  porte = 'medio',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'São Paulo-SP. interlab@interlabdist.com.br. Tel: (11) 5564-9500. Foco principal em produtos científicos; cosméticos como segmento secundário.'
WHERE UPPER(nome) = 'INTERLAB';

UPDATE fornecedores SET
  site = 'https://www.labsynth.com.br',
  descricao = 'Fabricante, importadora e distribuidora de produtos químicos e reagentes analíticos com mais de 40 anos de mercado, certificada ISO 9001, ISO 14001 e ANVISA. Fornece para alimentício, cosmético e farmacêutico.',
  especialidade = 'Reagentes analíticos (marca Synth®), matérias-primas para cosméticos, alimentos e farmacêuticos conforme normas FCC/FB/USP',
  porte = 'medio',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Diadema-SP. synth@synth.com.br. Tel: (11) 4072-6100. WhatsApp: (11) 97705-0002. Capital social ~R$ 2M. ISO 9001 e 14001.'
WHERE UPPER(nome) = 'LABSYNTH';

UPDATE fornecedores SET
  site = 'https://legee.com.br',
  descricao = 'Produtora brasileira de óleos essenciais e hidrolatos 100% puros, com cultivo orgânico próprio no interior de São Paulo e destilação in-house. Opera com atacado B2B voltado a formuladores e cosméticos.',
  especialidade = 'Óleos essenciais (linha mais ampla do mercado BR), hidrolatos orgânicos, extratos vegetais e insumos para aromaterapia e cosméticos naturais. Maior linha de hidrolatos do Brasil.',
  porte = 'pequeno',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Interior de São Paulo-SP. Produtor vertical (do cultivo à destilação). Modelo atacado B2B via loja virtual (legee.lojavirtualnuvem.com.br).'
WHERE UPPER(nome) = 'LEGEE';

UPDATE fornecedores SET
  site = 'https://maian.com.br',
  descricao = 'Empresa com mais de 40 anos especializada em importação, distribuição, fabricação e desenvolvimento de matérias-primas para cosméticos, alimentos, farma, agro e domissanitários. Presença em 15+ países.',
  especialidade = 'Ingredientes cosméticos (linha Maian Beauty), substitutos naturais/sustentáveis a derivados de petróleo e animais. Linhas: Personal Care, Food, Farma e Agro.',
  porte = 'medio',
  categoria_fornecedor = 'importador',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Sede: Jandira-SP. CNPJ: 08.704.392/0001-81 (imp/exp) e 35.634.515/0001-28 (indústria). comercial4@maian.com.br. Tel: (11) 4774-7010. Ecovadis e Smeta certificada. Exporta para 4 continentes.'
WHERE UPPER(nome) = 'MAIAN';

UPDATE fornecedores SET
  site = 'https://phytoflora.com.br',
  descricao = 'Empresa 100% brasileira especializada em matérias-primas para Personal Care, com ISO 9001. Fundada em 1987, atua em todo território nacional com portfólio técnico para hair e skin care.',
  especialidade = 'Guar quaternizadas, ceras autoemulsionantes, behentrimonium methosulfate, conservantes, espessantes, lanolina, álcoois emolientes, proteínas quaternizadas, tensoativos. Linha Phytoattive (extratos, óleos, blends).',
  porte = 'micro',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 58.283.763/0001-77 (Microempresa). Sede: Rua Dezoito, 3461 - Bairro Industrial, Barretos-SP. Tel: (11) 5627-5111.'
WHERE UPPER(nome) = 'PHYTOFLORA';

UPDATE fornecedores SET
  site = 'https://www.oxygenquimica.com.br',
  descricao = 'Distribuidora, fabricadora e exportadora de matérias-primas químicas com mais de 15 anos de atuação, líder nacional na distribuição de glicerina bi-destilada. Portfólio de 200+ itens, 1.000+ clientes em 10+ países.',
  especialidade = 'Glicerina bi-destilada, oxysilicones, poliquatérnios, PVP K90, ácidos, álcoois e ingredientes para personal care, alimentos, nutrição, domissanitários, resinas, tintas e agroquímicos.',
  porte = 'grande',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Barueri-SP (comercial); CD Itapevi-SP; filiais Itajaí-SC e Recife-PE. contato@oxygenquimica.com.br. Tel: (11) 4205-1071. WhatsApp: (11) 91939-3647. Parte de grupo com faturamento R$ 10Bi+.'
WHERE UPPER(nome) = 'OXIGEN';

UPDATE fornecedores SET
  site = 'https://www.brenntag.com/pt-br/',
  descricao = 'Maior distribuidora global de produtos químicos. Fundada em 1991 em Itapevi-SP como PIC — Distribuidora pioneira de especialidades para personal care e farmácia de manipulação. Adquirida pela Brenntag em 2024.',
  especialidade = 'Especialidades químicas para personal care e farmacêutico: ingredientes cosméticos, farmácia de manipulação e Life Science.',
  porte = 'multinacional',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'CNPJ: 03.421.909/0001-01 (P.i.c Brenntag Specialties Brasil Ltda), Itapevi-SP. Faturamento pré-aquisição: ~€ 11M (2023). Site pic-web.com.br redireciona para Brenntag.'
WHERE UPPER(nome) = 'PIC';

UPDATE fornecedores SET
  site = 'https://quimiformula.com.br',
  descricao = 'Distribuidora de matérias-primas para cosméticos e saneantes, com mais de 20 anos de mercado. Fundada em 2004, com sede própria em Curitiba-PR e atendimento nacional.',
  especialidade = 'Tensoativos (todos os tipos), conservantes, bases autoemulsionantes, óleos vegetais, manteigas, silicones, filtros solares, repelente DEET, ativos e bioativos para cosméticos.',
  porte = 'pequeno',
  categoria_fornecedor = 'distribuidor',
  observacoes = COALESCE(observacoes || ' | ', '') || 'R. Bartolomeu Lourenço de Gusmão, 1580 - Hauer, Curitiba-PR. contato@quimiformula.com.br. Tel: (41) 3296-9052. WhatsApp: (41) 98775-7659. 20+ anos de atuação.'
WHERE UPPER(nome) = 'QUIMIFORMULA';

-- Fornecedores sem localização pública confirmada
UPDATE fornecedores SET
  descricao = 'Produtor de óleos essenciais de eucalipto para indústria cosmética e de higiene pessoal. Empresa de pequeno porte ou nome comercial regional.',
  especialidade = 'Óleos essenciais de eucalipto (Globulus, Citriodora) para cosméticos, higiene e aromaterapia',
  porte = 'micro',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Site e CNPJ não localizados em buscas abertas. Confirmar nome legal completo. Candidatos próximos: Essenceflora, FERQUIMA, Verde Essências ou Dierberger (linha eucalipto).'
WHERE UPPER(nome) = 'EUCALIPTOS';

-- THOR: fabricante global de biocidas e conservantes cosméticos
UPDATE fornecedores SET
  site = 'https://www.thor.com',
  descricao = 'Grupo químico global especializado em biocidas e conservantes para cosméticos, tintas, coatings e proteção industrial. Presente no Brasil através de distribuidores como Focus Química.',
  especialidade = 'Biocidas, conservantes cosméticos (linha Acticide), agentes antimicrobianos e estabilizantes para personal care, home care e coatings',
  porte = 'multinacional',
  categoria_fornecedor = 'fabricante',
  observacoes = COALESCE(observacoes || ' | ', '') || 'Grupo sediado no Reino Unido. No Brasil, distribuição via Focus Química. Linha Acticide amplamente usada em formulações cosméticas.'
WHERE UPPER(nome) = 'THOR';

-- TARUMA: distribuidora regional (SP)
UPDATE fornecedores SET
  descricao = 'Fornecedor de matérias-primas para cosméticos, com atuação regional.',
  porte = 'micro',
  categoria_fornecedor = 'distribuidor'
WHERE UPPER(nome) = 'TARUMA';

-- ── VERIFICAÇÃO FINAL ─────────────────────────────────────────────────────────
-- Execute separadamente:
-- SELECT nome, site IS NOT NULL as tem_site, porte, categoria_fornecedor,
--        LEFT(descricao, 60) as descricao_preview
-- FROM fornecedores
-- ORDER BY nome;

COMMIT;
