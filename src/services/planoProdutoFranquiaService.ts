import api from './api';
import { PlanoProdutoFranquia } from '../types/franquia.types';

const BASE_URL = '/planos-produtos-franquia';

export const planoProdutoFranquiaService = {
  /**
   * Associar uma franquia a um produto em um plano
   */
  associar: async (
    planoId: number,
    produtoId: number,
    franquiaId: number,
    limiteFranquia: number,
    valorExcedente?: number,
    periodoFranquia: string = 'MENSAL'
  ): Promise<PlanoProdutoFranquia> => {
    const params = new URLSearchParams();
    params.append('planoId', planoId.toString());
    params.append('produtoId', produtoId.toString());
    params.append('franquiaId', franquiaId.toString());
    params.append('limiteFranquia', limiteFranquia.toString());
    if (valorExcedente) params.append('valorExcedente', valorExcedente.toString());
    params.append('periodoFranquia', periodoFranquia);

    const response = await api.post(`${BASE_URL}/associar?${params.toString()}`);
    return response.data;
  },

  /**
   * Atualizar associação
   */
  atualizar: async (
    id: number,
    dados: {
      limiteFranquia?: number;
      valorExcedente?: number;
      ativo?: boolean;
    }
  ): Promise<PlanoProdutoFranquia> => {
    const params = new URLSearchParams();
    if (dados.limiteFranquia) params.append('limiteFranquia', dados.limiteFranquia.toString());
    if (dados.valorExcedente !== undefined) params.append('valorExcedente', dados.valorExcedente.toString());
    if (dados.ativo !== undefined) params.append('ativo', dados.ativo.toString());

    const response = await api.put(`${BASE_URL}/${id}?${params.toString()}`);
    return response.data;
  },

  /**
   * Listar franquias associadas a um plano
   */
  listarPorPlano: async (planoId: number): Promise<PlanoProdutoFranquia[]> => {
    const response = await api.get(`${BASE_URL}/plano/${planoId}`);
    return response.data;
  },

  /**
   * Listar associações por produto (planos onde este produto aparece com sua franquia)
   */
  listarPorProduto: async (produtoId: number): Promise<any[]> => {
    try {
      console.log(`🔍 [service] Buscando associações para produto ID: ${produtoId}`);
      const response = await api.get(`/planos-produtos-franquia/produto/${produtoId}`);
      
      // Log para debug
      console.log(`✅ [service] Encontradas ${response.data.length} associações`);
      
      return response.data;
    } catch (error) {
      console.error('❌ [service] Erro ao buscar associações do produto:', error);
      return [];
    }
  },

  /**
   * Buscar associação por plano e produto
   */
  buscarPorPlanoEProduto: async (planoId: number, produtoId: number): Promise<PlanoProdutoFranquia | null> => {
    try {
      const response = await api.get(`${BASE_URL}/plano/${planoId}/produto/${produtoId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
