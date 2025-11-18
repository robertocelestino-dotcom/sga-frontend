// src/services/api.ts
import axios from 'axios';

// Configuração base da API
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento global de erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Erro da API:', error);
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Erro de conexão. Verifique se o servidor está online.');
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============ INTERFACES PARA AUTENTICAÇÃO ============
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

// ============ INTERFACES PARA IMPORTACAO SPC ============
export interface ImportacaoSPC {
  id: number;
  nomeArquivo: string;
  dataImportacao: string;
  status: 'PROCESSADO' | 'ERRO' | 'PENDENTE';
  quantidadeNotas?: number;
  quantidadeItens?: number;
  valorTotal?: number;
  headers?: any[];
  parametros?: any[];
  notasDebito?: NotaDebitoSPC[];
  traillers?: any[];
}

export interface NotaDebitoSPC {
  id: number;
  tipoRegistro: string;
  dataVencimento: string;
  numeroFatura: string;
  numeroNotaDebito: string;
  valorNota: number;
  codigoSocio: string;
  nomeAssociado: string;
  enderecoCobranca: string;
  bairroCobranca: string;
  cepCobranca: string;
  cidadeCobranca: string;
  ufCobranca: string;
  telefoneCobranca: string;
  tipoPessoa: string;
  cnpjCic: string;
  inscricaoEstadual: string;
  itens: ItemSPC[];
}

export interface ItemSPC {
  id: number;
  tipoRegistro: string;
  quantidadeServicos: number;
  descricaoServico: string;
  valorUnitario: number;
  valorTotal: number;
  creditoDebito: string;
  tipoProduto: string;
  codigoProdutoComercial: string;
  codigoContabil: string;
  numeroNotaDebito: string;
  sequenciaNotaDebito: string;
  codigoProduto: string;
  codigoMeioAcesso: string;
  tipoProdutoDetalhe: string;
  incideISS: string;
}

// ============ INTERFACES PARA VERIFICAÇÃO ============
export interface VerificacaoResultado {
  categoria: string;
  quantidadeArquivo: number;
  quantidadeBanco: number;
  diferenca: number;
  valorArquivo: number;
  valorBanco: number;
  diferencaValor: number;
  possuiDivergencia: boolean;
}

export interface RelatorioVerificacao {
  importacaoId: number;
  nomeArquivo: string;
  dataImportacao: string;
  status: string;
  possuiDivergencias: boolean;
  totalDivergencias: number;
  resultados: VerificacaoResultado[];
}

export interface DivergenciasDetalhadas {
  associadosNovos: string[];
  associadosFaltantes: string[];
  totalAssociadosNovos: number;
  totalAssociadosFaltantes: number;
}

// ============ INTERFACES PARA UPLOAD ============
export interface UploadResponse {
  mensagem: string;
  importacao: ImportacaoSPC;
  nomeArquivo: string;
  tamanho: number;
  quantidadeItens?: number;
  quantidadeItensProcessados?: number;
}

export interface ErrorResponse {
  erro: string;
  timestamp?: string;
}

// ============ SERVIÇOS DE AUTENTICAÇÃO ============
export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔐 Enviando login para backend:', credentials);
    
    const response = await api.post('/auth/login', {
      username: credentials.username,
      password: credentials.password
    });

    console.log('✅ Resposta do login:', response.data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    console.log('✅ Logout realizado');
  },

  async getProfile(): Promise<User> {
    // Mock - ajuste conforme sua API real
    const response = await api.get('/auth/profile');
    return response.data;
  },

  async validateToken(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await api.get('/auth/validate');
      return response.data;
    } catch (error) {
      return { valid: false };
    }
  }
};

