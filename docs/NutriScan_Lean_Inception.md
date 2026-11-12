**Lean Inception: Projeto NutriScan**

*Preenchimento completo da metodologia Lean Inception (Paulo Caroli) com base no levantamento de requisitos e regras de negócio do NutriScan (PEX-MDL-54).*

| Contexto do Projeto:O NutriScan é um aplicativo mobile focado em saúde pública e conscientização nutricional em Manaus/AM. Através de OCR e visão computacional, ele lê a face principal da embalagem de alimentos ultraprocessados no ponto de venda e converte a legislação (RDC nº 429/2020 ANVISA) e os dados técnicos da rotulagem em alertas e explicações acessíveis para a população. |
| :---- |

**Passo 1: Visão do Produto**

Definição clara do propósito da solução, público-alvo, problema enfrentado e diferencial competitivo perante alternativas de mercado.

| Para | A população consumidora da cidade de Manaus (AM), incluindo público leigo em nutrição e pessoas que buscam escolhas alimentares mais saudáveis. |
| :---- | :---- |
| **Quem** | Enfrenta dificuldades para entender tabelas nutricionais complexas e identificar nutrientes críticos (açúcares adicionados, sódio e gorduras saturadas) em alimentos industrializados/ultraprocessados no momento da compra. |
| **O NutriScan** | É um aplicativo mobile-first de leitura, tradução e conscientização nutricional em saúde pública. |
| **É um(a)** | Ferramenta gratuita de visão computacional (OCR) e educação alimentícia. |
| **Que** | Lê a face principal da embalagem do produto (a que fica exposta na gôndola) via câmera do celular (OCR), identificando-o no banco regional e destacando alertas visuais instantâneos e traduzindo dados técnicos da ANVISA (RDC nº 429/2020) em explicações curtas, simples e acessíveis. |
| **Diferente de** | Aplicativos genéricos com tabelas nutricionais extensas e linguagem altamente técnica que geram um entedimento nebuloso e nenhum aprendizado nutricional ao cliente. |

**Passo 2: É, Não É, Faz, Não Faz**

Define o NutriScan como produto para alinhar com as expectativas de entrega.

| É (O que o produto é) | NÃO É (O que o produto não é) |
| :---- | :---- |
| • Um aplicativo mobile-first (React Native) focado em saúde pública e conscientização nutricional.• Um tradutor visual de rótulos baseado nas normas da ANVISA (RDC nº 429/2020).• Um leitor inteligente de rótulos por OCR e visão computacional em tempo real.• Uma solução pública, gratuita e acessível sem barreiras de uso. | • Não é um aplicativo de dieta restritiva ou contador de calorias (ex: MyFitnessPal).• Não é um prontuário médico ou substituto para consultas com nutricionistas/médicos.• Não é um e-commerce ou marketplace para venda de alimentos.• Não é um software restrito a uso interno de órgãos fiscalizadores. |

| FAZ (O que o produto faz) | NÃO FAZ (O que o produto não faz) |
| :---- | :---- |
| • Lê a face principal da embalagem, exposta na gôndola, utilizando a câmera do smartphone (RF01).• Identifica o produto pela face (nome, marca e selos) via OCR/Visão Computacional e consulta o banco cadastrado (RF02).• Destaca alertas visuais de nutrientes críticos (alto teor de açúcares adicionados, sódio e gordura saturada \- RF04).• Converte dados técnicos em linguagem palatável em 3 níveis de profundidade (RNF03).• Consulta banco de dados regionalizado com produtos consumidos em Manaus/AM (RF05). | • Não faz diagnóstico de alergias alimentares nem prescribe planos alimentares personalizados.• Não exige pagamento, assinaturas premium ou cadastro obrigatório para consulta (RN03).• Não substitui a fiscalização oficial de rotulagem por órgãos como a ANVISA/Procon.• Não processa compras nem oferece cupons de desconto comercial. |

**Passo 3: Personas, Objetivos e Funcionalidades**

Mapeamento do perfil de usuário principal e tempestade de ideias de funcionalidades associadas aos seus objetivos e dores.

**3.1. Perfil da Persona Principal**

| Nome da Persona: | Dona Maria / Consumidor Consciente de Manaus |
| :---- | :---- |
| **Perfil e Contexto:** | Morador(a) de Manaus, realiza compras de supermercado com frequência para a família. Possui rotina corrida e não tem formação técnica na área da saúde ou nutrição. |
| **Necessidades / Dores:** | Acha as tabelas nutricionais impressas nos rótulos minúsculas e difíceis de interpretar. Tem preocupação com a saúde da família (pressão alta, diabetes), mas não sabe identificar rapidamente se um produto ultraprocessado contém excesso de sódio ou açúcar. |
| **Objetivos com o Produto:** | Tirar a dúvida rapidamente no corredor do supermercado apontando a câmera do celular para o produto e entender de forma imediata e visual se ele é saudável ou se possui nutrientes críticos nocivos. |
| **Comportamento Tecnológico:** | Utiliza smartphone Android/iOS diariamente para redes sociais e mensagens. Busca aplicativos intuitivos, rápidos, sem formulários longos ou propagandas abusivas. |

**3.2. Tempestade de Ideias de Funcionalidades**

Relação detalhada de funcionalidades extraídas do levantamento de requisitos do projeto.

