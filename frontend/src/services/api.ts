import { MOCK_PRODUTOS } from '../data/mock';
import { normalizar } from '../domain/rdc';
import type { BuscaOut, ProdutoCompleto, ProdutoLista } from '../types';
import { API_KEY, API_URL, USE_MOCK } from './config';

/** Erro com mensagem JÁ amigável p/ exibir na tela (401/403/429 mapeados). */
export class ErroApi extends Error {}

// A chave só trafega quando configurada — em dev aberto o backend aceita sem header.
const HEADERS: Record<string, string> = API_KEY ? { 'X-Api-Key': API_KEY } : {};

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, { headers: HEADERS }).catch(() => {
    throw new ErroApi('Sem conexão com o servidor.');
  });
  if (r.status === 401) {
    throw new ErroApi('Chave da API não configurada (NUTRISCAN_API_KEY no backend).');
  }
  if (r.status === 403) {
    throw new ErroApi('X-Api-Key incorreto — confira a chave em services/config.ts.');
  }
  if (r.status === 429) {
    throw new ErroApi('Servidor ocupado — espere alguns segundos e tente de novo.');
  }
  if (!r.ok) {
    throw new ErroApi(`Erro do servidor (HTTP ${r.status}).`);
  }
  return r.json() as Promise<T>;
}

/** GET /{id}/imagem é rota pública — a <Image> do RN não manda header. */
export function urlImagem(id: number): string {
  return `${API_URL}/produtos/${id}/imagem`;
}

export async function obterProduto(id: number): Promise<ProdutoCompleto> {
  if (USE_MOCK) {
    const p = MOCK_PRODUTOS.find(x => x.id === id);
    if (!p) {
      throw new ErroApi('Produto não encontrado');
    }
    return p;
  }
  return get<ProdutoCompleto>(`/produtos/${id}`);
}

/**
 * Catálogo completo em 1 GET (o mesmo payload do matching offline).
 * Substitui o antigo listarProdutos() com N+1 (51 requests por lista).
 */
export async function listarCatalogo(): Promise<ProdutoLista[]> {
  if (USE_MOCK) {
    return MOCK_PRODUTOS.map(p => ({ ...p, tem_imagem: !!p.imagem_path }));
  }
  const out = await get<{ produtos: ProdutoLista[] }>('/produtos/catalogo');
  return out.produtos;
}

/** Texto do OCR → forte | duvidoso | nenhum (regra do backend; o app nunca assume match fraco). */
export async function buscarPorTexto(texto: string): Promise<BuscaOut> {
  if (!USE_MOCK) {
    return get<BuscaOut>(`/produtos/busca?q=${encodeURIComponent(texto)}`);
  }
  const q = normalizar(texto);
  const achados = MOCK_PRODUTOS.filter(
    p => q.includes(normalizar(p.nome)) || normalizar(p.nome).includes(q),
  );
  if (achados.length === 0 || q.length < 3) {
    return { match: 'nenhum', score: 0, candidatos: [] };
  }
  return achados.length === 1
    ? { match: 'forte', score: 0.9, candidatos: achados }
    : { match: 'duvidoso', score: 0.5, candidatos: achados.slice(0, 3) };
}
