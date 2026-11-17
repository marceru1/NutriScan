// DADOS DE DEMONSTRAÇÃO para desenvolver a interface sem o backend.
// Valores do protótipo. Troque USE_MOCK em services/api.ts quando o backend estiver acessível.
import type { ProdutoCompleto } from '../types';

const creme = (id: number): ProdutoCompleto => ({
  id,
  nome: 'Creme de leite',
  marca: 'Exemplo',
  imagem_path: null,
  aliases: ['creme de leite 200g'],
  classificacao_rdc: { acucar_adicionado: false, sodio: false, gordura_saturada: true },
  tabela_nutricional: {
    base: '100 g',
    porcao: '15 g (1 1/2 colher de sopa)',
    porcoes_embalagem: 'Cerca de 13',
    linhas: [
      { nome: 'Valor energético (kcal)', v100: '164', vPorcao: '24', vd: '1' },
      { nome: 'Carboidratos (g)', v100: '4,3', vPorcao: '0,6', vd: '0' },
      { nome: 'Açúcares totais (g)', v100: '3,5', vPorcao: '0,5', recuo: true },
      { nome: 'Açúcares adicionados (g)', v100: '0', vPorcao: '0', vd: '0', recuo: true },
      { nome: 'Proteínas (g)', v100: '2,9', vPorcao: '0,4', vd: '1' },
      { nome: 'Gorduras totais (g)', v100: '15', vPorcao: '2,3', vd: '3' },
      { nome: 'Gorduras saturadas (g)', v100: '9,7', vPorcao: '1,5', vd: '7', recuo: true },
      { nome: 'Gorduras trans (g)', v100: '0', vPorcao: '0', vd: '0', recuo: true },
      { nome: 'Fibras alimentares (g)', v100: '0', vPorcao: '0', vd: '0' },
      { nome: 'Sódio (mg)', v100: '106', vPorcao: '16', vd: '1' },
    ],
  },
  traducao_n1: 'Rico em gordura saturada e açúcares totais',
  traducao_n2:
    'Este produto tem teores elevados de gordura saturada (9,7g/100g) e açúcares totais (3,5g/100g) o que pode ser prejudicial se consumido em excesso.',
  traducao_n3:
    'Embora o tamanho da porção tenha valores absolutos baixos, a concentração por 100g revela níveis significativos de gordura saturada e açúcares naturais do leite. A gordura saturada deve ser limitada na dieta. Note que não há açúcares adicionados e o sódio é baixo, ideal para uso moderado em preparações, mas evite o consumo diário excessivo para manter a saúde cardiovascular.',
  consumo_diario: 'Até 15g (uma colher de sopa)',
  substituicoes:
    'Prefira alternativas mais leves, como iogurte natural desnatado, creme de ricota light ou creme de aveia em preparações cotidianas.',
});

const simples = (
  id: number,
  nome: string,
  rdc: Record<string, boolean>,
  n1: string,
): ProdutoCompleto => ({
  id,
  nome,
  marca: 'Exemplo',
  imagem_path: null,
  aliases: [],
  classificacao_rdc: rdc,
  tabela_nutricional: {},
  traducao_n1: n1,
  traducao_n2: 'Resumo ainda não cadastrado (dado de demonstração).',
  traducao_n3: 'Detalhe ainda não cadastrado (dado de demonstração).',
});

export const MOCK_PRODUTOS: ProdutoCompleto[] = [
  creme(1),
  creme(2),
  creme(3),
  simples(4, 'Macarrão instantâneo', { sodio: true }, 'Rico em sódio'),
  simples(
    5,
    'Refrigerante Coca Cola',
    { acucar_adicionado: true },
    'Rico em açúcares adicionados',
  ),
  creme(6),
  creme(7),
];
