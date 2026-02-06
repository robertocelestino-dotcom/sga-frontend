// src/services/sistemaLogService.ts - VERSÃO CORRIGIDA
import api from './api';

export interface SistemaLog {
  id: number;
  tabelaAfetada: string;
  idRegistro?: number;
  acao: string;
  usuarioId?: number;
  usuarioNome?: string;
  enderecoIp?: string;
  userAgent?: string;
  dadosAnteriores?: string;
  dadosNovos?: string;
  diferencas?: string;
  observacao?: string;
  dataHora: string;
  sucesso: boolean;
  mensagemErro?: string;
  tempoExecucaoMs?: number;
  modulo?: string;
  operacao?: string;
}

export interface SistemaLogFiltro {
  pagina?: number;
  tamanho?: number;
  tabela?: string;
  acao?: string;
  modulo?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

const sistemaLogService = {
  // Método principal - APONTA PARA /logs (conforme backend)
  async buscarLogsComFiltros(filtros: SistemaLogFiltro = {}): Promise<PaginatedResponse<SistemaLog>> {
    try {
      console.log('🔍 Buscando logs em /logs com filtros:', filtros);
      
      // Montar os parâmetros conforme o backend espera
      const params: any = {
        page: filtros.pagina || 0,
        size: filtros.tamanho || 20
      };
      
      if (filtros.tabela) params.tabela = filtros.tabela;
      if (filtros.acao) params.acao = filtros.acao;
      if (filtros.modulo) params.modulo = filtros.modulo;
      
      // ✅ CORREÇÃO: Enviar apenas a data (YYYY-MM-DD), sem hora
      if (filtros.dataInicio) {
        // Remover a parte do tempo se existir
        const dataInicioStr = filtros.dataInicio.split('T')[0];
        params.dataInicio = dataInicioStr;
      }
      
      if (filtros.dataFim) {
        // Remover a parte do tempo se existir
        const dataFimStr = filtros.dataFim.split('T')[0];
        params.dataFim = dataFimStr;
      }
      
      console.log('📤 Parâmetros enviados para backend:', params);
      
      const response = await api.get('/logs', {
        params: params,
        timeout: 10000
      });
      
      console.log('✅ Resposta de /logs recebida:', response.data);
      
      // Mapear resposta do backend
      const backendResponse = response.data;
      const content = backendResponse.content || [];
      
      console.log(`📊 ${content.length} logs recebidos`);
      if (content.length > 0) {
        console.log('📋 Primeiro log:', content[0]);
        console.log('🔑 Chaves do primeiro log:', Object.keys(content[0]));
      }
      
      return {
        content: content.map((item: any) => ({
          id: item.id || 0,
          tabelaAfetada: item.tabelaAfetada || item.tabela_afetada || '',
          idRegistro: item.idRegistro || item.id_registro,
          acao: item.acao || '',
          usuarioNome: item.usuarioNome || item.usuario_nome || 'Sistema',
          enderecoIp: item.enderecoIp || item.endereco_ip || '',
          // Converter data do formato do banco para ISO
          dataHora: this.formatarDataParaISO(item.dataHora || item.data_hora),
          sucesso: item.sucesso !== undefined ? item.sucesso : true,
          modulo: item.modulo || 'GERAL',
          operacao: item.operacao || item.observacao || ''
        })),
        totalElements: backendResponse.totalElements || 0,
        totalPages: backendResponse.totalPages || 0,
        size: backendResponse.size || 20,
        number: backendResponse.number || 0
      };
      
    } catch (error: any) {
      console.error('❌ ERRO em /logs:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  },

  // Método auxiliar para formatar data
  formatarDataParaISO(dataString: string): string {
  if (!dataString) return '';
  
  try {
    // Se já estiver em formato ISO, retornar como está
    if (dataString.includes('T')) return dataString;
    
    // Se estiver no formato do banco "2026-01-28 16:56:13.510146"
    if (dataString.includes(' ')) {
      return dataString.replace(' ', 'T') + 'Z';
    }
    
    return dataString;
  } catch {
    return dataString;
  }
},

  async buscarOpcoesTabelas(): Promise<string[]> {
    try {
      console.log('📡 Buscando tabelas em /logs/tabelas');
      const response = await api.get('/logs/tabelas');
      console.log('✅ Tabelas recebidas:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar tabelas:', error);
      // Fallback para desenvolvimento
      return ['Associado', 'Produto', 'Vendedor', 'Usuario', 'Plano', 'Categoria'];
    }
  },

  async buscarOpcoesAcoes(): Promise<string[]> {
    try {
      console.log('📡 Buscando ações em /logs/acoes');
      const response = await api.get('/logs/acoes');
      console.log('✅ Ações recebidas:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar ações:', error);
      // Fallback para desenvolvimento
      return ['CREATE', 'UPDATE', 'DELETE', 'READ', 'ERRO'];
    }
  },

  async buscarOpcoesModulos(): Promise<string[]> {
    try {
      console.log('📡 Buscando módulos em /logs/modulos');
      const response = await api.get('/logs/modulos');
      console.log('✅ Módulos recebidas:', response.data);
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar módulos:', error);
      // Fallback para desenvolvimento
      return ['ASSOCIADOS', 'PRODUTOS', 'VENDEDORES', 'USUARIOS', 'SISTEMA'];
    }
  },

  async limparLogsAntigos(dias: number): Promise<{ quantidade: number }> {
    try {
      console.log(`🧹 Limpando logs antigos (${dias} dias)`);
      // Tente ambos formatos
      try {
        const response = await api.delete(`/logs/limpar?diasManter=${dias}`);
        console.log('✅ Logs limpos (query param):', response.data);
        return response.data;
      } catch {
        const response = await api.delete(`/logs/limpar/${dias}`);
        console.log('✅ Logs limpos (path variable):', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
      throw error;
    }
  },

  // Método de teste 
  async testarEndpoint(): Promise<any> {
    try {
      console.log('🧪 Testando endpoint /logs/teste');
      const response = await api.get('/logs/teste');
      console.log('✅ Teste OK:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      // Fallback para teste básico
      try {
        const response = await api.get('/logs', { params: { page: 0, size: 1 } });
        return { status: 'UP', message: 'Endpoint principal funcionando' };
      } catch {
        throw error;
      }
    }
  }
};

export default sistemaLogService;