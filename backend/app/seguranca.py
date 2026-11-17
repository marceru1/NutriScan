"""Auth da API: X-Api-Key (app RN, todas as rotas) + X-Admin-Token (equipe, escrita).

Duas chaves, papéis distintos:

- **X-Api-Key** (`NUTRISCAN_API_KEY`) — porta de entrada da API. O app RN manda
  em TODA chamada a /produtos; o valor mora no backend (.env) e no config do
  próprio app. Impede consumo casual por quem não é o app.
- **X-Admin-Token** (`NUTRISCAN_ADMIN_TOKEN`) — só da EQUIPE, em rotas de
  escrita. NUNCA vai para dentro do app.

Comparação em tempo constante em ambas para não vazar por timing.
"""

import hmac

from fastapi import Header, HTTPException

from . import settings


def exigir_api_key(x_api_key: str | None = Header(default=None)) -> None:
    """Dependência do router todo (leitura e escrita) — o app RN precisa dela."""
    esperado = settings.API_KEY
    if not esperado:  # dev local sem chave configurada → API aberta
        return
    if x_api_key is None:
        raise HTTPException(401, "Envie o header X-Api-Key.")
    if not hmac.compare_digest(x_api_key, esperado):
        raise HTTPException(403, "X-Api-Key incorreto.")


def exigir_admin(x_admin_token: str | None = Header(default=None)) -> None:
    """Dependência das rotas de escrita (POST/DELETE) — uso da equipe."""
    esperado = settings.ADMIN_TOKEN
    if not esperado:  # dev local sem token configurado → liberado
        return
    if x_admin_token is None:
        raise HTTPException(
            401, "Operação admin: envie o header X-Admin-Token."
        )
    if not hmac.compare_digest(x_admin_token, esperado):
        raise HTTPException(403, "X-Admin-Token incorreto.")
