// src/services/associadoProdutoService.ts

import api from './api';
import { AssociadoProduto, AssociadoProdutoResumo } from '../types/associadoProduto.types';

const BASE_URL = '/associados-produtos';

export const associadoProdutoService = {
  /**
   * Lista todos os produtos habilitados de um associado
   * GET /api/associados-produtos/associado/{associadoId}
   */
  listarPorAssociado: async (associadoId: number): Promise<AssociadoProdutoResumo[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}`);
    return response.data;
  },

  /**
   * Lista apenas produtos ATIVOS de um associado
   * GET /api/associados-produtos/associado/{associadoId}/ativos
   */
  listarAtivosPorAssociado: async (associadoId: number): Promise<AssociadoProdutoResumo[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/ativos`);
    return response.data;
  },

  /**
   * Lista produtos com paginação
   * GET /api/associados-produtos/associado/{associadoId}/paginado?page=0&size=10
   */
  listarPaginado: async (associadoId: number, page: number = 0, size: number = 10): Promise<any> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/paginado`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Busca um registro específico por ID
   * GET /api/associados-produtos/{id}
   */
  buscarPorId: async (id: number): Promise<AssociadoProduto> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Habilita um produto para um associado
   * POST /api/associados-produtos
   */
  criar: async (data: Omit<AssociadoProduto, 'id'>, usuario?: string): Promise<AssociadoProduto> => {
    const response = await api.post(BASE_URL, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Habilita múltiplos produtos em lote
   * POST /api/associados-produtos/lote
   */
  criarEmLote: async (data: Omit<AssociadoProduto, 'id'>[], usuario?: string): Promise<AssociadoProduto[]> => {
    const response = await api.post(`${BASE_URL}/lote`, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Atualiza configuração de um produto habilitado
   * PUT /api/associados-produtos/{id}
   */
  atualizar: async (id: number, data: Partial<AssociadoProduto>, usuario?: string): Promise<AssociadoProduto> => {
    const response = await api.put(`${BASE_URL}/${id}`, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Remove um produto habilitado
   * DELETE /api/associados-produtos/{id}
   */
  excluir: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Remove todos os produtos de um associado
   * DELETE /api/associados-produtos/associado/{associadoId}
   */
  excluirPorAssociado: async (associadoId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/associado/${associadoId}`);
  },

  /**
   * Altera status de um produto
   * PATCH /api/associados-produtos/{id}/status?status=
   */
  alterarStatus: async (id: number, status: 'A' | 'I', usuario?: string): Promise<AssociadoProduto> => {
    const response = await api.patch(`${BASE_URL}/${id}/status?status=${status}`, null, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  }
};