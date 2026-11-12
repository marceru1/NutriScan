"""Fixtures compartilhadas: banco em memória + client de API."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import get_db, init_db
from app.main import app


def _engine_memoria():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # uma única conexão → schema/compartilhamento ok
    )
    init_db(engine)
    return engine


@pytest.fixture()
def mem_db():
    """Sessão direta sobre SQLite em memória (testes do matching)."""
    factory = sessionmaker(bind=_engine_memoria(), autoflush=False, expire_on_commit=False)
    db = factory()
    yield db
    db.close()


@pytest.fixture()
def client():
    """TestClient com a dependência get_db trocada pelo banco em memória.

    Sem `with` → o lifespan (init_db global) não roda nos testes.
    """
    factory = sessionmaker(bind=_engine_memoria(), autoflush=False, expire_on_commit=False)

    def override_get_db():
        db = factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
