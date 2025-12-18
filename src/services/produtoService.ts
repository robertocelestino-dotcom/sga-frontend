// src/services/produtoService.ts - VERSÃO AJUSTADA
import { produtoAPI } from './api';

// Interface para Produto resumido (retornado na listagem)
export interface ProdutoResumoDTO {
  id: number;
  codigo: string;
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
}

export interface ProdutoFiltros {
  codigo?: string;
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
  // CRUD
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
    
    //console.log('📤 [produtoService] Parâmetros enviados para API:', params);
    
    try {
      //console.log('📞 [produtoService] Chamando produtoAPI.listarProdutos...');
      const response = await produtoAPI.listarProdutos(params);
      
      // LOG CRÍTICO: Verificar estrutura completa da resposta
      console.log('📥 [produtoService] Resposta COMPLETA da API:', {
        // Verifique se response é direto ou tem .data
        responseType: typeof response,
        isArray: Array.isArray(response),
        keys: Object.keys(response),
        // Verificar estrutura
        hasContent: 'content' in response,
        contentLength: response.content?.length,
        contentType: typeof response.content,
        // Verificar se tem .data
        hasData: 'data' in response,
        dataKeys: response.data ? Object.keys(response.data) : undefined,
        // Dados completos para debug
        fullResponse: response
      });
      
      // CORREÇÃO: Verificar se precisamos acessar response.data
      let dataParaRetornar;
      
      if (response && typeof response === 'object') {
        // Se response JÁ TEM a propriedade 'content' (é o objeto paginado)
        if ('content' in response) {
          //console.log('✅ [produtoService] Retornando response (tem content)');
          dataParaRetornar = response;
        }
        // Se response TEM .data e .data tem content
        else if (response.data && 'content' in response.data) {
          //console.log('✅ [produtoService] Retornando response.data (tem .data.content)');
          dataParaRetornar = response.data;
        }
        // Se response É UM ARRAY (endpoint retorna array direto)
        else if (Array.isArray(response)) {
          //console.log('⚠️ [produtoService] Response é array direto, convertendo para paginated');
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
        }
        // Fallback
        else {
          //console.warn('⚠️ [produtoService] Estrutura inesperada, usando fallback');
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
        //console.error('❌ [produtoService] Response inválida:', response);
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
      //console.error('❌ [produtoService] Erro ao listar produtos:', error);
      
      // Retornar estrutura vazia em caso de erro
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

  async excluir(id: number): Promise<void> {
    //console.log('🔄 [produtoService] Excluindo produto:', id);
    await produtoAPI.excluirProduto(id);
  },

  // Métodos específicos
  async listarFranquiasDisponiveis(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando franquias disponíveis');
    const response = await produtoAPI.listarFranquiasDisponiveis();
    //console.log(`✅ [produtoService] ${response.length} franquias encontradas`);
    return response;
  },

  async listarProdutosComFranquia(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos com franquia');
    const response = await produtoAPI.listarProdutosComFranquia();
    //console.log(`✅ [produtoService] ${response.length} produtos com franquia encontrados`);
    return response;
  },

  async listarProdutosSPC(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos SPC');
    const response = await produtoAPI.listarProdutosSPC();
    //console.log(`✅ [produtoService] ${response.length} produtos SPC encontrados`);
    return response;
  },

  async listarProdutosMix(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos MIX');
    const response = await produtoAPI.listarProdutosMix();
    //console.log(`✅ [produtoService] ${response.length} produtos MIX encontrados`);
    return response;
  },

  async listarProdutosAtivos(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos ativos');
    const response = await produtoAPI.listarProdutosAtivos();
    //console.log(`✅ [produtoService] ${response.length} produtos ativos encontrados`);
    return response;
  },

  async getFranquiasDoProduto(produtoId: number): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando franquias do produto:', produtoId);
    const response = await produtoAPI.getFranquiasDoProduto(produtoId);
    //console.log(`✅ [produtoService] ${response.length} franquias encontradas para produto ${produtoId}`);
    return response;
  },

  async getProdutosRelacionados(produtoId: number): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos relacionados:', produtoId);
    const response = await produtoAPI.getProdutosRelacionados(produtoId);
    //console.log(`✅ [produtoService] ${response.length} produtos relacionados encontrados`);
    return response;
  },

  async adicionarFranquia(produtoId: number, franquiaId: number): Promise<void> {
    //console.log(`🔄 [produtoService] Adicionando franquia ${franquiaId} ao produto ${produtoId}`);
    const { default: api } = await import('./api');
    await api.post(`/produtos/${produtoId}/franquias/${franquiaId}`);
    //console.log(`✅ [produtoService] Franquia ${franquiaId} adicionada ao produto ${produtoId}`);
  },

  async removerFranquia(produtoId: number, franquiaId: number): Promise<void> {
    //console.log(`🔄 [produtoService] Removendo franquia ${franquiaId} do produto ${produtoId}`);
    const { default: api } = await import('./api');
    await api.delete(`/produtos/${produtoId}/franquias/${franquiaId}`);
    //console.log(`✅ [produtoService] Franquia ${franquiaId} removida do produto ${produtoId}`);
  },

  async getEstatisticas(): Promise<any> {
    //console.log('🔄 [produtoService] Buscando estatísticas');
    const response = await produtoAPI.getEstatisticas();
    //console.log('✅ [produtoService] Estatísticas recebidas:', response);
    return response;
  },

  async getProdutosParaFaturamento(): Promise<ProdutoResumoDTO[]> {
    //console.log('🔄 [produtoService] Buscando produtos para faturamento');
    const response = await produtoAPI.getProdutosParaFaturamento();
    //console.log(`✅ [produtoService] ${response.length} produtos para faturamento encontrados`);
    return response;
  },

  async healthCheck(): Promise<any> {
    try {
      //console.log('🔄 [produtoService] Health check');
      const response = await produtoAPI.healthCheck();
      //console.log('✅ [produtoService] Health check OK:', response);
      return response;
    } catch (error) {
      //console.error('❌ [produtoService] Health check falhou:', error);
      return { status: 'DOWN', error: error.message };
    }
  },

  // Método de teste - NOVO
  async testeAPI(): Promise<any> {
    try {
      //console.log('🧪 [produtoService] Testando conexão com API...');
      
      // Teste 1: Endpoint direto (sem service)
      const { default: api } = await import('./api');
      const respostaDireta = await api.get('/produtos', { 
        params: { page: 0, size: 5, sort: 'nome' }
      });
      //console.log('🧪 [produtoService] Resposta direta:', respostaDireta.data);
      
      // Teste 2: Usando o produtoAPI
      const respostaAPI = await produtoAPI.listarProdutos({ page: 0, size: 5 });
      //console.log('🧪 [produtoService] Resposta via produtoAPI:', respostaAPI);
      
      return {
        direta: respostaDireta.data,
        viaAPI: respostaAPI,
        status: 'OK'
      };
    } catch (error: any) {
      //console.error('❌ [produtoService] Teste falhou:', error);
      return {
        status: 'ERROR',
        message: error.message,
        response: error.response?.data
      };
    }
  },

  // Método de teste de conexão
  async testConnection(): Promise<string> {
    try {
      //console.log('🔌 [produtoService] Testando conexão...');
      const health = await this.healthCheck();
      
      // Tentar listar alguns produtos também
      const produtos = await this.listar({ page: 0, size: 1 });
      
      return `✅ Conexão OK - Status: ${health.status}, Total Produtos: ${produtos.totalElements}`;
    } catch (error: any) {
      //console.error('❌ [produtoService] Falha na conexão:', error);
      return `❌ Falha na conexão: ${error.message}`;
    }
  }
};

// Opções para selects (mantenha como estava)
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