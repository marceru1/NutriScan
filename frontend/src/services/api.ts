import { MOCK_PRODUTOS } from '../data/mock';
import { normalizar } from '../domain/rdc';
import type { BuscaOut, ProdutoCompleto } from '../types';

// true = usa dados de demonstração (sem backend). false = chama o FastAPI.
export const USE_MOCK = true;

// Emulador Android: 10.0.2.2. Celular físico: IP do PC na rede (uvicorn --host 0.0.0.0).
export const API_URL = 'http://10.0.2.2:8000';

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`);
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export function urlImagem(id: number): string {
  return `${API_URL}/produtos/${id}/imagem`;
}

export async function obterProduto(id: number): Promise<ProdutoCompleto> {
  if (USE_MOCK) {
    const p = MOCK_PRODUTOS.find(x => x.id === id);
    if (!p) {
      throw new Error('Produto não encontrado');
    }
    return p;
  }
  return get<ProdutoCompleto>(`/produtos/${id}`);
}

export async function listarProdutos(): Promise<ProdutoCompleto[]> {
  if (USE_MOCK) {
    return MOCK_PRODUTOS;
  }
  const resumos = await get<{ id: number }[]>('/produtos?limite=50');
  return Promise.all(resumos.map(r => obterProduto(r.id)));
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
