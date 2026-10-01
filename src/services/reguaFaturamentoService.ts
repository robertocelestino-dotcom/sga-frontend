// src/services/reguaFaturamentoService.ts

import api from './api';

// ============================================================
// INTERFACES
// ============================================================

export interface ReguaFaturamento {
  id?: number;
  nome: string;
  descricao?: string;
  diaEmissao: number;
  diaVencimento?: number;
  periodo: 'PRIMEIRO' | 'SEGUNDO' | 'TERCEIRO';
  sequencia: number;
  tipoArquivo: 'CONSOLIDACAO' | 'PREVIA_CORRENTE' | 'PREVIA_ANTERIOR';
  ordemImportacao: number;
  ehPadrao: boolean;
  ativo: boolean;
  cor?: string;
  icone?: string;
  // 🔥 NOVOS CAMPOS
  permiteMigracao?: boolean;
  reguaDestinoMigracaoId?: number;
  tipoProcessamento?: string;
  aplicarFranquia?: boolean;
  aplicarFaturamentoMinimo?: boolean;
  aplicarCancelamentos?: boolean;
  // Auditoria
  criadoEm?: string;
  atualizadoEm?: string;
  criadoPor?: string;
  atualizadoPor?: string;
  // Tipos de arquivo
  tiposArquivo?: TipoArquivoRegua[];
  // 🔥 Contagem (vem do endpoint /com-contagem)
  totalAssociados?: number;
}

