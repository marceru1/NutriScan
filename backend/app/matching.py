"""Matching do texto OCR da face → produto do banco.

Regras acordadas no projeto (ver docs e README do backend):

1. Normaliza o texto do OCR (caixa alta, sem acentos, tokens úteis apenas)
2. Busca no índice FTS5 (nome + marca + aliases)
3. Score = fração dos tokens do OCR encontrados no texto do produto
4. Classifica em forte / duvidoso / nenhum — e NUNCA assume match fraco:
   é um app de saúde; um falso positivo mostra o alerta do produto errado.
"""

import re
import unicodedata
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import settings

# Tokens úteis = sequências de 3+ letras ("LEITE", "FAZENDINHA").
# Descarta enfeites numéricos/abreviações: "1L", "100G", "500", "LT".
_TOKEN_RE = re.compile(r"[A-Z]{3,}")


def normalizar(texto: str) -> str:
    """Caixa alta, sem acentos, apenas letras/números/espaços."""
    descomposto = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in descomposto if not unicodedata.combining(c))
    em_maiusculas = sem_acento.upper()
    return re.sub(r"[^A-Z0-9 ]", " ", em_maiusculas)


def extrair_tokens(texto_ocr: str) -> list[str]:
    """Tokens que valem para o matching, já sem enfeites como '1L' ou '100G'."""
    return _TOKEN_RE.findall(normalizar(texto_ocr))


def texto_indexado(nome: str, marca: str, aliases: list[str]) -> str:
    """Texto completo do produto que entra no índice FTS."""
    return normalizar(" ".join([nome, marca, *aliases]))


def _montar_query_fts(tokens: list[str]) -> str:
    # prefix query: "FAZEND* OR LEITE*"
    return " OR ".join(f'"{t}"*' for t in tokens)


@dataclass
class Candidato:
    produto_id: int
    score: float


def buscar(session: Session, texto_ocr: str) -> list[Candidato]:
    """Candidatos com score >= WEAK_MAX, do melhor para o pior (limitado)."""
    tokens = extrair_tokens(texto_ocr)
    if not tokens:
        return []

    rows = session.execute(
        text("SELECT rowid, texto FROM produto_fts WHERE produto_fts MATCH :q"),
        {"q": _montar_query_fts(tokens)},
    ).all()

    candidatos: list[Candidato] = []
    for rowid_, texto in rows:
        palavras = set(texto.split())
        batidos = sum(
            1 for t in tokens if t in palavras or any(p.startswith(t) for p in palavras)
        )
        score = batidos / len(tokens)
        if score >= settings.WEAK_MAX:
            candidatos.append(Candidato(produto_id=int(rowid_), score=round(score, 3)))

    candidatos.sort(key=lambda c: (-c.score, c.produto_id))
    return candidatos[: settings.MAX_CANDIDATOS]


def classificar(candidatos: list[Candidato]) -> tuple[str, float]:
    """('forte' | 'duvidoso' | 'nenhum', score do melhor).

    Forte exige: score >= STRONG_MIN **e** o 1º se destacar do 2º (DIFF_MIN).
    Empate (leite integral × desnatado com texto genérico) → duvidoso.
    """
    if not candidatos:
        return "nenhum", 0.0

    melhor = candidatos[0].score
    segundo = candidatos[1].score if len(candidatos) > 1 else 0.0
    destacado = (melhor - segundo) >= settings.DIFF_MIN

    if melhor >= settings.STRONG_MIN and destacado:
        return "forte", melhor
    if melhor >= settings.WEAK_MAX:
        return "duvidoso", melhor
    return "nenhum", 0.0
