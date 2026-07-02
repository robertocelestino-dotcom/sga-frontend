// src/components/faturamento/ModalResultadoExportacaoRm.tsx

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '../ui/Modal';
import { useMessage } from '../../providers/MessageProvider';
import { gerarNomeArquivoExcel, gerarNomeArquivoRm } from '../../utils/exportUtils';
import { formatDateWithoutTimezone, formatDateTimeWithoutTimezone, formatCurrency } from '../../utils/formatUtils';

// Interfaces
interface FaturaItem {
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface ResultadoExportacaoItem {
  faturaId: number;
  numeroFatura: string;
  numeroRps: number;
  status: string;
  mensagem?: string;
  associadoNome: string;
  codigoRm?: string;
  codigoSpc?: string;
  cnpjCpf: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  itens?: FaturaItem[];
}

interface ModalResultadoExportacaoRmProps {
  isOpen: boolean;
  onClose: () => void;
  resultado: {
    loteId: number;
    totalFaturas: number;
    faturasProcessadas: number;
    faturasComErro: number;
    faturasIgnoradas?: number;
    faturasIgnoradasIds?: number[];
    valorTotalIgnorado?: number;
    ultimoNumeroRps: number;
    primeiroNumeroRps?: number;
    dataProcessamento: string;
    mesReferencia?: string;
    anoReferencia?: string;
    valorTotal?: number;
    nomeArquivo?: string;
    detalhes: ResultadoExportacaoItem[];
  } | null;
  onBaixarArquivo?: () => void;
}

const ModalResultadoExportacaoRm: React.FC<ModalResultadoExportacaoRmProps> = ({
  isOpen,
  onClose,
  resultado,
  onBaixarArquivo
}) => {
  const { showToast } = useMessage();
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [gerandoExcel, setGerandoExcel] = useState(false);

  if (!isOpen || !resultado) return null;

  // 🔥 USAR FUNÇÕES DO formatUtils
  const formatDate = formatDateWithoutTimezone;
  const formatDateTime = formatDateTimeWithoutTimezone;

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'SUCESSO': '✅ Sucesso',
      'ERRO': '❌ Erro',
      'PAGA': '✅ Paga',
      'PENDENTE': '⏳ Pendente',
      'CANCELADA': '❌ Cancelada',
      'EM_PROCESSAMENTO': '🔄 Em Processamento'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'SUCESSO': 'bg-green-100 text-green-800',
      'PAGA': 'bg-green-100 text-green-800',
      'ERRO': 'bg-red-100 text-red-800',
      'CANCELADA': 'bg-red-100 text-red-800',
      'PENDENTE': 'bg-yellow-100 text-yellow-800',
      'EM_PROCESSAMENTO': 'bg-blue-100 text-blue-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // 🔥 FUNÇÃO PARA BAIXAR ARQUIVO RM COM NOME PADRONIZADO
  const handleBaixarArquivo = () => {
    if (onBaixarArquivo) {
      onBaixarArquivo();
      return;
    }
    if (resultado?.nomeArquivo) {
      showToast(`📥 Baixando ${resultado.nomeArquivo}...`, 'info');
    }
  };

  // 🔥 1. GERAR LISTAGEM ANALÍTICA (DETALHADA - COM ITENS)
  const gerarListagemAnalitica = () => {
    if (!resultado.detalhes || resultado.detalhes.length === 0) {
      showToast('Nenhuma fatura para exportar', 'warning');
      return;
    }

    setGerandoExcel(true);
    
    try {
      const faturasSucesso = resultado.detalhes.filter(
        item => item.status === 'SUCESSO' || item.status === 'PAGA'
      );

      if (faturasSucesso.length === 0) {
        showToast('Nenhuma fatura com sucesso para exportar', 'warning');
        setGerandoExcel(false);
        return;
      }

      // 🔥 DADOS ANALÍTICOS - UMA LINHA POR ITEM
      const dadosAnaliticos: any[] = [];

      faturasSucesso.forEach((fatura) => {
        // 🔥 CORREÇÃO: Garantir que codigoRm seja exibido corretamente
        const codigoRm = fatura.codigoRm || fatura.associadoId?.toString() || '';
        const codigoSpc = fatura.codigoSpc || '';
        const cnpjCpf = fatura.cnpjCpf || '';
        
        if (fatura.itens && fatura.itens.length > 0) {
          fatura.itens.forEach((item) => {
            dadosAnaliticos.push({
              'Código RM': codigoRm,
              'Código SPC': codigoSpc,
              'CNPJ/CPF': cnpjCpf,
              'Associado': fatura.associadoNome || '',
              'Nº Fatura': fatura.numeroFatura || '',
              'RPS': fatura.numeroRps || 0,
              'Código Produto': item.codigoProduto || '',
              'Descrição': item.descricao || '',
              'Quantidade': item.quantidade || 0,
              'Valor Unitário': item.valorUnitario || 0,
              'Valor Item': item.valorTotal || 0,
              'Valor Total Fatura': fatura.valorTotal || 0,
              'Data Emissão': formatDate(fatura.dataEmissao),
              'Data Vencimento': formatDate(fatura.dataVencimento),
              'Status': fatura.status || '',
            });
          });
        } else {
          dadosAnaliticos.push({
            'Código RM': codigoRm,
            'Código SPC': codigoSpc,
            'CNPJ/CPF': cnpjCpf,
            'Associado': fatura.associadoNome || '',
            'Nº Fatura': fatura.numeroFatura || '',
            'RPS': fatura.numeroRps || 0,
            'Código Produto': '',
            'Descrição': 'SEM ITENS',
            'Quantidade': 0,
            'Valor Unitário': 0,
            'Valor Item': 0,
            'Valor Total Fatura': fatura.valorTotal || 0,
            'Data Emissão': formatDate(fatura.dataEmissao),
            'Data Vencimento': formatDate(fatura.dataVencimento),
            'Status': fatura.status || '',
          });
        }
      });

      const wbAnalitico = XLSX.utils.book_new();
      const wsAnalitico = XLSX.utils.json_to_sheet(dadosAnaliticos);

      wsAnalitico['!cols'] = [
        { wch: 15 }, // Código RM (aumentado)
        { wch: 12 }, // Código SPC
        { wch: 18 }, // CNPJ/CPF
        { wch: 40 }, // Associado
        { wch: 14 }, // Nº Fatura
        { wch: 10 }, // RPS
        { wch: 16 }, // Código Produto
        { wch: 35 }, // Descrição
        { wch: 10 }, // Quantidade
        { wch: 14 }, // Valor Unitário
        { wch: 14 }, // Valor Item
        { wch: 16 }, // Valor Total Fatura
        { wch: 14 }, // Data Emissão
        { wch: 14 }, // Data Vencimento
        { wch: 14 }  // Status
      ];

      XLSX.utils.book_append_sheet(wbAnalitico, wsAnalitico, 'Analítico (Itens)');

      const wboutAnalitico = XLSX.write(wbAnalitico, { bookType: 'xlsx', type: 'binary' });
      const blobAnalitico = new Blob([s2ab(wboutAnalitico)], { type: 'application/octet-stream' });
      
      const nomeAnalitico = gerarNomeArquivoExcel('analitico');
      saveAs(blobAnalitico, nomeAnalitico);

      showToast(`✅ Listagem Analítica gerada: ${nomeAnalitico}`, 'success');
      
    } catch (error) {
      console.error('❌ Erro ao gerar listagem analítica:', error);
      showToast('Erro ao gerar listagem analítica', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  // 🔥 2. GERAR LISTAGEM SINTÉTICA (RESUMIDA - UMA LINHA POR FATURA)
  const gerarListagemSintetica = () => {
    if (!resultado.detalhes || resultado.detalhes.length === 0) {
      showToast('Nenhuma fatura para exportar', 'warning');
      return;
    }

    setGerandoExcel(true);
    
    try {
      const faturasSucesso = resultado.detalhes.filter(
        item => item.status === 'SUCESSO' || item.status === 'PAGA'
      );

      if (faturasSucesso.length === 0) {
        showToast('Nenhuma fatura com sucesso para exportar', 'warning');
        setGerandoExcel(false);
        return;
      }

      // 🔥 DADOS SINTÉTICOS - UMA LINHA POR FATURA
      const dadosSinteticos = faturasSucesso.map((fatura) => {
        // 🔥 CORREÇÃO: Garantir que codigoRm seja exibido corretamente
        const codigoRm = fatura.codigoRm || fatura.associadoId?.toString() || '';
        const codigoSpc = fatura.codigoSpc || '';
        const cnpjCpf = fatura.cnpjCpf || '';
        
        return {
          'Código RM': codigoRm,
          'Código SPC': codigoSpc,
          'CNPJ/CPF': cnpjCpf,
          'Associado': fatura.associadoNome || '',
          'Nº Fatura': fatura.numeroFatura || '',
          'RPS': fatura.numeroRps || 0,
          'Valor Total': fatura.valorTotal || 0,
          'Data Emissão': formatDate(fatura.dataEmissao),
          'Data Vencimento': formatDate(fatura.dataVencimento),
          'Status': fatura.status || '',
          'Qtd Itens': fatura.itens?.length || 0,
        };
      });

      const wbSintetico = XLSX.utils.book_new();
      const wsSintetico = XLSX.utils.json_to_sheet(dadosSinteticos);

      wsSintetico['!cols'] = [
        { wch: 15 }, // Código RM (aumentado)
        { wch: 12 }, // Código SPC
        { wch: 18 }, // CNPJ/CPF
        { wch: 40 }, // Associado
        { wch: 14 }, // Nº Fatura
        { wch: 10 }, // RPS
        { wch: 14 }, // Valor Total
        { wch: 14 }, // Data Emissão
        { wch: 14 }, // Data Vencimento
        { wch: 14 }, // Status
        { wch: 10 }  // Qtd Itens
      ];

      XLSX.utils.book_append_sheet(wbSintetico, wsSintetico, 'Sintético (Faturas)');

      const wboutSintetico = XLSX.write(wbSintetico, { bookType: 'xlsx', type: 'binary' });
      const blobSintetico = new Blob([s2ab(wboutSintetico)], { type: 'application/octet-stream' });
      
      const nomeSintetico = gerarNomeArquivoExcel('sintetico');
      saveAs(blobSintetico, nomeSintetico);

      showToast(`✅ Listagem Sintética gerada: ${nomeSintetico}`, 'success');
      
    } catch (error) {
      console.error('❌ Erro ao gerar listagem sintética:', error);
      showToast('Erro ao gerar listagem sintética', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  // 🔥 3. FUNÇÃO PARA BAIXAR LOG CSV COM CÓDIGO RM
  const baixarLogCsv = () => {
    if (!resultado.detalhes || resultado.detalhes.length === 0) {
      showToast('Nenhuma fatura para exportar', 'warning');
      return;
    }

    try {
      const BOM = "\uFEFF";
      // 🔥 ADICIONAR COLUNA CÓDIGO RM NO CSV
      let csvContent = "Fatura ID;Nº Fatura;RPS;Status;Associado;CNPJ/CPF;Código RM;Código SPC;Valor;Data Emissão;Data Vencimento;Qtd Itens\n";
      
      resultado.detalhes.forEach((item) => {
        const codigoRm = item.codigoRm || item.associadoId?.toString() || '';
        const codigoSpc = item.codigoSpc || '';
        const dataEmissao = formatDate(item.dataEmissao);
        const dataVencimento = formatDate(item.dataVencimento);
        
        csvContent += `${item.faturaId};${item.numeroFatura};${item.numeroRps};${item.status};${item.associadoNome || ''};${item.cnpjCpf || ''};${codigoRm};${codigoSpc};${item.valorTotal || 0};${dataEmissao};${dataVencimento};${item.itens?.length || 0}\n`;
      });
      
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exportacao_rm_lote_${resultado.loteId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('✅ Log CSV exportado', 'success');
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      showToast('Erro ao exportar CSV', 'error');
    }
  };

  // 🔥 FUNÇÃO AUXILIAR: Converter string para ArrayBuffer
  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
  };

  // Calcular totais
  const totalSucesso = resultado.detalhes?.filter(
    item => item.status === 'SUCESSO' || item.status === 'PAGA'
  ).length || 0;

  const totalErro = resultado.detalhes?.filter(
    item => item.status === 'ERRO' || item.status === 'CANCELADA'
  ).length || 0;

  const faturasIgnoradas = resultado.faturasIgnoradas || 0;
  const valorTotalIgnorado = resultado.valorTotalIgnorado || 0;
  const totalSelecionado = (resultado.valorTotal || 0) + valorTotalIgnorado;

  const temDiscrepancia = (resultado.totalFaturas || 0) !== (resultado.faturasProcessadas || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Resultado da Exportação RM" size="xl">
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{resultado.totalFaturas}</div>
            <div className="text-xs text-gray-600">Total Faturas</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{totalSucesso}</div>
            <div className="text-xs text-gray-600">Exportadas</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{totalErro}</div>
            <div className="text-xs text-gray-600">Com Erro</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{resultado.ultimoNumeroRps}</div>
            <div className="text-xs text-gray-600">Último RPS</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(resultado.valorTotal || 0)}</div>
            <div className="text-xs text-gray-600">Valor Exportado</div>
          </div>
        </div>

        {/* Faturas Ignoradas */}
        {faturasIgnoradas > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-yellow-800">⚠️ Faturas Ignoradas</span>
                <span className="ml-2 text-sm text-yellow-700">{faturasIgnoradas} fatura(s)</span>
              </div>
              <div className="text-sm text-yellow-700">
                Valor ignorado: {formatCurrency(valorTotalIgnorado)}
              </div>
            </div>
            {resultado.faturasIgnoradasIds && resultado.faturasIgnoradasIds.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-yellow-600">
                  IDs: {resultado.faturasIgnoradasIds.join(', ')}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Total selecionado: {formatCurrency(totalSelecionado)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Discrepância */}
        {temDiscrepancia && (
          <div className="p-3 bg-orange-50 border border-orange-300 rounded-lg text-sm text-orange-700">
            ⚠️ Discrepância identificada: {resultado.totalFaturas} faturas selecionadas, 
            mas apenas {resultado.faturasProcessadas} processadas. 
            {faturasIgnoradas > 0 && ` ${faturasIgnoradas} faturas foram ignoradas.`}
          </div>
        )}

        {/* Informações do Lote */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg text-sm">
          <p><span className="font-medium">Lote ID:</span> {resultado.loteId}</p>
          <p><span className="font-medium">Data:</span> {formatDateTime(resultado.dataProcessamento)}</p>
          <p><span className="font-medium">RPS Inicial:</span> {resultado.primeiroNumeroRps || 0}</p>
          <p><span className="font-medium">RPS Final:</span> {resultado.ultimoNumeroRps}</p>
          {resultado.mesReferencia && resultado.anoReferencia && (
            <p><span className="font-medium">Período:</span> {resultado.mesReferencia}/{resultado.anoReferencia}</p>
          )}
          {resultado.nomeArquivo && (
            <p><span className="font-medium">Arquivo:</span> <span className="font-mono text-xs">{resultado.nomeArquivo}</span></p>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleBaixarArquivo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            📥 Baixar Arquivo RM
          </button>
          
          <button
            onClick={gerarListagemAnalitica}
            disabled={gerandoExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {gerandoExcel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando...
              </>
            ) : (
              '📊 Analítico (Itens)'
            )}
          </button>

          <button
            onClick={gerarListagemSintetica}
            disabled={gerandoExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            {gerandoExcel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando...
              </>
            ) : (
              '📋 Sintético (Faturas)'
            )}
          </button>

          <button
            onClick={baixarLogCsv}
            className="px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2 text-sm"
          >
            📄 Log CSV
          </button>
        </div>

        {/* Detalhes */}
        <button
          onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {mostrarDetalhes ? '▼' : '▶'} 
          {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes ({resultado.detalhes?.length || 0} faturas)
        </button>

        {mostrarDetalhes && (
          <div className="overflow-x-auto max-h-80 border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">RPS</th>
                  <th className="px-3 py-2 text-left">Fatura</th>
                  <th className="px-3 py-2 text-left">Associado</th>
                  <th className="px-3 py-2 text-left">Código RM</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-3 py-2 text-center">Itens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resultado.detalhes.map((item) => {
                  const codigoRm = item.codigoRm || item.associadoId?.toString() || '';
                  return (
                    <tr key={item.faturaId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{item.numeroRps}</td>
                      <td className="px-3 py-2 font-mono">{item.numeroFatura || '-'}</td>
                      <td className="px-3 py-2 max-w-xs truncate" title={item.associadoNome}>
                        {item.associadoNome || '-'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{codigoRm || '-'}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.valorTotal || 0)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{item.itens?.length || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Mensagens */}
        {totalSucesso > 0 && (
          <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
            ✅ {totalSucesso} fatura(s) exportada(s) com sucesso. 
            {totalErro > 0 && ` ⚠️ ${totalErro} fatura(s) com erro.`}
            {faturasIgnoradas > 0 && ` ⚠️ ${faturasIgnoradas} fatura(s) ignoradas.`}
          </div>
        )}

        {totalErro > 0 && (
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
            ⚠️ {totalErro} fatura(s) apresentaram erro na exportação. Verifique os detalhes acima.
          </div>
        )}

        {faturasIgnoradas > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
            ⚠️ {faturasIgnoradas} fatura(s) foram ignoradas (sem itens ou valor zerado). 
            Valor ignorado: {formatCurrency(valorTotalIgnorado)}
          </div>
        )}

        {/* Botão Fechar */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalResultadoExportacaoRm;