// src/services/associadoDefFaturamentoService.ts

import api from './api';
import { AssociadoDefFaturamento, AssociadoDefFaturamentoResumo } from '../types/associadoDefFaturamento.types';

const BASE_URL = '/associados-def-faturamento';

export const associadoDefFaturamentoService = {
  /**
   * Lista todas as definições de faturamento de um associado
   * GET /api/associados-def-faturamento/associado/{associadoId}
   */
  listarPorAssociado: async (associadoId: number): Promise<AssociadoDefFaturamentoResumo[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}`);
    return response.data;
  },

  /**
   * Lista definições de faturamento com paginação
   * GET /api/associados-def-faturamento/associado/{associadoId}/paginado
   */
  listarPaginado: async (associadoId: number, page: number = 0, size: number = 10): Promise<any> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/paginado`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Lista dias de emissão disponíveis para um associado
   * GET /api/associados-def-faturamento/associado/{associadoId}/dias
   */
  listarDiasEmissao: async (associadoId: number): Promise<number[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/dias`);
    return response.data;
  },

  /**
   * Lista definições por dia de emissão
   * GET /api/associados-def-faturamento/associado/{associadoId}/dia/{diaEmissao}
   */
  listarPorDiaEmissao: async (associadoId: number, diaEmissao: number): Promise<AssociadoDefFaturamentoResumo[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/dia/${diaEmissao}`);
    return response.data;
  },

  /**
   * Busca definição por ID
   * GET /api/associados-def-faturamento/{id}
   */
  buscarPorId: async (id: number): Promise<AssociadoDefFaturamento> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Cria nova definição de faturamento
   * POST /api/associados-def-faturamento
   */
  criar: async (data: Omit<AssociadoDefFaturamento, 'id'>, usuario?: string): Promise<AssociadoDefFaturamento> => {
    const response = await api.post(BASE_URL, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Cria múltiplas definições em lote
   * POST /api/associados-def-faturamento/lote
   */
  criarEmLote: async (data: Omit<AssociadoDefFaturamento, 'id'>[], usuario?: string): Promise<AssociadoDefFaturamento[]> => {
    const response = await api.post(`${BASE_URL}/lote`, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Atualiza definição de faturamento
   * PUT /api/associados-def-faturamento/{id}
   */
  atualizar: async (id: number, data: Partial<AssociadoDefFaturamento>, usuario?: string): Promise<AssociadoDefFaturamento> => {
    const response = await api.put(`${BASE_URL}/${id}`, data, {
      headers: usuario ? { 'X-Usuario': usuario } : {}
    });
    return response.data;
  },

  /**
   * Exclui definição de faturamento
   * DELETE /api/associados-def-faturamento/{id}
   */
  excluir: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Exclui todas as definições de um associado
   * DELETE /api/associados-def-faturamento/associado/{associadoId}
   */
  excluirPorAssociado: async (associadoId: number): Promise<void> => {
    await api.delete(`${BASE_URL}/associado/${associadoId}`);
  }
  
};