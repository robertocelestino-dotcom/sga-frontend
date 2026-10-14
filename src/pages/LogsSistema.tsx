// src/pages/LogsSistema.tsx - VERSÃO CDL
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import sistemaLogService, { SistemaLog, SistemaLogFiltro } from '../services/sistemaLogService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { useMessage } from '../providers/MessageProvider';

/* ============================================================
   DEBOUNCE HOOK
   ============================================================ */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const LogsSistema: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useMessage();

  /* ---------------- ESTADOS ---------------- */
  const [logs, setLogs] = useState<SistemaLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputValues, setInputValues] = useState({
    tabela: '', acao: '', modulo: '', dataInicio: '', dataFim: '',
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<SistemaLogFiltro>({
    pagina: 0, tamanho: 10,
  });

  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0, totalPages: 0, size: 10, number: 0,
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState<SistemaLog | null>(null);

  const [opcoesTabelas, setOpcoesTabelas] = useState<string[]>([]);
  const [opcoesAcoes, setOpcoesAcoes] = useState<string[]>([]);
  const [opcoesModulos, setOpcoesModulos] = useState<string[]>([]);

  const filtrosAtivosRef = useRef(filtrosAtivos);
  const carregandoRef = useRef(false);

  const debouncedTabela = useDebounce(inputValues.tabela, 500);
  const debouncedAcao = useDebounce(inputValues.acao, 500);
  const debouncedModulo = useDebounce(inputValues.modulo, 500);

  useEffect(() => { filtrosAtivosRef.current = filtrosAtivos; }, [filtrosAtivos]);
  useEffect(() => { carregarOpcoes(); }, []);

  /* ---------------- FILTROS ---------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      const novosFiltros: SistemaLogFiltro = {
        ...filtrosAtivosRef.current,
        pagina: 0,
        tabela: debouncedTabela || undefined,
        acao: debouncedAcao || undefined,
        modulo: debouncedModulo || undefined,
        dataInicio: inputValues.dataInicio || undefined,
        dataFim: inputValues.dataFim || undefined,
      };
      Object.keys(novosFiltros).forEach((key) => {
        if (novosFiltros[key as keyof SistemaLogFiltro] === undefined) {
          delete novosFiltros[key as keyof SistemaLogFiltro];
        }
      });
      setFiltrosAtivos(novosFiltros);
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTabela, debouncedAcao, debouncedModulo, inputValues.dataInicio, inputValues.dataFim]);

  useEffect(() => {
    const timer = setTimeout(() => carregarLogs(filtrosAtivos), 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAtivos]);

  /* ---------------- CARREGAMENTOS ---------------- */
  const carregarOpcoes = async () => {
    try {
      const [tabelas, acoes, modulos] = await Promise.all([
        sistemaLogService.buscarOpcoesTabelas(),
        sistemaLogService.buscarOpcoesAcoes(),
        sistemaLogService.buscarOpcoesModulos(),
      ]);
      setOpcoesTabelas(tabelas);
      setOpcoesAcoes(acoes);
      setOpcoesModulos(modulos);
    } catch (error) {
      console.error('Erro ao carregar opções:', error);
    }
  };

  const carregarLogs = async (filtrosParaUsar: SistemaLogFiltro) => {
    if (carregandoRef.current) return;
    try {
      carregandoRef.current = true;
      setLoading(true);
      const response = await sistemaLogService.buscarLogsComFiltros(filtrosParaUsar);
      if (response && response.content) {
        setLogs(response.content);
        setPaginaInfo({
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          size: response.size || 10,
          number: response.number || 0,
        });
      } else {
        setLogs([]);
        showInfo('Nenhum log encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
      showError('Erro ao carregar logs. Tente novamente.');
      setLogs([]);
    } finally {
      setLoading(false);
      carregandoRef.current = false;
    }
  };

  /* ---------------- HANDLERS ---------------- */
  const handleInputChange = (campo: keyof typeof inputValues, valor: string) =>
    setInputValues((prev) => ({ ...prev, [campo]: valor }));

  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues((prev) => ({ ...prev, [campo]: valor }));
    setFiltrosAtivos((prev) => ({ ...prev, [campo]: valor || undefined, pagina: 0 }));
  };

  const limparFiltros = () => {
    setInputValues({ tabela: '', acao: '', modulo: '', dataInicio: '', dataFim: '' });
    setFiltrosAtivos({ pagina: 0, tamanho: 10 });
    showInfo('Filtros limpos');
  };

  const handleBuscarAgora = () => {
    setFiltrosAtivos({ ...filtrosAtivos, pagina: 0 });
  };

  const handleDetalhesLog = (log: SistemaLog) => {
    setLogSelecionado(log);
    setShowDetalhesModal(true);
  };

  const handleExportarLogs = async () => {
    try {
      const response = await sistemaLogService.buscarLogsComFiltros({
        ...filtrosAtivos, pagina: 0, tamanho: 1000,
      });
      const logsParaExportar = response.content || [];
      if (logsParaExportar.length === 0) {
        showInfo('Nenhum log para exportar com os filtros atuais.');
        return;
      }
      const headers = ['ID','Data/Hora','Tabela','Registro','Ação','Módulo','Usuário','IP','Status','Operação'];
      const rows = logsParaExportar.map((log) => [
        log.id, formatarData(log.dataHora), log.tabelaAfetada,
        log.idRegistro || '', log.acao, log.modulo || 'GERAL',
        log.usuarioNome || 'Sistema', log.enderecoIp || '',
        log.sucesso ? 'Sucesso' : 'Erro', log.operacao || '',
      ]);
      const csvContent = [
        headers.join(';'),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_sistema_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess(`Exportados ${logsParaExportar.length} logs com sucesso!`);
    } catch {
      showError('Erro ao exportar logs. Tente novamente.');
    }
  };

  const handlePaginaChange = (novaPagina: number) => {
    setFiltrosAtivos((prev) => ({ ...prev, pagina: novaPagina }));
  };

  /* ---------------- FORMATADORES ---------------- */
  const formatarData = (dataString: string) => {
    try {
      return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch { return dataString; }
  };

  const getAcaoColor = (acao: string) => {
    const a = acao?.toUpperCase() || '';
    switch (a) {
      case 'CREATE': case 'CRIAR': case 'INSERT':
        return 'bg-cdl-green-100 text-cdl-green-700 border border-cdl-green-100';
      case 'UPDATE': case 'ATUALIZAR':
        return 'bg-cdl-navy-100 text-cdl-navy-700 border border-cdl-navy-100';
      case 'DELETE': case 'EXCLUIR':
        return 'bg-cdl-danger-50 text-cdl-danger-500 border border-cdl-danger-100';
      case 'READ': case 'CONSULTAR': case 'SELECT':
        return 'bg-cdl-neutral-100 text-cdl-neutral-500 border border-cdl-neutral-100';
      case 'ERRO': case 'ERROR': case 'FALHA':
        return 'bg-cdl-danger-500 text-white border border-cdl-danger-600';
      default:
        return 'bg-cdl-yellow-100 text-cdl-yellow-700 border border-cdl-yellow-100';
    }
  };

  const getModuloColor = (modulo: string) => {
    const m = modulo?.toUpperCase() || '';
    const cores: Record<string, string> = {
      ASSOCIADOS: 'bg-cdl-navy-100 text-cdl-navy-700 border border-cdl-navy-200',
      PRODUTOS:   'bg-cdl-yellow-100 text-cdl-yellow-700 border border-cdl-yellow-200',
      VENDEDORES: 'bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100',
      CATEGORIAS: 'bg-cdl-green-100 text-cdl-green-700 border border-cdl-green-200',
      USUARIOS:   'bg-cdl-yellow-50 text-cdl-yellow-700 border border-cdl-yellow-100',
      PLANOS:     'bg-cdl-navy-50 text-cdl-navy-600 border border-cdl-navy-100',
      SISTEMA:    'bg-cdl-neutral-100 text-cdl-neutral-500 border border-cdl-neutral-100',
      IMPORTACAO: 'bg-cdl-yellow-100 text-cdl-yellow-700 border border-cdl-yellow-100',
      FINANCEIRO: 'bg-cdl-green-100 text-cdl-green-700 border border-cdl-green-200',
      LOG:        'bg-cdl-neutral-100 text-cdl-neutral-500 border border-cdl-neutral-100',
      GERAL:      'bg-cdl-neutral-100 text-cdl-neutral-500 border border-cdl-neutral-100',
    };
    return cores[m] || 'bg-cdl-neutral-100 text-cdl-neutral-500 border border-cdl-neutral-100';
  };

  const getStatusColor = (sucesso: boolean) =>
    sucesso
      ? 'bg-cdl-green-100 text-cdl-green-700 border border-cdl-green-200'
      : 'bg-cdl-danger-50 text-cdl-danger-500 border border-cdl-danger-100';

  const isFiltrando =
    debouncedTabela !== inputValues.tabela ||
    debouncedAcao !== inputValues.acao ||
    debouncedModulo !== inputValues.modulo;

  if (loading && logs.length === 0) return <Loading />;

  /* ---------------- RENDER ---------------- */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb
        links={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Logs do Sistema' },
        ]}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Logs do Sistema</h1>
          <p className="text-gray-600">
            Total: <strong className="text-cdl-navy-700">{paginaInfo.totalElements}</strong> log(s) | Exibindo:{' '}
            {logs.length}
            {isFiltrando && <span className="ml-2 text-cdl-navy-600 text-sm">(buscando...)</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg hover:bg-cdl-navy-50 flex items-center gap-2 transition-colors font-medium"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <button
            onClick={() => carregarLogs(filtrosAtivos)}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg hover:bg-cdl-navy-100 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 transition-colors font-medium"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>

          <button
            onClick={handleExportarLogs}
            className="px-4 py-2 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                       flex items-center gap-2 font-medium transition-all active:scale-[.98]"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-cdl border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cdl-navy-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={handleBuscarAgora}
                disabled={loading}
                className="px-3 py-1.5 bg-cdl-navy-700 text-white text-sm rounded-md
                           hover:bg-cdl-navy-800 disabled:opacity-50 transition-all font-medium"
              >
                🔍 Buscar Agora
              </button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1.5 bg-cdl-neutral-100 text-cdl-navy-700 text-sm rounded-md
                           hover:bg-cdl-neutral-200 transition-colors font-medium"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Tabela */}
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                Tabela
                {inputValues.tabela && debouncedTabela !== inputValues.tabela && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.tabela}
                onChange={(e) => handleSelectChange('tabela', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todas as tabelas</option>
                {opcoesTabelas.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Ação */}
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                Ação
                {inputValues.acao && debouncedAcao !== inputValues.acao && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.acao}
                onChange={(e) => handleSelectChange('acao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todas as ações</option>
                {opcoesAcoes.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Módulo */}
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                Módulo
                {inputValues.modulo && debouncedModulo !== inputValues.modulo && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.modulo}
                onChange={(e) => handleSelectChange('modulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todos os módulos</option>
                {opcoesModulos.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Data Início</label>
              <input
                type="date"
                value={inputValues.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                max={inputValues.dataFim || new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={inputValues.dataFim}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                min={inputValues.dataInicio}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Chips de filtros ativos */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {inputValues.tabela && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100">
                  Tabela: {inputValues.tabela}
                </span>
              )}
              {inputValues.acao && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-green-50 text-cdl-green-700 border border-cdl-green-100">
                  Ação: {inputValues.acao}
                </span>
              )}
              {inputValues.modulo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-100 text-cdl-navy-700 border border-cdl-navy-200">
                  Módulo: {inputValues.modulo}
                </span>
              )}
              {inputValues.dataInicio && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-yellow-100 text-cdl-yellow-700 border border-cdl-yellow-200">
                  De: {inputValues.dataInicio}
                </span>
              )}
              {inputValues.dataFim && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-50 text-cdl-navy-600 border border-cdl-navy-100">
                  Até: {inputValues.dataFim}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-cdl overflow-hidden">
        {loading && logs.length > 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
            <p className="mt-2 text-cdl-navy-700 font-medium">Atualizando lista...</p>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhum log encontrado"
            description={
              Object.values(inputValues).some((v) => v)
                ? 'Tente ajustar os filtros de busca.'
                : 'Nenhum registro de log no sistema.'
            }
            action={
              <button
                onClick={() => setMostrarFiltros(true)}
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                🔍 Mostrar Filtros de Busca
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Data/Hora','Tabela','Ação','Módulo','Usuário','IP','Status'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => handleDetalhesLog(log)}
                      className="hover:bg-cdl-navy-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-cdl-navy-700">
                          {formatarData(log.dataHora)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{log.tabelaAfetada}</div>
                        {log.idRegistro && (
                          <div className="text-xs text-gray-500 font-mono">ID: {log.idRegistro}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAcaoColor(log.acao)}`}>
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModuloColor(log.modulo || 'GERAL')}`}>
                          {log.modulo || 'GERAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.usuarioNome || 'Sistema'}
                        </div>
                        {log.operacao && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {log.operacao}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-cdl-navy-700">
                          {log.enderecoIp || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.sucesso)}`}>
                          {log.sucesso ? '✅ Sucesso' : '❌ Erro'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <strong className="text-cdl-navy-700">{logs.length}</strong> de{' '}
                    <strong className="text-cdl-navy-700">{paginaInfo.totalElements}</strong> logs
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-cdl-navy-700 hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Página <strong className="text-cdl-navy-700">{paginaInfo.number + 1}</strong> de{' '}
                        <strong className="text-cdl-navy-700">{paginaInfo.totalPages}</strong>
                      </span>

                      {paginaInfo.totalPages <= 5 && (
                        <div className="flex gap-1 ml-2">
                          {Array.from({ length: paginaInfo.totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handlePaginaChange(i)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                paginaInfo.number === i
                                  ? 'bg-cdl-navy-700 text-white'
                                  : 'border border-gray-300 text-cdl-navy-700 hover:bg-cdl-navy-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-cdl-navy-700 hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center">
                  <span className="text-sm text-gray-700 mr-2">Itens por página:</span>
                  <select
                    value={paginaInfo.size}
                    onChange={(e) =>
                      setFiltrosAtivos((prev) => ({
                        ...prev,
                        tamanho: parseInt(e.target.value),
                        pagina: 0,
                      }))
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes do log */}
      {showDetalhesModal && logSelecionado && (
        <Modal
          title="📋 Detalhes do Log"
          onClose={() => setShowDetalhesModal(false)}
          size="lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">ID:</p>
                <p className="text-sm font-mono text-cdl-navy-700">{logSelecionado.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Data/Hora:</p>
                <p className="text-sm text-gray-900">{formatarData(logSelecionado.dataHora)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Ação:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAcaoColor(logSelecionado.acao)}`}>
                  {logSelecionado.acao}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Módulo:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModuloColor(logSelecionado.modulo || 'GERAL')}`}>
                  {logSelecionado.modulo || 'GERAL'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Tabela:</p>
                <p className="text-sm text-gray-900">{logSelecionado.tabelaAfetada}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Registro ID:</p>
                <p className="text-sm font-mono text-gray-900">{logSelecionado.idRegistro || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Usuário:</p>
                <p className="text-sm text-gray-900">{logSelecionado.usuarioNome || 'Sistema'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">IP:</p>
                <p className="text-sm font-mono text-cdl-navy-700">{logSelecionado.enderecoIp || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cdl-navy-600">Status:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(logSelecionado.sucesso)}`}>
                  {logSelecionado.sucesso ? '✅ Sucesso' : '❌ Erro'}
                </span>
              </div>
            </div>

            {logSelecionado.operacao && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-cdl-navy-600">Operação:</p>
                <p className="text-sm text-gray-900">{logSelecionado.operacao}</p>
              </div>
            )}

            {logSelecionado.observacao && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-cdl-navy-600">Observação:</p>
                <p className="text-sm text-gray-900">{logSelecionado.observacao}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LogsSistema;