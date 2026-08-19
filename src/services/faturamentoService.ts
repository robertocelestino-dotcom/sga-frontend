// src/services/faturamentoService.ts

import api from './api';

export interface FaturaItemDTO {
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tipoLancamento: string;
}

export interface Fatura {
  id: number;
  numeroFatura: string;
  numeroNotaDebito?: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  processadoRm: boolean;
  mesReferencia?: number;
  anoReferencia?: number;
  criadoEm: string;
  observacao?: string;
  associadoId: number;
  associadoNome: string;
  cnpjCpf?: string;
  codigoSpc?: string;
  itens?: FaturaItemDTO[];
}

export interface FaturaResumoDTO {
  id: number;
  numeroFatura: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  mesReferencia: number;
  anoReferencia: number;
  associadoNome: string;
  cnpjCpf?: string;
  codigoSpc?: string;
  associadoId?: number;
  reguaId?: number;
  reguaNome?: string;
  reguaCor?: string;
  notaDebitoId?: number;
  processadoRm: boolean;
}

export interface FaturaDetalheDTO {
  id: number;
  numeroFatura: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  processadoRm: boolean;
  mesReferencia: number;
  anoReferencia: number;
  criadoEm: string;
  observacao?: string;
  associadoId: number;
  associadoNome: string;
  cnpjCpf: string;
  codigoSpc: string;
  numeroRps?: number;
  notaDebitoId?: number;
  itens: FaturaItemDTO[];
}

export interface PageableFatura {
  content: FaturaResumoDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// ============================================================
// 🔥 INTERFACES PARA LOGS
// ============================================================

export interface LogFatura {
  id: number;
  nivel: string;      // INFO, WARN, ERROR, DEBUG
  mensagem: string;
  passo: string;      // INICIO, EXTRAIR_PERIODO, etc.
  dataHora: string;
}

export interface ContagemLogs {
  faturaId: number;
  totalLogs: number;
}

// ============================================================
// INTERFACES PARA EXPORTAÇÃO RM
// ============================================================

export interface ExportacaoRmResultado {
  loteId: number;
  totalFaturas: number;
  faturasProcessadas: number;
  faturasComErro: number;
  faturasIgnoradas?: number;
  faturasIgnoradasIds?: number[];
  valorTotalIgnorado?: number;
  primeiroNumeroRps: number;
  ultimoNumeroRps: number;
  dataProcessamento: string;
  valorTotal: number;
  detalhes: ExportacaoFaturaDetalhe[];
}

export interface ExportacaoFaturaDetalhe {
  faturaId: number;
  numeroFatura: string;
  numeroRps: number;
  status: string;
  mensagem?: string;
  associadoNome: string;
  codigoRm?: string;
  codigoSpc?: string;
  cnpjCpf?: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  itens: ExportacaoItemFatura[];
}

export interface ExportacaoItemFatura {
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

// ============================================================
// INTERFACES PARA INTEGRAÇÃO RM API
// ============================================================

export interface IntegracaoRmApiRequest {
  notaIds: number[];
  configuracaoId?: number;
}

export interface IntegracaoRmApiItem {
  notaId: number;
  faturaId?: number;
  sucesso: boolean;
  idMov?: number;
  mensagem: string;
}

export interface IntegracaoRmApiResponse {
  sucesso: boolean;
  mensagem: string;
  totalProcessados: number;
  totalSucessos: number;
  totalErros: number;
  itens: IntegracaoRmApiItem[];
}

// ============================================================
// SERVICE
// ============================================================

class FaturamentoService {
  
  // ============================================================
  // CONSULTAS DE FATURAS
  // ============================================================

  async listarFaturas(page: number, size: number, filters?: {
    numeroFatura?: string;
    associadoNome?: string;
    status?: string;
    mes?: number;
    ano?: number;
    reguaId?: number;
  }): Promise<PageableFatura> {
    const params: any = {
      page,
      size,
      sort: 'dataEmissao,desc'
    };
    
    if (filters?.numeroFatura && filters.numeroFatura.trim() !== '') {
      params.numeroFatura = filters.numeroFatura.trim();
    }
    if (filters?.associadoNome && filters.associadoNome.trim() !== '') {
      params.associadoNome = filters.associadoNome.trim();
    }
    if (filters?.status && filters.status.trim() !== '') {
      params.status = filters.status.trim();
    }
    if (filters?.mes) {
      params.mes = filters.mes;
    }
    if (filters?.ano) {
      params.ano = filters.ano;
    }
    if (filters?.reguaId) {
      params.reguaId = filters.reguaId;
    }
    
    console.log('📤 Enviando filtros para API:', params);
    
    const response = await api.get('/faturamento/faturas', { params });
    return response.data;
  }
  
