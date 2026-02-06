// src/pages/LogsSistema.tsx - VERSÃO COMPLETA COM BOTÃO DE MOSTRAR/OCULTAR FILTROS
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import sistemaLogService, { SistemaLog, SistemaLogFiltro } from '../services/sistemaLogService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import ConfirmModal from '../components/ui/ConfirmModal';

// Hook de mensagens
let useMessages;
try {
  useMessages = require('../hooks/useMessages').useMessages;
} catch {
  useMessages = () => ({
    showSuccess: (msg: string) => console.log('✅', msg),
    showError: (msg: string) => console.error('❌', msg),
    showInfo: (msg: string) => console.info('💡', msg)
  });
}

// Hook de debounce personalizado
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const LogsSistema: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useMessages();
  
  // Estados principais
  const [logs, setLogs] = useState<SistemaLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para os valores dos inputs
  const [inputValues, setInputValues] = useState({
    tabela: '',
    acao: '',
    modulo: '',
    dataInicio: '',
    dataFim: ''
  });
  
  // Estado para os filtros ativos
  const [filtrosAtivos, setFiltrosAtivos] = useState<SistemaLogFiltro>({
    pagina: 0,
    tamanho: 10
  });
  
  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0
  });
  
  // Estado para mostrar/ocultar filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para modais
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState<SistemaLog | null>(null);
  
  // Opções para selects
  const [opcoesTabelas, setOpcoesTabelas] = useState<string[]>([]);
  const [opcoesAcoes, setOpcoesAcoes] = useState<string[]>([]);
  const [opcoesModulos, setOpcoesModulos] = useState<string[]>([]);
  
  // Referências
  const filtrosAtivosRef = useRef(filtrosAtivos);
  const carregandoRef = useRef(false);
  
  // Aplicar debounce nos campos
  const debouncedTabela = useDebounce(inputValues.tabela, 500);
  const debouncedAcao = useDebounce(inputValues.acao, 500);
  const debouncedModulo = useDebounce(inputValues.modulo, 500);
  
  // Atualizar ref
  useEffect(() => {
    filtrosAtivosRef.current = filtrosAtivos;
  }, [filtrosAtivos]);
  
  // Carregar opções iniciais
  useEffect(() => {
    carregarOpcoes();
  }, []);
  
  // Atualizar filtros com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const novosFiltros: SistemaLogFiltro = {
        ...filtrosAtivosRef.current,
        pagina: 0,
        tabela: debouncedTabela || undefined,
        acao: debouncedAcao || undefined,
        modulo: debouncedModulo || undefined,
        dataInicio: inputValues.dataInicio || undefined,
        dataFim: inputValues.dataFim || undefined
      };
      
      // Remover campos undefined
      Object.keys(novosFiltros).forEach(key => {
        if (novosFiltros[key as keyof SistemaLogFiltro] === undefined) {
          delete novosFiltros[key as keyof SistemaLogFiltro];
        }
      });
      
      setFiltrosAtivos(novosFiltros);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [debouncedTabela, debouncedAcao, debouncedModulo, inputValues.dataInicio, inputValues.dataFim]);
  
  // Carregar logs quando filtros mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarLogs(filtrosAtivos);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [filtrosAtivos]);
  
  const carregarOpcoes = async () => {
    try {
      const [tabelas, acoes, modulos] = await Promise.all([
        sistemaLogService.buscarOpcoesTabelas(),
        sistemaLogService.buscarOpcoesAcoes(),
        sistemaLogService.buscarOpcoesModulos()
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
      
      console.log('📡 Buscando logs com filtros:', filtrosParaUsar);
      
      const response = await sistemaLogService.buscarLogsComFiltros(filtrosParaUsar);
      
      console.log('📊 Resposta da API:', response);
      
      if (response && response.content) {
        setLogs(response.content);
        // Mapeamento correto das propriedades da paginação
        setPaginaInfo({
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          size: response.size || 10,
          number: response.number || 0
        });
        
        console.log('📄 Pagina info atualizada:', {
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          size: response.size,
          number: response.number
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
  
  const handleInputChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    setFiltrosAtivos(prev => ({
      ...prev,
      [campo]: valor || undefined,
      pagina: 0
    }));
  };
  
  const limparFiltros = () => {
    setInputValues({
      tabela: '',
      acao: '',
      modulo: '',
      dataInicio: '',
      dataFim: ''
    });
    
    setFiltrosAtivos({
      pagina: 0,
      tamanho: 10
    });
    
    showInfo('Filtros limpos');
  };
  
  const handleBuscarAgora = () => {
    const novosFiltros: SistemaLogFiltro = {
      ...filtrosAtivos,
      pagina: 0
    };
    setFiltrosAtivos(novosFiltros);
  };
  
  const handleDetalhesLog = (log: SistemaLog) => {
    setLogSelecionado(log);
    setShowDetalhesModal(true);
  };
  
  const handleExportarLogs = async () => {
    try {
      const response = await sistemaLogService.buscarLogsComFiltros({
        ...filtrosAtivos,
        pagina: 0,
        tamanho: 1000
      });
      
      const logsParaExportar = response.content || [];
      
      if (logsParaExportar.length === 0) {
        showInfo('Nenhum log para exportar com os filtros atuais.');
        return;
      }
      
      const headers = ['ID', 'Data/Hora', 'Tabela', 'Registro', 'Ação', 'Módulo', 'Usuário', 'IP', 'Status', 'Operação'];
      const rows = logsParaExportar.map(log => [
        log.id,
        formatarData(log.dataHora),
        log.tabelaAfetada,
        log.idRegistro || '',
        log.acao,
        log.modulo || 'GERAL',
        log.usuarioNome || 'Sistema',
        log.enderecoIp || '',
        log.sucesso ? 'Sucesso' : 'Erro',
        log.operacao || ''
      ]);
      
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
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
    } catch (error) {
      showError('Erro ao exportar logs. Tente novamente.');
    }
  };
  
  const handlePaginaChange = (novaPagina: number) => {
    console.log('📖 Mudando para página:', novaPagina);
    setFiltrosAtivos(prev => ({
      ...prev,
      pagina: novaPagina
    }));
  };
  
  const formatarData = (dataString: string) => {
    try {
      return new Date(dataString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dataString;
    }
  };
  
  // Cores para badges
  const getAcaoColor = (acao: string) => {
    const acaoUpper = acao?.toUpperCase() || '';
    switch (acaoUpper) {
      case 'CREATE': 
      case 'CRIAR':
      case 'INSERT': 
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'UPDATE': 
      case 'ATUALIZAR': 
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'DELETE': 
      case 'EXCLUIR': 
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'READ': 
      case 'CONSULTAR':
      case 'SELECT': 
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'ERRO': 
      case 'ERROR': 
      case 'FALHA':
        return 'bg-red-500 text-white border border-red-600';
      default: 
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    }
  };
  
  const getModuloColor = (modulo: string) => {
    const moduloUpper = modulo?.toUpperCase() || '';
    const cores: Record<string, string> = {
      /*'ASSOCIADO': 'bg-purple-100 text-purple-800 border border-purple-200',*/
      'ASSOCIADOS': 'bg-purple-100 text-purple-800 border border-purple-200',
      /*'PRODUTO': 'bg-pink-100 text-pink-800 border border-pink-200',*/
      'PRODUTOS': 'bg-pink-100 text-pink-800 border border-pink-200',
      /*'VENDEDOR': 'bg-indigo-100 text-indigo-800 border border-indigo-200',*/
      'VENDEDORES': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      /*'CATEGORIA': 'bg-teal-100 text-teal-800 border border-teal-200',*/
      'CATEGORIAS': 'bg-teal-100 text-teal-800 border border-teal-200',
      /*'USUARIO': 'bg-orange-100 text-orange-800 border border-orange-200',*/
      'USUARIOS': 'bg-orange-100 text-orange-800 border border-orange-200',
      /*'PLANO': 'bg-cyan-100 text-cyan-800 border border-cyan-200',*/
      'PLANOS': 'bg-cyan-100 text-cyan-800 border border-cyan-200',
      'SISTEMA': 'bg-gray-100 text-gray-800 border border-gray-200',
      'IMPORTACAO': 'bg-amber-100 text-amber-800 border border-amber-200',
      'FINANCEIRO': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      'LOG': 'bg-slate-100 text-slate-800 border border-slate-200',
      'GERAL': 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return cores[moduloUpper] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };
  
  const getStatusColor = (sucesso: boolean) => {
    return sucesso 
      ? 'bg-green-100 text-green-800 border border-green-200' 
      : 'bg-red-100 text-red-800 border border-red-200';
  };
  
  // Indicador de loading específico para filtros
  const isFiltrando = debouncedTabela !== inputValues.tabela || 
                      debouncedAcao !== inputValues.acao ||
                      debouncedModulo !== inputValues.modulo;
  
  if (loading && logs.length === 0) {
    return <Loading />;
  }
  
  return (
    <div className="p-6">
      <BreadCrumb 
        links={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Logs do Sistema' }
        ]}
      />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Logs do Sistema</h1>
          <p className="text-gray-600">
            Total: {paginaInfo.totalElements} log(s) | Exibindo: {logs.length}
            {isFiltrando && <span className="ml-2 text-blue-600">(buscando...)</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* BOTÃO MOSTRAR/OCULTAR FILTROS - IGUAL AO ASSOCIADOS */}
          <button
            onClick={() => {
              setMostrarFiltros(!mostrarFiltros);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={() => carregarLogs(filtrosAtivos)}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          
          <button
            onClick={handleExportarLogs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Seção de Filtros - CONDICIONAL */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={handleBuscarAgora}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                🔍 Buscar Agora
              </button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Campo: Tabela */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tabela
                {inputValues.tabela && debouncedTabela !== inputValues.tabela && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.tabela}
                onChange={(e) => handleSelectChange('tabela', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todas as tabelas</option>
                {opcoesTabelas.map(tabela => (
                  <option key={tabela} value={tabela}>{tabela}</option>
                ))}
              </select>
            </div>
            
            {/* Campo: Ação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação
                {inputValues.acao && debouncedAcao !== inputValues.acao && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.acao}
                onChange={(e) => handleSelectChange('acao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todas as ações</option>
                {opcoesAcoes.map(acao => (
                  <option key={acao} value={acao}>{acao}</option>
                ))}
              </select>
            </div>
            
            {/* Campo: Módulo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Módulo
                {inputValues.modulo && debouncedModulo !== inputValues.modulo && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <select
                value={inputValues.modulo}
                onChange={(e) => handleSelectChange('modulo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todos os módulos</option>
                {opcoesModulos.map(modulo => (
                  <option key={modulo} value={modulo}>{modulo}</option>
                ))}
              </select>
            </div>
            
            {/* Campo: Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={inputValues.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                max={inputValues.dataFim || new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Campo: Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={inputValues.dataFim}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                min={inputValues.dataInicio}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          {/* Indicadores ativos */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {inputValues.tabela && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Tabela: {inputValues.tabela}
                </span>
              )}
              {inputValues.acao && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ação: {inputValues.acao}
                </span>
              )}
              {inputValues.modulo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Módulo: {inputValues.modulo}
                </span>
              )}
              {inputValues.dataInicio && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  De: {inputValues.dataInicio}
                </span>
              )}
              {inputValues.dataFim && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Até: {inputValues.dataFim}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && logs.length > 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Atualizando lista...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum log encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {Object.values(inputValues).some(v => v) 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Nenhum registro de log no sistema.'}
            </p>
            <button
              onClick={() => setMostrarFiltros(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              🔍 Mostrar Filtros de Busca
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tabela
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleDetalhesLog(log)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatarData(log.dataHora)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{log.tabelaAfetada}</div>
                        {log.idRegistro && (
                          <div className="text-xs text-gray-500">ID: {log.idRegistro}</div>
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
                        <div className="text-sm font-medium text-gray-900">{log.usuarioNome || 'Sistema'}</div>
                        {log.operacao && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {log.operacao}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
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

            {/* PAGINAÇÃO - COMPLETA E FUNCIONAL */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{logs.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> logs
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-700">
                        Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                        <span className="font-medium">{paginaInfo.totalPages}</span>
                      </span>
                      
                      {/* Números de página - opcional */}
                      {paginaInfo.totalPages <= 5 && (
                        <div className="flex gap-1 ml-2">
                          {Array.from({ length: paginaInfo.totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => handlePaginaChange(i)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                                paginaInfo.number === i
                                  ? 'bg-blue-600 text-white'
                                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
                
                {/* Seleção de tamanho de página - opcional */}
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-sm text-gray-700 mr-2">Itens por página:</span>
                  <select
                    value={paginaInfo.size}
                    onChange={(e) => {
                      setFiltrosAtivos(prev => ({
                        ...prev,
                        tamanho: parseInt(e.target.value),
                        pagina: 0
                      }));
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
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

      {/* Modal de Detalhes do Log */}
      {showDetalhesModal && logSelecionado && (
        <ConfirmModal
          title="Detalhes do Log"
          isOpen={showDetalhesModal}
          onClose={() => setShowDetalhesModal(false)}
          onConfirm={() => setShowDetalhesModal(false)}
          confirmText="Fechar"
          cancelText={null}
          type="info"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium text-gray-500">ID:</p>
                <p className="text-sm">{logSelecionado.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data/Hora:</p>
                <p className="text-sm">{formatarData(logSelecionado.dataHora)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ação:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAcaoColor(logSelecionado.acao)}`}>
                  {logSelecionado.acao}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Módulo:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModuloColor(logSelecionado.modulo || 'GERAL')}`}>
                  {logSelecionado.modulo || 'GERAL'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Tabela:</p>
                <p className="text-sm">{logSelecionado.tabelaAfetada}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registro ID:</p>
                <p className="text-sm">{logSelecionado.idRegistro || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Usuário:</p>
                <p className="text-sm">{logSelecionado.usuarioNome || 'Sistema'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">IP:</p>
                <p className="text-sm font-mono">{logSelecionado.enderecoIp || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status:</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  logSelecionado.sucesso 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {logSelecionado.sucesso ? '✅ Sucesso' : '❌ Erro'}
                </span>
              </div>
            </div>
            {logSelecionado.operacao && (
              <div>
                <p className="text-sm font-medium text-gray-500">Operação:</p>
                <p className="text-sm">{logSelecionado.operacao}</p>
              </div>
            )}
            {logSelecionado.observacao && (
              <div>
                <p className="text-sm font-medium text-gray-500">Observação:</p>
                <p className="text-sm">{logSelecionado.observacao}</p>
              </div>
            )}
          </div>
        </ConfirmModal>
      )}
    </div>
  );
};

export default LogsSistema;