// ============ SERVIÇOS DE ASSOCIADOS ============
export const associateAPI = {
  async getAll(): Promise<any[]> {
    const response = await api.get('/associates');
    return response.data;
  },

  async getById(id: string): Promise<any> {
    const response = await api.get(`/associates/${id}`);
    return response.data;
  },

  async getByBillingType(billingType: string): Promise<any[]> {
    const response = await api.get(`/associates?billingType=${billingType}`);
    return response.data;
  },

  async create(data: any): Promise<any> {
    const response = await api.post('/associates', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<any> {
    const response = await api.put(`/associates/${id}`, data);
    return response.data;
  },

  async updateBillingType(id: string, billingType: string): Promise<any> {
    const response = await api.patch(`/associates/${id}/billing-type`, { billingType });
    return response.data;
  }
};

// ============ SERVIÇOS DE FATURAMENTO ============
export const billingAPI = {
  async processMonthly(month: number, year: number): Promise<any> {
    const response = await api.post('/billing/process-monthly', { month, year });
    return response.data;
  },

  async processExtemporaneous(associateId: string, data: any): Promise<any> {
    const response = await api.post(`/billing/process-extemporaneous/${associateId}`, data);
    return response.data;
  },

  async exportTOTVS(billingId: string): Promise<Blob> {
    const response = await api.get(`/billing/export-totvs/${billingId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async getInvoices(filters?: any): Promise<any[]> {
    const response = await api.get('/billing/invoices', { params: filters });
    return response.data;
  }
};

// ============ SERVIÇOS DE IMPORTACAO SPC ============
export const importacaoSPCService = {
  async uploadArquivo(arquivo: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const response = await api.post('/importacao-spc/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          console.log(`📤 Progresso do upload: ${progress.toFixed(2)}%`);
          
          if (typeof window !== 'undefined') {
            const progressEvent = new CustomEvent('uploadProgress', {
              detail: { progress }
            });
            window.dispatchEvent(progressEvent);
          }
        }
      },
    });

    console.log('✅ Upload concluído com sucesso:', response.data);
    return response.data;
  },

  async listarImportacoes(): Promise<ImportacaoSPC[]> {
    const response = await api.get('/importacao-spc');
    console.log('📋 Importações carregadas:', response.data.length);
    return response.data;
  },

  async buscarImportacao(id: number): Promise<ImportacaoSPC> {
    const response = await api.get(`/importacao-spc/${id}`);
    return response.data;
  },

  async listarItensImportacao(importacaoId: number): Promise<{ itens: ItemSPC[] }> {
    const response = await api.get(`/importacao-spc/${importacaoId}/itens`);
    return response.data;
  },

  async excluirImportacao(id: number): Promise<void> {
    await api.delete(`/importacao-spc/${id}`);
    console.log('🗑️ Importação excluída:', id);
  },
};

// ============ SERVIÇOS DE VERIFICAÇÃO ============
export const verificacaoService = {
  async verificarImportacao(importacaoId: number): Promise<RelatorioVerificacao> {
    const response = await api.get(`/importacao-spc/${importacaoId}/verificar`);
    console.log('🔍 Resultado da verificação:', response.data);
    return response.data;
  },

  async obterRelatorio(importacaoId: number): Promise<RelatorioVerificacao> {
    const response = await api.get(`/importacao-spc/${importacaoId}/relatorio`);
    return response.data;
  },

  async obterDivergenciasDetalhadas(importacaoId: number): Promise<DivergenciasDetalhadas> {
    const response = await api.get(`/importacao-spc/${importacaoId}/divergencias-detalhadas`);
    console.log('📊 Divergências detalhadas:', response.data);
    return response.data;
  },

  async healthCheck(): Promise<{ status: string; service: string; timestamp: string }> {
    const response = await api.get('/importacao-spc/health');
    return response.data;
  },
};

// ============ SERVIÇOS UTILITÁRIOS ============
export const utilsService = {
  async downloadArquivoProcessado(importacaoId: number, tipo: 'relatorio' | 'dados' = 'relatorio'): Promise<Blob> {
    const response = await api.get(`/importacao-spc/${importacaoId}/download/${tipo}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async obterEstatisticas(): Promise<any> {
    const response = await api.get('/importacao-spc/estatisticas');
    return response.data;
  },
};

// ============ HANDLERS DE ERRO ============
export const errorHandler = {
  getErrorMessage(error: any): string {
    if (error.response?.data?.erro) {
      return error.response.data.erro;
    }
    
    if (error.code === 'ERR_NETWORK') {
      return 'Erro de conexão. Verifique se o servidor está online.';
    }
    
    if (error.response?.status === 413) {
      return 'Arquivo muito grande. Tamanho máximo: 50MB.';
    }
    
    if (error.response?.status === 415) {
      return 'Tipo de arquivo não suportado. Apenas arquivos .txt são permitidos.';
    }
    
    if (error.response?.status === 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    if (error.response?.status === 404) {
      return 'Recurso não encontrado.';
    }
    
    if (error.response?.status === 400) {
      return 'Requisição inválida. Verifique os dados enviados.';
    }
    
    return error.message || 'Erro desconhecido. Tente novamente.';
  },

  isNetworkError(error: any): boolean {
    return error.code === 'ERR_NETWORK';
  },

  isTimeoutError(error: any): boolean {
    return error.code === 'ECONNABORTED';
  },
};

// ============ HOOK PERSONALIZADO PARA IMPORTACAO SPC ============
export const useImportacaoSPC = () => {
  const uploadArquivo = async (arquivo: File): Promise<UploadResponse> => {
    try {
      if (!arquivo) {
        throw new Error('Nenhum arquivo selecionado');
      }

      if (!arquivo.name.toLowerCase().endsWith('.txt')) {
        throw new Error('Apenas arquivos .txt são permitidos');
      }

      if (arquivo.size > 50 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
      }

      if (arquivo.size === 0) {
        throw new Error('Arquivo vazio');
      }

      return await importacaoSPCService.uploadArquivo(arquivo);
    } catch (error: any) {
      const errorMessage = errorHandler.getErrorMessage(error);
      console.error('❌ Erro no upload:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const verificarImportacao = async (importacaoId: number): Promise<RelatorioVerificacao> => {
    try {
      return await verificacaoService.verificarImportacao(importacaoId);
    } catch (error: any) {
      const errorMessage = errorHandler.getErrorMessage(error);
      console.error('❌ Erro na verificação:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const listarImportacoes = async (): Promise<ImportacaoSPC[]> => {
    try {
      return await importacaoSPCService.listarImportacoes();
    } catch (error: any) {
      const errorMessage = errorHandler.getErrorMessage(error);
      console.error('❌ Erro ao listar importações:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const obterDivergenciasDetalhadas = async (importacaoId: number): Promise<DivergenciasDetalhadas> => {
    try {
      return await verificacaoService.obterDivergenciasDetalhadas(importacaoId);
    } catch (error: any) {
      const errorMessage = errorHandler.getErrorMessage(error);
      console.error('❌ Erro ao obter divergências:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const healthCheck = async (): Promise<{ status: string; service: string; timestamp: string }> => {
    try {
      return await verificacaoService.healthCheck();
    } catch (error: any) {
      const errorMessage = errorHandler.getErrorMessage(error);
      console.error('❌ Erro no health check:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    uploadArquivo,
    verificarImportacao,
    listarImportacoes,
    obterDivergenciasDetalhadas,
    healthCheck,
  };
};

export default api;