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
  permiteMigracao?: boolean;
  reguaDestinoMigracaoId?: number;
  tipoProcessamento?: string;
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

/**
 * 🔥 SERVICE DE RÉGUAS DE FATURAMENTO
 * Exportado como const para ser importado como { reguaFaturamentoService }
 */
export const reguaFaturamentoService = {
  
  // ============================================================
  // RÉGUAS
  // ============================================================

  /**
   * 🔥 LISTA RÉGUAS COM PAGINAÇÃO (COM FALLBACK)
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
      console.warn('⚠️ Erro no listar com paginação, tentando fallback:', error);
      
      try {
        const ativas = await this.listarAtivos();
        return {
          content: ativas,
          totalPages: 1,
          totalElements: ativas.length,
          size: ativas.length,
          number: 0,
          first: true,
          last: true,
          empty: ativas.length === 0
        };
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
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
    }
  },

  /**
   * 🔥 LISTA RÉGUAS - ALIAS PARA listar (COMPATIBILIDADE)
   * Este método é chamado pela ConferenciaFaturamento.tsx
   */
  async listarReguas(page: number = 0, size: number = 100): Promise<PaginatedResponse<ReguaFaturamento>> {
    return this.listar({ page, size });
  },

  /**
   * 🔥 LISTA TODAS AS RÉGUAS ATIVAS
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
   * 🔥 LISTA RÉGUAS ATIVAS - ALIAS PARA listarAtivos (COMPATIBILIDADE)
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
  
  /**
   * 🔥 Lista associados COM NOTA DE DÉBITO (consolidado)
   */
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

  /**
   * 🔥 Busca TODOS os IDs dos associados COM NOTA DE DÉBITO
   */
  async listarTodosIdsConsolidados(reguaId: number): Promise<number[]> {
    console.log(`📥 Buscando TODOS os IDs CONSOLIDADOS (com nota) da régua ${reguaId}`);
    
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/todos-ids`);
      const ids = response.data || [];
      console.log(`✅ Retornados ${ids.length} IDs consolidados`);
      return ids;
    } catch (error) {
      console.error(`❌ Erro ao buscar IDs consolidados da régua ${reguaId}:`, error);
      return [];
    }
  },

  /**
   * ⚠️ DEPRECIADO - Não usar! Retorna TODOS os associados (incluindo sem nota)
   */
  async listarTodosIds(reguaId: number): Promise<number[]> {
    console.warn('⚠️ listarTodosIds está DEPRECIADO! Use listarTodosIdsConsolidados');
    
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados/todos-ids`);
      return response.data || [];
    } catch (error) {
      console.error(`❌ Erro ao buscar todos os IDs da régua ${reguaId}:`, error);
      return [];
    }
  },

  /**
   * 🔥 Conta associados com nota da régua
   */
  async contarAssociadosPorRegua(reguaId: number): Promise<number> {
    try {
      const response = await api.get(`/regua-faturamento/${reguaId}/associados-consolidado/paginado`, {
        params: {
          page: 0,
          size: 1
        }
      });
      return response.data?.totalElements || 0;
    } catch (error) {
      console.error(`❌ Erro ao contar associados da régua ${reguaId}:`, error);
      return 0;
    }
  },

  /**
   * Busca a régua ativa de um associado
   */
  async buscarReguaAtivaDoAssociado(associadoId: number): Promise<any> {
    try {
      const response = await api.get(`/regua-faturamento/associado/ativo/${associadoId}`);
      return response.data || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar régua ativa do associado ${associadoId}:`, error);
      return null;
    }
  },

  /**
   * Adiciona um associado a uma régua
   */
  async adicionarAssociadoARegua(reguaId: number, associadoId: number, dataInicio: string): Promise<any> {
    const response = await api.post(`/regua-faturamento/${reguaId}/associados/${associadoId}`, null, {
      params: { dataInicio }
    });
    return response.data;
  },

  /**
   * Migra um associado para outra régua (LEGADO - USAR O NOVO SERVICE)
   * @deprecated Use migracaoReguaService.migrarAssociado()
   */
  async migrarAssociado(associadoId: number, reguaDestinoId: number, dataMigracao: string, motivo?: string): Promise<any> {
    console.warn('⚠️ migrarAssociado está DEPRECIADO! Use migracaoReguaService.migrarAssociado()');
    
    const response = await api.put(`/regua-faturamento/associados/${associadoId}/migrar/${reguaDestinoId}`, null, {
      params: { dataMigracao, motivo }
    });
    return response.data;
  },

  /**
   * Remove um associado da régua atual
   */
  async removerAssociadoDaRegua(associadoId: number): Promise<void> {
    await api.delete(`/regua-faturamento/associados/${associadoId}`);
  },

  // ============================================================
  // MÉTODOS AUXILIARES
  // ============================================================

  /**
   * 🔥 Obtém a lista de réguas para dropdown
   */
  async getReguasParaDropdown(): Promise<{ value: number; label: string }[]> {
    try {
      const reguas = await this.listarAtivos();
      return reguas.map((r: ReguaFaturamento) => ({
        value: r.id!,
        label: r.nome
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar réguas para dropdown:', error);
      return [];
    }
  },

  /**
   * 🔥 Obtém o nome da régua pelo ID
   */
  async getNomeRegua(id: number): Promise<string> {
    try {
      const regua = await this.buscarPorId(id);
      return regua?.nome || 'Régua não encontrada';
    } catch (error) {
      return 'Régua não encontrada';
    }
  },

  /**
   * 🔥 Verifica se uma régua é extemporânea (IDs 7 e 8)
   */
  isExtemporanea(regua: ReguaFaturamento): boolean {
    return regua.id === 7 || regua.id === 8;
  },

  /**
   * 🔥 Verifica se uma régua permite migração
   */
  permiteMigracao(regua: ReguaFaturamento): boolean {
    return regua.permiteMigracao !== false;
  }
};

// ============================================================
// EXPORTAÇÃO DEFAULT
// ============================================================

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