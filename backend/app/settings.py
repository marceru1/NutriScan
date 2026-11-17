"""Configuração central do backend NutriScan.

Env vars lidas nesta ordem: ambiente do shell/Render primeiro, .env do
backend depois (load_dotenv NÃO sobrescreve o que já existe).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend

# backend/.env (gitignored) — copie de .env.example
load_dotenv(BASE_DIR / ".env")

# Banco SQLite — sobrescrevível via env NUTRISCAN_DB_PATH (usado nos testes)
DB_PATH = Path(os.getenv("NUTRISCAN_DB_PATH", str(BASE_DIR / "data" / "nutriscan.db")))

# Fotos da face das embalagens (upload admin → GET /{id}/imagem) — os testes
# sobrescrevem via env NUTRISCAN_IMAGENS_DIR
IMAGENS_DIR = Path(
    os.getenv("NUTRISCAN_IMAGENS_DIR", str(BASE_DIR / "data" / "imagens"))
)
# Face capturada pela câmera do app é JPEG/WebP — nada além disso é aceito
CONTENT_TYPES_IMAGEM = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
# ~50–150 KB por foto é o esperado; 10 MB é folga com segurança
LIMITE_IMAGEM_MB = 10

# Esqueleto: liberado para o app dev. Restringir no deploy.
CORS_ORIGINS = ["*"]

# Auth do CRUD admin (POST/DELETE): API key no header X-Admin-Token.
# VAZIO = dev local liberado. No deploy é OBRIGATÓRIO configurar — ver README.
ADMIN_TOKEN = os.getenv("NUTRISCAN_ADMIN_TOKEN", "")

# Chave do APP RN: o app manda em toda chamada (header X-Api-Key).
# Mesmo valor no backend (.env) e no config do app. VAZIO = API aberta no dev.
API_KEY = os.getenv("NUTRISCAN_API_KEY", "")

# Rate limit: requisições por minuto por IP (janela fixa em memória).
# 0 desliga. /health, /docs e /openapi.json são isentos.
RATE_LIMIT_RPM = int(os.getenv("NUTRISCAN_RATE_LIMIT_RPM", "120"))

# Regras de confiança do matching (acordadas no projeto):
# o app NUNCA assume match fraco — questionamos com candidatos em vez disso.
STRONG_MIN = 0.75  # score mínimo do melhor candidato para considerar "forte"
WEAK_MAX = 0.40  # abaixo disso: nenhum candidato confiável
DIFF_MIN = 0.15  # 1º precisa se destacar do 2º (evita empate ambíguo passar como forte)
MAX_CANDIDATOS = 5
