// src/services/produtoService.ts - VERSÃO COMPLETA AJUSTADA

import { produtoAPI } from './api';

// Interface para Produto resumido (retornado na listagem)
export interface ProdutoResumoDTO {
  id: number;
  codigo: string;
  codigoRm?: string;
  nome: string;
  nomeCompleto: string;
  valorUnitario: number;
  status: string;
  tipoProduto: string;
  categoria?: string;
  modalidade?: string;
  temFranquia: boolean;
  totalFranquias: number;
}

// Interface para Produto completo
export interface ProdutoDTO extends ProdutoResumoDTO {
  descricao?: string;
  codigoRm?: string;
  unidadeMedida?: string;
  limiteFranquia?: number;
  periodoFranquia?: string;
  geraCobrancaAutomatica?: boolean;
  cobrancaPeriodica?: boolean;
  periodicidadeCobranca?: string;
  diaCobranca?: number;
  permiteDesconto?: boolean;
  descontoMaximo?: number;
  exigeAutorizacao?: boolean;
  nivelAutorizacao?: number;
  criadoEm?: string;
  atualizadoEm?: string;
  usuarioCriacao?: string;
  usuarioAtualizacao?: string;
  franquiasIds?: number[];
  produtosRelacionadosIds?: number[];
  franquiaAssociadaId?: number;
}

