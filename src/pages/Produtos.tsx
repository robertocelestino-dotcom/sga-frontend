// src/pages/Produtos.tsx - VERSÃO CORRIGIDA COM FRANQUIA ASSOCIADA
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  produtoService,
  ProdutoResumoDTO,
  ProdutoFiltros,
  produtoOpcoes
} from '../services/produtoService';
import { planoProdutoFranquiaService } from '../services/planoProdutoFranquiaService';
import api from '../services/api';
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

// 🔥 MODAL PARA MOSTRAR FRANQUIA DO PRODUTO - CORRIGIDO
// 🔥 MODAL PARA MOSTRAR FRANQUIA DO PRODUTO - CORRIGIDO
const ModalFranquia: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  produto: any;
  franquia: any;
}> = ({ aberto, onFechar, produto, franquia }) => {
  if (!aberto) return null;

  // Log detalhado do que o modal recebeu
  console.log('🎯 Modal recebeu produto:', produto);
  console.log('   - nome:', produto?.nome);
  console.log('   - codigoRm:', produto?.codigoRm);
  console.log('   - codigo:', produto?.codigo);
  console.log('   - id:', produto?.id);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Franquia do Produto
            </h3>
            <button
              onClick={onFechar}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Produto</label>
            <p className="text-gray-900 font-medium">{produto?.nome}</p>
            <p className="text-sm text-gray-500">
              Código RM: {produto?.codigoRm || produto?.codigo || 'N/A'}
            </p>
            <p className="text-xs text-gray-400 mt-1">ID interno: {produto?.id}</p>
          </div>
          
          {franquia ? (
            <div className="bg-purple-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-purple-700 mb-1">Franquia Associada</label>
              <p className="text-gray-900 font-medium">{franquia.nome}</p>
              <p className="text-sm text-gray-600">
                Código RM: {franquia.codigoRm || franquia.codigo || 'N/A'}
              </p>
              {franquia.limiteFranquia && (
                <p className="text-sm text-gray-600 mt-2">
                  Limite: {franquia.limiteFranquia} consultas
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-500">Este produto não possui franquia associada</p>
              <p className="text-xs text-gray-400 mt-2">
                Código RM: {produto?.codigoRm || produto?.codigo}
              </p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onFechar}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  
  // Estados
  const [produtos, setProdutos] = useState<ProdutoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Estado para o modal de franquia
  const [modalFranquiaAberto, setModalFranquiaAberto] = useState(false);
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<any>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  
  // Estado para os valores dos inputs
  const [inputValues, setInputValues] = useState({
    codigo: '',
    nome: '',
    status: '',
    tipoProduto: '',
    categoria: ''
  });
  
  // Estado para os filtros ativos
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

  // Função para mapear inputValues para ProdutoFiltros
  const mapearFiltros = useCallback((): ProdutoFiltros => {
    const filtros: ProdutoFiltros = {
      page: 0,
      size: filtrosAtivos.size,
      sort: filtrosAtivos.sort,
      direction: filtrosAtivos.direction
    };

    if (debouncedCodigo) {
      filtros.codigoRm = debouncedCodigo;
    }

    if (debouncedNome) {
      filtros.nome = debouncedNome;
    }

    if (inputValues.status) {
      filtros.status = inputValues.status;
    }

    if (inputValues.tipoProduto) {
      filtros.tipoProduto = inputValues.tipoProduto;
    }

    if (inputValues.categoria) {
      filtros.categoria = inputValues.categoria;
    }

    return filtros;
  }, [debouncedCodigo, debouncedNome, inputValues.status, inputValues.tipoProduto, inputValues.categoria, filtrosAtivos.size, filtrosAtivos.sort, filtrosAtivos.direction]);

  useEffect(() => {
    const novosFiltros = mapearFiltros();
    setFiltrosAtivos(prev => ({
      ...prev,
      ...novosFiltros,
      page: 0
    }));
  }, [debouncedNome, debouncedCodigo, inputValues.status, inputValues.tipoProduto, inputValues.categoria, mapearFiltros]);

  // Carregar produtos quando filtrosAtivos mudar
  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando produtos com filtros:', filtrosAtivos);
      
      const response = await produtoService.listar(filtrosAtivos);
      
      if (response && response.content && Array.isArray(response.content)) {
        setProdutos(response.content);
        setPaginaInfo({
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          size: response.size,
          number: response.number
        });
        console.log(`✅ Carregados ${response.content.length} produtos`);
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

  // 🔥 Buscar franquia do produto - VERSÃO FINAL CORRIGIDA
  // 🔥 Buscar franquia do produto - VERSÃO COM LOGS DETALHADOS
const handleVerFranquia = async (produto: ProdutoResumoDTO) => {
  try {
    console.log('🔍 ===== INICIANDO BUSCA DE FRANQUIA =====');
    console.log('📦 Produto original recebido:', produto);
    console.log('📦 Campos do produto original:');
    console.log('   - id:', produto.id);
    console.log('   - codigo:', produto.codigo);
    console.log('   - codigoRm:', produto.codigoRm);
    console.log('   - nome:', produto.nome);
    console.log('   - temFranquia:', produto.temFranquia);
    
    // 🔥 Garantir que o código RM seja priorizado
    const produtoCompleto = {
      ...produto,
      // Forçar codigoRm a ter o valor correto
      codigoRm: produto.codigoRm || produto.codigo,
      // Manter referência ao código original
      codigoOriginal: produto.codigo,
    };
    
    console.log('📦 Produto completo criado:', produtoCompleto);
    console.log('   - codigoRm após correção:', produtoCompleto.codigoRm);
    
    setProdutoSelecionado(produtoCompleto);
    
    // 🔥 Buscar associações na tabela plano_produto_franquia
    console.log('🔍 Buscando associações para produto ID:', produto.id);
    const associacoes = await planoProdutoFranquiaService.listarPorProduto(produto.id);
    console.log('📊 Associações encontradas:', associacoes);
    
    let franquiaEncontrada = null;
    
    if (associacoes && associacoes.length > 0) {
      console.log(`✅ Encontradas ${associacoes.length} associações`);
      
      const primeiraAssoc = associacoes[0];
      console.log('📋 Primeira associação:', primeiraAssoc);
      
      // Tentar obter a franquia
      if (primeiraAssoc.franquia) {
        console.log('✅ Franquia já vem na associação');
        franquiaEncontrada = primeiraAssoc.franquia;
      } 
      else if (primeiraAssoc.franquiaId) {
        console.log('🔍 Buscando franquia por ID:', primeiraAssoc.franquiaId);
        franquiaEncontrada = await produtoService.buscarPorId(primeiraAssoc.franquiaId);
      }
      else if (primeiraAssoc.franquiaNome) {
        console.log('✅ Criando franquia a partir dos dados');
        franquiaEncontrada = {
          id: primeiraAssoc.franquiaId,
          nome: primeiraAssoc.franquiaNome,
          codigoRm: primeiraAssoc.franquiaCodigo,
          codigo: primeiraAssoc.franquiaCodigo,
          limiteFranquia: primeiraAssoc.limiteFranquia,
          periodoFranquia: primeiraAssoc.periodoFranquia
        };
      }
    }
    
    if (franquiaEncontrada) {
      console.log('✅ Franquia encontrada:', franquiaEncontrada);
      setFranquiaSelecionada(franquiaEncontrada);
    } else {
      console.log('❌ Nenhuma franquia encontrada');
      setFranquiaSelecionada(null);
    }
    
    console.log('🔍 Abrindo modal com produto:', produtoCompleto);
    setModalFranquiaAberto(true);
    
  } catch (error) {
    console.error('❌ Erro ao buscar franquia:', error);
    showToast('Erro ao buscar franquia do produto', 'error');
  }
};

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

  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setInputValues({
      codigo: '',
      nome: '',
      status: '',
      tipoProduto: '',
      categoria: ''
    });
    
    showToast('Filtros limpos', 'info');
    
    setTimeout(() => {
      if (nomeInputRef.current) {
        nomeInputRef.current.focus();
      }
    }, 100);
  };

  const handleBuscarAgora = () => {
    carregarProdutos();
  };

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

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
      case 'SUSPENSO': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoProdutoColor = (tipo: string) => {
    switch (tipo) {
      case 'FRANQUIA': return 'bg-purple-100 text-purple-800';
      case 'PLANO': return 'bg-indigo-100 text-indigo-800';
      case 'CONSULTA': return 'bg-blue-100 text-blue-800';
      case 'INSUMO': return 'bg-green-100 text-green-800';
      case 'SERVICO': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isFiltrando = debouncedNome !== inputValues.nome || 
                      debouncedCodigo !== inputValues.codigo;

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
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={carregarProdutos}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          
          <button
            onClick={handleNovoProduto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
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
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
              >
                🔍 Buscar Agora
              </button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Campos de filtro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código RM
                {inputValues.codigo && debouncedCodigo !== inputValues.codigo && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                ref={codigoInputRef}
                type="text"
                value={inputValues.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 04.01.03.69832"
              />
            </div>
            
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite para buscar..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={inputValues.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Status</option>
                {produtoOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={inputValues.tipoProduto}
                onChange={(e) => handleSelectChange('tipoProduto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Tipos</option>
                {produtoOpcoes.tipoProduto.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={inputValues.categoria}
                onChange={(e) => handleSelectChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as Categorias</option>
                {produtoOpcoes.categoria.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código RM</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franquia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {/* 🔥 CORRIGIDO: Usar codigoRm primeiro */}
                          {produto.codigoRm || produto.codigo}
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
                          <button
                            onClick={() => handleVerFranquia(produto)}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors flex items-center gap-1"
                            title="Ver franquia do produto"
                          >
                            <span>📦</span>
                            Ver Franquia
                          </button>
                        ) : (
                          <span className="text-gray-400">❌ Sem franquia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerDetalhes(produto.id)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditarProduto(produto.id)}
                            className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

      {/* 🔥 Modal de Franquia */}
      <ModalFranquia
        aberto={modalFranquiaAberto}
        onFechar={() => setModalFranquiaAberto(false)}
        produto={produtoSelecionado}
        franquia={franquiaSelecionada}
      />
    </div>
  );
};

export default ProdutosPage;