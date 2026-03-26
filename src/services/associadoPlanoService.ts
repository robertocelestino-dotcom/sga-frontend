import api from './api';
import { AssociadoPlano } from '../types/franquia.types';

const BASE_URL = '/associados-planos';

export const associadoPlanoService = {
  /**
   * Associar um plano a um associado
   */
  associarPlano: async (
    associadoId: number,
    planoId: number,
    dataAdesao?: string,
    observacao?: string
  ): Promise<AssociadoPlano> => {
    const params = new URLSearchParams();
    params.append('associadoId', associadoId.toString());
    params.append('planoId', planoId.toString());
    if (dataAdesao) params.append('dataAdesao', dataAdesao);
    if (observacao) params.append('observacao', observacao);

    const response = await api.post(`${BASE_URL}/associar?${params.toString()}`);
    return response.data;
  },

  /**
   * Cancelar um plano do associado
   */
  cancelarPlano: async (
    id: number,
    dataCancelamento?: string,
    motivo?: string
  ): Promise<AssociadoPlano> => {
    const params = new URLSearchParams();
    if (dataCancelamento) params.append('dataCancelamento', dataCancelamento);
    if (motivo) params.append('motivo', motivo);

    const response = await api.post(`${BASE_URL}/${id}/cancelar?${params.toString()}`);
    return response.data;
  },

  /**
   * Listar planos de um associado
   */
  listarPlanosDoAssociado: async (associadoId: number): Promise<AssociadoPlano[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}`);
    return response.data;
  },

  /**
   * Listar apenas planos ativos de um associado
   */
  listarPlanosAtivos: async (associadoId: number): Promise<AssociadoPlano[]> => {
    const response = await api.get(`${BASE_URL}/associado/${associadoId}/ativos`);
    return response.data;
  }
};
