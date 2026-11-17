# NutriScan 📷🥗

**Escaneie a frente da embalagem. Entenda o que está comprando.** — aplicativo mobile de tradução nutricional para Manaus/AM.

> Síntese do [PEX-MDL-54 — Projeto de Intervenção (Disciplina de Extensão)](docs/PEX-MDL-54%20-PROJETO%20DE%20INTERVENCAO%20-%20(DISCIPLINA%20DE%20EXTENSAO%20-%20DISCENTE).md) e da [Lean Inception do NutriScan](docs/NutriScan_Lean_Inception.md).

---

## 1. Sobre o projeto

O NutriScan é um aplicativo **mobile-first** de saúde pública e conscientização nutricional. Por meio da câmera do celular, ele lê a **face principal da embalagem** do produto ultraprocessado **no ponto de venda** — a face que fica exposta na gôndola, com nome, marca e os selos da rotulagem frontal — e traduz a legislação (RDC nº 429/2020 da ANVISA) em **alertas e explicações acessíveis** para a população — transformando letras pequenas e termos técnicos em decisões alimentares melhores, no corredor do supermercado.

| Dados do projeto | |
| :--- | :--- |
| **Instituição** | Uninorte — Centro Universitário do Norte (Campus Djalma Batista, Manaus–AM) |
| **Disciplina** | Atividades Práticas Interdisciplinares de Extensão III — Prof. Dean Matos Serpa |
| **Curso** | Ciência da Computação — 6º período |
| **Área temática** | Tecnologia e Produção — Tecnologias Aplicadas à Saúde / Inovação Social (ODS 3 — Saúde e Bem-Estar; ODS 9 — Indústria, Inovação e Infraestrutura) |
| **Equipe** | David Manuel (03346297), Fabricio Rodrigues (03335290), Marcelo Carvalho (03345274), Sabrina Santana (03346714), Yago Mauricio Lima do Nascimento (03343527) |

### Por que em Manaus?

A região Norte é historicamente rica em biodiversidade alimentar, mas a ocidentalização da dieta — impulsionada pelo rápido crescimento urbano — tem trocado peixes, raízes e frutos regionais por ultraprocessados de baixo custo nutricional, especialmente nas áreas periféricas. O projeto atua na **prevenção primária** de DCNTs (obesidade, diabetes tipo 2, hipertensão) e na **democratização da informação nutricional**, com foco direto no consumidor local.

---

## 2. Visão do produto (Lean Inception)

| | |
| :--- | :--- |
| **Para** | A população consumidora de Manaus/AM, incluindo público leigo em nutrição |
| **Quem** | Enfrenta dificuldades para entender rótulos complexos e identificar nutrientes críticos (açúcares adicionados, sódio e gorduras saturadas) no momento da compra |
| **O NutriScan** | É um aplicativo mobile-first de leitura, tradução e conscientização nutricional |
| **É um(a)** | Ferramenta gratuita de visão computacional (OCR) e educação alimentar |
| **Que** | Lê a face principal da embalagem (a exposta na gôndola) via câmera (OCR), destacando alertas visuais instantâneos e traduzindo os dados técnicos da ANVISA em explicações curtas, simples e acessíveis |
| **Diferente de** | Apps genéricos com tabelas extensas e linguagem técnica que não geram aprendizado nutricional |

### É / Não É · Faz / Não Faz

| É ✔ | Não É ✘ |
| :--- | :--- |
| Aplicativo mobile-first focado em saúde pública | Contador de calorias ou app de dieta restritiva |
| Tradutor visual da rotulagem frontal (RDC nº 429/2020) | Prontuário médico ou substituto de nutricionista |
| Leitor inteligente de embalagens por OCR em tempo real | E-commerce ou marketplace de alimentos |
| Solução pública, gratuita e acessível | Software restrito à fiscalização (ANVISA/Procon) |

| Faz ✔ | Não Faz ✘ |
| :--- | :--- |
| Lê a face principal da embalagem (exposta na gôndola) via OCR (RF01) | Diagnóstico de alergias ou planos alimentares |
| Identifica o produto contra o banco regional curado (RF05) | Cobrança, assinatura ou cadastro obrigatório (RN03) |
| Destaca alertas de nutrientes críticos (RF04) | Substitui a fiscalização oficial de rotulagem |
| Traduz dados técnicos em 3 níveis (RNF03) | Processa compras ou cupons |
| Mostra a foto da embalagem como confirmação do match | Extrai tabela nutricional da imagem (a tabela vem do banco) |

---

## 3. Persona principal

**Dona Maria / Consumidor Consciente de Manaus** — moradora que faz compras para a família, sem formação em nutrição, com rotina corrida. Acha os rótulos minúsculos e ilegíveis; preocupada com pressão alta e diabetes na família, precisa de **resposta rápida apontando a câmera para a frente da embalagem**. Usa Android/iOS diariamente e espera apps intuitivos, sem formulários longos.

---

## 4. Funcionalidades e priorização

