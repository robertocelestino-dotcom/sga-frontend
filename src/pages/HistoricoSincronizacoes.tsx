// src/pages/HistoricoSincronizacoes.tsx

import React, { useState, useEffect } from 'react';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
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
  const { showToast } = useMessage();
  const [loading, setLoading] = useState(false);
  const [sincronizacoes, setSincronizacoes] = useState<Sincronizacao[]>([]);
  const [desfazendo, setDesfazendo] = useState<number | null>(null);
  
  // 🔥 PAGINAÇÃO
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalRegistros, setTotalRegistros] = useState(0);

  // 🔥 FORMATAR DATA
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

  // 🔥 CARREGAR HISTÓRICO
  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sincronizacoes', {
        params: {
          page: paginaAtual - 1,
          size: itensPorPagina
        }
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

  // 🔥 DESFAZER SINCRONIZAÇÃO
  const handleDesfazer = async (sincronizacao: Sincronizacao) => {
    // 🔥 VERIFICAR SE PODE DESFAZER
    try {
      const verificacao = await api.get(`/sincronizacoes/${sincronizacao.id}/pode-desfazer`);
      
      if (!verificacao.data.podeDesfazer) {
        showToast(`⚠️ ${verificacao.data.motivo}`, 'warning');
        return;
      }
      
      // 🔥 CONFIRMAR
      if (!confirm(
        `⚠️ Tem certeza que deseja desfazer a sincronização?\n\n` +
        `Período: ${formatarData(sincronizacao.dataInicio)} à ${formatarData(sincronizacao.dataFim)}\n` +
        `Associados: ${sincronizacao.totalAssociados}\n` +
        `Registros: ${sincronizacao.totalRegistros}\n\n` +
        `Esta ação removerá todos os dados sincronizados.`
      )) {
        return;
      }
      
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

  // 🔥 PAGINAÇÃO
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;

  useEffect(() => {
    carregarHistorico();
  }, [paginaAtual]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Histórico de Sincronizações" />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📋 Histórico de Sincronizações</h1>
            <p className="text-gray-600 text-sm mt-1">
              Visualize e gerencie as sincronizações realizadas
            </p>
          </div>
          <button
            onClick={carregarHistorico}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? 'Carregando...' : '🔄 Atualizar'}
          </button>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : sincronizacoes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">Nenhuma sincronização realizada</p>
            <p className="text-sm text-gray-400 mt-1">As sincronizações aparecerão aqui após a primeira execução</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Associados</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Registros</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Sinc.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sincronizacoes.map((sinc) => (
                    <tr key={sinc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{sinc.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatarData(sinc.dataInicio)} à {formatarData(sinc.dataFim)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {sinc.codigoAssociado || 'Todos'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{sinc.totalAssociados}</td>
                      <td className="px-4 py-3 text-center">{sinc.totalRegistros}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatarDataHora(sinc.dataSincronizacao)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sinc.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
                          sinc.status === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sinc.status || 'CONCLUIDO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sinc.status !== 'CANCELADO' && (
                          <button
                            onClick={() => handleDesfazer(sinc)}
                            disabled={desfazendo === sinc.id}
                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors text-sm flex items-center gap-1 mx-auto"
                          >
                            {desfazendo === sinc.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                ...
                              </>
                            ) : (
                              '🗑️ Desfazer'
                            )}
                          </button>
                        )}
                        {sinc.status === 'CANCELADO' && (
                          <span className="text-xs text-gray-400">Cancelado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 🔥 PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {indexPrimeiroItem + 1} - {Math.min(indexUltimoItem, totalRegistros)} de {totalRegistros} registros
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ◀ Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    Próxima ▶
                  </button>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
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