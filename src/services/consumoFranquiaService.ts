import api from './api';
import { ConsumoFranquia, RegistrarConsumoDTO } from '../types/franquia.types';

const BASE_URL = '/consumo-franquia';

export const consumoFranquiaService = {
  /**
   * Registrar consumo de franquia
   */
  registrarConsumo: async (
    associadoId: number,
    produtoId: number,
    quantidade: number,
    data?: string
  ): Promise<ConsumoFranquia> => {
    const params = new URLSearchParams();
    params.append('associadoId', associadoId.toString());
    params.append('produtoId', produtoId.toString());
    params.append('quantidade', quantidade.toString());
    if (data) params.append('data', data);

    const response = await api.post(`${BASE_URL}/registrar?${params.toString()}`);
    return response.data;
  },

  /**
   * Registrar consumo em lote (otimizado)
   */
  registrarConsumoEmLote: async (
    associadoId: number,
    produtoId: number,
    quantidade: number,
    data?: string
  ): Promise<ConsumoFranquia> => {
    const params = new URLSearchParams();
    params.append('associadoId', associadoId.toString());
    params.append('produtoId', produtoId.toString());
    params.append('quantidade', quantidade.toString());
    if (data) params.append('data', data);

    const response = await api.post(`${BASE_URL}/registrar-lote?${params.toString()}`);
    return response.data;
  },

  /**
   * Buscar consumo de um produto em um mês específico
   */
  buscarConsumo: async (
    associadoId: number,
    produtoId: number,
    ano: number,
    mes: number
  ): Promise<ConsumoFranquia> => {
    const response = await api.get(`${BASE_URL}/consumo`, {
      params: { associadoId, produtoId, ano, mes }
    });
    return response.data;
  },

  /**
   * Listar todos os consumos do associado em um mês
   */
  listarConsumosDoMes: async (
    associadoId: number,
    ano: number,
    mes: number
  ): Promise<ConsumoFranquia[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/mes`, {
      params: { ano, mes }
    });
    return response.data;
  },

  /**
   * Listar consumos com excedente no mês
   */
  listarConsumosComExcedente: async (
    associadoId: number,
    ano: number,
    mes: number
  ): Promise<ConsumoFranquia[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/excedentes`, {
      params: { ano, mes }
    });
    return response.data;
  }
};
