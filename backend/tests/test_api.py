"""Testes da API (TestClient sobre SQLite em memória)."""

import pytest

from app import settings

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


def _criar(client, dados, token: str | None = None):
    headers = {"X-Admin-Token": token} if token else {}
    r = client.post("/produtos", json=dados, headers=headers)
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


def test_campos_extras_na_ficha_e_no_catalogo(client):
    """consumo_diario/substituicoes: conteúdo extra da curadoria (uso no 'Detalhes'
    do app) — ecoam na ficha e no catálogo, e ficam null quando não cadastrados."""
    com_extras = _criar(
        client,
        {
            **LEITE_INTEGRAL,
            "consumo_diario": "1 copo por dia",
            "substituicoes": "Prefirir bebidas vegetais fortificadas.",
        },
    )
    ficha = client.get(f"/produtos/{com_extras['id']}").json()
    assert ficha["consumo_diario"] == "1 copo por dia"
    assert ficha["substituicoes"] == "Prefirir bebidas vegetais fortificadas."

    (item,) = client.get("/produtos/catalogo").json()["produtos"]
    assert item["consumo_diario"] == "1 copo por dia"
    assert item["substituicoes"] == "Prefirir bebidas vegetais fortificadas."

    # sem os campos no cadastro → null (o app esconde a seção)
    padrao = _criar(client, LEITE_DESNATADO)
    assert client.get(f"/produtos/{padrao['id']}").json()["consumo_diario"] is None


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


# ---------------------------------------------------------------------------
# Catálogo (sync offline do app) e upload de imagem
# ---------------------------------------------------------------------------


@pytest.fixture()
def imagens_dir(tmp_path, monkeypatch):
    """Redireciona o diretório de imagens para tmp — testes não sujam data/."""
    destino = tmp_path / "imagens"
    monkeypatch.setattr(settings, "IMAGENS_DIR", destino)
    return destino


def test_catalogo_devolve_texto_sem_foto(client):
    criado = _criar(client, LEITE_INTEGRAL)

    body = client.get("/produtos/catalogo").json()
    assert body["total"] == 1
    assert "gerado_em" in body

    (item,) = body["produtos"]
    assert item["id"] == criado["id"]
    assert item["nome"] == "Leite Integral Fazendinha"
    assert item["aliases"] == LEITE_INTEGRAL["aliases"]
    assert item["classificacao_rdc"] == LEITE_INTEGRAL["classificacao_rdc"]
    assert item["traducao_n3"] == LEITE_INTEGRAL["traducao_n3"]
    assert item["tem_imagem"] is False


PNG_FAKE = b"\x89PNG\r\n\x1a\nfake-png"  # testes não precisam de imagem real


def test_imagem_upload_definir_baixar(client, imagens_dir):
    criado = _criar(client, LEITE_INTEGRAL)

    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("face.jpg", PNG_FAKE, "image/png")},
    )
    assert r.status_code == 201, r.text
    resp = r.json()
    assert resp["produto_id"] == criado["id"]
    assert resp["tamanho_bytes"] == len(PNG_FAKE)

    # nome derivado do id — não confia no nome enviado
    assert "produto-" in resp["imagem_path"]

    # o download devolve exatamente o que foi enviado
    dl = client.get(f"/produtos/{criado['id']}/imagem")
    assert dl.status_code == 200
    assert dl.content == PNG_FAKE

    # catálogo agora sinaliza que tem foto (app só baixa com rede quando faz sentido)
    item = client.get("/produtos/catalogo").json()["produtos"][0]
    assert item["tem_imagem"] is True


def test_imagem_upload_tipo_invalido_415(client, imagens_dir):
    criado = _criar(client, LEITE_INTEGRAL)
    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("curioso.pdf", b"%PDF-1.4", "application/pdf")},
    )
    assert r.status_code == 415
    # nada gravado
    assert client.get(f"/produtos/{criado['id']}/imagem").status_code == 404


def test_imagem_upload_vazio_400(client, imagens_dir):
    criado = _criar(client, LEITE_INTEGRAL)
    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("vazio.jpg", b"", "image/jpeg")},
    )
    assert r.status_code == 400


