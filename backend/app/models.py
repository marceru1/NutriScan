"""Modelos do banco regional de produtos."""

from typing import Any

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Produto(Base):
    __tablename__ = "produtos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    marca: Mapped[str] = mapped_column(String, default="")
    # Foto da face principal — usada como CONFIRMAÇÃO visual no app (não identificador)
    imagem_path: Mapped[str | None] = mapped_column(String, default=None)
    # {"por_100ml": {"kcal": 61, "acucar_adicionado_g": 0, ...}} — nunca inferido, só cadastrado
    tabela_nutricional: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    # {"acucar_adicionado": bool, "sodio": bool, "gordura_saturada": bool} — RDC 429/2020
    classificacao_rdc: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    # Tradução já redigida: destaque (5–10 palavras) → resumo (20–40) → detalhe (60–90)
    traducao_n1: Mapped[str] = mapped_column(String, default="")
    traducao_n2: Mapped[str] = mapped_column(String, default="")
    traducao_n3: Mapped[str] = mapped_column(String, default="")

    aliases: Mapped[list["ProdutoAlias"]] = relationship(
        back_populates="produto",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class ProdutoAlias(Base):
    """Textos alternativos da embalagem — deixam o matching robusto a variantes."""

    __tablename__ = "produto_aliases"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto: Mapped[str] = mapped_column(String, index=True)
    produto_id: Mapped[int] = mapped_column(
        ForeignKey("produtos.id", ondelete="CASCADE")
    )
    produto: Mapped["Produto"] = relationship(back_populates="aliases")