export interface ProdutoFiltros {
  codigo?: string;
  codigoRm?: string;
  nome?: string;
  tipoProduto?: string;
  categoria?: string;
  modalidade?: string;
  status?: string;
  temFranquia?: boolean;
  page?: number;
  size?: number;
  sort?: string;
  direction?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Serviço principal
export const produtoService = {

  // ========== CRUD ==========

  async criar(produto: ProdutoDTO): Promise<ProdutoDTO> {
    console.log('🔄 [produtoService] Criando produto:', produto);
    const response = await produtoAPI.criarProduto(produto);
    console.log('✅ [produtoService] Produto criado:', response);
    return response;
  },

  async atualizar(id: number, produto: ProdutoDTO): Promise<ProdutoDTO> {
    console.log('🔄 [produtoService] Atualizando produto:', id, produto);
    const response = await produtoAPI.atualizarProduto(id, produto);
    return response;
  },

  async buscarPorId(id: number): Promise<ProdutoDTO> {
    console.log('🔄 [produtoService] Buscando produto por ID:', id);
    const response = await produtoAPI.buscarPorId(id);
    return response;
  },

  async listar(filtros: ProdutoFiltros = {}): Promise<PaginatedResponse<ProdutoResumoDTO>> {
    console.log('🔄 [produtoService] Listando produtos com filtros:', filtros);
    
    const params = {
      page: filtros.page || 0,
      size: filtros.size || 10,
      sort: filtros.sort || 'nome',
      direction: filtros.direction || 'asc',
      codigo: filtros.codigo || '',
      codigoRm: filtros.codigoRm || '',
      nome: filtros.nome || '',
      tipoProduto: filtros.tipoProduto || '',
      categoria: filtros.categoria || '',
      modalidade: filtros.modalidade || '',
      status: filtros.status || '',
      temFranquia: filtros.temFranquia
    };
    
    // Remove parâmetros vazios
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params];
      }
    });
    
    console.log('📤 [produtoService] Parâmetros enviados para API:', params);
    
    try {
      const response = await produtoAPI.listarProdutos(params);
      
      console.log('📥 [produtoService] Resposta COMPLETA da API:', {
        responseType: typeof response,
        isArray: Array.isArray(response),
        keys: Object.keys(response),
        hasContent: 'content' in response,
        contentLength: response.content?.length,
        hasData: 'data' in response,
        dataKeys: response.data ? Object.keys(response.data) : undefined,
      });
      
      let dataParaRetornar;
      
      if (response && typeof response === 'object') {
        if ('content' in response) {
          dataParaRetornar = response;
        } else if (response.data && 'content' in response.data) {
          dataParaRetornar = response.data;
        } else if (Array.isArray(response)) {
          dataParaRetornar = {
            content: response,
            totalElements: response.length,
            totalPages: 1,
            size: response.length,
            number: 0,
            first: true,
            last: true,
            empty: response.length === 0
          };
        } else {
          dataParaRetornar = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 10,
            number: 0,
            first: true,
            last: true,
            empty: true
          };
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
      
      console.log('✅ [produtoService] Produtos processados:', {
        total: dataParaRetornar.totalElements,
        pagina: dataParaRetornar.number + 1,
        produtos: dataParaRetornar.content?.length || 0,
        vazio: dataParaRetornar.empty
      });
      
      return dataParaRetornar;
      
    } catch (error) {
      console.error('❌ [produtoService] Erro ao listar produtos:', error);
      
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        first: true,
        last: true,
        empty: true
      };
    }
  },

  // 🔥 NOVO MÉTODO: Listagem simplificada para busca de produtos (dropdown)
  async listarSimples(filtros: {
    termo?: string;
    page?: number;
    size?: number;
    ativo?: boolean;
  } = {}): Promise<PaginatedResponse<ProdutoResumoDTO>> {
    console.log('🔄 [produtoService] Listando produtos simplificado:', filtros);
    
    const params: any = {
      page: filtros.page || 0,
      size: filtros.size || 20,
      sort: 'nome',
      direction: 'asc'
    };
    
    if (filtros.termo && filtros.termo.length > 0) {
      params.nome = filtros.termo;
      if (/^\d+$/.test(filtros.termo)) {
        params.codigoRm = filtros.termo;  // Busca por código RM também
      }
    }
    
    if (filtros.ativo !== undefined) {
      params.status = filtros.ativo ? 'ATIVO' : 'INATIVO';
    } else {
      params.status = 'ATIVO';
    }
    
    console.log('📤 [produtoService] Parâmetros listagem simplificada:', params);
    
    try {
      const response = await produtoAPI.listarProdutos(params);
      
      let dataParaRetornar;
      
      if (response && typeof response === 'object') {
        if ('content' in response) {
          dataParaRetornar = response;
        } else if (response.data && 'content' in response.data) {
          dataParaRetornar = response.data;
        } else if (Array.isArray(response)) {
          dataParaRetornar = {
            content: response,
            totalElements: response.length,
            totalPages: 1,
            size: response.length,
            number: 0,
            first: true,
            last: true,
            empty: response.length === 0
          };
        } else {
          dataParaRetornar = {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 20,
            number: 0,
            first: true,
            last: true,
            empty: true
          };
        }
      } else {
        dataParaRetornar = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 20,
          number: 0,
          first: true,
          last: true,
          empty: true
        };
      }
      
      // 🔥 GARANTIR QUE O CODIGO_RM ESTÁ SENDO RETORNADO
      console.log('✅ [produtoService] Primeiro produto retornado:', dataParaRetornar.content?.[0]);
      console.log('✅ [produtoService] codigo_rm do primeiro:', dataParaRetornar.content?.[0]?.codigoRm);
      
      return dataParaRetornar;
      
    } catch (error) {
      console.error('❌ [produtoService] Erro ao listar produtos simplificado:', error);
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 20,
        number: 0,
        first: true,
        last: true,
        empty: true
      };
    }
  },

  async excluir(id: number): Promise<void> {
    await produtoAPI.excluirProduto(id);
  },

  // ========== MÉTODOS ESPECÍFICOS ==========

  async listarFranquiasDisponiveis(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.listarFranquiasDisponiveis();
    return response;
  },

  async listarProdutosComFranquia(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.listarProdutosComFranquia();
    return response;
  },

  async listarProdutosSPC(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.listarProdutosSPC();
    return response;
  },

  async listarProdutosMix(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.listarProdutosMix();
    return response;
  },

  async listarProdutosAtivos(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.listarProdutosAtivos();
    return response;
  },

  async getFranquiasDoProduto(produtoId: number): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.getFranquiasDoProduto(produtoId);
    return response;
  },

  async getProdutosRelacionados(produtoId: number): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.getProdutosRelacionados(produtoId);
    return response;
  },

  async adicionarFranquia(produtoId: number, franquiaId: number): Promise<void> {
    const { default: api } = await import('./api');
    await api.post(`/produtos/${produtoId}/franquias/${franquiaId}`);
  },

  async removerFranquia(produtoId: number, franquiaId: number): Promise<void> {
    const { default: api } = await import('./api');
    await api.delete(`/produtos/${produtoId}/franquias/${franquiaId}`);
  },

  async getEstatisticas(): Promise<any> {
    const response = await produtoAPI.getEstatisticas();
    return response;
  },

  async getProdutosParaFaturamento(): Promise<ProdutoResumoDTO[]> {
    const response = await produtoAPI.getProdutosParaFaturamento();
    return response;
  },

  async healthCheck(): Promise<any> {
    try {
      const response = await produtoAPI.healthCheck();
      return response;
    } catch (error) {
      return { status: 'DOWN', error: error.message };
    }
  },

  // ========== MÉTODOS DE TESTE ==========

  async testeAPI(): Promise<any> {
    try {
      const { default: api } = await import('./api');
      const respostaDireta = await api.get('/produtos', { 
        params: { page: 0, size: 5, sort: 'nome' }
      });
      const respostaAPI = await produtoAPI.listarProdutos({ page: 0, size: 5 });
      
      return {
        direta: respostaDireta.data,
        viaAPI: respostaAPI,
        status: 'OK'
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        message: error.message,
        response: error.response?.data
      };
    }
  },

  async testConnection(): Promise<string> {
    try {
      const health = await this.healthCheck();
      const produtos = await this.listar({ page: 0, size: 1 });
      return `✅ Conexão OK - Status: ${health.status}, Total Produtos: ${produtos.totalElements}`;
    } catch (error: any) {
      return `❌ Falha na conexão: ${error.message}`;
    }
  }
};

