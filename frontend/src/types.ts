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
  // Extras do protótipo que o backend AINDA NÃO tem. Só aparecem na tela se vierem preenchidos.
  consumo_diario?: string;
  substituicoes?: string;
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
