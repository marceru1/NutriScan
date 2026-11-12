"""Conexão SQLite + índice de busca textual FTS5."""

from collections.abc import Generator
from contextlib import contextmanager

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from . import settings

# FastAPI roda endpoints sync em threadpool → check_same_thread=False
engine = create_engine(
    f"sqlite:///{settings.DB_PATH}",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db(target_engine: Engine | None = None) -> None:
    """Cria tabelas e o índice FTS5. Idempotente (aceita engine de teste)."""
    from . import models  # noqa: F401 — registra os models no metadata

    e = target_engine or engine
    settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    models.Base.metadata.create_all(e)
    with e.begin() as conn:
        conn.execute(
            text("CREATE VIRTUAL TABLE IF NOT EXISTS produto_fts USING fts5(texto)")
        )


def get_db() -> Generator[Session, None, None]:
    """Dependência do FastAPI (request-scoped)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Sessão para scripts (seed etc.) — commit/rollback automático."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