def test_imagem_upload_404_produto_inexistente(client, imagens_dir):
    r = client.post(
        "/produtos/999/imagem",
        files={"arquivo": ("foto.png", PNG_FAKE, "image/png")},
    )
    assert r.status_code == 404


def test_imagem_upload_substitui_e_limpa_extensao_antiga(client, imagens_dir):
    criado = _criar(client, LEITE_INTEGRAL)

    client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("a.jpg", b"jpeg-velho", "image/jpeg")},
    )
    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("b.webp", b"webp-novo", "image/webp")},
    )
    assert r.status_code == 201

    # a antiga sai do diretório; o DB aponta para a nova
    restantes = sorted(p.name for p in imagens_dir.iterdir())
    assert restantes == [f"produto-{criado['id']}.webp"]
    dl = client.get(f"/produtos/{criado['id']}/imagem")
    assert dl.content == b"webp-novo"


def test_imagem_upload_nao_apaga_arquivo_externo(client, imagens_dir, tmp_path):
    """imagem_path apontando fora do diretório de uploads não é apagado."""
    externa = tmp_path / "face-seed.jpg"
    externa.write_bytes(b"foto-do-seed")
    dados = {**LEITE_INTEGRAL, "imagem_path": str(externa)}
    criado = _criar(client, dados)

    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("novo.png", PNG_FAKE, "image/png")},
    )
    assert r.status_code == 201
    assert externa.is_file()  # o upload não destrói arquivo que não é seu
    assert client.get(f"/produtos/{criado['id']}/imagem").content == PNG_FAKE


# ---------------------------------------------------------------------------
# Auth (X-Admin-Token) e rate limit
# ---------------------------------------------------------------------------

TOKEN = "segredo-equipe"
CHAVE_APP = "chave-do-app-rn"


def test_api_key_exige_header_quando_configurada(client, monkeypatch):
    """O app RN manda X-Api-Key em toda chamada — leitura e escrita."""
    monkeypatch.setattr(settings, "API_KEY", CHAVE_APP)

    # sem chave → 401 ; errada → 403
    assert client.get("/produtos").status_code == 401
    assert client.get("/produtos", headers={"X-Api-Key": "errada"}).status_code == 403

    # correta → 200, incluindo busca e catálogo (o fluxo do app)
    assert client.get("/produtos", headers={"X-Api-Key": CHAVE_APP}).status_code == 200
    assert (
        client.get("/produtos/catalogo", headers={"X-Api-Key": CHAVE_APP}).status_code
        == 200
    )
    assert (
        client.get(
            "/produtos/busca",
            params={"q": "LEITE INTEGRAL FAZENDINHA"},
            headers={"X-Api-Key": CHAVE_APP},
        ).status_code
        == 200
    )

    # /health continua aberto (monitoramento)
    assert client.get("/health").status_code == 200


def test_toda_rota_de_app_exige_chave_menos_a_imagem(client, imagens_dir, monkeypatch):
    """Rede de segurança do auth por rota: se alguém criar rota nova sem
    Depends(exigir_api_key), este teste acusa. Única exceção de chave:
    GET /{id}/imagem — a <Image> do RN não manda header (e foto de embalagem
    não é dado sensível); o upload continua exigindo as duas chaves."""
    criado = _criar(client, LEITE_INTEGRAL)
    r_up = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("face.png", PNG_FAKE, "image/png")},
    )
    assert r_up.status_code == 201, r_up.text

    monkeypatch.setattr(settings, "API_KEY", CHAVE_APP)

    # TODAS as leituras do app exigem a chave quando configurada…
    assert client.get("/produtos").status_code == 401
    assert client.get(f"/produtos/{criado['id']}").status_code == 401
    assert client.get("/produtos/catalogo").status_code == 401
    assert client.get("/produtos/busca", params={"q": "x"}).status_code == 401

    # …menos o download da foto: 200 sem header nenhum
    dl = client.get(f"/produtos/{criado['id']}/imagem")
    assert dl.status_code == 200
    assert dl.content == PNG_FAKE


