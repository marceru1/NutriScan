# NutriScan — Backend (Onda 2)

FastAPI + SQLite. **Esqueleto implementado (API + matching FTS5 + catálogo + upload de imagem + testes).**

> 📄 **Contrato da API para o front**: [`docs/NutriScan_Contrato_API.md`](../docs/NutriScan_Contrato_API.md) — endpoints, payloads, códigos e auth "mastigados" para o app RN consumir.

## Como rodar

```bash
cd backend
py -3.12 -m venv .venv            # primeira vez
.venv\Scripts\activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env       # e preencha as chaves (§ Segurança abaixo)

python -m app.seed                # popula produtos-exemplo (Leite Integral Fazendinha…)
uvicorn app.main:app --reload     # http://localhost:8000/docs / Swagger
pytest                            # testes (SQLite em memória)
```

> 💡 **Rede com antivírus interceptando TLS (Kaspersky na máquina de dev):** se o pip falhar com `SSL: CERTIFICATE_VERIFY_FAILED`, os pacotes estão sendo assinados pela CA pessoal do Kaspersky — consulte `certs/kaspersky-ca.pem` (extraída da própria conexão) e use `pip install --cert certs/kaspersky-ca.pem ...` para validar contra ela em vez de desligar a verificação. Muitas vezes o python do venv passa direto (não é interceptado).

## Status do esqueleto

```
backend/
├── app/
│   ├── main.py        # FastAPI + CORS + nosniff + /health (Swagger em /docs)
│   ├── settings.py    # DB path, CORS, token admin, rate limit, limiares do matching
│   ├── db.py          # engine SQLite + índice FTS5 (init_db idempotente)
│   ├── models.py      # Produto (+ aliases como tabela própria, imagem_path, traduções n1/2/3)
│   ├── schemas.py     # Pydantic: ProdutoCreate/Resumo/Completo, BuscaOut, Catalogo*
│   ├── seguranca.py   # exigir_api_key (app RN, router todo) + exigir_admin (equipe, escrita)
│   ├── rate_limit.py  # middleware: janela fixa por IP em memória → 429 + Retry-After
│   ├── matching.py    # normalização → busca FTS5 → score → forte/duvidoso/nenhum
│   ├── crud.py        # criar/listar/apagar + catálogo + imagem + indexação no FTS
│   ├── seed.py        # python -m app.seed — 4 produtos-exemplo (idempotente)
│   └── routers/produtos.py
└── tests/             # pytest com SQLite em memória
```

Regras de matching já no código (ver `app/matching.py` e `settings.py`):

- **forte** — score ≥ 0.75 **e** o 1º se destaca do 2º por ≥ 0.15 → resposta direta;
- **duvidoso** — empate (ex.: Leite Integral × Desnatado com texto genérico "LEITE FAZENDINHA") → lista de candidatos para confirmação;
- **nenhum** — score < 0.40 → `[]` + o app mostra o texto cru do OCR.

O que falta: edit/atualização de produto (PUT), deploy na Render.

## Segurança

**Duas chaves, papéis distintos** (ambas em `backend/.env` — copie de `.env.example`; env do shell/Render tem prioridade):

| Chave | Header | Quem usa | Onde vive |
|---|---|---|---|
| **API key** (`NUTRISCAN_API_KEY`) | `X-Api-Key` em **toda** chamada a `/produtos` (leitura e escrita) | **O app RN** | No backend (.env) **e** no config do app |
| **Admin token** (`NUTRISCAN_ADMIN_TOKEN`) | `X-Admin-Token` nas rotas de **escrita** | **Só a equipe** (curl/Postman/scripts) | Só no backend — **nunca** dentro do app |

- Sem a variável configurada no `.env`, a respectiva chave fica **desligada** (dev local aberto). Produção/Render: configurar ambas é obrigatório.
- Comparação em tempo constante nas duas. Escrita soma as duas chaves (app + admin).
- Honesto sobre a API key: ela vai no APK, então quem desmontar o app extrai — é **porta de entrada**, não cofre; a proteção real contra abuso é o rate limit + limites da Render.

**Rate limit** — janela fixa em memória, por IP: `NUTRISCAN_RATE_LIMIT_RPM` (padrão 120, `0` desliga). Excedeu → `429` com `Retry-After`; toda resposta leva `X-RateLimit-Limit`/`X-RateLimit-Remaining`. `/health`, `/docs` e `/openapi.json` isentos. Sem dependência nova (um processo só).

**Headers** — `X-Content-Type-Options: nosniff` em toda resposta (o serve de imagem entrega bytes enviados por terceiro); CORS liberado para o app dev (`NUTRISCAN_*` na Render restringir).

**Pelo app RN (quando integrar):**

```ts
// frontend — config da API (valores do .env de produção quando subir)
const API_URL = 'http://10.0.2.2:8000'; // emulador Android; celular físico: IP da máquina na LAN
const API_KEY = '<mesma NUTRISCAN_API_KEY do backend>';

fetch(`${API_URL}/produtos/busca?q=${encodeURIComponent(textoOcr)}`, {
  headers: { 'X-Api-Key': API_KEY },
})
```

