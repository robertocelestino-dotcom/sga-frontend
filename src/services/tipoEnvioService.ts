// src/services/tipoEnvioService.ts

import api from './api';
import { TipoEnvio } from '../types/associadoProduto.types';

const BASE_URL = '/tipos-envio';

export const tipoEnvioService = {
  /**
   * Lista todos os tipos de envio ativos
   * GET /api/tipos-envio/ativos
   */
  listarAtivos: async (): Promise<TipoEnvio[]> => {
    const response = await api.get(`${BASE_URL}/ativos`);
    return response.data;
  },

  /**
   * Lista todos os tipos de envio com filtros
   * GET /api/tipos-envio?descricao=&ativo=
   */
  listarComFiltros: async (params?: { descricao?: string; ativo?: boolean }): Promise<any> => {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  },

  /**
   * Busca tipo de envio por ID
   * GET /api/tipos-envio/{id}
   */
  buscarPorId: async (id: number): Promise<TipoEnvio> => {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Cria um novo tipo de envio
   * POST /api/tipos-envio
   */
  criar: async (data: Omit<TipoEnvio, 'id'>): Promise<TipoEnvio> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  /**
   * Atualiza um tipo de envio
   * PUT /api/tipos-envio/{id}
   */
  atualizar: async (id: number, data: Partial<TipoEnvio>): Promise<TipoEnvio> => {
    const response = await api.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Altera status de um tipo de envio
   * PATCH /api/tipos-envio/{id}/status?ativo=
   */
  alterarStatus: async (id: number, ativo: boolean): Promise<TipoEnvio> => {
    const response = await api.patch(`${BASE_URL}/${id}/status?ativo=${ativo}`);
    return response.data;
  },

  /**
   * Exclui um tipo de envio
   * DELETE /api/tipos-envio/{id}
   */
  excluir: async (id: number): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  }
};