// src/pages/Associados.tsx - VERSÃO COM PERMISSION GUARD

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  associadoService,
  associadoOpcoes,
  AssociadoResumoDTO,
  AssociadoFiltros
} from '../services/associadoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';
import { PermissionGuard } from '../components/PermissionGuard'; // 🔥 ADICIONADO
import { useAuthStore } from '../stores/authStore'; // 🔥 ADICIONADO

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

const AssociadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const { hasPermission } = useAuthStore(); // 🔥 ADICIONADO
  
  // Estados
  const [associados, setAssociados] = useState<AssociadoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para os valores dos inputs (atualiza a cada tecla)
  const [inputValues, setInputValues] = useState({
    codigoSpc: '',
    cnpjCpf: '',
    nomeRazao: '',
    tipoPessoa: '',
    status: ''
  });
  
  // Estado para os filtros ativos (usados na busca)
  const [filtrosAtivos, setFiltrosAtivos] = useState<AssociadoFiltros>({
    page: 0,
    size: 10,
    sort: 'nomeRazao',
    direction: 'asc'
  });
  
  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0
  });
  
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Referências para manter foco
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const codigoSpcInputRef = useRef<HTMLInputElement>(null);

  // Aplicar debounce nos campos de texto (500ms)
  const debouncedNomeRazao = useDebounce(inputValues.nomeRazao, 500);
  const debouncedCodigoSpc = useDebounce(inputValues.codigoSpc, 500);
  const debouncedCnpjCpf = useDebounce(inputValues.cnpjCpf, 500);

  // 🔴 CORREÇÃO: Use um ref para evitar dependência circular
  const filtrosAtivosRef = useRef(filtrosAtivos);
  const carregandoRef = useRef(false);

  // 🔴 CORREÇÃO: Atualizar filtros com debounce e sem criar loop
  useEffect(() => {
    filtrosAtivosRef.current = filtrosAtivos;
  }, [filtrosAtivos]);

  // 🔴 CORREÇÃO: Efeito separado para atualizar filtros quando inputs mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      const novosFiltros: AssociadoFiltros = {
        ...filtrosAtivosRef.current,
        page: 0,
        codigoSpc: debouncedCodigoSpc || undefined,
        cnpjCpf: debouncedCnpjCpf || undefined,
        nomeRazao: debouncedNomeRazao || undefined,
        tipoPessoa: inputValues.tipoPessoa || undefined,
        status: inputValues.status || undefined
      };

      Object.keys(novosFiltros).forEach(key => {
        if (novosFiltros[key as keyof AssociadoFiltros] === undefined) {
          delete novosFiltros[key as keyof AssociadoFiltros];
        }
      });

      setFiltrosAtivos(novosFiltros);
    }, 50);

    return () => clearTimeout(timer);
  }, [debouncedNomeRazao, debouncedCodigoSpc, debouncedCnpjCpf, inputValues.tipoPessoa, inputValues.status]);

  // 🔴 CORREÇÃO: Função de carregamento SEM useCallback
  const carregarAssociados = async (filtrosParaUsar: AssociadoFiltros) => {
    if (carregandoRef.current) return;
    
    try {
      carregandoRef.current = true;
      setLoading(true);
      
      console.log('📡 Carregando associados com filtros:', filtrosParaUsar);
      
      const response = await associadoService.listar(filtrosParaUsar);
      
      if (response && response.content && Array.isArray(response.content)) {
        setAssociados(response.content);
        setPaginaInfo({
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          size: response.size || 10,
          number: response.number || 0
        });
      } else if (Array.isArray(response)) {
        setAssociados(response);
        setPaginaInfo({
          totalElements: response.length,
          totalPages: 1,
          size: 10,
          number: 0
        });
      } else {
        setAssociados([]);
        showToast('Nenhum associado encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao carregar associados:', error);
      showToast('Erro ao carregar associados. Tente novamente.', 'error');
      setAssociados([]);
    } finally {
      setLoading(false);
      carregandoRef.current = false;
    }
  };

  // 🔴 CORREÇÃO: Efeito para carregar quando filtros mudam (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarAssociados(filtrosAtivos);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [filtrosAtivos]);

  // 🔴 CORREÇÃO: Carregamento inicial (apenas uma vez)
  useEffect(() => {
    carregarAssociados({
      page: 0,
      size: 10,
      sort: 'nomeRazao',
      direction: 'asc'
    });
  }, []);

  // Handlers para os inputs
  const handleInputChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Handlers para selects (busca imediata)
  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    setFiltrosAtivos(prev => ({
      ...prev,
      [campo]: valor || undefined,
      page: 0
    }));
  };

  // Limpar todos os filtros
  const limparFiltros = () => {
    setInputValues({
      codigoSpc: '',
      cnpjCpf: '',
      nomeRazao: '',
      tipoPessoa: '',
      status: ''
    });
    
    setFiltrosAtivos({
      page: 0,
      size: 10,
      sort: 'nomeRazao',
      direction: 'asc'
    });
    
    showToast('Filtros limpos', 'info');
    
    setTimeout(() => {
      if (nomeInputRef.current) {
        nomeInputRef.current.focus();
      }
    }, 100);
  };

  // Busca manual
  const handleBuscarAgora = () => {
    const novosFiltros: AssociadoFiltros = {
      ...filtrosAtivos,
      page: 0,
      codigoSpc: inputValues.codigoSpc || undefined,
      cnpjCpf: inputValues.cnpjCpf || undefined,
      nomeRazao: inputValues.nomeRazao || undefined
    };
    setFiltrosAtivos(novosFiltros);
  };

  // Handlers para ações dos associados
  const handleNovoAssociado = () => {
    navigate('/associados/novo');
  };

  const handleEditarAssociado = (id: number) => {
    navigate(`/associados/editar/${id}`);
  };

  const handleVerDetalhes = (id: number) => {
    navigate(`/associados/${id}`);
  };

  const handleMigrarRegua = (id: number) => {
    // Navegar para a tela de migração ou abrir modal
    navigate(`/associados/${id}/migrar-regua`);
  };

  const handleExcluirAssociado = async (id: number, nome: string) => {
    const confirmado = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o associado "${nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmado) return;

    try {
      await associadoService.excluir(id);
      showToast('Associado excluído com sucesso!', 'success');
      carregarAssociados(filtrosAtivos);
    } catch (error: any) {
      console.error('Erro ao excluir associado:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao excluir associado. Verifique se não está em uso.';
      showToast(mensagem, 'error');
    }
  };

  const handlePaginaChange = (novaPagina: number) => {
    setFiltrosAtivos(prev => ({
      ...prev,
      page: novaPagina
    }));
  };

  // Formatar CNPJ/CPF
  const formatarCnpjCpf = (cnpjCpf: string) => {
    if (!cnpjCpf) return '-';
    
    const apenasNumeros = cnpjCpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpjCpf;
  };

  const formatarData = (dataString?: string): string => {
    if (!dataString || dataString.trim() === '') return '-';
    
    try {
      const dataLimpa = dataString.trim();
      
      if (dataLimpa.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
        const dataObj = new Date(dataLimpa);
        
        if (isNaN(dataObj.getTime())) {
          return '-';
        }
        
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const ano = dataObj.getUTCFullYear();
        
        return `${dia}/${mes}/${ano}`;
      }
      
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
        const partes = dataLimpa.split('/');
        if (partes.length === 3) {
          const [dia, mes, ano] = partes;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(dataLimpa)) {
        const partes = dataLimpa.split('/');
        if (partes.length === 3) {
          const [ano, mes, dia] = partes;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      if (dataLimpa.includes(' ')) {
        const match = dataLimpa.match(/(\d{1,2})\s+[^\/]*\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, dia, mes, ano] = match;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      return '-';
      
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data:', dataString);
      return '-';
    }
  };

  const formatarDataCadastro = (dataString?: string): string => {
    if (!dataString || dataString.trim() === '') return '-';
    
    try {
      const dataLimpa = dataString.trim();
      
      let dataPart = dataLimpa;
      
      if (dataLimpa.includes(' ')) {
        dataPart = dataLimpa.split(' ')[0];
      }
      
      if (dataPart.includes('T')) {
        dataPart = dataPart.split('T')[0];
      }
      
      const [ano, mes, dia] = dataPart.split('-').map(Number);
      
      if (!ano || !mes || !dia) {
        return formatarData(dataString);
      }
      
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
      
    } catch (error) {
      console.error('Erro ao formatar data de cadastro:', error, 'Data:', dataString);
      return formatarData(dataString);
    }
  };

  const formatarDataFiliacao = (dataString?: string) => {
    if (!dataString || dataString.trim() === '') return '-';
    
    try {
      const dataPart = dataString.split('T')[0];
      
      if (!dataPart) return '-';
      
      const [ano, mes, dia] = dataPart.split('-');
      
      if (!ano || !mes || !dia) return '-';
      
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    } catch {
      return '-';
    }
  };

  const formatarDataFiliacaoComStatus = (dataString?: string) => {
    const dataFormatada = formatarDataFiliacao(dataString);
    
    if (dataFormatada === '-') {
      return {
        texto: 'Não informada',
        classe: 'text-gray-400 italic'
      };
    }
    
    try {
      const [diaStr, mesStr, anoStr] = dataFormatada.split('/');
      const dia = parseInt(diaStr);
      const mes = parseInt(mesStr) - 1;
      const ano = parseInt(anoStr);
      
      const dataFiliacao = new Date(ano, mes, dia);
      const hoje = new Date();
      
      const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const dataFiliacaoSemHora = new Date(ano, mes, dia);
      
      const diffTempo = hojeSemHora.getTime() - dataFiliacaoSemHora.getTime();
      const diffDias = diffTempo / (1000 * 3600 * 24);
      
      if (diffDias <= 30) {
        return {
          texto: dataFormatada,
          classe: 'text-green-600 font-medium'
        };
      } else if (diffDias > 365) {
        return {
          texto: dataFormatada,
          classe: 'text-yellow-600'
        };
      } else {
        return {
          texto: dataFormatada,
          classe: 'text-gray-600'
        };
      }
    } catch {
      return {
        texto: dataFormatada,
        classe: 'text-gray-600'
      };
    }
  };

  const formatarDataComStatus = (dataString?: string) => {
    const dataFormatada = formatarDataFiliacao(dataString);
    
    if (dataFormatada === '-') {
      return {
        texto: 'Não informada',
        classe: 'text-gray-400 italic'
      };
    }
    
    try {
      const data = new Date(dataString || '');
      const hoje = new Date();
      const diffTempo = hoje.getTime() - data.getTime();
      const diffDias = diffTempo / (1000 * 3600 * 24);
      
      if (diffDias <= 30) {
        return {
          texto: dataFormatada,
          classe: 'text-green-600 font-medium'
        };
      } else if (diffDias > 365) {
        return {
          texto: dataFormatada,
          classe: 'text-yellow-600'
        };
      } else {
        return {
          texto: dataFormatada,
          classe: 'text-gray-600'
        };
      }
    } catch {
      return {
        texto: dataFormatada,
        classe: 'text-gray-600'
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'I': return 'bg-red-100 text-red-800';
      case 'S': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoPessoaColor = (tipo: string) => {
    switch (tipo) {
      case 'F': return 'bg-blue-100 text-blue-800';
      case 'J': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const opcao = associadoOpcoes.status.find(s => s.value === status);
    return opcao ? opcao.label : status;
  };

  const getTipoPessoaText = (tipo: string) => {
    const opcao = associadoOpcoes.tipoPessoa.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };

  const formatarValor = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const isFiltrando = debouncedNomeRazao !== inputValues.nomeRazao || 
                      debouncedCodigoSpc !== inputValues.codigoSpc ||
                      debouncedCnpjCpf !== inputValues.cnpjCpf;

  if (loading && associados.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <BreadCrumb atual="Associados" />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Associados</h1>
          <p className="text-gray-600">
            Total: {paginaInfo.totalElements} associado(s) | Exibindo: {associados.length}
            {isFiltrando && <span className="ml-2 text-blue-600">(buscando...)</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMostrarFiltros(!mostrarFiltros);
              setTimeout(() => {
                if (nomeInputRef.current && mostrarFiltros === false) {
                  nomeInputRef.current.focus();
                }
              }, 100);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={() => carregarAssociados(filtrosAtivos)}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          
          {/* 🔥 NOVO ASSOCIADO - PERMISSION GUARD */}
          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <button
              onClick={handleNovoAssociado}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              ➕ Novo Associado
            </button>
          </PermissionGuard>
          
          {/* 🔥 IMPORTAÇÃO - PERMISSION GUARD */}
          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <button
              onClick={() => navigate('/importacao-associados')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 transition-colors"
            >
              📥 Importar Associados
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Seção de Filtros */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código SPC
                {inputValues.codigoSpc && debouncedCodigoSpc !== inputValues.codigoSpc && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                ref={codigoSpcInputRef}
                type="text"
                value={inputValues.codigoSpc}
                onChange={(e) => handleInputChange('codigoSpc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: SPC001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ/CPF
                {inputValues.cnpjCpf && debouncedCnpjCpf !== inputValues.cnpjCpf && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                type="text"
                value={inputValues.cnpjCpf}
                onChange={(e) => handleInputChange('cnpjCpf', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite CPF ou CNPJ"
              />
              <p className="text-xs text-gray-500 mt-1">
                Busca automática após 0.5s
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome/Razão Social
                {inputValues.nomeRazao && debouncedNomeRazao !== inputValues.nomeRazao && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                ref={nomeInputRef}
                type="text"
                value={inputValues.nomeRazao}
                onChange={(e) => handleInputChange('nomeRazao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite para buscar..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Pessoa</label>
              <select
                value={inputValues.tipoPessoa}
                onChange={(e) => handleSelectChange('tipoPessoa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todos os Tipos</option>
                {associadoOpcoes.tipoPessoa.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={inputValues.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todos os Status</option>
                {associadoOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {inputValues.codigoSpc && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Código SPC: {inputValues.codigoSpc}
                </span>
              )}
              {inputValues.cnpjCpf && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  CNPJ/CPF: {formatarCnpjCpf(inputValues.cnpjCpf)}
                </span>
              )}
              {inputValues.nomeRazao && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Nome: {inputValues.nomeRazao}
                </span>
              )}
              {inputValues.tipoPessoa && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Tipo: {getTipoPessoaText(inputValues.tipoPessoa)}
                </span>
              )}
              {inputValues.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Status: {getStatusText(inputValues.status)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Associados */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && associados.length > 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Atualizando lista...</p>
          </div>
        ) : associados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum associado encontrado</h3>
            <p className="text-gray-600 mb-6">
              {Object.values(inputValues).some(v => v) 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro associado.'}
            </p>
            <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
              <button
                onClick={handleNovoAssociado}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                ➕ Criar Primeiro Associado
              </button>
            </PermissionGuard>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código SPC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome/Razão Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ/CPF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Filiação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {associados.map((associado) => {
                    const dataFiliacaoFormatada = formatarDataComStatus(associado.dataFiliacao);
                    
                    return (
                      <tr 
                        key={associado.id} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {associado.codigoSpc || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {associado.codigoRm || 'Sem código RM'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{associado.nomeRazao}</div>
                          {associado.nomeFantasia && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {associado.nomeFantasia}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {associado.planoNome && (
                              <span className="mr-2">📋 {associado.planoNome}</span>
                            )}
                            {associado.vendedorNome && (
                              <span>👤 {associado.vendedorNome}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatarCnpjCpf(associado.cnpjCpf)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {associado.tipoPessoa === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoPessoaColor(associado.tipoPessoa)}`}>
                            {getTipoPessoaText(associado.tipoPessoa)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(associado.status)}`}>
                            {getStatusText(associado.status)}
                          </span>
                          {associado.faturamentoMinimo && (
                            <div className="text-xs text-gray-500 mt-1">
                              💰 {formatarValor(associado.faturamentoMinimo)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${dataFiliacaoFormatada.classe}`}>
                            {dataFiliacaoFormatada.texto}
                          </div>
                          {associado.dataFiliacao && associado.dataFiliacao !== '-' && (
                            <div className="text-xs text-gray-400">
                              {associado.dataCadastro && (
                                <span title={`Cadastrado em: ${formatarData(associado.dataCadastro)}`}>
                                  📅 Cadastro: {formatarDataCadastro(associado.dataCadastro)}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-1">
                            {/* 🔥 VISUALIZAR - PERMISSION GUARD */}
                            <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                              <button
                                onClick={() => handleVerDetalhes(associado.id)}
                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                                title="Ver detalhes"
                              >
                                👁️
                              </button>
                            </PermissionGuard>

                            {/* 🔥 EDITAR - PERMISSION GUARD */}
                            <PermissionGuard requiredPermissions={['ASSOCIADO_EDIT']}>
                              <button
                                onClick={() => handleEditarAssociado(associado.id)}
                                className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                                title="Editar"
                              >
                                ✏️
                              </button>
                            </PermissionGuard>

                            {/* 🔥 MIGRAR RÉGUA - PERMISSION GUARD */}
                            <PermissionGuard requiredPermissions={['ASSOCIADO_MIGRAR_REGUA']}>
                              <button
                                onClick={() => handleMigrarRegua(associado.id)}
                                className="p-1 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors"
                                title="Migrar Régua"
                              >
                                🔄
                              </button>
                            </PermissionGuard>

                            {/* 🔥 EXCLUIR - PERMISSION GUARD */}
                            <PermissionGuard requiredPermissions={['ASSOCIADO_DELETE']}>
                              <button
                                onClick={() => handleExcluirAssociado(associado.id, associado.nomeRazao)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{associados.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> associados
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                      <span className="font-medium">{paginaInfo.totalPages}</span>
                    </span>
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssociadosPage;