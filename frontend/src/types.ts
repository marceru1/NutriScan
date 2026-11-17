// Espelha backend/app/schemas.py (ProdutoResumo / ProdutoCompleto / BuscaOut).
export type Match = 'forte' | 'duvidoso' | 'nenhum';

export interface ProdutoResumo {
  id: number;
  nome: string;
  marca: string;
  imagem_path: string | null;
}

export interface ProdutoCompleto extends ProdutoResumo {
  aliases: string[];
  tabela_nutricional: Record<string, any>;
  classificacao_rdc: Record<string, any>;
  traducao_n1: string;
  traducao_n2: string;
  traducao_n3: string;
  // Conteúdo extra da curadoria — o backend já tem (null → seção oculta).
  consumo_diario?: string | null;
  substituicoes?: string | null;
}

/**
 * Espelho do CatalogoProduto do backend (GET /produtos/catalogo) — 1 resposta
 * para a lista inteira. ProdutoCompleto (ficha) NÃO é atribuível a este tipo:
 * o que muda de lado é o tem_imagem.
 */
export interface ProdutoLista {
  id: number;
  nome: string;
  marca: string;
  imagem_path: string | null;
  aliases: string[];
  classificacao_rdc: Record<string, any>;
  traducao_n1: string;
  traducao_n2: string;
  traducao_n3: string;
  consumo_diario?: string | null; // conteúdo extra; null → seção oculta
  substituicoes?: string | null;
  tem_imagem: boolean;
}

export interface BuscaOut {
  match: Match;
  score: number;
  candidatos: ProdutoResumo[];
}

export type Rota =
  | { nome: 'home' }
  | { nome: 'lista'; consulta?: string }
  | { nome: 'scanner' }
  | { nome: 'resumo'; produto: ProdutoCompleto };
