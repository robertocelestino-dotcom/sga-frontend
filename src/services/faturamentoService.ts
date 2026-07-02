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
  itens: FaturaItemDTO[];
}

export interface PageableFatura {
  content: FaturaResumoDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// 🔥 INTERFACE PARA RESULTADO DA EXPORTAÇÃO RM COM METADADOS
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

class FaturamentoService {
  
  async listarFaturas(page: number, size: number, filters?: {
    numeroFatura?: string;
    associadoNome?: string;
    status?: string;
    mes?: number;
    ano?: number;
  }): Promise<PageableFatura> {
    const params: any = {
      page,
      size,
      sort: 'dataEmissao,desc'
    };
    
    // 🔥 GARANTIR QUE OS FILTROS SÃO ENVIADOS CORRETAMENTE
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
  
  // ========== EXPORTAÇÃO RM ==========
  
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
  
  // 🔥 MÉTODO ATUALIZADO - RETORNA METADADOS + BLOB
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
  
  // 🔥 MÉTODO LEGADO - MANTIDO PARA COMPATIBILIDADE
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

  // 🔥 ADICIONAR ESTES MÉTODOS
  async adicionarItemFatura(faturaId: number, item: {
    codigoProduto: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
  }): Promise<any> {
    // VALIDAR PARÂMETROS
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
    tipoLancamento?: string; // 🔥 ADICIONAR ESTE CAMPO
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
      tipoLancamento: item.tipoLancamento || 'D' // 🔥 DEFINIR PADRÃO
    });
    
    return response.data;
  }

  /**
   * 🔥 EXCLUIR FATURA
   * Apenas faturas com status PENDENTE ou SIMULADO podem ser excluídas
   */
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

}

export default new FaturamentoService();