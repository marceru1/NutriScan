"""Contratos de entrada/saída da API (Pydantic)."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ProdutoCreate(BaseModel):
    nome: str
    marca: str = ""
    # Textos alternativos da embalagem — robustecem o matching (ex.: "leite paste fazendinha")
    aliases: list[str] = Field(default_factory=list)
    imagem_path: str | None = None
    tabela_nutricional: dict[str, Any] = Field(default_factory=dict)
    classificacao_rdc: dict[str, Any] = Field(default_factory=dict)
    traducao_n1: str = ""
    traducao_n2: str = ""
    traducao_n3: str = ""


class ProdutoResumo(BaseModel):
    id: int
    nome: str
    marca: str
    imagem_path: str | None = None

    model_config = {"from_attributes": True}


class ProdutoCompleto(ProdutoResumo):
    aliases: list[str] = []
    tabela_nutricional: dict[str, Any]
    classificacao_rdc: dict[str, Any]
    traducao_n1: str
    traducao_n2: str
    traducao_n3: str


class BuscaOut(BaseModel):
    """Resposta da busca: nunca assume match fraco — pede confirmação."""

    match: Literal["forte", "duvidoso", "nenhum"]
    score: float
    # forte: 1 produto ; duvidoso: candidatos para o usuário confirmar ; nenhum: []
    candidatos: list[ProdutoResumo]
