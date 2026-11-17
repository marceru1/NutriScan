# NutriScan — Contrato da API v0.2

> Contrato de consumo para o app React Native e para a equipe de cadastro.
> Fonte automática (sempre atualizada): **Swagger em `/docs`** quando o backend estiver rodando.
> Base: FastAPI — respostas sempre **JSON** (UTF-8), exceto o endpoint de imagem (bytes).

| Ambiente | Base URL |
| :--- | :--- |
| Dev local (mesma máquina) | `http://localhost:8000` |
| Dev local (emulador Android) | `http://10.0.2.2:8000` *(10.0.2.2 = a máquina hospedeira vista do emulador)* |
| Dev local (celular físico) | `http://<IP-LAN-da-máquina>:8000` (mesma rede Wi-Fi) |
| Produção (Render — a definir no deploy) | `https://<nome-do-servico>.onrender.com` |

Sem prefixo de versão no MVP (`/produtos`, não `/api/v1/produtos`). Cada resposta de sucesso é 200/201 e cada erro devolve `{"detail": "<mensagem>"}` (ver [Códigos de Status](#5-códigos-de-status-http)).

---

## 1. Endpoints e URLs

| # | Endpoint | Método | O que faz | Auth |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `/health` | `GET` | Sonda de vida (monitoramento) | Nenhum |
| 2 | `/produtos/busca?q=` | `GET` | **Endpoint principal do app**: dado o texto OCR da face, identifica o produto | `X-Api-Key` |
| 3 | `/produtos/catalogo` | `GET` | Catálogo completo em texto (pré-download para matching offline) | `X-Api-Key` |
| 4 | `/produtos` | `GET` | Lista resumida do banco | `X-Api-Key` |
| 5 | `/produtos/{id}` | `GET` | Ficha completa do produto | `X-Api-Key` |
| 6 | `/produtos/{id}/imagem` | `GET` | Foto da face cadastrada (confirmação visual) | `X-Api-Key` |
| 7 | `/produtos` | `POST` | Cadastrar produto | `X-Api-Key` **+** `X-Admin-Token` |
| 8 | `/produtos/{id}/imagem` | `POST` | Cadastrar foto da face (multipart) | `X-Api-Key` **+** `X-Admin-Token` |
| 9 | `/produtos/{id}` | `DELETE` | Apagar produto | `X-Api-Key` **+** `X-Admin-Token` |

> Fluxo do app com estes endpoints: ver [§6 Fluxo recomendado](#7-fluxo-recomendado-do-app).

## 2. Métodos HTTP (verbos)

- **`GET`** — leitura, sem efeito no banco. O app RN só usa `GET`.
- **`POST`** — criação (produto ou foto). Só a equipe usa.
- **`DELETE`** — remoção. Só a equipe usa.
- Não há `PUT`/`PATCH` no MVP — para corrigir um cadastro, apague e recrie (planejado: atualização parcial).

## 3. Autenticação e Autorização

**Duas chaves, papéis distintos.** Sem header, erro `401`; header errado, `403`.

| Chave | Header | Quem usa | Onde fica o valor (env) |
| :--- | :--- | :--- | :--- |
| **API key** | `X-Api-Key` em **toda** chamada a `/produtos` | **App RN** | `NUTRISCAN_API_KEY` no backend **e** no config do app |
| **Admin token** | `X-Admin-Token` nas rotas de **escrita** | **Equipe** (curl/Postman) | `NUTRISCAN_ADMIN_TOKEN` — só no backend, **nunca no app** |

- No ambiente dev **sem as vars configuradas** (`.env` em branco), a API fica aberta — modo dev. Na Render, configurar ambas é obrigatório.
- O valor das chaves: gerar com `python -c "import secrets; print(secrets.token_urlsafe(32))"` e colocar em `backend/.env` (copie de `.env.example`). Env do shell/Render sobrescreve o `.env`.
- `/health`, `/docs` e `/openapi.json` **não** exigem chaves.

**Chamada do app RN:**

```ts
const API_URL = 'http://10.0.2.2:8000';                 // emulador; físico: IP da máquina
const API_KEY = '<mesma NUTRISCAN_API_KEY do backend>';

// exemplo: busca
const resp = await fetch(`${API_URL}/produtos/busca?q=${encodeURIComponent(textoOcr)}`, {
  headers: { 'X-Api-Key': API_KEY },
});
const busca = await resp.json(); // BuscaOut — ver exemplo do endpoint 2
```

**Chamada da equipe (cadastro):**

```powershell
curl -X POST http://localhost:8000/produtos `
  -H "X-Api-Key: <api key>" -H "X-Admin-Token: <admin token>" `
  -H "Content-Type: application/json" `
  -d '{...}'
```

## 4. Endpoints em detalhe (entrada e saída)

### 4.1 `GET /health`

Sonda de vida para monitor/deploy. Sem auth, sem corpo.

```json
{"status": "ok"}
```

### 4.2 `GET /produtos/busca?q=<texto OCR>` — **o endpoint do app**

**Entrada:** query param `q` (obrigatório) — o texto cru lido na face da embalagem (poucos KB). O backend normaliza (caixa alta, sem acento, descarta enfeites tipo `1L`, `500G`) e consulta o índice FTS5.

**Resposta 200 (`BuscaOut`):** `match` ∈ `forte` | `duvidoso` | `nenhum`, `score` (0–1) e `candidatos` (0 ou mais resumos).

```json
// match "forte" — resposta direta (score ≥ 0.75 com folga sobre o 2º)
{
  "match": "forte",
  "score": 0.75,
  "candidatos": [
    {"id": 1, "nome": "Leite Integral Fazendinha", "marca": "Fazendinha", "imagem_path": null}
  ]
}

// match "duvidoso" — empate; o APP precisa pedir ao usuário para confirmar
{
  "match": "duvidoso",
  "score": 0.667,
  "candidatos": [
    {"id": 1, "nome": "Leite Integral Fazendinha", "marca": "Fazendinha", "imagem_path": null},
    {"id": 2, "nome": "Leite Desnatado Fazendinha", "marca": "Fazendinha", "imagem_path": null}
  ]
}

// match "nenhum" — o app mostra "produto não cadastrado" + o texto cru do OCR
{"match": "nenhum", "score": 0.0, "candidatos": []}
```

**Regra de confiança do produto: o app NUNCA assume match fraco.** `forte` → card direto; `duvidoso` → lista para confirmação; `nenhum` → texto cru. (`candidatos[].imagem_path` é caminho interno do servidor — use o endpoint `GET /{id}/imagem` (§4.6), não abra esse campo.)

| Código | Quando |
| :--- | :--- |
| 200 | Sempre que `q` vier (mesmo sem match — `[]`) |
| 401/403 | Sem/errado `X-Api-Key` |
| 422 | `q` ausente |

### 4.3 `GET /produtos/catalogo` — sync offline

Catálogo completo em **texto** (cabe em poucos MB) para o app pré-baixar e fazer matching offline no mercado. **Não inclui fotos** — foto é confirmação on-line.

**Resposta 200 (`CatalogoOut`):**

```json
{
  "gerado_em": "2026-11-17T12:41:46+00:00",
  "total": 4,
  "produtos": [
    {
      "id": 1,
      "nome": "Leite Integral Fazendinha",
      "marca": "Fazendinha",
      "aliases": ["leite integra fazendinha", "fazendinha leite 1l", "leite paste fazendinha"],
      "classificacao_rdc": {"acucar_adicionado": false, "sodio": false, "gordura_saturada": false},
      "traducao_n1": "Leite comum: sem lupa crítica na frente.",
      "traducao_n2": "Leite integral tradicional. Não traz lupas de atenção da ANVISA.",
      "traducao_n3": "O leite integral tem gordura e açúcar naturalmente (lactose), mas em níveis que não acionam os selos frontais da RDC 429/2020. Faz parte da alimentação habitual, sem sinal de alerta na embalagem.",
      "tem_imagem": false
    }
  ]
}
```

- `gerado_em` (ISO-8601): o app compara contra seu cache para saber se resincroniza.
- `classificacao_rdc`: convenção adotada — `acucar_adicionado`, `sodio`, `gordura_saturada` (bool). É o que alimenta os **alertas visuais F04**.
- `traducao_n1`/`n2`/`n3`: os 3 níveis do RNF03 — destaque (5–10 palavras), resumo (20–40), detalhe (60–90).
- `tem_imagem`: só chame `GET /{id}/imagem` quando `true` (evita 404 à toa).

| Código | Quando |
| :--- | :--- |
| 200 | normal |
| 401/403 | auth |

### 4.4 `GET /produtos?limite=50`

Lista resumida (`[{id, nome, marca, imagem_path}]`), ordenada por id. Query param `limite` (int, padrão 50).

| Código | Quando |
| :--- | :--- |
| 200 | normal |
| 401/403 | auth |

### 4.5 `GET /produtos/{id}` — ficha completa

**Resposta 200 (`ProdutoCompleto`):** resumo + aliases + tabela + traduções.

```json
{
  "id": 1,
  "nome": "Leite Integral Fazendinha",
  "marca": "Fazendinha",
  "imagem_path": null,
  "aliases": ["leite integra fazendinha", "fazendinha leite 1l", "leite paste fazendinha"],
  "tabela_nutricional": {
    "por_100ml": {"kcal": 61, "acucar_adicionado_g": 0, "gordura_saturada_g": 2.3, "sodio_mg": 100}
  },
  "classificacao_rdc": {"acucar_adicionado": false, "sodio": false, "gordura_saturada": false},
  "traducao_n1": "Leite comum: sem lupa crítica na frente.",
  "traducao_n2": "Leite integral tradicional. Não traz lupas de atenção da ANVISA.",
  "traducao_n3": "O leite integral tem gordura e açúcar naturalmente (lactose), mas em níveis que não acionam os selos frontais da RDC 429/2020. Faz parte da alimentação habitual, sem sinal de alerta na embalagem."
}
```

- `tabela_nutricional` — convenção: `por_100ml` **ou** `por_100g` com `kcal`, `acucar_adicionado_g`, `gordura_saturada_g`, `sodio_mg`. **Vem 100% do cadastro — a API nunca infere valores** (a tabela NÃO vem da câmera).
- `imagem_path`: caminho interno do servidor; baixe a foto por `GET /{id}/imagem`.

| Código | Quando |
| :--- | :--- |
| 200 | produto existe |
| 401/403 | auth |
| 404 | `{"detail": "Produto não encontrado"}` |

### 4.6 `GET /produtos/{id}/imagem` — foto da face

Foto da face principal cadastrada (**confirmação visual, nunca identificador** — regra de produto: *texto identifica, foto confirma*).

**Resposta 200:** bytes da imagem com `Content-Type` correspondente (`image/jpeg` | `image/png` | `image/webp`). Esperado WebP ~1024 px (50–150 KB) — o app baixa por produto lido **e faz cache local**. Só chame se `tem_imagem: true` (catálogo) ou `imagem_path` presente.

| Código | Quando |
| :--- | :--- |
| 200 | imagem existe |
| 401/403 | auth |
| 404 | `{"detail": "Produto não encontrado ou sem imagem cadastrada"}` ou `{"detail": "Arquivo de imagem não encontrado"}` |

### 4.7 `POST /produtos` — cadastrar produto *(equipe)*

**Entrada (`ProdutoCreate`, `application/json`):**

```json
{
  "nome": "Leite Integral Fazendinha",
  "marca": "Fazendinha",
  "aliases": ["leite integra fazendinha", "fazendinha leite 1l", "leite paste fazendinha"],
  "tabela_nutricional": {"por_100ml": {"kcal": 61, "acucar_adicionado_g": 0, "gordura_saturada_g": 2.3, "sodio_mg": 100}},
  "classificacao_rdc": {"acucar_adicionado": false, "sodio": false, "gordura_saturada": false},
  "traducao_n1": "Leite comum: sem lupa crítica na frente.",
  "traducao_n2": "Leite integral tradicional. Não traz lupas de atenção da ANVISA.",
  "traducao_n3": "O leite integral tem gordura e açúcar naturalmente (lactose), mas em níveis que não acionam os selos frontais da RDC 429/2020. Faz parte da alimentação habitual, sem sinal de alerta na embalagem."
}
```

- `nome` (obrigatório); demais opcionais com padrão (`marca=""`, listas/dicts vazios).
- `aliases` — textos alternativos impressos na embalagem (abreviações, ordem trocada); **quanto mais, melhor o matching**. A ordem de resposta dos aliases segue a ordem de cadastro.
- **Nunca inferir valores nutricionais** — só o que está escrito no rótulo real do produto.

**Resposta 201:** `ProdutoCompleto` (mesma forma do [4.5](#45-get-produtosid--ficha-completa)) com `id` gerado.

### 4.8 `POST /produtos/{id}/imagem` — cadastrar foto *(equipe)*

**Entrada:** `multipart/form-data` com campo **`arquivo`** (JPEG, PNG ou WebP; máx. 10 MB; esperado: a face principal, WebP ~1024 px).

```powershell
curl -X POST http://localhost:8000/produtos/1/imagem `
  -H "X-Api-Key: <api key>" -H "X-Admin-Token: <admin token>" `
  -F "arquivo=@face-do-produto.webp"
```

**Resposta 201:**

```json
{"produto_id": 1, "imagem_path": "C:/data/imagens/produto-1.webp", "tamanho_bytes": 148000}
```

O nome no servidor é derivado do **id** (`produto-{id}.{ext}`) — o nome do arquivo enviado é ignorado. Reupload substitui a foto anterior.

| Código | Quando |
| :--- | :--- |
| 201 | gravado |
| 400 | `{"detail": "Arquivo vazio"}` |
| 401/403 | auth |
| 404 | produto inexistente |
| 413 | `{"detail": "Imagem acima de 10 MB — comprima o WebP."}` |
| 415 | `{"detail": "Tipo de arquivo não suportado (...)..."}` — só JPEG/PNG/WebP |

### 4.9 `DELETE /produtos/{id}` — apagar produto *(equipe)*

Remove o produto + aliases + indexação. Sem corpo de resposta.

| Código | Quando |
| :--- | :--- |
| 204 | apagado |
| 401/403 | auth |
| 404 | produto inexistente |

## 5. Códigos de Status HTTP

| Código | Significado | Quando nesta API |
| :--- | :--- | :--- |
| **200** | OK | leituras |
| **201** | Created | criação de produto/foto |
| **204** | No Content | delete |
| **400** | Bad Request | upload vazio |
| **401** | Unauthorized | header `X-Api-Key`/`X-Admin-Token` ausente |
| **403** | Forbidden | header errado |
| **404** | Not Found | produto/imagem inexistente |
| **413** | Payload Too Large | imagem > 10 MB |
| **415** | Unsupported Media Type | imagem fora de JPEG/PNG/WebP |
| **422** | Unprocessable Entity | corpo inválido, `q` ausente ou `id` de path não-numérico — `{"detail": [{"type": "missing", "loc": ["query", "q"], "msg": "Field required", "input": null}]}` |
| **429** | Too Many Requests | estourou rate limit |
| **500** | Internal Server Error | falha inesperada (reporte à equipe do back) |

**Forma de erro fixa:** `{"detail": "<mensagem>"}` (FastAPI). Em 422, `detail` é uma lista.

**Rate limit (429):** janela de 60 s por IP, padrão `120 req/min` (env `NUTRISCAN_RATE_LIMIT_RPM`). Resposta com `Retry-After` (segundos). Toda resposta traz `X-RateLimit-Limit` e `X-RateLimit-Remaining`. `/health`, `/docs`, `/openapi.json` isentos.

**Headers de todas as respostas:** `X-Content-Type-Options: nosniff`; CORS liberado em dev (restringe na Render).

## 6. Auth — exemplos de erro

```json
// 401 (sem header)
{"detail": "Envie o header X-Api-Key."}
// 403 (header errado)
{"detail": "X-Api-Key incorreto."}
// 401 (escrita com X-Api-Key ok, mas sem X-Admin-Token)
{"detail": "Operação admin: envie o header X-Admin-Token."}
```

## 7. Fluxo recomendado do app

```
1. App baixa GET /produtos/catalogo uma vez e cacheia (matching OFFLINE pelo texto)
        │  (sem rede: matching local pelo catálogo cacheado — regra do MVP)
        ▼
2. Câmara → OCR da face → texto cru
        ▼
3. GET /produtos/busca?q=<texto>           [on-line, com X-Api-Key]
   ├─ forte    → pega candidatos[0] → GET /{id} (ficha) → mostra traduções + alertas RDC
   │             → se tem_imagem: GET /{id}/imagem → foto para CONFIRMAR
   ├─ duvidoso → mostra lista de candidatos → usuário escolhe → GET /{id}
   └─ nenhum   → "produto não cadastrado ainda" + o texto cru do OCR
```

**Regras de confiança (inegociáveis, de produto):** o app nunca assume match fraco (duvidoso → sempre confirmação); nunca inventa nutrição (só mostra o que está cadastrado); a foto é confirmação, não identificador.

## 8. Changelog do contrato

| Versão | Mudança |
| :--- | :--- |
| 0.2 | `X-Api-Key` + `X-Admin-Token`; `/catalogo`; upload/serviço de imagem; rate limit; `413`/`415` |
| 0.1 | `/busca` (FTS5 forte/duvidoso/nenhum), CRUD básico |
