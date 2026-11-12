"""Testes da API (TestClient sobre SQLite em memória)."""

LEITE_INTEGRAL = {
    "nome": "Leite Integral Fazendinha",
    "marca": "Fazendinha",
    "aliases": ["leite paste fazendinha", "fazendinha leite 1l"],
    "tabela_nutricional": {"por_100ml": {"kcal": 61}},
    "classificacao_rdc": {"acucar_adicionado": False, "sodio": False, "gordura_saturada": False},
    "traducao_n1": "Leite comum, sem lupa crítica.",
    "traducao_n2": "Leite integral tradicional, sem lupas.",
    "traducao_n3": "Sem selos de atenção na frente da embalagem.",
}

LEITE_DESNATADO = {
    "nome": "Leite Desnatado Fazendinha",
    "marca": "Fazendinha",
    "aliases": ["leite paste fazendinha desnatado"],
    "tabela_nutricional": {"por_100ml": {"kcal": 35}},
    "classificacao_rdc": {"acucar_adicionado": False, "sodio": False, "gordura_saturada": False},
    "traducao_n1": "Leite desnatado, sem lupa crítica.",
    "traducao_n2": "Versão desnatada da mesma marca.",
    "traducao_n3": "Sem selos de atenção na frente da embalagem.",
}


def _criar(client, dados):
    r = client.post("/produtos", json=dados)
    assert r.status_code == 201, r.text
    return r.json()


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_criar_listar_e_obter(client):
    criado = _criar(client, LEITE_INTEGRAL)
    assert criado["nome"] == "Leite Integral Fazendinha"
    assert len(criado["aliases"]) == 2

    lista = client.get("/produtos").json()
    assert [p["id"] for p in lista] == [criado["id"]]

    ficha = client.get(f"/produtos/{criado['id']}").json()
    assert ficha["classificacao_rdc"]["acucar_adicionado"] is False
    assert ficha["traducao_n2"].startswith("Leite integral")


def test_get_inexistente_404(client):
    assert client.get("/produtos/999").status_code == 404


def test_busca_forte(client):
    criado = _criar(client, LEITE_INTEGRAL)
    r = client.get(
        "/produtos/busca", params={"q": "LEITE INTEGRAL FAZENDINHA 1L PAST EU"}
    )
    body = r.json()
    assert body["match"] == "forte"
    assert len(body["candidatos"]) == 1
    assert body["candidatos"][0]["id"] == criado["id"]


def test_busca_empate_duvidoso_com_os_2_irmaos(client):
    i1 = _criar(client, LEITE_INTEGRAL)["id"]
    i2 = _criar(client, LEITE_DESNATADO)["id"]
    body = client.get("/produtos/busca", params={"q": "LEITE FAZENDINHA PAST"}).json()
    assert body["match"] == "duvidoso"
    assert {p["id"] for p in body["candidatos"]} == {i1, i2}


def test_busca_nenhum(client):
    _criar(client, LEITE_INTEGRAL)
    body = client.get("/produtos/busca", params={"q": "CHOCOLATE XYZ AB"}).json()
    assert body["match"] == "nenhum"
    assert body["candidatos"] == []


def test_busca_sem_tokens_uteis(client):
    body = client.get("/produtos/busca", params={"q": "1L 500G 123 45"}).json()
    assert body["match"] == "nenhum"


def test_apagar_e_busca_desaparece(client):
    criado = _criar(client, LEITE_INTEGRAL)
    r = client.delete(f"/produtos/{criado['id']}")
    assert r.status_code == 204
    assert client.get(f"/produtos/{criado['id']}").status_code == 404
    body = client.get(
        "/produtos/busca", params={"q": "LEITE INTEGRAL FAZENDINHA"}
    ).json()
    assert body["match"] == "nenhum"


def test_imagem_404_sem_cadastro(client):
    criado = _criar(client, LEITE_INTEGRAL)
    assert client.get(f"/produtos/{criado['id']}/imagem").status_code == 404


def test_imagem_200_com_arquivo(client, tmp_path):
    foto = tmp_path / "leite.jpg"
    foto.write_bytes(b"\xff\xd8foto-teste")
    dados = {**LEITE_INTEGRAL, "imagem_path": str(foto)}
    criado = _criar(client, dados)

    r = client.get(f"/produtos/{criado['id']}/imagem")
    assert r.status_code == 200
    assert r.content == b"\xff\xd8foto-teste"
