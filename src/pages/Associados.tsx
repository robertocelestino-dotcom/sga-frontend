// src/pages/Associados.tsx - VERSÃO SEM CARDS DE ESTATÍSTICAS
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
    // Atualiza o ref com os valores atuais
    filtrosAtivosRef.current = filtrosAtivos;
  }, [filtrosAtivos]);

  // 🔴 CORREÇÃO: Efeito separado para atualizar filtros quando inputs mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      const novosFiltros: AssociadoFiltros = {
        ...filtrosAtivosRef.current,
        page: 0, // Sempre voltar para primeira página ao filtrar
        codigoSpc: debouncedCodigoSpc || undefined,
        cnpjCpf: debouncedCnpjCpf || undefined,
        nomeRazao: debouncedNomeRazao || undefined,
        tipoPessoa: inputValues.tipoPessoa || undefined,
        status: inputValues.status || undefined
      };

      // Remover campos undefined
      Object.keys(novosFiltros).forEach(key => {
        if (novosFiltros[key as keyof AssociadoFiltros] === undefined) {
          delete novosFiltros[key as keyof AssociadoFiltros];
        }
      });

      setFiltrosAtivos(novosFiltros);
    }, 50); // Pequeno delay para agrupar atualizações

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
        // Se a resposta for um array direto (sem paginação)
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
    }, 100); // Debounce para evitar chamadas muito rápidas
    
    return () => clearTimeout(timer);
  }, [filtrosAtivos]);

  // 🔴 CORREÇÃO: Carregamento inicial (apenas uma vez)
  useEffect(() => {
    // Carrega dados iniciais
    carregarAssociados({
      page: 0,
      size: 10,
      sort: 'nomeRazao',
      direction: 'asc'
    });
  }, []); // Array vazio = executa apenas uma vez

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
    
    // Para selects, atualizar filtros imediatamente
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
    
    // Dar foco ao campo nome após limpar
    setTimeout(() => {
      if (nomeInputRef.current) {
        nomeInputRef.current.focus();
      }
    }, 100);
  };

  // Busca manual (para quando o usuário quiser forçar uma busca)
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
      // Recarrega os dados
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

  // 🔴 FUNÇÃO CORRIGIDA PARA FORMATAR DATAS
  const formatarData = (dataString?: string): string => {
    if (!dataString || dataString.trim() === '') return '-';
    
    try {
      // Remover qualquer espaço em branco
      const dataLimpa = dataString.trim();
      
      // Caso 1: Data ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
      if (dataLimpa.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(dataLimpa)) {
        const dataObj = new Date(dataLimpa);
        
        if (isNaN(dataObj.getTime())) {
          return '-';
        }
        
        // Usar UTC para consistência
        const dia = String(dataObj.getUTCDate()).padStart(2, '0');
        const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
        const ano = dataObj.getUTCFullYear();
        
        return `${dia}/${mes}/${ano}`;
      }
      
      // Caso 2: Data no formato DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(dataLimpa)) {
        const partes = dataLimpa.split('/');
        if (partes.length === 3) {
          const [dia, mes, ano] = partes;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      // Caso 3: Data no formato YYYY/MM/DD
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(dataLimpa)) {
        const partes = dataLimpa.split('/');
        if (partes.length === 3) {
          const [ano, mes, dia] = partes;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      // Caso 4: Data com formato estranho (ex: "27 15:37:38/01/2026")
      if (dataLimpa.includes(' ')) {
        // Tentar extrair a parte da data
        const match = dataLimpa.match(/(\d{1,2})\s+[^\/]*\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const [, dia, mes, ano] = match;
          return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
        }
      }
      
      console.warn('Formato de data não reconhecido:', dataString);
      return '-';
      
    } catch (error) {
      console.error('Erro ao formatar data:', error, 'Data:', dataString);
      return '-';
    }
  };

  // 🔴 FUNÇÃO ESPECÍFICA PARA DATA DE CADASTRO (com timestamp)
const formatarDataCadastro = (dataString?: string): string => {
  if (!dataString || dataString.trim() === '') return '-';
  
  try {
    // Para data de cadastro, queremos apenas a data, ignorando o horário
    const dataLimpa = dataString.trim();
    
    // Extrair apenas a parte da data
    let dataPart = dataLimpa;
    
    // Se tiver espaço, pegar a parte antes do espaço
    if (dataLimpa.includes(' ')) {
      dataPart = dataLimpa.split(' ')[0];
    }
    
    // Se tiver 'T', pegar a parte antes do 'T'
    if (dataPart.includes('T')) {
      dataPart = dataPart.split('T')[0];
    }
    
    // Parse manual da data no formato YYYY-MM-DD
    const [ano, mes, dia] = dataPart.split('-').map(Number);
    
    if (!ano || !mes || !dia) {
      return formatarData(dataString); // Fallback para a função geral
    }
    
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    
  } catch (error) {
    console.error('Erro ao formatar data de cadastro:', error, 'Data:', dataString);
    return formatarData(dataString); // Fallback
  }
};

const formatarDataFiliacao = (dataString?: string) => {
  if (!dataString || dataString.trim() === '') return '-';
  
  try {
    // Para datas de filiação, que são apenas data sem hora
    // Remover qualquer parte de tempo
    const dataPart = dataString.split('T')[0];
    
    if (!dataPart) return '-';
    
    // Parse manual para evitar problemas de fuso
    const [ano, mes, dia] = dataPart.split('-');
    
    if (!ano || !mes || !dia) return '-';
    
    return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
  } catch {
    return '-';
  }
};

// 🔴 FUNÇÃO PARA DATA DE FILIAÇÃO COM STATUS VISUAL (versão corrigida)
const formatarDataFiliacaoComStatus = (dataString?: string) => {
  const dataFormatada = formatarDataFiliacao(dataString);
  
  if (dataFormatada === '-') {
    return {
      texto: 'Não informada',
      classe: 'text-gray-400 italic'
    };
  }
  
  // Calcular diferença de dias para coloração
  try {
    // Parse da data formatada (DD/MM/YYYY)
    const [diaStr, mesStr, anoStr] = dataFormatada.split('/');
    const dia = parseInt(diaStr);
    const mes = parseInt(mesStr) - 1; // Mês 0-indexed
    const ano = parseInt(anoStr);
    
    const dataFiliacao = new Date(ano, mes, dia);
    const hoje = new Date();
    
    // Zerar horas para comparar apenas datas
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const dataFiliacaoSemHora = new Date(ano, mes, dia);
    
    const diffTempo = hojeSemHora.getTime() - dataFiliacaoSemHora.getTime();
    const diffDias = diffTempo / (1000 * 3600 * 24);
    
    if (diffDias <= 30) {
      // Data recente (últimos 30 dias)
      return {
        texto: dataFormatada,
        classe: 'text-green-600 font-medium'
      };
    } else if (diffDias > 365) {
      // Data antiga (mais de 1 ano)
      return {
        texto: dataFormatada,
        classe: 'text-yellow-600'
      };
    } else {
      // Data normal
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

  // Nova função para formatar data com status visual
  const formatarDataComStatus = (dataString?: string) => {
    //const dataFormatada = formatarData(dataString);
    const dataFormatada = formatarDataFiliacao(dataString);
    
    if (dataFormatada === '-') {
      return {
        texto: 'Não informada',
        classe: 'text-gray-400 italic'
      };
    }
    
    // Verificar se a data é recente (últimos 30 dias)
    try {
      const data = new Date(dataString || '');
      const hoje = new Date();
      const diffTempo = hoje.getTime() - data.getTime();
      const diffDias = diffTempo / (1000 * 3600 * 24);
      
      if (diffDias <= 30) {
        // Data recente (últimos 30 dias)
        return {
          texto: dataFormatada,
          classe: 'text-green-600 font-medium'
        };
      } else if (diffDias > 365) {
        // Data antiga (mais de 1 ano)
        return {
          texto: dataFormatada,
          classe: 'text-yellow-600'
        };
      } else {
        // Data normal
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

  // Atualize a função getStatusColor:
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'I': return 'bg-red-100 text-red-800';
      case 'S': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Cores para tipo pessoa
  const getTipoPessoaColor = (tipo: string) => {
    switch (tipo) {
      case 'F': return 'bg-blue-100 text-blue-800';
      case 'J': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Atualize a função getStatusText:
  const getStatusText = (status: string) => {
    const opcao = associadoOpcoes.status.find(s => s.value === status);
    return opcao ? opcao.label : status;
  };

  // Texto para tipo pessoa
  const getTipoPessoaText = (tipo: string) => {
    const opcao = associadoOpcoes.tipoPessoa.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };

  // Formatar valor
  const formatarValor = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Indicador de loading específico para filtros
  const isFiltrando = debouncedNomeRazao !== inputValues.nomeRazao || 
                      debouncedCodigoSpc !== inputValues.codigoSpc ||
                      debouncedCnpjCpf !== inputValues.cnpjCpf;

  // Loading inicial
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
              // Dar foco ao campo nome quando abrir os filtros
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
          
          <button
            onClick={handleNovoAssociado}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            ➕ Novo Associado
          </button>
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
            {/* Campo: Código SPC */}
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
            
            {/* Campo: CNPJ/CPF */}
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
            
            {/* Campo: Nome/Razão Social */}
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
            
            {/* Campo: Tipo Pessoa */}
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
            
            {/* Campo: Status */}
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
          
          {/* Indicadores ativos */}
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
            <button
              onClick={handleNovoAssociado}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              ➕ Criar Primeiro Associado
            </button>
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
                    {/* ALTERAÇÃO: Data de Cadastro → Data de Filiação */}
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
                    // Formatar data de filiação com status visual
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
                          {/* Informações adicionais */}
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
                        {/* ALTERAÇÃO: Exibir Data de Filiação com formatação especial */}
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerDetalhes(associado.id)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                              title="Ver detalhes"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleEditarAssociado(associado.id)}
                              className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleExcluirAssociado(associado.id, associado.nomeRazao)}
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                              title="Excluir"
                            >
                              🗑️
                            </button>
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