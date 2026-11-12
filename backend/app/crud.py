"""Operações de cadastro sobre o banco de produtos."""

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import matching
from .models import Produto, ProdutoAlias
from .schemas import ProdutoCreate


def indexar_produto(session: Session, produto: Produto) -> None:
    """Reescreve a linha do produto no índice FTS5 (idempotente)."""
    texto = matching.texto_indexado(
        produto.nome, produto.marca, [a.texto for a in produto.aliases]
    )
    session.execute(text("DELETE FROM produto_fts WHERE rowid = :i"), {"i": produto.id})
    session.execute(
        text("INSERT INTO produto_fts (rowid, texto) VALUES (:i, :t)"),
        {"i": produto.id, "t": texto},
    )


def criar_produto(session: Session, dados: ProdutoCreate) -> Produto:
    """Cadastra produto + aliases e indexa no FTS."""
    produto = Produto(
        nome=dados.nome.strip(),
        marca=dados.marca.strip(),
        imagem_path=dados.imagem_path,
        tabela_nutricional=dados.tabela_nutricional,
        classificacao_rdc=dados.classificacao_rdc,
        traducao_n1=dados.traducao_n1,
        traducao_n2=dados.traducao_n2,
        traducao_n3=dados.traducao_n3,
    )
    session.add(produto)
    session.flush()  # garante produto.id antes dos aliases

    for alias in dados.aliases:
        texto = alias.strip()
        if texto:
            session.add(ProdutoAlias(texto=texto, produto_id=produto.id))

    indexar_produto(session, produto)
    session.commit()
    session.refresh(produto)
    return produto


def get_produto(session: Session, produto_id: int) -> Produto | None:
    return session.get(Produto, produto_id)


def listar_produtos(session: Session, limite: int = 50) -> list[Produto]:
    return session.query(Produto).order_by(Produto.id).limit(limite).all()


def apagar_produto(session: Session, produto: Produto) -> None:
    session.execute(
        text("DELETE FROM produto_fts WHERE rowid = :i"), {"i": produto.id}
    )
    session.delete(produto)  # cascade apaga os aliases
    session.commit()


def para_completo(produto: Produto) -> dict:
    """Monta o payload completo (aliases viram lista de strings)."""
    return {
        "id": produto.id,
        "nome": produto.nome,
        "marca": produto.marca,
        "imagem_path": produto.imagem_path,
        "aliases": [a.texto for a in produto.aliases],
        "tabela_nutricional": produto.tabela_nutricional,
        "classificacao_rdc": produto.classificacao_rdc,
        "traducao_n1": produto.traducao_n1,
        "traducao_n2": produto.traducao_n2,
        "traducao_n3": produto.traducao_n3,
    }