| ID | Nome da Funcionalidade | Descrição Resumida | Requisito / Regra Origem |
| :---- | :---- | :---- | :---- |
| F01 | Scanner da Câmera — Face da Embalagem | Interface mobile para captura instantânea da face principal da embalagem (a exposta na gôndola) e leitura do texto por OCR. | RF01 / RNF01 |
| F02 | Motor de OCR & Identificação do Produto | Reconhecimento automatizado do texto da face da embalagem (nome, marca e selos) via algoritmo de visão computacional, para identificar o produto no banco cadastrado. | RF02 / RNF04 |
| F03 | Tradução Nutricional Multinível | Exibição da tradução técnica em 3 níveis: destaque (5-10 palavras), resumo (20-40 palavras) e detalhe (60-90 palavras). | RF03 / RNF03 |
| F04 | Alertas Visuais de Nutrientes Críticos | Sinalização visual (magnitudes/selos) para açúcares adicionados, sódio e gordura saturada conforme a RDC 429/2020. | RF04 / RN01 / RN02 |
| F05 | Consulta ao Banco Regional de Alimentos | Motor de busca e sincronização com banco de dados em FastAPI contendo alimentos consumidos em Manaus/AM. | RF05 / RNF02 / RN03 |

**Passo 4: Revisão Técnica, de Negócio e de UX \+ Sequenciador**

Análise de incertezas, esforço e valor estratégico das funcionalidades com sequenciamento por ondas de desenvolvimento (Waves).

| Funcionalidade | Valor de Negócio | Esforço Técnico | Incerteza Técnica | Incerteza de UX | Onda (Wave) |
| :---- | ----- | ----- | ----- | ----- | ----- |
| F01 \- Scanner da Câmera | Alto (\$\$\$) | Médio (EE) | Baixa (G1) | Baixa (U1) | **Onda 1 (MVP)** |
| F04 \- Alertas de Nutrientes Críticos | Alto (\$\$\$) | Baixo (E) | Baixa (G1) | Baixa (U1) | **Onda 1 (MVP)** |
| F03 \- Tradução Nutricional | Alto (\$\$\$) | Médio (EE) | Baixa (G1) | Média (U2) | **Onda 1 (MVP)** |
| F02 \- Motor de OCR & Identificação | Alto (\$\$\$) | Alto (EEE) | Média (G2) | Baixa (U1) | Onda 2 |
| F05 \- Consulta ao Banco Regional | Médio (\$\$) | Médio (EE) | Baixa (G1) | Baixa (U1) | Onda 2 |

**Passo 5: Canvas MVP**

Consolidação da proposta de valor, público prioritário, fluxo de uso, funcionalidades e métricas para a primeira versão validável do NutriScan.

| 1\. Proposta de Valor do MVP | Oferecer aos consumidores de Manaus uma forma gratuita, simples e imediata de identificar alimentos ultraprocessados nocivos no ponto de venda, convertendo os alertas de nutrientes críticos da ANVISA em linguagem visual acessível. |
| :---- | :---- |
| **2\. Personas Alvo do MVP** | Dona Maria e consumidores leigos em nutrição que realizam compras em supermercados regionais em Manaus/AM. |
| **3\. Jornada do Usuário no MVP** | 1\. Abre o app \-\> 2\. Aponta a câmera para a frente do produto (a face exposta na gôndola) \-\> 3\. Recebe alertas visuais imediatos de Açúcar/Sódio/Gordura \-\> 4\. Lê a tradução curta e acessível. |
| **4\. Funcionalidades Incluídas** | • F01: Scanner da Câmera — leitura da face principal da embalagem• F04: Alertas Visuais de Nutrientes Críticos (RDC 429/2020)• F03: Tradução Nutricional em Linguagem Acessível (3 níveis) |
| **5\. Resultado Esperado** | Validação da aceitação da interface mobile e da clareza das informações curtas junto ao público final durante testes no ponto de venda. |
| **6\. Métricas de Validação** | • Taxa de compreensão dos alertas (avaliação Likert \> 80% de aprovação \- RNF03).• Tempo médio de resposta da consulta e leitura visual (\< 3 segundos).• Frequência de leituras realizadas por usuário no ponto de venda. |
|  |  |

**Passo 6: Valor de Negócio x Requisitos**

Mapeamento do impacto de saúde pública e facilidade de implementação de cada requisito para definição da priorização técnica e estratégica.

| Requisito / Funcionalidade | Impacto Social / Negócio (1-5) | Custo / Esforço (1-5) | Prioridade & Release |
| :---- | ----- | ----- | ----- |
| RF01 / F01 \- Escaneamento por Câmera | 5 (Crítico) | 2 (Médio) | Prioridade Alta \- MVP (Onda 1\) |
| RF04 / F04 \- Destaque Nutrientes Críticos | 5 (Crítico) | 1 (Baixo) | Prioridade Alta \- MVP (Onda 1\) |
| RF03 / F03 \- Tradução Nutricional | 5 (Crítico) | 2 (Médio) | Prioridade Alta \- MVP (Onda 1\) |
| RF02 / F02 \- Reconhecimento OCR Avançado | 4 (Alto) | 4 (Alto) | Prioridade Média \- Release 2 (Onda 2\) |
| RF05 / F05 \- Consulta ao Banco Regional | 3 (Médio) | 3 (Médio) | Prioridade Média \- Release 2 (Onda 2\) |

