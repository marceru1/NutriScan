"""NutriScan API — backend do banco regional de produtos."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import settings
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

app.include_router(produtos.router)


@app.get("/health", tags=["infra"])
def health():
    return {"status": "ok"}
