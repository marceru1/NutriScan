"""NutriScan API — backend do banco regional de produtos."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import rate_limit, settings
from .db import init_db
from .routers import produtos


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="NutriScan API",
    version="0.2.0",
    description=(
        "Banco regional de produtos (Manaus/AM). O app lê a face da embalagem por "
        "OCR e este backend identifica o produto por texto (FTS5) e devolve os "
        "dados cadastrados — nunca inferidos."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(rate_limit.limitar)

app.include_router(produtos.router)


@app.middleware("http")
async def cabecalho_nosniff(request, call_next):
    """Serve de imagem entrega bytes enviados por terceiro — barra o sniff."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    return response


@app.get("/health", tags=["infra"])
def health():
    return {"status": "ok"}
