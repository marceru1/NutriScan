"""Rate limit em memória (janela fixa, por IP) — middleware do FastAPI.

Projeto de extensão, um só processo: contador em dict basta. Sem dependência
nova. Env configurável (NUTRISCAN_RATE_LIMIT_RPM), 0 desliga, /health e docs
isentos. 429 volta com Retry-After e todas as respostas levam X-RateLimit-*.
"""

import time

from fastapi import Request
from fastapi.responses import JSONResponse

from . import settings

# (ip, início_da_janela) → número de requisições na janela
_BUCKETS: dict[tuple[str, int], int] = {}

# Doc/health não refletem trabalho do app — isentos
ISENTOS = {"/health", "/docs", "/openapi.json", "/redoc"}

# Piso para limpar janelas vencidas e o dict não crescer sem parar
_CLEANUP_APOS = 4096


def reset() -> None:
    """Limpa os contadores (usado nos testes)."""
    _BUCKETS.clear()


def _limpar_vencidas(janela_atual: int) -> None:
    if len(_BUCKETS) < _CLEANUP_APOS:
        return
    vencidas = [k for k in _BUCKETS if k[1] < janela_atual]
    for k in vencidas:
        _BUCKETS.pop(k, None)


async def limitar(request: Request, call_next):
    rpm = settings.RATE_LIMIT_RPM
    if rpm <= 0 or request.url.path in ISENTOS:
        return await call_next(request)

    seg = time.monotonic()
    agora = int(seg)
    janela_seg = 60
    janela = agora // janela_seg

    ip = request.client.host if request.client else "-"
    chave = (ip, janela)
    _limpar_vencidas(janela)

    _BUCKETS[chave] = _BUCKETS.get(chave, 0) + 1
    feito = _BUCKETS[chave]
    headers = {
        "X-RateLimit-Limit": str(rpm),
        "X-RateLimit-Remaining": str(max(0, rpm - feito)),
    }

    if feito > rpm:
        retry_apos = (janela + 1) * janela_seg - agora
        return JSONResponse(
            status_code=429,
            content={"detail": "Muitas requisições — tente de novo em instantes."},
            headers={**headers, "Retry-After": str(retry_apos)},
        )

    response = await call_next(request)
    response.headers.setdefault("X-RateLimit-Limit", headers["X-RateLimit-Limit"])
    response.headers.setdefault(
        "X-RateLimit-Remaining", headers["X-RateLimit-Remaining"]
    )
    return response
