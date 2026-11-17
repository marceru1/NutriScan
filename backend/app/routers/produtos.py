"""Rotas do banco regional de produtos."""

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .. import crud, matching, settings
from ..db import get_db
from ..schemas import (
    BuscaOut,
    CatalogoOut,
    CatalogoProduto,
    ProdutoCreate,
    ProdutoCompleto,
    ProdutoResumo,
)
from ..seguranca import exigir_admin, exigir_api_key

# exigir_api_key no router INTEIRO: é a porta de entrada do app RN.
# Escritas somam exigir_admin (a equipe precisa das duas).
router = APIRouter(
    prefix="/produtos",
    tags=["produtos"],
    dependencies=[Depends(exigir_api_key)],
)


@router.post("", response_model=ProdutoCompleto, status_code=201,
             dependencies=[Depends(exigir_admin)])
def criar_produto(dados: ProdutoCreate, db: Session = Depends(get_db)):
    """Cadastra um produto do banco regional (+ aliases) — uso da equipe (admin)."""
    produto = crud.criar_produto(db, dados)
    return crud.para_completo(produto)


# /busca e /catalogo ANTES de /{produto_id} — ordem importa para não casar como id
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


@router.get("/catalogo", response_model=CatalogoOut)
def catalogo(db: Session = Depends(get_db)):
    """Catálogo completo (texto) para o app pré-baixar e bater match offline.

    Nome, marca, aliases, classificação RDC e traduções — cabe em poucos MB.
    A foto NÃO vai aqui: é confirmação, baixada por produto quando há rede.
    """
    produtos = crud.listar_catalogo(db)
    return CatalogoOut(
        gerado_em=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        total=len(produtos),
        produtos=[
            CatalogoProduto(
                id=p.id,
                nome=p.nome,
                marca=p.marca,
                aliases=[a.texto for a in p.aliases],
                classificacao_rdc=p.classificacao_rdc,
                traducao_n1=p.traducao_n1,
                traducao_n2=p.traducao_n2,
                traducao_n3=p.traducao_n3,
                tem_imagem=bool(p.imagem_path),
            )
            for p in produtos
        ],
    )


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


@router.post("/{produto_id}/imagem", status_code=201,
             dependencies=[Depends(exigir_admin)])
async def enviar_imagem(
    produto_id: int, arquivo: UploadFile, db: Session = Depends(get_db)
):
    """Cadastra/substitui a foto da face principal — uso da equipe (admin).

    O app usa a foto como confirmação visual (match é por texto). O arquivo é
    gravado com nome derivado do id — nunca se confia no nome enviado.
    """
    produto = crud.get_produto(db, produto_id)
    if produto is None:
        raise HTTPException(404, "Produto não encontrado")

    ext = settings.CONTENT_TYPES_IMAGEM.get(arquivo.content_type or "")
    if ext is None:
        raise HTTPException(
            415,
            f"Tipo de arquivo não suportado ({arquivo.content_type}). "
            "Envie JPEG, PNG ou WebP — é o formato que a câmera captura.",
        )

    conteudo = await arquivo.read()
    limite = settings.LIMITE_IMAGEM_MB * 1024 * 1024
    if len(conteudo) == 0:
        raise HTTPException(400, "Arquivo vazio")
    if len(conteudo) > limite:
        raise HTTPException(
            413, f"Imagem acima de {settings.LIMITE_IMAGEM_MB} MB — comprima o WebP."
        )

    settings.IMAGENS_DIR.mkdir(parents=True, exist_ok=True)
    novo = settings.IMAGENS_DIR / f"produto-{produto_id}{ext}"

    # Foto anterior do nosso diretório com nome diferente → apagar para não vire lixo
    antigo = Path(produto.imagem_path) if produto.imagem_path else None

    # Arquivo primeiro (falha → DB intocado), path no DB depois
    try:
        novo.write_bytes(conteudo)
    except OSError:
        raise HTTPException(500, "Falha ao gravar o arquivo de imagem")

    crud.definir_imagem(db, produto, novo)

    if (
        antigo
        and antigo.is_absolute()
        and antigo != novo
        and antigo.parent == settings.IMAGENS_DIR
        and antigo.is_file()
    ):
        antigo.unlink()

    return {
        "produto_id": produto_id,
        "imagem_path": produto.imagem_path,
        "tamanho_bytes": len(conteudo),
    }


@router.delete("/{produto_id}", status_code=204,
               dependencies=[Depends(exigir_admin)])
def apagar(produto_id: int, db: Session = Depends(get_db)):
    produto = crud.get_produto(db, produto_id)
    if produto is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    crud.apagar_produto(db, produto)
