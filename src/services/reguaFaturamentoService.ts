// src/services/reguaFaturamentoService.ts

import api from './api';

export interface ReguaFaturamento {
  id?: number;
  nome: string;
  descricao?: string;
  diaEmissao: number;
  periodo: 'PRIMEIRO' | 'SEGUNDO' | 'TERCEIRO';
  sequencia: number;
  tipoArquivo: 'CONSOLIDACAO' | 'PREVIA_CORRENTE' | 'PREVIA_ANTERIOR';
  ordemImportacao: number;
  ehPadrao: boolean;
  ativo: boolean;
  cor?: string;
  icone?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  criadoPor?: string;
  atualizadoPor?: string;
}

export interface AssociadoRegua {
  id: number;
  associadoId: number;
  associadoNome: string;
  associadoCodigoSpc: string;
  reguaId: number;
  reguaNome: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  motivoMigracao?: string;
  observacao?: string;
}

export const reguaFaturamentoService = {
  
  // ==================== RÉGUAS ====================
  async listar(params: {
    page: number;
    size: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ReguaFaturamento>> {
    const response = await api.get('/regua-faturamento', {
      params: {
        page: params.page,
        size: params.size,
        sort: params.sort || 'id',
        direction: params.direction || 'asc'
      }
    });
    return response.data;
  },

  async listarAtivos() {
    const response = await api.get('/regua-faturamento/ativos');
    return response.data;
  },

  async buscarPadrao() {
    const response = await api.get('/regua-faturamento/padrao');
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/regua-faturamento/${id}`);
    return response.data;
  },

  async criar(data: ReguaFaturamento) {
    const response = await api.post('/regua-faturamento', data);
    return response.data;
  },

  async atualizar(id: number, data: ReguaFaturamento) {
    const response = await api.put(`/regua-faturamento/${id}`, data);
    return response.data;
  },

  async excluir(id: number) {
    await api.delete(`/regua-faturamento/${id}`);
  },

  // ==================== ASSOCIADOS NA RÉGUA ====================
  
  /**
   * 🔥 MÉTODO CORRETO - Lista associados COM NOTA DE DÉBITO (consolidado)
   */
  async listarAssociadosPorRegua(reguaId: number, params?: {
    page?: number;
    size?: number;
    nome?: string;
    cnpjCpf?: string;
    status?: string;
  }) {
    // 🔥 USAR O ENDPOINT CONSOLIDADO (com nota de débito)
    const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/paginado`, {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        sort: 'nomeRazao',
        direction: 'asc',
        ...(params?.nome && { nome: params.nome }),
        ...(params?.cnpjCpf && { cnpjCpf: params.cnpjCpf }),
        ...(params?.status && params.status !== 'TODOS' && { status: params.status })
      }
    });
    return response.data;
  },

  /**
   * 🔥 MÉTODO CORRETO - Busca TODOS os IDs dos associados COM NOTA DE DÉBITO
   * Este é o método que o Modal deve usar para "Selecionar Todos"
   * 
   * AGORA RETORNA APENAS OS IDs COM NOTA (2443)
   */
  async listarTodosIdsConsolidados(reguaId: number): Promise<number[]> {
    console.log(`📥 Buscando TODOS os IDs CONSOLIDADOS (com nota) da régua ${reguaId}`);
    
    // 🔥 CHAMAR O ENDPOINT CORRETO - /associados-consolidado/todos-ids
    const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/todos-ids`);
    
    console.log(`✅ Retornados ${response.data?.length || 0} IDs consolidados`);
    return response.data || [];
  },

  /**
   * ⚠️ DEPRECIADO - Não usar! Retorna TODOS os associados (incluindo sem nota)
   * Use listarTodosIdsConsolidados() em vez deste
   */
  async listarTodosIds(reguaId: number): Promise<number[]> {
    console.warn('⚠️ listarTodosIds está DEPRECIADO! Use listarTodosIdsConsolidados');
    console.warn('   Este método retorna TODOS os associados, incluindo sem nota de débito');
    
    const response = await api.get(`/regua-faturamento/${reguaId}/associados/todos-ids`);
    return response.data || [];
  },

  /**
   * 🔥 NOVO MÉTODO - Busca APENAS a contagem (sem dados)
   */
  async contarAssociadosPorRegua(reguaId: number) {
    const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/paginado`, {
      params: {
        page: 0,
        size: 1
      }
    });
    return response.data.totalElements || 0;
  },

  async buscarReguaAtivaDoAssociado(associadoId: number) {
    const response = await api.get(`/regua-faturamento/associado/ativo/${associadoId}`);
    return response.data;
  },

  async adicionarAssociadoARegua(reguaId: number, associadoId: number, dataInicio: string) {
    const response = await api.post(`/regua-faturamento/${reguaId}/associados/${associadoId}`, null, {
      params: { dataInicio }
    });
    return response.data;
  },

  async migrarAssociado(associadoId: number, reguaDestinoId: number, dataMigracao: string, motivo?: string) {
    const response = await api.put(`/regua-faturamento/associados/${associadoId}/migrar/${reguaDestinoId}`, null, {
      params: { dataMigracao, motivo }
    });
    return response.data;
  },

  async removerAssociadoDaRegua(associadoId: number) {
    await api.delete(`/regua-faturamento/associados/${associadoId}`);
  }
};