export interface TipoArquivoRegua {
  id?: number;
  tipo: string;
  ordem: number;
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

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ============================================================
// SERVICE
// ============================================================

export const reguaFaturamentoService = {
  
  // ============================================================
  // RÉGUAS
  // ============================================================

  /**
   * 🔥 LISTA RÉGUAS COM PAGINAÇÃO
   */
  async listar(params: {
    page: number;
    size: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<ReguaFaturamento>> {
    try {
      console.log('📡 Listando réguas com paginação:', params);
      
      const response = await api.get('/regua-faturamento', {
        params: {
          page: params.page,
          size: params.size,
          sort: params.sort || 'id',
          direction: params.direction || 'asc'
        }
      });
      
      if (Array.isArray(response.data)) {
        return {
          content: response.data,
          totalPages: 1,
          totalElements: response.data.length,
          size: response.data.length,
          number: 0,
          first: true,
          last: true,
          empty: response.data.length === 0
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar réguas:', error);
      return {
        content: [],
        totalPages: 0,
        totalElements: 0,
        size: 0,
        number: 0,
        first: true,
        last: true,
        empty: true
      };
    }
  },

  /**
   * 🔥 NOVO: LISTA RÉGUAS COM CONTAGEM DE ASSOCIADOS
   * Usa o endpoint /com-contagem
   */
  async listarComContagem(): Promise<ReguaFaturamento[]> {
    try {
      console.log('📡 Listando réguas com contagem de associados');
      const response = await api.get('/regua-faturamento/com-contagem');
      const reguas = response.data || [];
      console.log(`✅ ${reguas.length} réguas carregadas com contagem`);
      return reguas;
    } catch (error) {
      console.error('❌ Erro ao listar réguas com contagem:', error);
      // Fallback: listar ativas sem contagem
      try {
        return await this.listarAtivos();
      } catch (fallbackError) {
        return [];
      }
    }
  },

  /**
   * 🔥 LISTA RÉGUAS ATIVAS
   */
  async listarAtivos(): Promise<ReguaFaturamento[]> {
    try {
      const response = await api.get('/regua-faturamento/ativos');
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar réguas ativas:', error);
      try {
        const response = await api.get('/regua-faturamento/ativas');
        return response.data || [];
      } catch (fallbackError) {
        console.error('❌ Fallback /ativas também falhou:', fallbackError);
        return [];
      }
    }
  },

  /**
   * Alias para listarAtivos
   */
  async listarReguasAtivas(): Promise<ReguaFaturamento[]> {
    return this.listarAtivos();
  },

  /**
   * Busca a régua padrão
   */
  async buscarPadrao(): Promise<ReguaFaturamento | null> {
    try {
      const response = await api.get('/regua-faturamento/padrao');
      return response.data || null;
    } catch (error) {
      console.error('❌ Erro ao buscar régua padrão:', error);
      return null;
    }
  },

  /**
   * Busca uma régua por ID
   */
  async buscarPorId(id: number): Promise<ReguaFaturamento | null> {
    try {
      const response = await api.get(`/regua-faturamento/${id}`);
      return response.data || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar régua ${id}:`, error);
      return null;
    }
  },

  /**
   * Cria uma nova régua
   */
  async criar(data: ReguaFaturamento): Promise<ReguaFaturamento> {
    const response = await api.post('/regua-faturamento', data);
    return response.data;
  },

  /**
   * Atualiza uma régua
   */
  async atualizar(id: number, data: ReguaFaturamento): Promise<ReguaFaturamento> {
    const response = await api.put(`/regua-faturamento/${id}`, data);
    return response.data;
  },

  /**
   * Exclui uma régua
   */
  async excluir(id: number): Promise<void> {
    await api.delete(`/regua-faturamento/${id}`);
  },

  // ============================================================
  // ASSOCIADOS NA RÉGUA
  // ============================================================
  
  async listarAssociadosPorRegua(reguaId: number, params?: {
    page?: number;
    size?: number;
    nome?: string;
    cnpjCpf?: string;
    status?: string;
  }) {
    try {
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
    } catch (error) {
      console.error(`❌ Erro ao listar associados da régua ${reguaId}:`, error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 0,
        number: 0
      };
    }
  },

  async listarTodosIdsConsolidados(reguaId: number): Promise<number[]> {
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/todos-ids`);
      return response.data || [];
    } catch (error) {
      console.error(`❌ Erro ao buscar IDs consolidados da régua ${reguaId}:`, error);
      return [];
    }
  },

  async listarTodosIds(reguaId: number): Promise<number[]> {
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados/todos-ids`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  },

  async contarAssociadosPorRegua(reguaId: number): Promise<number> {
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/paginado`, {
        params: { page: 0, size: 1 }
      });
      return response.data?.totalElements || 0;
    } catch (error) {
      return 0;
    }
  },

  async buscarReguaAtivaDoAssociado(associadoId: number): Promise<any> {
    try {
      const response = await api.get(`/regua-faturamento/associado/ativo/${associadoId}`);
      return response.data || null;
    } catch (error) {
      return null;
    }
  },

  async adicionarAssociadoARegua(reguaId: number, associadoId: number, dataInicio: string): Promise<any> {
    const response = await api.post(`/regua-faturamento/${reguaId}/associados/${associadoId}`, null, {
      params: { dataInicio }
    });
    return response.data;
  },

  async migrarAssociado(associadoId: number, reguaDestinoId: number, dataMigracao: string, motivo?: string): Promise<any> {
    const response = await api.put(`/regua-faturamento/associados/${associadoId}/migrar/${reguaDestinoId}`, null, {
      params: { dataMigracao, motivo }
    });
    return response.data;
  },

  async removerAssociadoDaRegua(associadoId: number): Promise<void> {
    await api.delete(`/regua-faturamento/associados/${associadoId}`);
  },

  // ============================================================
  // MÉTODOS AUXILIARES
  // ============================================================

  async getReguasParaDropdown(): Promise<{ value: number; label: string }[]> {
    try {
      const reguas = await this.listarAtivos();
      return reguas.map((r: ReguaFaturamento) => ({
        value: r.id!,
        label: r.nome
      }));
    } catch (error) {
      return [];
    }
  },

  async getNomeRegua(id: number): Promise<string> {
    try {
      const regua = await this.buscarPorId(id);
      return regua?.nome || 'Régua não encontrada';
    } catch (error) {
      return 'Régua não encontrada';
    }
  },

  isExtemporanea(regua: ReguaFaturamento): boolean {
    return regua.id === 7 || regua.id === 8;
  },

  permiteMigracao(regua: ReguaFaturamento): boolean {
    return regua.permiteMigracao !== false;
  }
};

export default reguaFaturamentoService;

// ============================================================
// TIPOS AUXILIARES
// ============================================================

export const PERIODOS = {
  PRIMEIRO: 'PRIMEIRO',
  SEGUNDO: 'SEGUNDO',
  TERCEIRO: 'TERCEIRO'
} as const;

export const TIPOS_ARQUIVO = {
  CONSOLIDACAO: 'CONSOLIDACAO',
  PREVIA_CORRENTE: 'PREVIA_CORRENTE',
  PREVIA_ANTERIOR: 'PREVIA_ANTERIOR'
} as const;

export const getPeriodoLabel = (periodo: string): string => {
  const labels: Record<string, string> = {
    'PRIMEIRO': '1º Período',
    'SEGUNDO': '2º Período',
    'TERCEIRO': '3º Período'
  };
  return labels[periodo] || periodo;
};

export const getTipoArquivoLabel = (tipo: string): string => {
  const labels: Record<string, string> = {
    'CONSOLIDACAO': 'Consolidação',
    'PREVIA_CORRENTE': 'Prévia Corrente',
    'PREVIA_ANTERIOR': 'Prévia Anterior'
  };
  return labels[tipo] || tipo;
};