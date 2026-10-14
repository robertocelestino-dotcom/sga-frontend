// src/components/associado/HistoricoMigracao.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import migracaoReguaService, { HistoricoMigracaoDTO } from '../../services/migracaoReguaService';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';
import EmptyState from '../ui/EmptyState';

interface HistoricoMigracaoProps {
  associadoId: number;
}

const HistoricoMigracao: React.FC<HistoricoMigracaoProps> = ({ associadoId }) => {
  const { showToast } = useMessage();
  const [historico, setHistorico] = useState<HistoricoMigracaoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  useEffect(() => { carregarHistorico(); /* eslint-disable-next-line */ }, [associadoId]);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      const data = await migracaoReguaService.buscarHistorico(associadoId);
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
      case 'SUCESSO':   return 'bg-cdl-green-100 text-cdl-green-700';
      case 'ERRO':      return 'bg-cdl-danger-50 text-cdl-danger-500';
      case 'CANCELADO': return 'bg-cdl-neutral-100 text-cdl-neutral-500';
      default:          return 'bg-cdl-neutral-100 text-cdl-neutral-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCESSO':   return '✅';
      case 'ERRO':      return '❌';
      case 'CANCELADO': return '⏹️';
      default:          return '📄';
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try { return new Date(dateStr).toLocaleString('pt-BR'); }
    catch { return dateStr; }
  };

  const historicoFiltrado = filtroStatus === 'TODOS'
    ? historico
    : historico.filter((item) => item.status === filtroStatus);

  const statusOptions = ['TODOS', ...new Set(historico.map((item) => item.status))];

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loading />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <EmptyState
        icon="📭"
        title="Nenhuma migração registrada"
        description="As migrações de régua serão registradas aqui quando ocorrerem."
        compact
      />
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-sm font-medium text-cdl-navy-700">Status:</span>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFiltroStatus(status)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all active:scale-[.98] ${
                filtroStatus === status
                  ? 'bg-cdl-navy-700 text-white'
                  : 'bg-cdl-neutral-100 text-cdl-navy-700 hover:bg-cdl-navy-50'
              }`}
            >
              {status === 'TODOS' ? 'Todos' : status}
              {status !== 'TODOS' && (
                <span className="ml-1 text-[10px]">
                  ({historico.filter((h) => h.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>
        <span className="text-sm text-cdl-navy-600 ml-auto font-medium">
          Total: <strong>{historicoFiltrado.length}</strong> registro(s)
        </span>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-cdl-navy-50">
            <tr>
              {['Data','Usuário','Origem','Destino','Status','Motivo','Faturas'].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                    i === 6 ? 'text-center' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {historicoFiltrado.map((item) => (
              <tr key={item.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                <td className="px-3 py-2 text-xs whitespace-nowrap text-gray-700">
                  {formatDate(item.dataMigracao)}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="font-medium text-cdl-navy-700">{item.usuario}</span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  {item.reguaOrigemNome || '-'}
                </td>
                <td className="px-3 py-2 text-xs font-medium text-cdl-navy-700">
                  {item.reguaDestinoNome || '-'}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                    <span>{getStatusIcon(item.status)}</span>
                    <span>{item.status}</span>
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate" title={item.motivo || ''}>
                  {item.motivo || '-'}
                </td>
                <td className="px-3 py-2 text-center text-xs">
                  {item.faturasPendentes > 0 ? (
                    <span className="text-cdl-yellow-700 font-medium">
                      {item.faturasPendentes}
                      {item.migracaoForcada && ' ⚠️'}
                    </span>
                  ) : (
                    <span className="text-cdl-green-700 font-bold">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="mt-4 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg flex flex-wrap justify-between gap-2 text-xs font-medium text-cdl-navy-700">
        <span>
          Total de migrações: <strong>{historico.length}</strong>
        </span>
        <span>
          ✅ Sucessos: <strong>{historico.filter((h) => h.status === 'SUCESSO').length}</strong> |{' '}
          ❌ Erros: <strong>{historico.filter((h) => h.status === 'ERRO').length}</strong>
        </span>
        <span>
          ⚠️ Forçadas: <strong>{historico.filter((h) => h.migracaoForcada).length}</strong>
        </span>
      </div>
    </div>
  );
};

export default HistoricoMigracao;