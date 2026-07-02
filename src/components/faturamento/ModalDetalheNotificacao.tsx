// src/components/faturamento/ModalDetalheNotificacao.tsx
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '../ui/Modal';
import { useMessage } from '../../providers/MessageProvider';
import notificacaoService from '../../services/notificacaoService';
import Loading from '../Loading';

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
  dataFim
}) => {
  const { showToast } = useMessage();
  const [loading, setLoading] = useState(false);
  const [dadosDetalhados, setDadosDetalhados] = useState<any[]>([]);
  const [gerandoExcel, setGerandoExcel] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // 🔥 FORMATAR DATA PARA DD/MM/YYYY (COM VALIDAÇÃO)
  const formatarData = (data: Date | undefined | null): string => {
    if (!data || !(data instanceof Date) || isNaN(data.getTime())) {
      return 'Data inválida';
    }
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Carregar dados detalhados do backend
  useEffect(() => {
    if (isOpen && notificacao && notificacao.codigoAssociado) {
      carregarDetalhes();
    }
  }, [isOpen, notificacao]);

  const carregarDetalhes = async () => {
    if (!notificacao) return;
    setLoading(true);
    try {
      // 🔥 USAR PERÍODO COMPLETO EM VEZ DE MÊS/ANO
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

  if (!isOpen || !notificacao) return null;

  // Calcular totais
  const totais = dadosDetalhados.reduce((acc, item) => ({
    totalRegistros: acc.totalRegistros + (item.totalRegistrosDigital || 0),
    emailsSemEnriquecimento: acc.emailsSemEnriquecimento + (item.emailsSemEnriquecimento || 0),
    emailsComEnriquecimento: acc.emailsComEnriquecimento + (item.emailsComEnriquecimento || 0),
    totalEmail: acc.totalEmail + (item.totalEmail || 0),
    smsSemEnriquecimento: acc.smsSemEnriquecimento + (item.smsSemEnriquecimento || 0),
    smsComEnriquecimento: acc.smsComEnriquecimento + (item.smsComEnriquecimento || 0),
    totalSms: acc.totalSms + (item.totalSms || 0),
    cartas: acc.cartas + (item.cartasEnviadas || 0),
    naoEnviadas: acc.naoEnviadas + (item.naoEnviada || 0)
  }), {
    totalRegistros: 0,
    emailsSemEnriquecimento: 0,
    emailsComEnriquecimento: 0,
    totalEmail: 0,
    smsSemEnriquecimento: 0,
    smsComEnriquecimento: 0,
    totalSms: 0,
    cartas: 0,
    naoEnviadas: 0
  });

  // 🔥 AGRUPAR POR DATA PARA EVITAR DUPLICAÇÃO
  const dadosAgrupadosPorData = () => {
    const mapa = new Map<string, any>();
    
    dadosDetalhados.forEach(item => {
      // Usar a data como string para chave
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
          naoEnviada: 0
        });
      }
      
      const grupo = mapa.get(chave);
      grupo.totalRegistrosDigital += item.totalRegistrosDigital || 0;
      grupo.smsSemEnriquecimento += item.smsSemEnriquecimento || 0;
      grupo.smsComEnriquecimento += item.smsComEnriquecimento || 0;
      grupo.totalSms += item.totalSms || 0;
      grupo.emailsSemEnriquecimento += item.emailsSemEnriquecimento || 0;
      grupo.emailsComEnriquecimento += item.emailsComEnriquecimento || 0;
      grupo.totalEmail += item.totalEmail || 0;
      grupo.cartasEnviadas += item.cartasEnviadas || 0;
      grupo.naoEnviada += item.naoEnviada || 0;
    });
    
    return Array.from(mapa.values());
  };

  const dadosAgrupados = dadosAgrupadosPorData();

  // EXPORTAR EXCEL
  const handleExportarExcel = () => {
    setGerandoExcel(true);
    try {
      const dados = dadosAgrupados.map(item => ({
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
        'Não Enviadas': item.naoEnviada
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
        'Não Enviadas': totais.naoEnviadas || 0
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dados);
      
      ws['!cols'] = [
        { wch: 12 }, { wch: 16 }, { wch: 14 },
        { wch: 22 }, { wch: 22 }, { wch: 14 },
        { wch: 20 }, { wch: 20 }, { wch: 14 },
        { wch: 12 }, { wch: 14 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Detalhes Notificações');
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      
      const nomeArquivo = `detalhe_notificacao_${notificacao.codigoAssociado}_${new Date().toISOString().slice(0,10)}.xlsx`;
      saveAs(blob, nomeArquivo);
      
      showToast(`✅ Excel exportado: ${nomeArquivo}`, 'success');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      showToast('Erro ao exportar Excel', 'error');
    } finally {
      setGerandoExcel(false);
    }
  };

  // EXPORTAR PDF
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
          h1 { color: #1e293b; font-size: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f1f5f9; color: #334155; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; text-align: center; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; }
          .total-row { background: #f8fafc; font-weight: bold; }
          .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      `;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalhe Notificação - ${notificacao.nomeAssociado}</title>
            ${style}
          </head>
          <body>
            <h1>📊 Detalhe das Notificações</h1>
            <p><strong>Associado:</strong> ${notificacao.nomeAssociado}</p>
            <p><strong>Código:</strong> ${notificacao.codigoAssociado}</p>
            <p><strong>Período:</strong> ${formatarData(dataInicio)} à ${formatarData(dataFim)}</p>
            <br/>
            ${conteudo.innerHTML}
            <div class="footer">
              Gerado em: ${new Date().toLocaleString('pt-BR')}
            </div>
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

  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
  };

  // Verificar se as datas são válidas
  const dataInicioValida = dataInicio instanceof Date && !isNaN(dataInicio.getTime());
  const dataFimValida = dataFim instanceof Date && !isNaN(dataFim.getTime());

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📊 Detalhe das Notificações" size="xl">
      <div className="space-y-6">
        {/* Informações do Associado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Código</p>
            <p className="text-sm font-semibold">{notificacao.codigoAssociado}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Associado</p>
            <p className="text-sm font-semibold">{notificacao.nomeAssociado}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Período</p>
            <p className="text-sm font-semibold">
              {dataInicioValida && dataFimValida 
                ? `${formatarData(dataInicio)} à ${formatarData(dataFim)}`
                : 'Período não disponível'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : dadosAgrupados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhum detalhe encontrado para este associado no período</p>
          </div>
        ) : (
          <>
            {/* Tabela de Detalhes */}
            <div id="conteudo-pdf" className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">
                      COMPETÊNCIA
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">
                      DATA MOVIMENTO
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">
                      TOTAL REGISTROS
                    </th>
                    <th colSpan={3} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-blue-50">
                      E-MAILS
                    </th>
                    <th colSpan={3} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-purple-50">
                      SMS
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-yellow-50">
                      CARTAS
                    </th>
                  </tr>
                  <tr>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-blue-50">
                      SEM ENR.
                    </th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-blue-50">
                      COM ENR.
                    </th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-blue-50">
                      TOTAL
                    </th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-purple-50">
                      SEM ENR.
                    </th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-purple-50">
                      COM ENR.
                    </th>
                    <th className="px-3 py-1 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 bg-purple-50">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {dadosAgrupados.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center border border-gray-200">{item.competencia}</td>
                      <td className="px-3 py-2 text-center border border-gray-200">
                        {item.dataMovimento ? new Date(item.dataMovimento).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-medium border border-gray-200">{item.totalRegistrosDigital}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-blue-600">{item.emailsSemEnriquecimento}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-blue-600">{item.emailsComEnriquecimento}</td>
                      <td className="px-3 py-2 text-center font-medium border border-gray-200 text-blue-700">{item.totalEmail}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-purple-600">{item.smsSemEnriquecimento}</td>
                      <td className="px-3 py-2 text-center border border-gray-200 text-purple-600">{item.smsComEnriquecimento}</td>
                      <td className="px-3 py-2 text-center font-medium border border-gray-200 text-purple-700">{item.totalSms}</td>
                      <td className="px-3 py-2 text-center font-medium border border-gray-200 text-yellow-600">{item.cartasEnviadas}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-right border border-gray-200">TOTAL</td>
                    <td className="px-3 py-2 text-center border border-gray-200">{totais.totalRegistros}</td>
                    <td className="px-3 py-2 text-center border border-gray-200 text-blue-600">{totais.emailsSemEnriquecimento}</td>
                    <td className="px-3 py-2 text-center border border-gray-200 text-blue-600">{totais.emailsComEnriquecimento}</td>
                    <td className="px-3 py-2 text-center font-bold border border-gray-200 text-blue-700">{totais.totalEmail}</td>
                    <td className="px-3 py-2 text-center border border-gray-200 text-purple-600">{totais.smsSemEnriquecimento}</td>
                    <td className="px-3 py-2 text-center border border-gray-200 text-purple-600">{totais.smsComEnriquecimento}</td>
                    <td className="px-3 py-2 text-center font-bold border border-gray-200 text-purple-700">{totais.totalSms}</td>
                    <td className="px-3 py-2 text-center font-bold border border-gray-200 text-yellow-600">{totais.cartas}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <button
                onClick={handleExportarExcel}
                disabled={gerandoExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
              >
                {gerandoExcel ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '📊'
                )}
                Exportar Excel
              </button>

              <button
                onClick={handleExportarPdf}
                disabled={gerandoPdf}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
              >
                {gerandoPdf ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '📄'
                )}
                Exportar PDF
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ModalDetalheNotificacao;