// src/pages/Produtos.tsx - VERSÃO COM DEBOUNCE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  produtoService,
  ProdutoResumoDTO,
  ProdutoFiltros,
  produtoOpcoes
} from '../services/produtoService';
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

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  
  // Estados
  const [produtos, setProdutos] = useState<ProdutoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para os valores dos inputs (atualiza a cada tecla)
  const [inputValues, setInputValues] = useState({
    codigo: '',
    nome: '',
    status: '',
    tipoProduto: '',
    categoria: ''
  });
  
  // Estado para os filtros ativos (usados na busca)
  const [filtrosAtivos, setFiltrosAtivos] = useState<ProdutoFiltros>({
    page: 0,
    size: 10,
    sort: 'nome',
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
  const codigoInputRef = useRef<HTMLInputElement>(null);

  // Aplicar debounce nos campos de texto (500ms)
  const debouncedNome = useDebounce(inputValues.nome, 500);
  const debouncedCodigo = useDebounce(inputValues.codigo, 500);

  // Atualizar filtros ativos quando os valores com debounce mudarem
  useEffect(() => {
    const novosFiltros: ProdutoFiltros = {
      ...filtrosAtivos,
      page: 0, // Sempre voltar para primeira página ao filtrar
      nome: debouncedNome || undefined,
      codigo: debouncedCodigo || undefined,
      status: inputValues.status || undefined,
      tipoProduto: inputValues.tipoProduto || undefined,
      categoria: inputValues.categoria || undefined
    };

    // Remover campos undefined
    Object.keys(novosFiltros).forEach(key => {
      if (novosFiltros[key as keyof ProdutoFiltros] === undefined) {
        delete novosFiltros[key as keyof ProdutoFiltros];
      }
    });

    setFiltrosAtivos(novosFiltros);
  }, [debouncedNome, debouncedCodigo, inputValues.status, inputValues.tipoProduto, inputValues.categoria]);

  // Carregar produtos quando filtrosAtivos mudar
  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await produtoService.listar(filtrosAtivos);
      
      if (response && response.content && Array.isArray(response.content)) {
        setProdutos(response.content);
        setPaginaInfo({
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          size: response.size,
          number: response.number
        });
      } else {
        setProdutos([]);
        showToast('Nenhum produto encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showToast('Erro ao carregar produtos. Tente novamente.', 'error');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtivos, showToast]);

  // Efeito para carregar produtos quando filtrosAtivos mudam
  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

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
      codigo: '',
      nome: '',
      status: '',
      tipoProduto: '',
      categoria: ''
    });
    
    setFiltrosAtivos({
      page: 0,
      size: 10,
      sort: 'nome',
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
    setFiltrosAtivos(prev => ({
      ...prev,
      nome: inputValues.nome || undefined,
      codigo: inputValues.codigo || undefined,
      page: 0
    }));
  };

  // Handlers para ações dos produtos
  const handleNovoProduto = () => {
    navigate('/produtos/novo');
  };

  const handleEditarProduto = (id: number) => {
    navigate(`/produtos/editar/${id}`);
  };

  const handleVerDetalhes = (id: number) => {
    navigate(`/produtos/${id}`);
  };

  const handleExcluirProduto = async (id: number, nome: string) => {
    const confirmado = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o produto "${nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmado) return;

    try {
      await produtoService.excluir(id);
      showToast('Produto excluído com sucesso!', 'success');
      carregarProdutos();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao excluir produto. Verifique se não está em uso.';
      showToast(mensagem, 'error');
    }
  };

  const handlePaginaChange = (novaPagina: number) => {
    setFiltrosAtivos(prev => ({
      ...prev,
      page: novaPagina
    }));
  };

  // Formatar valores monetários
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Cores para status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
      case 'SUSPENSO': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Cores para tipos de produto
  const getTipoProdutoColor = (tipo: string) => {
    switch (tipo) {
      case 'FRANQUIA': return 'bg-purple-100 text-purple-800';
      case 'SERVICO': return 'bg-blue-100 text-blue-800';
      case 'PRODUTO': return 'bg-green-100 text-green-800';
      case 'ASSINATURA': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Indicador de loading específico para filtros
  const isFiltrando = debouncedNome !== inputValues.nome || 
                      debouncedCodigo !== inputValues.codigo;

  // Loading inicial
  if (loading && produtos.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <BreadCrumb atual="Produtos" />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Produtos</h1>
          <p className="text-gray-600">
            Total: {paginaInfo.totalElements} produto(s) | Exibindo: {produtos.length}
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
            onClick={carregarProdutos}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          
          <button
            onClick={handleNovoProduto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            ➕ Novo Produto
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
            {/* Campo: Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
                {inputValues.codigo && debouncedCodigo !== inputValues.codigo && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                ref={codigoInputRef}
                type="text"
                value={inputValues.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ex: PROD001"
              />
            </div>
            
            {/* Campo: Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
                {inputValues.nome && debouncedNome !== inputValues.nome && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                ref={nomeInputRef}
                type="text"
                value={inputValues.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite para buscar..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Busca automática após 0.5s
              </p>
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
                {produtoOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Campo: Tipo de Produto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={inputValues.tipoProduto}
                onChange={(e) => handleSelectChange('tipoProduto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todos os Tipos</option>
                {produtoOpcoes.tipoProduto.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Campo: Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={inputValues.categoria}
                onChange={(e) => handleSelectChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Todas as Categorias</option>
                {produtoOpcoes.categoria.map(opt => (
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
              {inputValues.codigo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Código: {inputValues.codigo}
                </span>
              )}
              {inputValues.nome && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Nome: {inputValues.nome}
                </span>
              )}
              {inputValues.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status: {produtoOpcoes.status.find(s => s.value === inputValues.status)?.label || inputValues.status}
                </span>
              )}
              {inputValues.tipoProduto && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Tipo: {produtoOpcoes.tipoProduto.find(t => t.value === inputValues.tipoProduto)?.label || inputValues.tipoProduto}
                </span>
              )}
              {inputValues.categoria && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Categoria: {produtoOpcoes.categoria.find(c => c.value === inputValues.categoria)?.label || inputValues.categoria}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && produtos.length > 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Atualizando lista...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-6">
              {Object.values(inputValues).some(v => v) 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro produto.'}
            </p>
            <button
              onClick={handleNovoProduto}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              ➕ Criar Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Franquias
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr 
                      key={produto.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {produto.codigo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {produto.nomeCompleto}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatarValor(produto.valorUnitario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoProdutoColor(produto.tipoProduto)}`}>
                          {produto.tipoProduto}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(produto.status)}`}>
                          {produto.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {produto.temFranquia ? (
                          <span className="text-green-600 font-medium">
                            ✅ {produto.totalFranquias} franquia(s)
                          </span>
                        ) : (
                          <span className="text-gray-400">❌ Sem franquia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerDetalhes(produto.id)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditarProduto(produto.id)}
                            className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{produtos.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> produtos
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

export default ProdutosPage;