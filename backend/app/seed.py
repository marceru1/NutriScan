"""Popula o banco com produtos-exemplo.

Uso:  python -m app.seed   (dentro de backend/, com o venv ativado)
Idempotente: não roda se já existirem produtos cadastrados.
"""

from sqlalchemy import select

from .crud import criar_produto
from .db import init_db, session_scope
from .models import Produto
from .schemas import ProdutoCreate

# Exemplos para desenvolvimento/teste — nome de marca fictício/regionais.
PRODUTOS_EXEMPLO = [
    ProdutoCreate(
        nome="Leite Integral Fazendinha",
        marca="Fazendinha",
        aliases=[
            "leite integra fazendinha",
            "fazendinha leite 1l",
            "leite paste fazendinha",
        ],
        tabela_nutricional={
            "por_100ml": {
                "kcal": 61,
                "acucar_adicionado_g": 0,  # lactose é açúcar natural, não adicionado
                "gordura_saturada_g": 2.3,
                "sodio_mg": 100,
            }
        },
        classificacao_rdc={"acucar_adicionado": False, "sodio": False, "gordura_saturada": False},
        traducao_n1="Leite comum: sem lupa crítica na frente.",
        traducao_n2="Leite integral tradicional. Não traz lupas de atenção da ANVISA.",
        traducao_n3=(
            "O leite integral tem gordura e açúcar naturalmente (lactose), mas em "
            "níveis que não acionam os selos frontais da RDC 429/2020. Faz parte da "
            "alimentação habitual, sem sinal de alerta na embalagem."
        ),
    ),
    ProdutoCreate(
        nome="Leite Desnatado Fazendinha",
        marca="Fazendinha",
        aliases=["fazendinha desnatado 1l", "leite paste fazendinha desnatado"],
        tabela_nutricional={
            "por_100ml": {"kcal": 35, "acucar_adicionado_g": 0, "gordura_saturada_g": 0.1, "sodio_mg": 95}
        },
        classificacao_rdc={"acucar_adicionado": False, "sodio": False, "gordura_saturada": False},
        traducao_n1="Leite com menos gordura: sem lupa crítica.",
        traducao_n2="Mesma marca do integral, versão desnatada. Sem lupas de atenção.",
        traducao_n3=(
            "O desnatado tem menos gordura que o integral e também não aciona os "
            "selos da RDC 429/2020. Atenção na gôndola: as duas embalagens se parecem; "
            "confira sempre qual você está pegando."
        ),
    ),
    ProdutoCreate(
        nome="Refrigerante Xingu Cola",
        marca="Xingu Cola",
        aliases=["xingu cola 2l", "xingu cola lata", "guarana xingu cola"],
        tabela_nutricional={
            "por_100ml": {"kcal": 42, "acucar_adicionado_g": 10.5, "gordura_saturada_g": 0, "sodio_mg": 5}
        },
        classificacao_rdc={"acucar_adicionado": True, "sodio": False, "gordura_saturada": False},
        traducao_n1="Muito açúcar adicionado — melhor evitar.",
        traducao_n2="Refrigerante com alta quantidade de açúcar adicionado por porção.",
        traducao_n3=(
            "Cada porção de refrigerante leva açúcar adicionado em nível de atenção "
            "segundo a RDC 429/2020. Consumo frequente está associado a diabetes e "
            "ganho de peso; prefira água ou sucos naturais."
        ),
    ),
    ProdutoCreate(
        nome="Biscoito Recheado Chocolate Amazonas",
        marca="Amazonas",
        aliases=["biscoito recheado chocolate amazonas 130g", "recheado amazonas"],
        tabela_nutricional={
            "por_100g": {"kcal": 480, "acucar_adicionado_g": 32, "gordura_saturada_g": 9, "sodio_mg": 280}
        },
        classificacao_rdc={"acucar_adicionado": True, "sodio": False, "gordura_saturada": True},
        traducao_n1="Alto em açúcar adicionado e gordura saturada.",
        traducao_n2="Biscoito recheado ultraprocessado com duas lupas de atenção.",
        traducao_n3=(
            "O biscoito recheado leva açúcar adicionado e gordura saturada em níveis "
            "de atenção da RDC 429/2020 — dois selos frontais. Consumo regular está "
            "associado a DCNTs como obesidade e hipertensão; trate como ocasião, "
            "não como lanche diário."
        ),
    ),
]


def main() -> None:
    init_db()
    with session_scope() as db:
        total = len(db.scalars(select(Produto)).all())
        if total > 0:
            print(f"Banco já tem {total} produto(s) — seed ignorado.")
            return
        for dados in PRODUTOS_EXEMPLO:
            produto = criar_produto(db, dados)
            print(f"+ {produto.id}: {produto.nome} (aliases: {len(produto.aliases)})")
    print("Seed concluído.")


if __name__ == "__main__":
    main()