// ========== OPÇÕES PARA SELECTS ==========

export const produtoOpcoes = {
  status: [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'SUSPENSO', label: 'Suspenso' }
  ],

  tipoProduto: [
    { value: 'SERVICO', label: 'Serviço' },
    { value: 'FRANQUIA', label: 'Franquia' },
    { value: 'PRODUTO', label: 'Produto' },
    { value: 'ASSINATURA', label: 'Assinatura' }
  ],

  unidadeMedida: [
    { value: 'UNIDADE', label: 'Unidade' },
    { value: 'CONSULTA', label: 'Consulta' },
    { value: 'HORA', label: 'Hora' },
    { value: 'MES', label: 'Mês' },
    { value: 'ANO', label: 'Ano' },
    { value: 'MINUTO', label: 'Minuto' }
  ],

  categoria: [
    { value: 'SPC', label: 'SPC' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'INTERNET', label: 'Internet' },
    { value: 'WEBSERVICE', label: 'Webservice' },
    { value: 'MIX', label: 'Mix' },
    { value: 'SPC+MIX', label: 'SPC + Mix' },
    { value: 'SPC+CHEQUE', label: 'SPC + Cheque' },
    { value: 'TELECOM', label: 'Telecom' }
  ],

  modalidade: [
    { value: 'POSITIVO', label: 'Positivo' },
    { value: 'NEGATIVO', label: 'Negativo' },
    { value: 'FOR', label: 'FOR' },
    { value: 'INTERNET', label: 'Internet' },
    { value: 'WEBSERVICE', label: 'Webservice' },
    { value: 'CONSULTA', label: 'Consulta' },
    { value: 'MONITORAMENTO', label: 'Monitoramento' }
  ],

  periodoFranquia: [
    { value: 'MENSAL', label: 'Mensal' },
    { value: 'ANUAL', label: 'Anual' },
    { value: 'DIARIO', label: 'Diário' },
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' }
  ],

  periodicidadeCobranca: [
    { value: 'MENSAL', label: 'Mensal' },
    { value: 'ANUAL', label: 'Anual' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'QUINZENAL', label: 'Quinzenal' },
    { value: 'SEMANAL', label: 'Semanal' }
  ]
};