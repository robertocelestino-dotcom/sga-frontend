// src/components/faturamento/ModalLogFatura.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import faturamentoService, { LogFatura } from '../../services/faturamentoService';
import { useMessage } from '../../providers/MessageProvider';
import EmptyState from '../ui/EmptyState';

interface ModalLogFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  faturaId: number;
  faturaNumero: string;
}

const ModalLogFatura: React.FC<ModalLogFaturaProps> = ({
  isOpen,
  onClose,
  faturaId,
  faturaNumero,
}) => {
  const { showToast } = useMessage();
  const [logs, setLogs] = useState<LogFatura[]>([]);
  const [logsFiltrados, setLogsFiltrados] = useState<LogFatura[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS');
  const [filtroPasso, setFiltroPasso] = useState<string>('TODOS');
  const [totalLogs, setTotalLogs] = useState<number>(0);

  useEffect(() => {
    if (isOpen && faturaId) carregarLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, faturaId]);

  const carregarLogs = async () => {
    setIsLoading(true);
    try {
      const data = await faturamentoService.buscarLogsFatura(faturaId);
      setLogs(data);
      setLogsFiltrados(data);
      setTotalLogs(data.length);
    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      showToast('Erro ao carregar logs da fatura', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtrados = [...logs];
    if (filtroNivel !== 'TODOS') filtrados = filtrados.filter((log) => log.nivel === filtroNivel);
    if (filtroPasso !== 'TODOS') filtrados = filtrados.filter((log) => log.passo === filtroPasso);
    setLogsFiltrados(filtrados);
  }, [logs, filtroNivel, filtroPasso]);

  const niveis = ['TODOS', ...new Set(logs.map((log) => log.nivel))];
  const passos = ['TODOS', ...new Set(logs.map((log) => log.passo).filter(Boolean))];

  const getNivelBadge = (nivel: string) => {
    const cores: Record<string, string> = {
      INFO: 'bg-cdl-navy-100 text-cdl-navy-700',
      WARN: 'bg-cdl-yellow-100 text-cdl-yellow-700',
      ERROR: 'bg-cdl-danger-50 text-cdl-danger-500',
      DEBUG: 'bg-cdl-neutral-100 text-cdl-neutral-500',
    };
    return cores[nivel] || 'bg-cdl-neutral-100 text-cdl-neutral-500';
  };

  const getPassoBadge = (passo: string) => {
    const cores: Record<string, string> = {
      INICIO: 'bg-cdl-navy-100 text-cdl-navy-700',
      EXTRAIR_PERIODO: 'bg-cdl-navy-100 text-cdl-navy-700',
      PROCESSAR_NOTAS: 'bg-cdl-navy-100 text-cdl-navy-700',
      CALCULAR_ITENS: 'bg-cdl-navy-100 text-cdl-navy-700',
      ADICIONAR_NOTIFICACOES: 'bg-cdl-navy-100 text-cdl-navy-700',
      REMOVER_DUPLICADOS: 'bg-cdl-green-100 text-cdl-green-700',
      CRIAR_FATURA: 'bg-cdl-green-100 text-cdl-green-700',
      APLICAR_REGRAS: 'bg-cdl-yellow-100 text-cdl-yellow-700',
      PERSISTIR: 'bg-cdl-navy-100 text-cdl-navy-700',
      FINALIZAR: 'bg-cdl-neutral-100 text-cdl-navy-700',
    };
    return cores[passo] || 'bg-cdl-neutral-100 text-cdl-navy-700';
  };

  const exportarLogs = () => {
    if (logsFiltrados.length === 0) {
      showToast('Nenhum log para exportar', 'warning');
      return;
    }
    const conteudo = logsFiltrados
      .map(
        (log) =>
          `[${new Date(log.dataHora).toLocaleString('pt-BR')}] ${log.nivel} - ${log.passo || 'N/A'}: ${log.mensagem}`
      )
      .join('\n');

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_fatura_${faturaNumero || faturaId}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Log exportado com ${logsFiltrados.length} registros`, 'success');
  };

  const handleLimparLogs = async () => {
    if (!confirm(`⚠️ Tem certeza que deseja limpar todos os ${totalLogs} logs desta fatura? Esta ação não pode ser desfeita.`)) return;
    try {
      const result = await faturamentoService.limparLogsFatura(faturaId);
      showToast(`✅ ${result.logsRemovidos} logs removidos com sucesso`, 'success');
      carregarLogs();
    } catch (error) {
      console.error('❌ Erro ao limpar logs:', error);
      showToast('Erro ao limpar logs', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 flex items-center gap-2">
              <span>📝</span> Logs de Processamento
            </h2>
            <p className="text-xs text-cdl-navy-600 mt-0.5">
              Fatura <span className="font-mono">#{faturaNumero || faturaId}</span> · Total: <strong>{totalLogs}</strong> registros
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filtros e ações */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-200 flex flex-wrap items-center gap-3 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-cdl-navy-700 font-medium">Nível:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors"
            >
              {niveis.map((nivel) => <option key={nivel} value={nivel}>{nivel}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-cdl-navy-700 font-medium">Passo:</span>
            <select
              value={filtroPasso}
              onChange={(e) => setFiltroPasso(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors"
            >
              {passos.map((passo) => <option key={passo} value={passo}>{passo || 'N/A'}</option>)}
            </select>
          </div>

          <div className="flex-1" />

          <button
            onClick={exportarLogs}
            disabled={logsFiltrados.length === 0}
            className="px-4 py-1.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center
                       gap-1.5 font-medium transition-all active:scale-[.98]"
          >
            📥 Exportar
          </button>

          {totalLogs > 0 && (
            <button
              onClick={handleLimparLogs}
              className="px-4 py-1.5 bg-cdl-danger-500 text-white rounded-lg hover:bg-cdl-danger-600
                         text-sm flex items-center gap-1.5 font-medium transition-all active:scale-[.98]"
            >
              🗑️ Limpar
            </button>
          )}
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-cdl-neutral-50">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
              <p className="text-cdl-navy-700 mt-2 text-sm font-medium">Carregando logs...</p>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <EmptyState
              icon={logs.length === 0 ? '📭' : '🔍'}
              title={logs.length === 0 ? 'Nenhum log encontrado' : 'Nenhum log corresponde aos filtros'}
              description={
                logs.length === 0
                  ? 'Os logs são gerados durante o processamento da fatura.'
                  : 'Tente ajustar ou limpar os filtros.'
              }
              action={
                logs.length > 0 ? (
                  <button
                    onClick={() => { setFiltroNivel('TODOS'); setFiltroPasso('TODOS'); }}
                    className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98] text-sm"
                  >
                    🔄 Limpar filtros
                  </button>
                ) : undefined
              }
              compact
            />
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {logsFiltrados.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm
                             hover:shadow-cdl hover:border-cdl-navy-200 transition-all"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(log.dataHora).toLocaleString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getNivelBadge(log.nivel)}`}>
                      {log.nivel}
                    </span>
                    {log.passo && (
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPassoBadge(log.passo)}`}>
                        {log.passo.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-700 whitespace-pre-wrap break-words">
                    {log.mensagem}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex justify-between items-center bg-cdl-neutral-50 shrink-0">
          <span className="text-xs text-gray-500">
            {logsFiltrados.length} de {logs.length} registros
            {filtroNivel !== 'TODOS' || filtroPasso !== 'TODOS' ? ' (filtrados)' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       transition-all active:scale-[.98] font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalLogFatura;