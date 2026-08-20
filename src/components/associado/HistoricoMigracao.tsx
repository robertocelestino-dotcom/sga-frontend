// src/components/associado/HistoricoMigracao.tsx

import React, { useState, useEffect } from 'react';
import migracaoReguaService, { HistoricoMigracaoDTO } from '../../services/migracaoReguaService';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';

interface HistoricoMigracaoProps {
  associadoId: number;
}

const HistoricoMigracao: React.FC<HistoricoMigracaoProps> = ({ associadoId }) => {
  const { showToast } = useMessage();
  const [historico, setHistorico] = useState<HistoricoMigracaoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  useEffect(() => {
    carregarHistorico();
  }, [associadoId]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      console.log('📡 Carregando histórico de migrações para associado:', associadoId);
      const data = await migracaoReguaService.buscarHistorico(associadoId);
      console.log('📥 Histórico carregado:', data);
      setHistorico(data);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      showToast('Erro ao carregar histórico de migrações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCESSO': return 'bg-green-100 text-green-800';
      case 'ERRO': return 'bg-red-100 text-red-800';
      case 'CANCELADO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCESSO': return '✅';
      case 'ERRO': return '❌';
      case 'CANCELADO': return '⏹️';
      default: return '📄';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const historicoFiltrado = filtroStatus === 'TODOS' 
    ? historico 
    : historico.filter(item => item.status === filtroStatus);

  const statusOptions = ['TODOS', ...new Set(historico.map(item => item.status))];

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loading />
        <p className="text-gray-500 mt-2">Carregando histórico...</p>
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">📭</p>
        <p>Nenhuma migração de régua registrada</p>
        <p className="text-sm text-gray-400 mt-1">
          As migrações de régua serão registradas aqui
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm text-gray-600">Status:</span>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filtroStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'TODOS' ? 'Todos' : status}
              {status !== 'TODOS' && (
                <span className="ml-1 text-xs">
                  ({historico.filter(h => h.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-auto">
          Total: {historicoFiltrado.length} registros
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Faturas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {historicoFiltrado.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {formatDate(item.dataMigracao)}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="font-medium">{item.usuario}</span>
                </td>
                <td className="px-3 py-2 text-xs">
                  {item.reguaOrigemNome || '-'}
                </td>
                <td className="px-3 py-2 text-xs font-medium">
                  {item.reguaDestinoNome || '-'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                    <span>{getStatusIcon(item.status)}</span>
                    <span>{item.status}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate" title={item.motivo || ''}>
                  {item.motivo || '-'}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {item.faturasPendentes > 0 ? (
                    <span className="text-yellow-600">
                      {item.faturasPendentes}
                      {item.migracaoForcada && ' ⚠️'}
                    </span>
                  ) : (
                    <span className="text-green-600">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg flex flex-wrap justify-between text-xs text-gray-500">
        <span>Total de migrações: {historico.length}</span>
        <span>
          Sucessos: {historico.filter(h => h.status === 'SUCESSO').length} | 
          Erros: {historico.filter(h => h.status === 'ERRO').length}
        </span>
        <span>
          Migrações forçadas: {historico.filter(h => h.migracaoForcada).length}
        </span>
      </div>
    </div>
  );
};

export default HistoricoMigracao;