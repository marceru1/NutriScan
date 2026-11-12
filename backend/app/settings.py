"""Configuração central do backend NutriScan."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend

# Banco SQLite — sobrescrevível via env NUTRISCAN_DB_PATH (usado nos testes)
DB_PATH = Path(os.getenv("NUTRISCAN_DB_PATH", str(BASE_DIR / "data" / "nutriscan.db")))

# Esqueleto: liberado para o app dev. Restringir no deploy.
CORS_ORIGINS = ["*"]

# Regras de confiança do matching (acordadas no projeto):
# o app NUNCA assume match fraco — questionamos com candidatos em vez disso.
STRONG_MIN = 0.75  # score mínimo do melhor candidato para considerar "forte"
WEAK_MAX = 0.40  # abaixo disso: nenhum candidato confiável
DIFF_MIN = 0.15  # 1º precisa se destacar do 2º (evita empate ambíguo passar como forte)
MAX_CANDIDATOS = 5
