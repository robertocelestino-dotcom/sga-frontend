// src/services/faturamentoService.ts

import api from './api';

export interface Fatura {
  id: number;
  numeroFatura: string;
  numeroNotaDebito: string;
  associadoId: number;
  associadoNome: string;
  cnpjCpf: string;
  dataEmissao: string;
  dataVencimento: string;
  valorTotal: number;
  status: string;
  processadoRm: boolean;
  mesReferencia: number;
  anoReferencia: number;
  observacao?: string;
  criadoEm: string;
  itens?: FaturaItem[];
}

export interface FaturaItem {
  id: number;
  descricao: string;
  codigoProduto: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tipoLancamento: string;
}

export interface ProcessamentoRequest {
  associadosIds: number[];
  mes: number;
  ano: number;
  extemporaneo?: boolean;
  integrarRm?: boolean;
  gerarNotas?: boolean;
  simular?: boolean;
  reguaId?: number;
  processarCancelamentos?: boolean;
  usuario?: string;
}

export interface ResultadoProcessamento {
  totalAssociados: number;
  associadosProcessados: number;
  associadosComErro: number;
  totalNotasGeradas: number;
  valorTotalDebito: number;
  dataProcessamento: string;
  detalhes?: any[];
  erros?: string[];
}

class FaturamentoService {
  
  private baseUrl = '/faturamento';

  /**
   * Processa faturamento para os associados selecionados
   */
  async processar(request: ProcessamentoRequest): Promise<ResultadoProcessamento> {
    const response = await api.post(`${this.baseUrl}/processar`, request);
    return response.data;
  }

  /**
   * Simula faturamento (pré-visualização)
   */
  async simular(request: ProcessamentoRequest): Promise<ResultadoProcessamento> {
    const response = await api.post(`${this.baseUrl}/simular`, { ...request, simular: true });
    return response.data;
  }

  /**
   * Lista todas as faturas com paginação
   */
  async listarFaturas(page: number = 0, size: number = 15, filtros?: {
    numeroFatura?: string;
    associadoNome?: string;
    status?: string;
    mes?: number;
    ano?: number;
  }): Promise<{ content: Fatura[]; totalPages: number; totalElements: number }> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    params.append('sort', 'dataEmissao,desc');
    
    if (filtros?.numeroFatura) params.append('numeroFatura', filtros.numeroFatura);
    if (filtros?.associadoNome) params.append('associadoNome', filtros.associadoNome);
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.mes) params.append('mes', filtros.mes.toString());
    if (filtros?.ano) params.append('ano', filtros.ano.toString());
    
    const response = await api.get(`${this.baseUrl}/faturas?${params}`);
    return response.data;
  }

  /**
   * Busca uma fatura por ID
   */
  async buscarFatura(id: number): Promise<Fatura> {
    const response = await api.get(`${this.baseUrl}/faturas/${id}`);
    return response.data;
  }

  /**
   * Lista faturas por associado
   */
  async listarFaturasPorAssociado(associadoId: number, page: number = 0, size: number = 15): Promise<{ content: Fatura[]; totalPages: number; totalElements: number }> {
    const response = await api.get(`${this.baseUrl}/faturas/associado/${associadoId}?page=${page}&size=${size}`);
    return response.data;
  }

  /**
   * Lista faturas pendentes de integração com RM
   */
  async listarFaturasPendentesRM(): Promise<Fatura[]> {
    const response = await api.get(`${this.baseUrl}/faturas/pendentes-rm`);
    return response.data;
  }

  /**
   * Marca fatura como processada no RM
   */
  async marcarComoProcessadaRm(id: number): Promise<Fatura> {
    const response = await api.post(`${this.baseUrl}/faturas/${id}/marcar-processada-rm`);
    return response.data;
  }

  /**
   * Atualiza status da fatura
   */
  async atualizarStatus(id: number, status: string): Promise<Fatura> {
    const response = await api.put(`${this.baseUrl}/faturas/${id}/status`, { status });
    return response.data;
  }

  /**
   * Exporta fatura como PDF
   */
  async exportarPdf(id: number): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/faturas/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new FaturamentoService();