| ID | Funcionalidade | Requisito/RN de origem | Onda |
| :--- | :--- | :--- | :--- |
| **F01** | Scanner da câmera — leitura da face principal da embalagem (exposta na gôndola) por OCR | RF01 / RNF01 | **1 — MVP** |
| **F04** | Alertas visuais de nutrientes críticos (açúcares adicionados, sódio, gordura saturada — RDC 429/2020) | RF04 / RN01 / RN02 | **1 — MVP** |
| **F03** | Tradução nutricional multinível: destaque (5–10 palavras) → resumo (20–40) → detalhe (60–90) | RF03 / RNF03 | **1 — MVP** |
| **F02** | Motor de OCR avançado (robustez de leitura da face: ângulo, brilho, tipografia variada) | RF02 / RNF04 | 2 |
| **F05** | Identificação no banco regional + confirmação por imagem da embalagem | RF05 / RNF02 / RN03 | 2 |

### Canvas do MVP (Onda 1)

- **Jornada:** abre o app → aponta a câmera para a frente da embalagem (a que está exposta na gôndola) → recebe alertas visuais de açúcar/sódio/gordura → lê a tradução curta.
- **Métricas de validação:** compreensão dos alertas (Likert > 80% — RNF03) · resposta e leitura em **< 3 segundos** · frequência de leituras no ponto de venda.

---

## 5. Stack técnica

