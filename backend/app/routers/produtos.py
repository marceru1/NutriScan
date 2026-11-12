"""Rotas do banco regional de produtos."""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import crud, matching, settings
from ..db import get_db
from ..schemas import BuscaOut, ProdutoCreate, ProdutoCompleto, ProdutoResumo

router = APIRouter(prefix="/produtos", tags=["produtos"])


@router.post("", response_model=ProdutoCompleto, status_code=201)
def criar_produto(dados: ProdutoCreate, db: Session = Depends(get_db)):
    """Cadastra um produto do banco regional (+ aliases) — uso da equipe (admin)."""
    produto = crud.criar_produto(db, dados)
    return crud.para_completo(produto)


# /busca ANTES de /{produto_id} — ordem importa para não casar 'busca' como id
@router.get("/busca", response_model=BuscaOut)
def buscar_produto(q: str, db: Session = Depends(get_db)):
    """Identifica o produto a partir do texto lido na face da embalagem.

    forte → 1 candidato ; duvidoso → candidatos para confirmação ; nenhum → [].
    O app NUNCA assume match fraco (regra de confiança do projeto).
    """
    candidatos = matching.buscar(db, q)
    match, score = matching.classificar(candidatos)

    if match == "nenhum":
        return BuscaOut(match=match, score=score, candidatos=[])
    if match == "forte":
        ids = [candidatos[0].produto_id]
    else:
        ids = [c.produto_id for c in candidatos]

    produtos = []
    for produto_id in ids:
        produto = crud.get_produto(db, produto_id)
        if produto is not None:
            produtos.append(
                ProdutoResumo(
                    id=produto.id,
                    nome=produto.nome,
                    marca=produto.marca,
                    imagem_path=produto.imagem_path,
                )
            )
    return BuscaOut(match=match, score=score, candidatos=produtos)


@router.get("", response_model=list[ProdutoResumo])
def listar(limite: int = 50, db: Session = Depends(get_db)):
    return [ProdutoResumo.model_validate(p) for p in crud.listar_produtos(db, limite)]


@router.get("/{produto_id}", response_model=ProdutoCompleto)
def obter(produto_id: int, db: Session = Depends(get_db)):
    produto = crud.get_produto(db, produto_id)
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return crud.para_completo(produto)


@router.get("/{produto_id}/imagem")
def obter_imagem(produto_id: int, db: Session = Depends(get_db)):
    """Foto da face principal cadastrada — usada como confirmação no app."""
    produto = crud.get_produto(db, produto_id)
    if produto is None or not produto.imagem_path:
        raise HTTPException(404, "Produto não encontrado ou sem imagem cadastrada")

    caminho = Path(produto.imagem_path)
    if not caminho.is_absolute():
        caminho = settings.BASE_DIR / caminho
    if not caminho.is_file():
        raise HTTPException(404, "Arquivo de imagem não encontrado")
    return FileResponse(caminho)


@router.delete("/{produto_id}", status_code=204)
def apagar(produto_id: int, db: Session = Depends(get_db)):
    produto = crud.get_produto(db, produto_id)
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    crud.apagar_produto(db, produto)
