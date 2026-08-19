// src/components/faturamento/ModalLogFatura.tsx

import React, { useState, useEffect } from 'react';
import faturamentoService, { LogFatura } from '../../services/faturamentoService';
import { useMessage } from '../../providers/MessageProvider';

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
  faturaNumero
}) => {
  const { showToast } = useMessage();
  const [logs, setLogs] = useState<LogFatura[]>([]);
  const [logsFiltrados, setLogsFiltrados] = useState<LogFatura[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroNivel, setFiltroNivel] = useState<string>('TODOS');
  const [filtroPasso, setFiltroPasso] = useState<string>('TODOS');
  const [totalLogs, setTotalLogs] = useState<number>(0);

  // 🔥 Carregar logs ao abrir o modal
  useEffect(() => {
    if (isOpen && faturaId) {
      carregarLogs();
    }
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

  // 🔥 Filtrar logs
  useEffect(() => {
    let filtrados = [...logs];
    
    if (filtroNivel !== 'TODOS') {
      filtrados = filtrados.filter(log => log.nivel === filtroNivel);
    }
    
    if (filtroPasso !== 'TODOS') {
      filtrados = filtrados.filter(log => log.passo === filtroPasso);
    }
    
    setLogsFiltrados(filtrados);
  }, [logs, filtroNivel, filtroPasso]);

  // 🔥 Obter níveis únicos para filtro
  const niveis = ['TODOS', ...new Set(logs.map(log => log.nivel))];
  const passos = ['TODOS', ...new Set(logs.map(log => log.passo).filter(Boolean))];

  // 🔥 Cores dos níveis
  const getNivelBadge = (nivel: string) => {
    const cores: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800',
      DEBUG: 'bg-gray-100 text-gray-800'
    };
    return cores[nivel] || 'bg-gray-100 text-gray-800';
  };

  // 🔥 Cores dos passos
  const getPassoBadge = (passo: string) => {
    const cores: Record<string, string> = {
      'INICIO': 'bg-purple-100 text-purple-800',
      'EXTRAIR_PERIODO': 'bg-indigo-100 text-indigo-800',
      'PROCESSAR_NOTAS': 'bg-blue-100 text-blue-800',
      'CALCULAR_ITENS': 'bg-cyan-100 text-cyan-800',
      'ADICIONAR_NOTIFICACOES': 'bg-teal-100 text-teal-800',
      'REMOVER_DUPLICADOS': 'bg-green-100 text-green-800',
      'CRIAR_FATURA': 'bg-emerald-100 text-emerald-800',
      'APLICAR_REGRAS': 'bg-orange-100 text-orange-800',
      'PERSISTIR': 'bg-pink-100 text-pink-800',
      'FINALIZAR': 'bg-gray-100 text-gray-800'
    };
    return cores[passo] || 'bg-gray-100 text-gray-800';
  };

  // 🔥 Exportar logs
  const exportarLogs = () => {
    if (logsFiltrados.length === 0) {
      showToast('Nenhum log para exportar', 'warning');
      return;
    }

    const conteudo = logsFiltrados.map(log => 
      `[${new Date(log.dataHora).toLocaleString('pt-BR')}] ${log.nivel} - ${log.passo || 'N/A'}: ${log.mensagem}`
    ).join('\n');
    
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

  // 🔥 Limpar logs (com confirmação)
  const handleLimparLogs = async () => {
    if (!confirm(`⚠️ Tem certeza que deseja limpar todos os ${totalLogs} logs desta fatura? Esta ação não pode ser desfeita.`)) {
      return;
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              📝 Logs de Processamento
            </h2>
            <p className="text-sm text-gray-500">
              Fatura #{faturaNumero || faturaId} - Total: {totalLogs} registros
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Filtros e Ações */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
          {/* Filtro por Nível */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Nível:</span>
            <select
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {niveis.map(nivel => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Passo */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Passo:</span>
            <select
              value={filtroPasso}
              onChange={(e) => setFiltroPasso(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {passos.map(passo => (
                <option key={passo} value={passo}>{passo || 'N/A'}</option>
              ))}
            </select>
          </div>

          <div className="flex-1"></div>

          {/* Botões de Ação */}
          <button
            onClick={exportarLogs}
            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            📥 Exportar
          </button>
          
          {totalLogs > 0 && (
            <button
              onClick={handleLimparLogs}
              className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
            >
              🗑️ Limpar Logs
            </button>
          )}
        </div>

        {/* Corpo - Lista de Logs */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando logs...</p>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {logs.length === 0 ? (
                <>
                  <p className="text-4xl mb-2">📭</p>
                  <p>Nenhum log encontrado para esta fatura</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Os logs são gerados durante o processamento da fatura
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl mb-2">🔍</p>
                  <p>Nenhum log encontrado para os filtros selecionados</p>
                  <button
                    onClick={() => {
                      setFiltroNivel('TODOS');
                      setFiltroPasso('TODOS');
                    }}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Limpar filtros
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {logsFiltrados.map((log) => (
                <div
                  key={log.id}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
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
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {logsFiltrados.length} de {logs.length} registros
            {filtroNivel !== 'TODOS' || filtroPasso !== 'TODOS' ? ' (filtrados)' : ''}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalLogFatura;