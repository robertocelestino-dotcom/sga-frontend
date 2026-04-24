// src/services/cancelamentoService.ts

import api from './api';

export interface CancelamentoImportacao {
  codigoAssociado: string;
  descricaoProduto: string;
  produtoPersonalizado?: string;
  valorCancelamento: number;
  quantidadeServicos?: number;
  servicos?: string[];
  status?: string;
  linha?: number;
  erro?: string;
}

class CancelamentoService {
  
  async importarCancelamentos(
    arquivo: File, 
    mes: number, 
    ano: number
  ): Promise<CancelamentoImportacao[]> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('mes', mes.toString());
    formData.append('ano', ano.toString());
    
    const response = await api.post('/cancelamentos/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
  
  async desfazerImportacao(mes: number, ano: number): Promise<void> {
    await api.delete(`/cancelamentos/desfazer/${mes}/${ano}`);
  }
  
  async desfazerImportacaoPorId(importacaoId: number): Promise<void> {
    await api.delete(`/cancelamentos/desfazer/${importacaoId}`);
  }
  
  downloadModelo(): void {
    const instrucoes = [
      '# ============================================================',
      '# INSTRUÇÕES PARA IMPORTAÇÃO DE CANCELAMENTOS:',
      '# - CODIGO: Código SPC do associado (obrigatório)',
      '# - SERVICO1, SERVICO2, SERVICO3, ...: Nomes dos serviços a serem cancelados',
      '# - O sistema irá remover qualquer item da fatura que contenha o nome do serviço',
      '# ============================================================',
      ''
    ];
    
    const cabecalho = ['CODIGO', 'SERVICO1', 'SERVICO2', 'SERVICO3', 'SERVICO4', 'SERVICO5'];
    const exemplos = [
      '17055;HSM;;;',
      '17056;SPC AVISA;;;',
      '17057;NFE;;;',
      '17058;HSM;SPC AVISA;NFE;'
    ];
    
    const conteudo = [...instrucoes, cabecalho.join(';'), ...exemplos].join('\n');
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_cancelamentos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new CancelamentoService();