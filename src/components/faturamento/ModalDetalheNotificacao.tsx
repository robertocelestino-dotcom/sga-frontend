// src/components/faturamento/ModalDetalheNotificacao.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { X, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useMessage } from '../../providers/MessageProvider';
import notificacaoService from '../../services/notificacaoService';
import EmptyState from '../ui/EmptyState';

interface NotificacaoDetalhe {
  idRemessa: number;
  tipoEnvio: string;
  competencia: string;
  dataMovimento: string;
  codigoAssociado: number;
  nomeAssociado: string;
  totalRegistrosDigital: number;
  smsSemEnriquecimento: number;
  smsComEnriquecimento: number;
  totalSms: number;
  emailsSemEnriquecimento: number;
  emailsComEnriquecimento: number;
  totalEmail: number;
  cartasEnviadas: number;
  naoEnviada: number;
}

interface ModalDetalheNotificacaoProps {
  isOpen: boolean;
  onClose: () => void;
  notificacao: NotificacaoDetalhe | null;
  dataInicio: Date;
  dataFim: Date;
}

const ModalDetalheNotificacao: React.FC<ModalDetalheNotificacaoProps> = ({
  isOpen,
  onClose,
  notificacao,
  dataInicio,
  dataFim,
}) => {
  const { showToast } = useMessage();
  const [loading, setLoading] = useState(false);
  const [dadosDetalhados, setDadosDetalhados] = useState<any[]>([]);
  const [gerandoExcel, setGerandoExcel] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const formatarData = (data: Date | undefined | null): string => {
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) return 'Data inválida';
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  useEffect(() => {
    if (isOpen && notificacao && notificacao.codigoAssociado) carregarDetalhes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, notificacao]);

  const carregarDetalhes = async () => {
    if (!notificacao) return;
    setLoading(true);
    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);
      const data = await notificacaoService.buscarPorPeriodo(
        dataInicioStr,
        dataFimStr,
        String(notificacao.codigoAssociado)
      );
      setDadosDetalhados(data);
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      showToast('Erro ao carregar detalhes das notificações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totais = dadosDetalhados.reduce(
    (acc, item) => ({
      totalRegistros: acc.totalRegistros + (item.totalRegistrosDigital || 0),
      emailsSemEnriquecimento: acc.emailsSemEnriquecimento + (item.emailsSemEnriquecimento || 0),
      emailsComEnriquecimento: acc.emailsComEnriquecimento + (item.emailsComEnriquecimento || 0),
      totalEmail: acc.totalEmail + (item.totalEmail || 0),
      smsSemEnriquecimento: acc.smsSemEnriquecimento + (item.smsSemEnriquecimento || 0),
      smsComEnriquecimento: acc.smsComEnriquecimento + (item.smsComEnriquecimento || 0),
      totalSms: acc.totalSms + (item.totalSms || 0),
      cartas: acc.cartas + (item.cartasEnviadas || 0),
      naoEnviadas: acc.naoEnviadas + (item.naoEnviada || 0),
    }),
    {
      totalRegistros: 0,
      emailsSemEnriquecimento: 0,
      emailsComEnriquecimento: 0,
      totalEmail: 0,
      smsSemEnriquecimento: 0,
      smsComEnriquecimento: 0,
      totalSms: 0,
      cartas: 0,
      naoEnviadas: 0,
    }
  );

  const dadosAgrupadosPorData = () => {
    const mapa = new Map<string, any>();
    dadosDetalhados.forEach((item) => {
      const chave = item.dataMovimento || item.competencia;
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          competencia: item.competencia,
          dataMovimento: item.dataMovimento,
          totalRegistrosDigital: 0,
          smsSemEnriquecimento: 0,
          smsComEnriquecimento: 0,
          totalSms: 0,
          emailsSemEnriquecimento: 0,
          emailsComEnriquecimento: 0,
          totalEmail: 0,
          cartasEnviadas: 0,
          naoEnviada: 0,
        });
      }
      const g = mapa.get(chave);
      g.totalRegistrosDigital += item.totalRegistrosDigital || 0;
      g.smsSemEnriquecimento += item.smsSemEnriquecimento || 0;
      g.smsComEnriquecimento += item.smsComEnriquecimento || 0;
      g.totalSms += item.totalSms || 0;
      g.emailsSemEnriquecimento += item.emailsSemEnriquecimento || 0;
      g.emailsComEnriquecimento += item.emailsComEnriquecimento || 0;
      g.totalEmail += item.totalEmail || 0;
      g.cartasEnviadas += item.cartasEnviadas || 0;
      g.naoEnviada += item.naoEnviada || 0;
    });
    return Array.from(mapa.values());
  };

  const dadosAgrupados = dadosAgrupadosPorData();

  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  /* ============================ EXCEL ============================ */
  const handleExportarExcel = () => {
    setGerandoExcel(true);
    try {
      const dados = dadosAgrupados.map((item) => ({
        'Competência': item.competencia,
        'Data Movimento': item.dataMovimento ? new Date(item.dataMovimento).toLocaleDateString('pt-BR') : '-',
        'Total Registros': item.totalRegistrosDigital,
        'E-mails Sem Enriquecimento': item.emailsSemEnriquecimento,
        'E-mails Com Enriquecimento': item.emailsComEnriquecimento,
        'Total E-mails': item.totalEmail,
        'SMS Sem Enriquecimento': item.smsSemEnriquecimento,
        'SMS Com Enriquecimento': item.smsComEnriquecimento,
        'Total SMS': item.totalSms,
        'Cartas': item.cartasEnviadas,
        'Não Enviadas': item.naoEnviada,
      }));

      dados.push({
        'Competência': 'TOTAL',
        'Data Movimento': '',
        'Total Registros': totais.totalRegistros,
        'E-mails Sem Enriquecimento': totais.emailsSemEnriquecimento,
        'E-mails Com Enriquecimento': totais.emailsComEnriquecimento,
        'Total E-mails': totais.totalEmail,
        'SMS Sem Enriquecimento': totais.smsSemEnriquecimento,
        'SMS Com Enriquecimento': totais.smsComEnriquecimento,
        'Total SMS': totais.totalSms,
        'Cartas': totais.cartas,
        'Não Enviadas': totais.naoEnviadas || 0,
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dados);
      ws['!cols'] = [
        { wch: 12 }, { wch: 16 }, { wch: 14 },
        { wch: 22 }, { wch: 22 }, { wch: 14 },
        { wch: 20 }, { wch: 20 }, { wch: 14 },
        { wch: 12 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Detalhes Notificações');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const nome = `detalhe_notificacao_${notificacao!.codigoAssociado}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveAs(blob, nome);
      showToast(`✅ Excel exportado: ${nome}`, 'success');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      showToast('Erro ao exportar Excel', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  /* ============================ PDF ============================ */
  const handleExportarPdf = () => {
    setGerandoPdf(true);
    try {
      const conteudo = document.getElementById('conteudo-pdf');
      if (!conteudo) {
        showToast('Erro ao gerar PDF', 'error');
        setGerandoPdf(false);
        return;
      }
      const win = window.open('', '_blank');
      if (!win) {
        showToast('Permita pop-ups para gerar o PDF', 'warning');
        setGerandoPdf(false);
        return;
      }
      const style = `
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1F3A8A; font-size: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #EEF2FB; color: #1F3A8A; font-weight: bold; padding: 8px; border: 1px solid #D9E1F5; text-align: center; }
          td { padding: 6px 8px; border: 1px solid #D9E1F5; text-align: center; }
          .total-row { background: #F5C518; color: #1F3A8A; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 10px; color: #6B7280; text-align: center; }
        </style>
      `;
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalhe Notificação - ${notificacao!.nomeAssociado}</title>
            ${style}
          </head>
          <body>
            <h1>📊 Detalhe das Notificações</h1>
            <p><strong>Associado:</strong> ${notificacao!.nomeAssociado}</p>
            <p><strong>Código:</strong> ${notificacao!.codigoAssociado}</p>
            <p><strong>Período:</strong> ${formatarData(dataInicio)} à ${formatarData(dataFim)}</p>
            <br/>
            ${conteudo.innerHTML}
            <div class="footer">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
          </body>
        </html>
      `;
      win.document.write(html);
      win.document.close();
      setTimeout(() => {
        win.print();
        setGerandoPdf(false);
      }, 500);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showToast('Erro ao gerar PDF', 'error');
      setGerandoPdf(false);
    }
  };

  if (!isOpen || !notificacao) return null;

  const dataInicioValida = dataInicio instanceof Date && !isNaN(dataInicio.getTime());
  const dataFimValida = dataFim instanceof Date && !isNaN(dataFim.getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-6xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 flex items-center gap-2">
            <span>📊</span> Detalhe das Notificações
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
          {/* Info do associado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
            <div>
              <p className="text-xs text-cdl-navy-600 font-medium">Código</p>
              <p className="text-sm font-mono font-semibold text-cdl-navy-700">{notificacao.codigoAssociado}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-cdl-navy-600 font-medium">Associado</p>
              <p className="text-sm font-semibold text-cdl-navy-700">{notificacao.nomeAssociado}</p>
            </div>
            <div>
              <p className="text-xs text-cdl-navy-600 font-medium">Período</p>
              <p className="text-sm font-semibold text-cdl-navy-700">
                {dataInicioValida && dataFimValida
                  ? `${formatarData(dataInicio)} à ${formatarData(dataFim)}`
                  : 'Período não disponível'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-cdl-navy-100 border-t-cdl-navy-700" />
            </div>
          ) : dadosAgrupados.length === 0 ? (
            <EmptyState
              icon="📭"
              title="Nenhum detalhe encontrado"
              description="Não há notificações registradas para este associado no período selecionado."
              compact
            />
          ) : (
            <>
              {/* Tabela */}
              <div id="conteudo-pdf" className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-cdl-navy-50">
                    <tr>
                      <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200">
                        Competência
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200">
                        Data Movimento
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200">
                        Total Registros
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200 bg-cdl-navy-100">
                        E-MAILS
                      </th>
                      <th colSpan={3} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200 bg-cdl-navy-100">
                        SMS
                      </th>
                      <th rowSpan={2} className="px-3 py-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200 bg-cdl-yellow-100">
                        Cartas
                      </th>
                    </tr>
                    <tr>
                      {['Sem Enr.','Com Enr.','Total','Sem Enr.','Com Enr.','Total'].map((h, i) => (
                        <th
                          key={i}
                          className={`px-3 py-1 text-center text-xs font-semibold text-cdl-navy-700 uppercase border border-gray-200 ${
                            i < 3 ? 'bg-cdl-navy-100' : 'bg-cdl-navy-100'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {dadosAgrupados.map((item, index) => (
                      <tr key={index} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-3 py-2 text-center border border-gray-200 text-gray-900">
                          {item.competencia}
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-200 text-gray-900">
                          {item.dataMovimento ? new Date(item.dataMovimento).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-3 py-2 text-center font-medium border border-gray-200 text-cdl-navy-700">
                          {item.totalRegistrosDigital}
                        </td>
                        <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-600">{item.emailsSemEnriquecimento}</td>
                        <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-600">{item.emailsComEnriquecimento}</td>
                        <td className="px-3 py-2 text-center font-medium border border-gray-200 text-cdl-navy-700">{item.totalEmail}</td>
                        <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-600">{item.smsSemEnriquecimento}</td>
                        <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-600">{item.smsComEnriquecimento}</td>
                        <td className="px-3 py-2 text-center font-medium border border-gray-200 text-cdl-navy-700">{item.totalSms}</td>
                        <td className="px-3 py-2 text-center font-medium border border-gray-200 text-cdl-yellow-700">{item.cartasEnviadas}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-cdl-yellow-50 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right border border-gray-200 text-cdl-navy-700">TOTAL</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-700">{totais.totalRegistros}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-700">{totais.emailsSemEnriquecimento}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-700">{totais.emailsComEnriquecimento}</td>
                      <td className="px-3 py-2 text-center font-bold border border-gray-200 text-cdl-navy-700">{totais.totalEmail}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-700">{totais.smsSemEnriquecimento}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-cdl-navy-700">{totais.smsComEnriquecimento}</td>
                      <td className="px-3 py-2 text-center font-bold border border-gray-200 text-cdl-navy-700">{totais.totalSms}</td>
                      <td className="px-3 py-2 text-center font-bold border border-gray-200 text-cdl-yellow-700">{totais.cartas}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Botões */}
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleExportarExcel}
                  disabled={gerandoExcel}
                  className="px-4 py-2.5 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2
                             transition-all active:scale-[.98] font-medium"
                >
                  {gerandoExcel ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <FileSpreadsheet size={18} />
                  )}
                  Exportar Excel
                </button>

                <button
                  onClick={handleExportarPdf}
                  disabled={gerandoPdf}
                  className="px-4 py-2.5 bg-cdl-danger-500 text-white rounded-lg hover:bg-cdl-danger-600
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2
                             transition-all active:scale-[.98] font-medium"
                >
                  {gerandoPdf ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <FileText size={18} />
                  )}
                  Exportar PDF
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 rounded-lg
                             hover:bg-cdl-neutral-50 transition-colors font-medium"
                >
                  Fechar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalDetalheNotificacao;