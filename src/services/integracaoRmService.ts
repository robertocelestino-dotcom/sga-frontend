// src/services/integracaoRmService.ts

import api from './api';

export interface ConfiguracaoRmParametro {
  id?: number;
  chave: string;
  valor: string;
  descricao: string;
  ordem: number;
}

export interface ConfiguracaoRm {
  id?: number;
  descricao: string;
  ativo: boolean;
  tipoMovimento: string;
  codigoTmv: string;
  centroCusto: string;
  condicaoPagamento: string;
  serie: string;
  contaCaixa: string;
  codigoServico: string;
  municipioServico: string;
  ufServico: string;
  parametros: ConfiguracaoRmParametro[];
  criadoEm?: string;
  atualizadoEm?: string;
}

class IntegracaoRmService {
  
  async listarConfiguracoes(): Promise<ConfiguracaoRm[]> {
    const response = await api.get('/integracao-rm/configuracoes');
    return response.data;
  }
  
  async listarConfiguracoesAtivas(): Promise<ConfiguracaoRm[]> {
    const response = await api.get('/integracao-rm/configuracoes/ativas');
    return response.data;
  }
  
  async buscarConfiguracao(id: number): Promise<ConfiguracaoRm> {
    const response = await api.get(`/integracao-rm/configuracoes/${id}`);
    return response.data;
  }
  
  async criarConfiguracao(config: ConfiguracaoRm): Promise<ConfiguracaoRm> {
    const response = await api.post('/integracao-rm/configuracoes', config);
    return response.data;
  }
  
  async atualizarConfiguracao(id: number, config: ConfiguracaoRm): Promise<ConfiguracaoRm> {
    const response = await api.put(`/integracao-rm/configuracoes/${id}`, config);
    return response.data;
  }
  
  async excluirConfiguracao(id: number): Promise<void> {
    await api.delete(`/integracao-rm/configuracoes/${id}`);
  }
}

export default new IntegracaoRmService();