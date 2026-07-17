// src/services/notificacaoService.ts
import api from './api';
import { NotificacaoSumarizada, NotificacaoAssociado, SincronizacaoResponse } from '../types/notificacao';

class NotificacaoService {
  
  // ========== SINCRONIZAÇÃO ==========
  
  async sincronizar(mes?: number, ano?: number, codigoAssociado?: string): Promise<SincronizacaoResponse> {
    const params: any = {};
    if (mes) params.mes = mes;
    if (ano) params.ano = ano;
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    const response = await api.post('/notificacoes/sincronizar', null, { params });
    return response.data;
  }

  // 🔥 NOVO: Sincronização com período
  async sincronizarPorPeriodo(dataInicio: string, dataFim: string, codigoAssociado?: string): Promise<SincronizacaoResponse> {
    const params: any = { dataInicio, dataFim };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    const response = await api.post('/notificacoes/sincronizar-por-periodo', null, { params });
    return response.data;
  }

  // ========== CONSULTAS ==========

  async buscarSumarizadas(codigoAssociado?: string): Promise<NotificacaoSumarizada[]> {
    const params: any = {};
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    try {
      const response = await api.get('/notificacoes/sumarizadas', { params });
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar notificações sumarizadas:', error);
      return [];
    }
  }

  async buscarAgrupadas(mes: number, ano: number, codigoAssociado?: string): Promise<any[]> {
    const params: any = { mes, ano };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    try {
      const response = await api.get('/notificacoes/agrupadas', { params });
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar notificações agrupadas:', error);
      return [];
    }
  }

  // 🔥 NOVO: Buscar notificações por período
  async buscarPorPeriodo(dataInicio: string, dataFim: string, codigoAssociado?: string): Promise<any[]> {
    const params: any = { dataInicio, dataFim };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    try {
      const response = await api.get('/notificacoes/por-periodo', { params });
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar notificações por período:', error);
      return [];
    }
  }

  async buscarDetalhadas(mes: number, ano: number, codigoAssociado: string): Promise<any[]> {
    const params: any = { mes, ano, codigoAssociado };
    
    try {
      const response = await api.get('/notificacoes/detalhadas', { params });
      return response.data || [];
    } catch (error: any) {
      console.error('❌ Erro ao buscar notificações detalhadas:', error);
      return [];
    }
  }

  async buscarPorAssociado(associadoId: number, mes: number, ano: number): Promise<NotificacaoAssociado> {
    const response = await api.get(`/notificacoes/associado/${associadoId}`, {
      params: { mes, ano }
    });
    return response.data;
  }

  async buscarNaoProcessados(mes: number, ano: number): Promise<NotificacaoAssociado[]> {
    const response = await api.get('/notificacoes/nao-processados', {
      params: { mes, ano }
    });
    return response.data;
  }

  async health(): Promise<any> {
    const response = await api.get('/notificacoes/health');
    return response.data;
  }

  /**
 * 🔥 BUSCA NOTIFICAÇÕES AGRUPADAS POR PERÍODO - TABELA LOCAL (RÁPIDO)
 * @param dataInicio - Formato: dd/MM/yyyy (ex: 26/05/2026)
 * @param dataFim - Formato: dd/MM/yyyy (ex: 25/06/2026)
 * @param codigoAssociado - Código SPC do associado (opcional)
 * @param signal - AbortSignal para cancelar a requisição
 */
  async buscarAgrupadasPorPeriodo(
    dataInicio: string, 
    dataFim: string, 
    codigoAssociado?: string,
    signal?: AbortSignal
  ): Promise<NotificacaoSumarizada[]> {
    const params: any = { dataInicio, dataFim };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    try {
      const response = await api.get('/notificacoes/agrupadas-por-periodo', { 
        params,
        signal // 🔥 ADICIONAR SIGNAL PARA CANCELAR
      });
      return response.data || [];
    } catch (error: any) {
      // 🔥 NÃO TRATAR ERRO DE CANCELAMENTO COMO ERRO
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log('⏹️ Requisição cancelada');
        return [];
      }
      console.error('❌ Erro ao buscar notificações agrupadas por período:', error);
      return [];
    }
  }

  // 🔥 NOVO: Sincronizar agrupado por período
  async sincronizarAgrupadoPorPeriodo(dataInicio: string, dataFim: string, codigoAssociado?: string): Promise<any> {
    const params: any = { dataInicio, dataFim };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    const response = await api.post('/notificacoes/sincronizar-agrupado-periodo', null, { params });
    return response.data;
  }

  /**
   * 🔥 DESFAZER SINCRONIZAÇÃO
   * Remove os dados sincronizados da tabela local
   */
  async desfazerSincronizacao(dataInicio: string, dataFim: string, codigoAssociado?: string): Promise<any> {
    const params: any = { dataInicio, dataFim };
    if (codigoAssociado) params.codigoAssociado = codigoAssociado;
    
    try {
      const response = await api.post('/notificacoes/desfazer-sincronizacao', null, { params });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao desfazer sincronização:', error);
      throw error;
    }
  }

  /**
 * 🔥 VERIFICAR STATUS DE UMA TAREFA
 */
async verificarStatusTarefa(taskId: string): Promise<any> {
  try {
    const response = await api.get(`/faturamento/processamento-status/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar status da tarefa:', error);
    throw error;
  }
}

/**
 * 🔥 CANCELAR TAREFA
 */
async cancelarTarefa(taskId: string): Promise<any> {
  try {
    const response = await api.post(`/faturamento/processamento-cancelar/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao cancelar tarefa:', error);
    throw error;
  }
}

/**
 * 🔥 LISTAR TAREFAS EM PROCESSAMENTO
 */
async listarTarefas(): Promise<any> {
  try {
    const response = await api.get('/faturamento/processamento-tarefas');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao listar tarefas:', error);
    return {};
  }
}

}

export default new NotificacaoService();