  async buscarFatura(id: number): Promise<FaturaDetalheDTO> {
    const response = await api.get(`/faturamento/faturas/${id}`);
    return response.data;
  }
  
  async atualizarStatus(id: number, status: string): Promise<Fatura> {
    const response = await api.put(`/faturamento/faturas/${id}/status`, { status });
    return response.data;
  }
  
  async exportarPdf(id: number): Promise<Blob> {
    const response = await api.get(`/faturamento/faturas/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  }

  // ============================================================
  // 🔥 LOGS DE FATURA (NOVOS MÉTODOS)
  // ============================================================

  /**
   * Busca todos os logs de uma fatura
   */
  async buscarLogsFatura(faturaId: number): Promise<LogFatura[]> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/logs`);
    return response.data;
  }

  /**
   * Busca apenas logs de erro (WARN e ERROR) de uma fatura
   */
  async buscarLogsErrosFatura(faturaId: number): Promise<LogFatura[]> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/logs/erros`);
    return response.data;
  }

  /**
   * Busca logs de uma fatura filtrados por nível
   */
  async buscarLogsPorNivel(faturaId: number, nivel: string): Promise<LogFatura[]> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/logs/nivel/${nivel.toUpperCase()}`);
    return response.data;
  }

  /**
   * Busca logs de uma fatura filtrados por passo
   */
  async buscarLogsPorPasso(faturaId: number, passo: string): Promise<LogFatura[]> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/logs/passo/${passo.toUpperCase()}`);
    return response.data;
  }

  /**
   * Conta logs de uma fatura
   */
  async contarLogsFatura(faturaId: number): Promise<ContagemLogs> {
    const response = await api.get(`/faturamento/faturas/${faturaId}/logs/count`);
    return response.data;
  }

  /**
   * Limpa todos os logs de uma fatura
   */
  async limparLogsFatura(faturaId: number): Promise<{
    success: boolean;
    faturaId: number;
    logsRemovidos: number;
    mensagem: string;
    usuario: string;
  }> {
    const response = await api.delete(`/faturamento/faturas/${faturaId}/logs`);
    return response.data;
  }

  // ============================================================
  // EXPORTAÇÃO RM
  // ============================================================

  async exportarRmFatura(id: number, ultimoNumeroRps: number, reguaId?: number, mesReferencia?: string): Promise<Blob> {
    console.log('📤 Chamando exportarRmFatura - ID:', id, 'RPS:', ultimoNumeroRps);
    
    const params: any = { ultimoNumeroRps };
    if (reguaId) params.reguaId = reguaId;
    if (mesReferencia) params.mesReferencia = mesReferencia;
    
    const response = await api.post(`/faturamento/faturas/${id}/exportar-rm`, null, {
      params,
      responseType: 'blob',
      headers: { 'Accept': 'text/plain' }
    });
    
    console.log('📥 Resposta recebida:', response);
    console.log('📥 Tamanho do blob:', response.data.size);
    
    if (response.data.size === 0) {
      console.error('❌ Blob vazio recebido!');
      throw new Error('Arquivo gerado está vazio');
    }
    
    return response.data;
  }
  
  async exportarRmMultiplasFaturasComMetadados(
    faturaIds: number[], 
    ultimoNumeroRps: number, 
    reguaId?: number, 
    mesReferencia?: string
  ): Promise<{ blob: Blob; metadados: ExportacaoRmResultado }> {
    console.log('📤 Chamando exportarRmMultiplasFaturasComMetadados - Faturas:', faturaIds.length, 'RPS:', ultimoNumeroRps);
    
    const response = await api.post('/faturamento/faturas/exportar-rm-lote-metadados', {
      faturaIds,
      ultimoNumeroRps,
      reguaId,
      mesReferencia
    }, {
      timeout: 300000 // 5 minutos
    });
    
    console.log('📥 Resposta recebida (lote com metadados):', response.data);
    
    const { arquivoBase64, ...metadados } = response.data;
    
    // Converter Base64 para Blob
    const byteCharacters = atob(arquivoBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'text/plain' });
    
    console.log('📥 Blob criado, tamanho:', blob.size);
    console.log('📥 Metadados:', metadados);
    
    return { blob, metadados };
  }
  
  async exportarRmMultiplasFaturas(faturaIds: number[], ultimoNumeroRps: number, reguaId?: number, mesReferencia?: string): Promise<Blob> {
    console.log('📤 Chamando exportarRmMultiplasFaturas (legado) - Faturas:', faturaIds.length, 'RPS:', ultimoNumeroRps);
    
    const response = await api.post('/faturamento/faturas/exportar-rm-lote', {
      faturaIds,
      ultimoNumeroRps,
      reguaId,
      mesReferencia
    }, {
      responseType: 'blob',
      headers: { 'Accept': 'text/plain' }
    });
    
    console.log('📥 Resposta recebida (lote):', response);
    console.log('📥 Tamanho do blob:', response.data.size);
    
    if (response.data.size === 0) {
      console.error('❌ Blob vazio recebido!');
      throw new Error('Arquivo gerado está vazio');
    }
    
    return response.data;
  }
  
  async lerConteudoBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(blob, 'ISO-8859-1');
    });
  }

  // ============================================================
  // ITENS DA FATURA
  // ============================================================

  async adicionarItemFatura(faturaId: number, item: {
    codigoProduto: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }): Promise<any> {
    if (!faturaId) {
      throw new Error('ID da fatura é obrigatório');
    }
    if (!item.codigoProduto || item.codigoProduto.trim() === '') {
      throw new Error('Código do produto é obrigatório');
    }
    if (!item.descricao || item.descricao.trim() === '') {
      throw new Error('Descrição do item é obrigatória');
    }
    if (item.quantidade <= 0) {
      throw new Error('Quantidade deve ser maior que zero');
    }
    if (item.valorUnitario <= 0) {
      throw new Error('Valor unitário deve ser maior que zero');
    }
    
    console.log('📤 POST /faturamento/faturas/${faturaId}/itens', item);
    
    const response = await api.post(`/faturamento/faturas/${faturaId}/itens`, {
      codigoProduto: item.codigoProduto.trim(),
      descricao: item.descricao.trim(),
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario
    });
    
    return response.data;
  }

  async removerItemFatura(faturaId: number, itemId: number): Promise<void> {
    await api.delete(`/faturamento/faturas/${faturaId}/itens/${itemId}`);
  }

  async atualizarItemFatura(faturaId: number, itemId: number, item: {
    codigoProduto: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    tipoLancamento?: string;
  }): Promise<any> {
    if (!faturaId || faturaId === 0) {
      throw new Error('ID da fatura inválido: ' + faturaId);
    }
    if (!itemId || itemId === 0) {
      throw new Error('ID do item inválido: ' + itemId);
    }
    
    console.log('📤 PUT /faturamento/faturas/${faturaId}/itens/${itemId}', item);
    
    const response = await api.put(`/faturamento/faturas/${faturaId}/itens/${itemId}`, {
      codigoProduto: item.codigoProduto,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario,
      tipoLancamento: item.tipoLancamento || 'D'
    });
    
    return response.data;
  }

  async excluirFatura(id: number): Promise<void> {
    try {
      console.log(`🗑️ Excluindo fatura ID: ${id}`);
      await api.delete(`/faturamento/faturas/${id}`);
      console.log(`✅ Fatura ${id} excluída com sucesso!`);
    } catch (error: any) {
      console.error('❌ Erro ao excluir fatura:', error);
      throw error;
    }
  }

  // ============================================================
  // INTEGRAÇÃO RM VIA API
  // ============================================================

  async integrarFaturasViaApi(notaIds: number[], configuracaoId?: number): Promise<IntegracaoRmApiResponse> {
    console.log('📤 Integrando via API - Notas:', notaIds.length);
    
    const response = await api.post('/rm-api/integrar', {
      notaIds,
      configuracaoId
    });
    
    return response.data;
  }

  async integrarFaturasViaApiAutomatico(notaIds: number[]): Promise<IntegracaoRmApiResponse> {
    console.log('🤖 Integrando via API (automático) - Notas:', notaIds.length);
    
    const response = await api.post('/rm-api/integrar/automatico', {
      notaIds
    });
    
    return response.data;
  }

  async testarConexaoApi(config: {
    wsUrl: string;
    wsUsername: string;
    wsPassword: string;
    wsColigada: string;
    wsSistema: string;
    wsUsuario: string;
  }): Promise<boolean> {
    console.log('🧪 Testando conexão com WebService');
    
    const response = await api.post('/rm-api/testar-conexao', config);
    return response.data;
  }
}

export default new FaturamentoService();