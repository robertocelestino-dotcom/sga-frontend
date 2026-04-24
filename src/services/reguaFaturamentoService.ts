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
        sort: params.sort || 'id',  // 🔥 Usar 'id' em vez de 'sequencia'
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
  async listarAssociadosPorRegua(reguaId: number) {
    const response = await api.get(`/regua-faturamento/${reguaId}/associados`);
    return response.data;
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
