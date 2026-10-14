// src/components/faturamento/ModalResultadoExportacaoRm.tsx - VERSÃO CDL
import React, { useState } from 'react';
import { X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useMessage } from '../../providers/MessageProvider';
import { gerarNomeArquivoExcel, gerarNomeArquivoRm } from '../../utils/exportUtils';
import { formatDateWithoutTimezone, formatDateTimeWithoutTimezone, formatCurrency } from '../../utils/formatUtils';

// ==================== INTERFACES ====================
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
  associadoId?: number;
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
  onBaixarArquivo,
}) => {
  const { showToast } = useMessage();
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [gerandoExcel, setGerandoExcel] = useState(false);

  if (!isOpen || !resultado) return null;

  const formatDate = formatDateWithoutTimezone;
  const formatDateTime = formatDateTimeWithoutTimezone;

  /* ============================================================
     HELPERS
     ============================================================ */
  const getStatusLabel = (status: string): string => {
    const m: Record<string, string> = {
      SUCESSO: '✅ Sucesso',
      ERRO: '❌ Erro',
      PAGA: '✅ Paga',
      PENDENTE: '⏳ Pendente',
      CANCELADA: '❌ Cancelada',
      EM_PROCESSAMENTO: '🔄 Em Processamento',
    };
    return m[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const m: Record<string, string> = {
      SUCESSO: 'bg-cdl-green-100 text-cdl-green-700',
      PAGA: 'bg-cdl-green-100 text-cdl-green-700',
      ERRO: 'bg-cdl-danger-50 text-cdl-danger-500',
      CANCELADA: 'bg-cdl-danger-50 text-cdl-danger-500',
      PENDENTE: 'bg-cdl-yellow-100 text-cdl-yellow-700',
      EM_PROCESSAMENTO: 'bg-cdl-navy-100 text-cdl-navy-700',
    };
    return m[status] || 'bg-cdl-neutral-100 text-cdl-neutral-500';
  };

  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  /* ============================================================
     BAIXAR ARQUIVO RM
     ============================================================ */
  const handleBaixarArquivo = () => {
    if (onBaixarArquivo) {
      onBaixarArquivo();
      return;
    }
    if (resultado?.nomeArquivo) {
      showToast(`📥 Baixando ${resultado.nomeArquivo}...`, 'info');
    }
  };

  /* ============================================================
     EXCEL ANALÍTICO
     ============================================================ */
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

      const dadosAnaliticos: any[] = [];
      faturasSucesso.forEach((fatura) => {
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

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosAnaliticos);
      ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 14 }, { wch: 10 },
        { wch: 16 }, { wch: 35 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
        { wch: 14 }, { wch: 14 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Analítico (Itens)');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const nome = gerarNomeArquivoExcel('analitico');
      saveAs(blob, nome);
      showToast(`✅ Listagem Analítica gerada: ${nome}`, 'success');
    } catch (error) {
      console.error('❌ Erro ao gerar listagem analítica:', error);
      showToast('Erro ao gerar listagem analítica', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  /* ============================================================
     EXCEL SINTÉTICO
     ============================================================ */
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

      const dadosSinteticos = faturasSucesso.map((fatura) => {
        const codigoRm = fatura.codigoRm || fatura.associadoId?.toString() || '';
        return {
          'Código RM': codigoRm,
          'Código SPC': fatura.codigoSpc || '',
          'CNPJ/CPF': fatura.cnpjCpf || '',
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

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosSinteticos);
      ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 14 },
        { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Sintético (Faturas)');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const nome = gerarNomeArquivoExcel('sintetico');
      saveAs(blob, nome);
      showToast(`✅ Listagem Sintética gerada: ${nome}`, 'success');
    } catch (error) {
      console.error('❌ Erro ao gerar listagem sintética:', error);
      showToast('Erro ao gerar listagem sintética', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  /* ============================================================
     CSV LOG
     ============================================================ */
  const baixarLogCsv = () => {
    if (!resultado.detalhes || resultado.detalhes.length === 0) {
      showToast('Nenhuma fatura para exportar', 'warning');
      return;
    }
    try {
      const BOM = '\uFEFF';
      let csvContent = 'Fatura ID;Nº Fatura;RPS;Status;Associado;CNPJ/CPF;Código RM;Código SPC;Valor;Data Emissão;Data Vencimento;Qtd Itens\n';
      resultado.detalhes.forEach((item) => {
        const codigoRm = item.codigoRm || item.associadoId?.toString() || '';
        csvContent += `${item.faturaId};${item.numeroFatura};${item.numeroRps};${item.status};${item.associadoNome || ''};${item.cnpjCpf || ''};${codigoRm};${item.codigoSpc || ''};${item.valorTotal || 0};${formatDate(item.dataEmissao)};${formatDate(item.dataVencimento)};${item.itens?.length || 0}\n`;
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

  /* ============================================================
     CÁLCULOS
     ============================================================ */
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

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-6xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 flex items-center gap-2">
            <span>📊</span> Resultado da Exportação RM
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">{resultado.totalFaturas}</div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Total Faturas</div>
            </div>
            <div className="bg-cdl-green-50 border border-cdl-green-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-green-700">{totalSucesso}</div>
              <div className="text-xs text-cdl-green-600 mt-0.5 font-medium">Exportadas</div>
            </div>
            <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-danger-500">{totalErro}</div>
              <div className="text-xs text-cdl-danger-500 mt-0.5 font-medium">Com Erro</div>
            </div>
            <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-yellow-700">{resultado.ultimoNumeroRps}</div>
              <div className="text-xs text-cdl-yellow-600 mt-0.5 font-medium">Último RPS</div>
            </div>
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">
                {formatCurrency(resultado.valorTotal || 0)}
              </div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Valor Exportado</div>
            </div>
          </div>

          {/* Ignoradas */}
          {faturasIgnoradas > 0 && (
            <div className="bg-cdl-yellow-50 border border-cdl-yellow-200 p-4 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-cdl-yellow-700">⚠️ Faturas Ignoradas</span>
                  <span className="ml-2 text-sm text-cdl-yellow-600">{faturasIgnoradas} fatura(s)</span>
                </div>
                <div className="text-sm text-cdl-yellow-700">
                  Valor ignorado: <strong>{formatCurrency(valorTotalIgnorado)}</strong>
                </div>
              </div>
              {resultado.faturasIgnoradasIds && resultado.faturasIgnoradasIds.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-cdl-yellow-600">IDs: {resultado.faturasIgnoradasIds.join(', ')}</p>
                  <p className="text-xs text-cdl-yellow-600 mt-1">
                    Total selecionado: <strong>{formatCurrency(totalSelecionado)}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Discrepância */}
          {temDiscrepancia && (
            <div className="p-3 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg text-sm text-cdl-danger-600">
              ⚠️ Discrepância: <strong>{resultado.totalFaturas}</strong> faturas selecionadas, mas apenas{' '}
              <strong>{resultado.faturasProcessadas}</strong> processadas.
              {faturasIgnoradas > 0 && ` ${faturasIgnoradas} faturas ignoradas.`}
            </div>
          )}

          {/* Info do lote */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-cdl-neutral-50 border border-cdl-neutral-100 p-3 rounded-lg text-sm">
            <p><span className="font-medium text-cdl-navy-700">Lote ID:</span> <span className="text-gray-700">{resultado.loteId}</span></p>
            <p><span className="font-medium text-cdl-navy-700">Data:</span> <span className="text-gray-700">{formatDateTime(resultado.dataProcessamento)}</span></p>
            <p><span className="font-medium text-cdl-navy-700">RPS Inicial:</span> <span className="text-gray-700">{resultado.primeiroNumeroRps || 0}</span></p>
            <p><span className="font-medium text-cdl-navy-700">RPS Final:</span> <span className="text-gray-700">{resultado.ultimoNumeroRps}</span></p>
            {resultado.mesReferencia && resultado.anoReferencia && (
              <p><span className="font-medium text-cdl-navy-700">Período:</span> <span className="text-gray-700">{resultado.mesReferencia}/{resultado.anoReferencia}</span></p>
            )}
            {resultado.nomeArquivo && (
              <p><span className="font-medium text-cdl-navy-700">Arquivo:</span> <span className="font-mono text-xs text-gray-700">{resultado.nomeArquivo}</span></p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBaixarArquivo}
              className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         transition-all active:scale-[.98] flex items-center gap-2 text-sm font-medium"
            >
              📥 Baixar Arquivo RM
            </button>

            <button
              onClick={gerarListagemAnalitica}
              disabled={gerandoExcel}
              className="px-4 py-2.5 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                         transition-all active:scale-[.98] disabled:bg-gray-400 disabled:cursor-not-allowed
                         flex items-center gap-2 text-sm font-medium"
            >
              {gerandoExcel ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Gerando...
                </>
              ) : '📊 Analítico (Itens)'}
            </button>

            <button
              onClick={gerarListagemSintetica}
              disabled={gerandoExcel}
              className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         transition-all active:scale-[.98] disabled:bg-gray-400 disabled:cursor-not-allowed
                         flex items-center gap-2 text-sm font-medium"
            >
              {gerandoExcel ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Gerando...
                </>
              ) : '📋 Sintético (Faturas)'}
            </button>

            <button
              onClick={baixarLogCsv}
              className="px-4 py-2.5 border border-cdl-yellow-500 text-cdl-yellow-700 bg-white
                         rounded-lg hover:bg-cdl-yellow-50 transition-colors flex items-center gap-2
                         text-sm font-medium"
            >
              📄 Log CSV
            </button>
          </div>

          {/* Toggle detalhes */}
          <button
            onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
            className="flex items-center gap-2 text-cdl-navy-700 hover:text-cdl-navy-800
                       text-sm font-medium transition-colors"
          >
            {mostrarDetalhes ? '▼' : '▶'}{' '}
            {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes ({resultado.detalhes?.length || 0} faturas)
          </button>

          {/* Tabela detalhes */}
          {mostrarDetalhes && (
            <div className="overflow-x-auto max-h-80 border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-cdl-navy-50 sticky top-0">
                  <tr>
                    {[
                      { label: 'RPS', align: 'left' },
                      { label: 'Fatura', align: 'left' },
                      { label: 'Associado', align: 'left' },
                      { label: 'Código RM', align: 'left' },
                      { label: 'Valor', align: 'right' },
                      { label: 'Status', align: 'center' },
                      { label: 'Itens', align: 'center' },
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                          h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {resultado.detalhes.map((item) => {
                    const codigoRm = item.codigoRm || item.associadoId?.toString() || '';
                    return (
                      <tr key={item.faturaId} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-3 py-2 font-mono text-cdl-navy-700">{item.numeroRps}</td>
                        <td className="px-3 py-2 font-mono text-cdl-navy-700">{item.numeroFatura || '-'}</td>
                        <td className="px-3 py-2 max-w-xs truncate text-gray-900" title={item.associadoNome}>
                          {item.associadoNome || '-'}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{codigoRm || '-'}</td>
                        <td className="px-3 py-2 text-right font-medium text-cdl-navy-700">
                          {formatCurrency(item.valorTotal || 0)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-700">{item.itens?.length || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mensagens resumo */}
          {totalSucesso > 0 && (
            <div className="p-3 bg-cdl-green-50 border border-cdl-green-100 rounded-lg text-sm text-cdl-green-700">
              ✅ <strong>{totalSucesso}</strong> fatura(s) exportada(s) com sucesso.
              {totalErro > 0 && ` ⚠️ ${totalErro} fatura(s) com erro.`}
              {faturasIgnoradas > 0 && ` ⚠️ ${faturasIgnoradas} fatura(s) ignoradas.`}
            </div>
          )}

          {totalErro > 0 && (
            <div className="p-3 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg text-sm text-cdl-danger-600">
              ⚠️ <strong>{totalErro}</strong> fatura(s) apresentaram erro na exportação. Verifique os detalhes acima.
            </div>
          )}

          {faturasIgnoradas > 0 && (
            <div className="p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg text-sm text-cdl-yellow-700">
              ⚠️ <strong>{faturasIgnoradas}</strong> fatura(s) foram ignoradas (sem itens ou valor zerado).
              Valor ignorado: <strong>{formatCurrency(valorTotalIgnorado)}</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end bg-cdl-neutral-50 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       transition-all active:scale-[.98] font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalResultadoExportacaoRm;