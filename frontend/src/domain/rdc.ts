import type { ProdutoCompleto } from '../types';

const ROTULOS: Record<string, string> = {
  acucar_adicionado: 'açúcares adicionados',
  gordura_saturada: 'gorduras saturadas',
  sodio: 'sódio',
};

/** "Alto em açúcares adicionados e sódio" — ou null se nenhuma lupa (RDC 429/2020). */
export function textoAlerta(classificacao: Record<string, any>): string | null {
  const altos = Object.keys(ROTULOS)
    .filter(k => classificacao?.[k] === true)
    .map(k => ROTULOS[k]);
  if (altos.length === 0) {
    return null;
  }
  const lista =
    altos.length === 1
      ? altos[0]
      : `${altos.slice(0, -1).join(', ')} e ${altos[altos.length - 1]}`;
  return `Alto em ${lista}`;
}

export function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export interface LinhaTabela {
  nome: string;
  v100: string;
  vPorcao?: string;
  vd?: string;
  recuo?: boolean;
}

export interface TabelaView {
  colunaBase: string; // "100 g" | "100 ml"
  porcao?: string;
  porcoesEmbalagem?: string;
  temPorcao: boolean;
  linhas: LinhaTabela[];
}

const NOMES_CHAVE: Record<string, string> = {
  kcal: 'Valor energético (kcal)',
  acucar_adicionado_g: 'Açúcares adicionados (g)',
  gordura_saturada_g: 'Gorduras saturadas (g)',
  sodio_mg: 'Sódio (mg)',
};

/**
 * Aceita dois formatos de `tabela_nutricional`:
 *  1) {linhas:[{nome,v100,vPorcao,vd,recuo}], porcao, porcoes_embalagem, base}
 *  2) o formato simples do seed do backend: {por_100ml: {kcal: 61, ...}}
 * Nunca calcula nem infere valores — só exibe o que está cadastrado.
 */
export function montarTabela(p: ProdutoCompleto): TabelaView {
  const t = p.tabela_nutricional ?? {};
  if (Array.isArray(t.linhas)) {
    return {
      colunaBase: t.base ?? '100 g',
      porcao: t.porcao,
      porcoesEmbalagem: t.porcoes_embalagem,
      temPorcao: t.linhas.some((l: LinhaTabela) => l.vPorcao != null),
      linhas: t.linhas,
    };
  }
  const chave = Object.keys(t).find(k => k.startsWith('por_100')) ?? '';
  const bloco: Record<string, any> = t[chave] ?? {};
  return {
    colunaBase: chave.endsWith('ml') ? '100 ml' : '100 g',
    temPorcao: false,
    linhas: Object.keys(bloco).map(k => ({
      nome: NOMES_CHAVE[k] ?? k,
      v100: String(bloco[k]),
    })),
  };
}