### Mapa de códigos

| Rota | Sucesso | Erros |
|---|---|---|
| `GET /health` | 200 | — |
| `POST /produtos` | 201 | 401/403 (X-Api-Key + X-Admin-Token) · 422 corpo inválido |
| `GET /produtos` · `GET /catalogo` · `GET /busca` | 200 (`busca` devolve `[]` quando nenhum — caso de negócio, não erro) | 401/403 (X-Api-Key) · 422 faltando `q` |
| `GET /produtos/{id}` | 200 | 401/403 · 404 |
| `POST /{id}/imagem` | 201 | 400 vazio · 401/403 · 404 · 413 >10 MB · 415 tipo |
| `GET /{id}/imagem` | 200 | 401/403 · 404 |
| `DELETE /{id}` | 204 | 401/403 · 404 |
| qualquer | — | 429 estourou rate limit · 500 interno |

## Sincronização do catálogo (app offline)

- `GET /produtos/catalogo` → todo o **texto** (id, nome, marca, aliases, classificação RDC, traduções 1–3 e `tem_imagem`) com `gerado_em` (ISO) — o app pré-baixa e faz matching **offline** no corredor. Centenas de produtos cabem em poucos MB; sinaliza `tem_imagem` para o app só baixar foto de quem tem.
- `POST /produtos/{id}/imagem` (multipart, campo `arquivo`) — cadastro/substituição da foto da face. Aceita JPEG/PNG/WebP (`415` fora disso), vazio → `400`, > 10 MB → `413`. Grava em `data/imagens/produto-{id}.{ext}` (nome derivado do **id**, nunca o nome do cliente) e substitui a de extensão diferente. `GET /produtos/{id}/imagem` serve o arquivo — **confirmação** visual, nunca identificador.
- No venv de testes, `NUTRISCAN_IMAGENS_DIR` sobrescreve o diretório (como `NUTRISCAN_DB_PATH`).

## Responsabilidade

Hospedar o **banco regional de produtos** (curado manualmente pela equipe) e responder: *"dado o texto lido na face da embalagem, qual é o produto?"* — devolvendo dados estruturados já traduzidos. **Não** faz OCR nem processa imagem.

## Modelo principal: `Produto`

| Campo | Descrição |
|---|---|
| `id` | PK |
| `nome` | Nome comercial cadastrado (ex.: "Leite Integral Fazendinha") |
| `marca` | Marca/fabricante |
| `aliases` | Textos alternativos para robustecer o matching (ex.: "leite integra fazendinha", "fazendinha leite 1l", "fazendinha past.") |
| `imagem_path` | Foto da face principal cadastrada — aparece no card de confirmação do app |
| `tabela_nutricional` | Valores por 100 g/ml e por porção (JSON) |
| `classificacao_rdc` | Alto em açúcar adicionado? sódio? gordura saturada? (RDC 429/2020) |
| `traducao_n1` / `n2` / `n3` | Tradução redigida: destaque (5–10 palavras) → resumo (20–40) → detalhe (60–90) |

## Regras de matching (acordadas)

1. App envia o texto cru do OCR da face (poucos KB).
2. Backend **normaliza** (caixa alta, sem acentos, ignora numerações/enfeites tipo "1L", "PAST.") e busca no SQLite com **FTS5** (full-text, nativo).
3. **Score de confiança** decide a resposta:
   - Match forte → resposta direta com card completo (nome, marca, selos RDC, tradução, `imagem_path`);
   - Match duvidoso (ex.: "leite" genérico de marca não cadastrada) → lista de **candidatos**, o usuário confirma;
   - Nada → "produto não cadastrado ainda" + texto cru que o app já exibe.
4. **O app nunca assume match fraco** — é um app de saúde; falso positivo mostra alerta do produto errado.
5. Nunca inferir valores nutricionais de qualquer forma — só o que está cadastrado.

## Endpoints

- `GET /produtos/busca?q=<texto OCR>` → produto único (forte) ou lista de candidatos
- `GET /produtos/catalogo` → catálogo completo em texto (sync offline do app)
- `GET /produtos/{id}` → ficha completa
- `GET /produtos/{id}/imagem` → foto da face (WebP ~1024 px; app faz cache local)
- `POST /produtos/{id}/imagem` → upload da foto da face (multipart)
- CRUD de cadastro (painel/admin FastAPI ou script de seed) para a equipe alimentar o banco

## Peso e offline

- Resposta de match: poucos KB. Foto confirmada: ~50–150 KB, baixada por produto lido, com cache.
- O catálogo de **texto** (nomes, aliases, classificação, traduções) é pequeno (MB para centenas de produtos) — cabe pré-sincronizar no app para matching *offline* no corredor do mercado. Foto só entra com rede.
- **Fora do escopo**: matching visual on-device (modelos de embedding tipo CLIP no celular) — pesado e frágil entre embalagens-irmãs. Se um dia o cadastro manual inviabilizar o texto, reavaliar com busca vetorial *no backend* (sqlite-vec).