def test_api_key_sem_config_fica_aberta(client):
    """Dev local sem NUTRISCAN_API_KEY: leitura sem header (comportamento atual)."""
    assert settings.API_KEY == ""
    assert client.get("/produtos").status_code == 200


def test_escrita_exige_as_duas_chaves(client, monkeypatch):
    monkeypatch.setattr(settings, "API_KEY", CHAVE_APP)
    monkeypatch.setattr(settings, "ADMIN_TOKEN", TOKEN)

    # só admin, faltou a do app → 401 ; só a do app, faltou admin → 401
    r = client.post("/produtos", json=LEITE_INTEGRAL, headers={"X-Admin-Token": TOKEN})
    assert r.status_code == 401
    r = client.post(
        "/produtos", json=LEITE_INTEGRAL, headers={"X-Api-Key": CHAVE_APP}
    )
    assert r.status_code == 401

    # as duas → 201
    r = client.post(
        "/produtos",
        json=LEITE_INTEGRAL,
        headers={"X-Api-Key": CHAVE_APP, "X-Admin-Token": TOKEN},
    )
    assert r.status_code == 201, r.text


def test_admin_exige_token_quando_configurado(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_TOKEN", TOKEN)

    # escrita sem token → 401 ; token errado → 403
    assert client.post("/produtos", json=LEITE_INTEGRAL).status_code == 401
    r = client.post(
        "/produtos",
        json=LEITE_INTEGRAL,
        headers={"X-Admin-Token": "token-errado"},
    )
    assert r.status_code == 403

    # leitura continua pública — o app não precisa de token para consultar
    assert client.get("/produtos").status_code == 200
    assert client.get("/produtos/catalogo").status_code == 200

    # token certo → 201 ; apagar também é proteção
    r = client.post("/produtos", json=LEITE_INTEGRAL, headers={"X-Admin-Token": TOKEN})
    assert r.status_code == 201, r.text
    pid = r.json()["id"]
    assert client.delete(f"/produtos/{pid}").status_code == 401
    assert client.delete(f"/produtos/{pid}", headers={"X-Admin-Token": TOKEN}).status_code == 204
    assert client.get(f"/produtos/{pid}").status_code == 404


def test_admin_sem_token_configurado_fica_aberto(client):
    """Dev local sem NUTRISCAN_ADMIN_TOKEN: escrita liberada (comportamento atual)."""
    assert settings.ADMIN_TOKEN == ""
    assert client.post("/produtos", json=LEITE_INTEGRAL).status_code == 201


def test_admin_upload_imagem_precisa_token(client, imagens_dir, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_TOKEN", TOKEN)
    criado = _criar(client, LEITE_INTEGRAL, token=TOKEN)

    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("f.png", PNG_FAKE, "image/png")},
    )
    assert r.status_code == 401
    # nada gravado no disco nem no cadastro
    assert client.get(f"/produtos/{criado['id']}/imagem").status_code == 404

    r = client.post(
        f"/produtos/{criado['id']}/imagem",
        files={"arquivo": ("f.png", PNG_FAKE, "image/png")},
        headers={"X-Admin-Token": TOKEN},
    )
    assert r.status_code == 201


def test_rate_limit_429_com_headers_e_health_isento(client, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_RPM", 3)

    r1 = client.get("/produtos")
    assert r1.status_code == 200
    assert r1.headers["X-RateLimit-Limit"] == "3"
    assert r1.headers["X-RateLimit-Remaining"] == "2"

    codigos = [r1.status_code] + [client.get("/produtos").status_code for _ in range(7)]
    # janela de 60s pode virar no meio — mas 8 requisições garantem estouro
    assert 429 in codigos

    r429 = None
    for _ in range(3):
        resp = client.get("/produtos")
        if resp.status_code == 429:
            r429 = resp
            break
        codigos.append(resp.status_code)
    assert r429 is not None
    retry = int(r429.headers["Retry-After"])
    assert 0 < retry <= 60

    # /health é isento — mesmo estourado responde (monitoramento de vida)
    assert client.get("/health").status_code == 200


def test_nosniff_na_resposta(client):
    r = client.get("/health")
    assert r.headers["X-Content-Type-Options"] == "nosniff"