> **Nota sobre o PEX-MDL-54:** o documento de extensão previa frontend web (React, Vite, TypeScript e Tailwind). A Lean Inception consolidou o NutriScan como **app mobile-first**, e a equipe optou por **React Native nativo** — necessário para acesso de baixa latência à câmera e OCR *on-device*. O backend FastAPI com SQLite permanece como planejado (Onda 2). Ver [§10](#10-ajustes-em-relação-aos-documentos-de-origem) para a lista completa de alinhamentos.

| Camada | Tecnologia | Versão |
| :--- | :--- | :--- |
| App mobile | React Native + TypeScript (New Architecture, Hermes) | 0.88.1 |
| Câmera | [react-native-vision-camera](https://github.com/margelo/react-native-vision-camera) | 5.2.4 |
| **OCR on-device** | [`react-native-vision-camera-ocr-plus`](https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus) (Google ML Kit, via Nitro Modules) | 2.1.2 |
| Frame processors | react-native-vision-camera-worklets + react-native-worklets | 5.2.4 / 0.13.1 |
| Runtime Nitro | react-native-nitro-modules | 0.37.2 |
| Backend (Onda 2) | Python + FastAPI + SQLite (FTS5 para busca por texto) | — |

### Por que OCR nativo?

O coração do NutriScan é **ler a face principal da embalagem** — a que fica exposta na gôndola, com nome, marca e os selos da rotulagem frontal da RDC 429/2020 — e não o código de barras nem a tabela nutricional do verso. É exatamente nessa face que a ANVISA exige as **lupas de atenção** (alto em açúcar adicionado, sódio e gordura saturada) — tipografia grande, alto contraste e padrão fixo: cenário ideal para OCR. O `react-native-vision-camera-ocr-plus` roda o **Google ML Kit Text Recognition 100% no dispositivo** (sem internet, sem custo por consulta) e expõe:

- `<Camera mode="recognize">` — OCR ao vivo em cada frame (usado agora na tela inicial);
- `useTextRecognition` / frame processors com `scanRegion` — para focar em parte da face frontal (ex.: a região dos selos);
- `PhotoRecognizer` — OCR de foto tirada a posteriori;
- tradução opcional ao vivo (`mode="translate"`) e remoção de modelos para reduzir o tamanho do app.

---

## 6. Onda 2 — como o app identifica o produto (texto + confirmação por imagem)

A identificação do produto é um **mix de texto e imagem**, definido para ser preciso e leve ao usuário:

```
[Câmera]  lê a face principal → OCR extrai o texto (nome, marca, selos)
      │
      ▼  texto do OCR (poucos KB)
[Backend FastAPI + SQLite]  normaliza e busca por similaridade (FTS5)
      │                     no cadastro regional (Produto + aliases)
      ▼  match com score de confiança
[App]  card do produto: nome, marca, selos RDC, tradução
       + 📸 foto da face cadastrada (~50–150 KB WebP, baixada por produto
         lido, cache local) → o usuário confirma visualmente
```

**Por que a foto é confirmação, não identificador:** o matching visual por imagem (comparar a foto cadastrada com o frame da câmera) exige modelos de embedding, é pesado no aparelho e vulnerável a embalagens-irmãs (Leite Integral Fazendinha × Desnatado Fazendinha diferem por um detalhe de cor — um falso positivo mostraria alerta do produto errado). O texto lido na face identifica; **a foto cadastrada confirma** numa olhadela, com custo de rede mínimo.

**Cadastro no banco (`Produto`)** — nome, marca, `aliases` (textos alternativos que deixam o matching robusto: "leite integra fazendinha", "fazendinha 1l"...), `imagem_path` (foto da face), tabela nutricional, classificação RDC 429/2020 e tradução já redigida nos 3 níveis. Detalhes: [`backend/README.md`](backend/README.md).

**Regras de confiança (decisão de produto):**

1. O app **nunca assume match fraco** — score baixo → lista de candidatos para a Dona Maria confirmar; nada → "produto não cadastrado" + texto cru;
2. **O app nunca inventa nutrição** — só mostra o que está cadastrado no banco;
3. O texto da face **pode identificar offline** (catálogo regional curado é pequeno — cabe pré-sincronizado no aparelho); a foto é opcional e entra quando há rede.

---

## 7. Configurações nativas já aplicadas (`frontend/`)

- ✅ `frontend/android/app/src/main/AndroidManifest.xml` — permissão `android.permission.CAMERA`;
- ✅ `frontend/android/build.gradle` — `minSdkVersion` elevado de 24 para **26** (exigência da lib; target SDK 36 é o padrão do template);
- ✅ `frontend/babel.config.js` — plugin obrigatório `react-native-worklets/plugin`;
- ✅ `frontend/ios/NutriScan/Info.plist` — chave `NSCameraUsageDescription`;
- ✅ `frontend/jest.setup.js` — mocks de módulos nativos para o Jest.

No Android a lib é **auto-linkada** — não é preciso passo extra de build. No iOS, rode `cd ios && pod install` num mac. Se o app crescer, dá para reduzir o APK removendo modelos não usados (comentários em `frontend/android/gradle.properties`).

---

## 8. Como rodar (frontend)

### Pré-requisitos

- Node.js ≥ 20 e npm
- JDK 17+ (o Gradle do RN usa o `JAVA_HOME` da máquina)
- Android Studio com SDK 36 + emulador/celular físico com câmera
- Para iOS: mac com Xcode e `pod install`

### Passos

```bash
cd frontend
npm install

# Android (emulador ligado ou celular conectado)
npm run android

# iOS (mac — precisa de pod install primeiro)
npm run ios
# → cd ios && pod install && npx react-native run-ios
```

> ⚠️ O scanner precisa de **câmera real** — teste preferencialmente em celular físico; em emulador use uma câmera virtual.

### Desenvolvimento

```bash
cd frontend
npm run lint     # ESLint
npx tsc --noEmit # checagem de tipos
npm test         # Jest (com mocks nativos)
```

---

## 9. Estrutura do monorepo

```
NutriScan/
├── frontend/        # App React Native — App.tsx, android/, ios/, jest.setup.js…
│   ├── App.tsx      #   Scanner da face frontal (F01 — tela inicial)
│   ├── android/ · ios/
│   └── (backend FastAPI não entra aqui — é o backend/)
├── backend/         # FastAPI + SQLite + FTS5 (Onda 2) — ver backend/README.md
├── docs/            # PEX-MDL-54 e Lean Inception (documentos de origem da equipe)
└── README.md        # Visão geral do monorepo (este arquivo)
```

---

## 10. Ajustes aplicados nos documentos de origem

Os `.md` em `docs/` foram atualizados para refletir as decisões da equipe (edições dentro das células originais — numeração de linhas preservada):

1. **Tecnologia de frontend:** PEX-MDL-54 (linha 27) agora descreve **app mobile em React Native nativo** (câmera + OCR on-device) em vez de "React, Vite, TypeScript e Tailwind CSS"; testes do frontend descritos como Jest e deploy na Render.
2. **Sem leitura de código de barras:** Lean Inception (linhas 5, 17, 30, 51, 76 e 77) e PEX-MDL-54 (linhas 17 e 27) agora descrevem a leitura da **face principal da embalagem, exposta na gôndola** (contexto, visão, RF01/F01 e jornada).
3. **OCR identifica o produto:** Lean RF02/F02 (linhas 30, 52 e 66) descreve o reconhecimento da face (nome, marca e selos) para **identificar o produto no banco cadastrado** — a tabela nutricional vem do cadastro (RF05), não da câmera.
4. **Banco consolidado em SQLite + FTS5** e deploy do backend na **Render** (PEX linha 27).

---

## 11. Cronograma 2026 (AGO–DEZ)

A ordem das atividades segue o PEX-MDL-54:

1. Levantamento de requisitos, alimentação da base nutricional e especificação do MVP;
2. Desenvolvimento do backend (FastAPI) e integração dos modelos de visão computacional;
3. Desenvolvimento do frontend e da tradução visual da informação nutricional;
4. Testes de precisão da leitura, usabilidade e deploy do protótipo;
5. Testes práticos com o público-alvo (Uninorte e supermercados) + questionário Likert;
6. Análise dos feedbacks, ajustes e relatório final de extensão.

---

## 12. Referências

- RDC nº 429/2020 — ANVISA (rotulagem nutricional frontal);
- [`react-native-vision-camera-ocr-plus`](https://github.com/jamenamcinteer/react-native-vision-camera-ocr-plus) — motor de OCR deste app;
- Documentos de origem na pasta [`docs/`](docs/);
- SILVA, A. C.; ASSIS, M. D. (2018); SANTOS, E. F. et al. (2020) — ver PEX-MDL-54.
