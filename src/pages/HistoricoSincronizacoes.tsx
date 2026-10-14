// src/pages/HistoricoSincronizacoes.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import EmptyState from '../components/ui/EmptyState';
import api from '../services/api';

interface Sincronizacao {
  id: number;
  dataInicio: string;
  dataFim: string;
  codigoAssociado: string;
  totalAssociados: number;
  totalRegistros: number;
  status: string;
  usuario: string;
  dataSincronizacao: string;
  observacao: string;
}

const HistoricoSincronizacoes: React.FC = () => {
  // ✅ FIX: adiciona showConfirm ao useMessage
  const { showToast, showConfirm } = useMessage();

  const [loading, setLoading] = useState(false);
  const [sincronizacoes, setSincronizacoes] = useState<Sincronizacao[]>([]);
  const [desfazendo, setDesfazendo] = useState<number | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);

  /* ============================================================
     FORMATADORES
     ============================================================ */
  const formatarData = (data: string) => {
    if (!data) return '-';
    const partes = data.split('T')[0].split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatarDataHora = (data: string) => {
    if (!data) return '-';
    const partes = data.split('T');
    const dataPartes = partes[0].split('-');
    const horaPartes = partes[1].split('.')[0].split(':');
    return `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]} ${horaPartes[0]}:${horaPartes[1]}`;
  };

  /* ============================================================
     CARREGAR HISTÓRICO
     ============================================================ */
  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sincronizacoes', {
        params: { page: paginaAtual - 1, size: itensPorPagina },
      });
      setSincronizacoes(response.data.content || []);
      setTotalRegistros(response.data.totalElements || 0);
      setTotalPaginas(response.data.totalPages || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      showToast('⚠️ Erro ao carregar histórico de sincronizações', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     ✅ FIX: substitui window.confirm() pelo showConfirm() do useMessage
     ============================================================ */
  const handleDesfazer = async (sincronizacao: Sincronizacao) => {
    try {
      // 1) Verificação prévia (backend)
      const verificacao = await api.get(
        `/sincronizacoes/${sincronizacao.id}/pode-desfazer`
      );

      if (!verificacao.data.podeDesfazer) {
        showToast(`⚠️ ${verificacao.data.motivo}`, 'warning');
        return;
      }

      // 2) Confirmação com modal CDL
      const confirmado = await showConfirm({
        title: '🗑️ Desfazer Sincronização',
        message:
          `Tem certeza que deseja desfazer a sincronização?\n\n` +
          `📅 Período: ${formatarData(sincronizacao.dataInicio)} à ${formatarData(sincronizacao.dataFim)}\n` +
          `👥 Associados: ${sincronizacao.totalAssociados}\n` +
          `📝 Registros: ${sincronizacao.totalRegistros}\n\n` +
          `⚠️ Esta ação removerá todos os dados sincronizados.`,
        confirmText: 'Sim, desfazer',
        cancelText: 'Cancelar',
        type: 'danger',
      });

      if (!confirmado) return;

      // 3) Executa o delete
      setDesfazendo(sincronizacao.id);
      const response = await api.delete(`/sincronizacoes/${sincronizacao.id}`);

      if (response.data.success) {
        showToast(`✅ ${response.data.message}`, 'success');
        await carregarHistorico();
      } else {
        showToast(`⚠️ ${response.data.message}`, 'warning');
      }
    } catch (error) {
      console.error('❌ Erro ao desfazer sincronização:', error);
      showToast('⚠️ Erro ao desfazer sincronização', 'error');
    } finally {
      setDesfazendo(null);
    }
  };

  /* ============================================================
     PAGINAÇÃO
     ============================================================ */
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;

  useEffect(() => {
    carregarHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Histórico de Sincronizações" />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700 flex items-center gap-2">
              <span>📋</span> Histórico de Sincronizações
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Visualize e gerencie as sincronizações realizadas
            </p>
          </div>
          <button
            onClick={carregarHistorico}
            disabled={loading}
            className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2
                       font-medium transition-all active:scale-[.98]"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Carregando...
              </>
            ) : '🔄 Atualizar'}
          </button>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : sincronizacoes.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nenhuma sincronização realizada"
            description="As sincronizações aparecerão aqui após a primeira execução."
            compact
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {[
                      { label: 'ID',          align: 'left' },
                      { label: 'Período',     align: 'left' },
                      { label: 'Código',      align: 'left' },
                      { label: 'Associados',  align: 'center' },
                      { label: 'Registros',   align: 'center' },
                      { label: 'Data Sinc.',  align: 'left' },
                      { label: 'Status',      align: 'left' },
                      { label: 'Ações',       align: 'center' },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          h.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sincronizacoes.map((sinc) => (
                    <tr key={sinc.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-cdl-navy-700">
                        {sinc.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatarData(sinc.dataInicio)} à {formatarData(sinc.dataFim)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-cdl-navy-700">
                        {sinc.codigoAssociado || 'Todos'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-cdl-navy-700">
                        {sinc.totalAssociados}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {sinc.totalRegistros}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatarDataHora(sinc.dataSincronizacao)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sinc.status === 'CONCLUIDO'
                            ? 'bg-cdl-green-100 text-cdl-green-700'
                            : sinc.status === 'CANCELADO'
                              ? 'bg-cdl-danger-50 text-cdl-danger-500'
                              : 'bg-cdl-yellow-100 text-cdl-yellow-700'
                        }`}>
                          {sinc.status || 'CONCLUIDO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sinc.status !== 'CANCELADO' ? (
                          <button
                            onClick={() => handleDesfazer(sinc)}
                            disabled={desfazendo === sinc.id}
                            className="px-3 py-1.5 bg-cdl-danger-50 text-cdl-danger-500 rounded-lg
                                       hover:bg-cdl-danger-100 disabled:opacity-50 disabled:cursor-not-allowed
                                       transition-colors text-sm flex items-center gap-1 mx-auto font-medium"
                          >
                            {desfazendo === sinc.id ? (
                              <>
                                <span className="inline-block w-3 h-3 rounded-full border-2 border-cdl-danger-500 border-t-transparent animate-spin" />
                                Desfazendo...
                              </>
                            ) : (
                              <>🗑️ Desfazer</>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Cancelado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando <strong className="text-cdl-navy-700">{indexPrimeiroItem + 1}</strong> -{' '}
                  <strong className="text-cdl-navy-700">
                    {Math.min(indexUltimoItem, totalRegistros)}
                  </strong>{' '}
                  de <strong className="text-cdl-navy-700">{totalRegistros}</strong> registros
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                               transition-colors text-sm"
                    title="Primeira página"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                               transition-colors text-sm"
                  >
                    ◀ Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página <strong className="text-cdl-navy-700">{paginaAtual}</strong> de{' '}
                    <strong className="text-cdl-navy-700">{totalPaginas}</strong>
                  </span>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                               transition-colors text-sm"
                  >
                    Próxima ▶
                  </button>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                               transition-colors text-sm"
                    title="Última página"
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoricoSincronizacoes;