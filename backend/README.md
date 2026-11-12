# NutriScan — Backend (Onda 2)

FastAPI + SQLite. **Esqueleto implementado** (API + matching FTS5 + testes) — sem as features finais.

## Como rodar

```bash
cd backend
py -3.12 -m venv .venv            # primeira vez
.venv\Scripts\activate            # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

python -m app.seed                # popula produtos-exemplo (Leite Integral Fazendinha…)
uvicorn app.main:app --reload     # http://localhost:8000/docs / Swagger
pytest                            # testes (SQLite em memória)
```

> 💡 **Rede com antivírus interceptando TLS (Kaspersky na máquina de dev):** se o pip falhar com `SSL: CERTIFICATE_VERIFY_FAILED`, os pacotes estão sendo assinados pela CA pessoal do Kaspersky — consulte `certs/kaspersky-ca.pem` (extraída da própria conexão) e use `pip install --cert certs/kaspersky-ca.pem ...` para validar contra ela em vez de desligar a verificação. Muitas vezes o python do venv passa direto (não é interceptado).

## Status do esqueleto

```
backend/
├── app/
│   ├── main.py        # FastAPI + CORS + /health (Swagger em /docs)
│   ├── settings.py    # DB path, CORS, limiares do matching (STRONG_MIN etc.)
│   ├── db.py          # engine SQLite + índice FTS5 (init_db idempotente)
│   ├── models.py      # Produto (+ aliases como tabela própria, imagem_path, traduções n1/2/3)
│   ├── schemas.py     # Pydantic: ProdutoCreate/Resumo/Completo, BuscaOut
│   ├── matching.py    # normalização → busca FTS5 → score → forte/duvidoso/nenhum
│   ├── crud.py        # criar/listar/apagar + indexação no FTS
│   ├── seed.py        # python -m app.seed — 4 produtos-exemplo (idempotente)
│   └── routers/produtos.py
└── tests/             # pytest com SQLite em memória
```

Regras de matching já no código (ver `app/matching.py` e `settings.py`):

- **forte** — score ≥ 0.75 **e** o 1º se destaca do 2º por ≥ 0.15 → resposta direta;
- **duvidoso** — empate (ex.: Leite Integral × Desnatado com texto genérico "LEITE FAZENDINHA") → lista de candidatos para confirmação;
- **nenhum** — score < 0.40 → `[]` + o app mostra o texto cru do OCR.

O que falta (features finais): endpoint de upload/serve de imagens de produto, auth simples para o CRUD admin, deploy na Render, cache/sincronização do catálogo no app.

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

## Endpoints previstos

- `GET /produtos/busca?q=<texto OCR>` → produto único (forte) ou lista de candidatos
- `GET /produtos/{id}` → ficha completa
- `GET /produtos/{id}/imagem` → foto da face (WebP ~1024 px; app faz cache local)
- CRUD de cadastro (painel/admin FastAPI ou script de seed) para a equipe alimentar o banco

## Peso e offline

- Resposta de match: poucos KB. Foto confirmada: ~50–150 KB, baixada por produto lido, com cache.
- O catálogo de **texto** (nomes, aliases, classificação, traduções) é pequeno (MB para centenas de produtos) — cabe pré-sincronizar no app para matching *offline* no corredor do mercado. Foto só entra com rede.
- **Fora do escopo**: matching visual on-device (modelos de embedding tipo CLIP no celular) — pesado e frágil entre embalagens-irmãs. Se um dia o cadastro manual inviabilizar o texto, reavaliar com busca vetorial *no backend* (sqlite-vec).
