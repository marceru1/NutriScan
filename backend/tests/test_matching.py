"""Testes unitários do matching (normalização, score, classificação)."""

from app import crud
from app.matching import Candidato, buscar, classificar, extrair_tokens, normalizar
from app.schemas import ProdutoCreate


def test_normalizar_tira_acentos_e_vira_caixa_alta():
    assert normalizar("Leite Integral Fazendinha") == "LEITE INTEGRAL FAZENDINHA"
    assert normalizar("Guaraná Xíngu") == "GUARANA XINGU"


def test_extract_tokens_descarta_enfeites():
    tokens = extrair_tokens("LEITE INTEGRAL FAZENDINHA 1L PAST EURIZADO 500G")
    assert tokens == ["LEITE", "INTEGRAL", "FAZENDINHA", "PAST", "EURIZADO"]


def test_classificar_vazio_eh_nenhum():
    assert classificar([]) == ("nenhum", 0.0)


def test_classificar_unico_candidato_forte():
    assert classificar([Candidato(1, 1.0)]) == ("forte", 1.0)


def test_classificar_empate_eh_duvidoso():
    # integral × desnatado com texto genérico: ambos 1.0 → nunca assumir
    assert classificar([Candidato(1, 1.0), Candidato(2, 1.0)])[0] == "duvidoso"


def test_classificar_fraco_eh_nenhum():
    assert classificar([Candidato(1, 0.3)]) == ("nenhum", 0.0)


def _criar(db, nome: str, marca: str, aliases: list[str]):
    return crud.criar_produto(
        db,
        ProdutoCreate(
            nome=nome,
            marca=marca,
            aliases=aliases,
            classificacao_rdc={"acucar_adicionado": False, "sodio": False, "gordura_saturada": False},
            traducao_n1="t", traducao_n2="t", traducao_n3="t",
        ),
    )


def test_busca_com_gap_forte_vs_irmao(mem_db):
    """'INTEGRAL' presente → o integral ganha com folga do desnatado."""
    integral = _criar(mem_db, "Leite Integral Fazendinha", "Fazendinha", ["leite paste fazendinha"])
    _criar(mem_db, "Leite Desnatado Fazendinha", "Fazendinha", ["leite paste fazendinha desnatado"])

    candidatos = buscar(mem_db, "LEITE INTEGRAL FAZENDINHA 1L PAST EU")
    assert candidatos[0].produto_id == integral.id


def test_busca_generico_traz_os_2_irmaos(mem_db):
    """Sem 'INTEGRAL'/'DESNATADO' no OCR: os dois empatam → nunca assumir."""
    _criar(mem_db, "Leite Integral Fazendinha", "Fazendinha", ["leite paste fazendinha"])
    _criar(mem_db, "Leite Desnatado Fazendinha", "Fazendinha", ["leite paste fazendinha desnatado"])

    candidatos = buscar(mem_db, "LEITE FAZENDINHA PAST")
    assert len(candidatos) == 2
    assert classificar(candidatos)[0] == "duvidoso"
