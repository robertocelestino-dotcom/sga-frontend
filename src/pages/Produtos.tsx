// src/pages/Produtos.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect, useCallback } from 'react';
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

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const [produtos, setProdutos] = useState<ProdutoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<ProdutoFiltros>({
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
  const [isMounted, setIsMounted] = useState(true);

  // Carregar produtos COM useCallback para evitar recriações
  const carregarProdutos = useCallback(async () => {
    console.log('📞 [Produtos.tsx] Carregando produtos...');
    
    // Evitar chamadas se não estiver montado
    if (!isMounted) return;
    
    try {
      setLoading(true);
      console.log('📤 [Produtos.tsx] Chamando produtoService.listar...');
      
      const response = await produtoService.listar(filtros);
      console.log('📥 [Produtos.tsx] Resposta recebida:', {
        temProdutos: response.content?.length,
        total: response.totalElements,
        content: response.content
      });
      
      // VERIFICAÇÃO CRÍTICA
      if (response && response.content && Array.isArray(response.content)) {
        console.log('✅ [Produtos.tsx] Produtos válidos:', response.content.length);
        setProdutos(response.content);
        setPaginaInfo({
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          size: response.size,
          number: response.number
        });
      } else {
        console.error('❌ [Produtos.tsx] Estrutura inválida:', response);
        setProdutos([]);
        showToast('Erro: Estrutura de dados inválida', 'error');
      }
    } catch (error) {
      console.error('❌ [Produtos.tsx] Erro ao carregar produtos:', error);
      showToast('Erro ao carregar produtos. Tente novamente.', 'error');
      setProdutos([]);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [filtros, isMounted, showToast]);

  // useEffect com cleanup
  useEffect(() => {
    setIsMounted(true);
    console.log('🏗️ [Produtos.tsx] Componente montado');
    
    // Adicionar log para testar se o componente está renderizando
    console.log('🔄 [Produtos.tsx] Renderizando, produtos atuais:', produtos.length);
    
    carregarProdutos();
    
    return () => {
      console.log('🗑️ [Produtos.tsx] Componente desmontado');
      setIsMounted(false);
    };
  }, [carregarProdutos]);

  // Adicione este teste temporário
  useEffect(() => {
    const testarDados = () => {
      console.log('🧪 [Produtos.tsx] TESTE: Estado atual:', {
        produtosLength: produtos.length,
        produtos: produtos,
        loading,
        paginaInfo
      });
    };
    
    // Executar teste após 1 segundo
    const timer = setTimeout(testarDados, 1000);
    return () => clearTimeout(timer);
  }, [produtos, loading, paginaInfo]);

  // Resto do código permanece igual...
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

  const handleFiltroChange = (campo: keyof ProdutoFiltros, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      page: 0 // Reset para primeira página ao filtrar
    }));
  };

  const handlePaginaChange = (novaPagina: number) => {
    setFiltros(prev => ({
      ...prev,
      page: novaPagina
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      page: 0,
      size: 10,
      sort: 'nome',
      direction: 'asc'
    });
    setMostrarFiltros(false);
    showToast('Filtros limpos', 'info');
  };

  // Formatar valores
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    return status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTipoProdutoColor = (tipo: string) => {
    switch (tipo) {
      case 'FRANQUIA': return 'bg-purple-100 text-purple-800';
      case 'SERVICO': return 'bg-blue-100 text-blue-800';
      case 'PRODUTO': return 'bg-green-100 text-green-800';
      case 'ASSINATURA': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Adicione este log de renderização
  console.log('🎨 [Produtos.tsx] Renderizando JSX, produtos:', produtos.length);

  if (loading) {
    console.log('⏳ [Produtos.tsx] Mostrando loading...');
    return <Loading />;
  }

  return (
    <div className="p-6">
      <BreadCrumb atual="Produtos" />
      
      {/* Cabeçalho com LOG TEMPORÁRIO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Produtos</h1>
          <p className="text-gray-600">
            Total: {paginaInfo.totalElements} produto(s) | Na lista: {produtos.length}
          </p>
          {/* TEMPORÁRIO: Mostrar estado atual */}
          <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-100 rounded">
            DEBUG: {produtos.length} produtos no estado | Última atualização: {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            🔍 Filtros
          </button>
          
          <button
            onClick={carregarProdutos}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            🔄 Atualizar
          </button>
          
          <button
            onClick={handleNovoProduto}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Novo Produto
          </button>
        </div>
      </div>

      {/* Filtros (se estiverem visíveis) */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Campos de filtro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={filtros.codigo || ''}
                onChange={(e) => handleFiltroChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Filtrar por código"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={filtros.nome || ''}
                onChange={(e) => handleFiltroChange('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Filtrar por nome"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filtros.status || ''}
                onChange={(e) => handleFiltroChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos</option>
                {produtoOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={limparFiltros}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de produtos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {produtos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum produto encontrado.</p>
            <button
              onClick={handleNovoProduto}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Criar primeiro produto
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
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        <div className="text-sm text-gray-500">{produto.nomeCompleto}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarValor(produto.valorUnitario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTipoProdutoColor(produto.tipoProduto)}`}>
                          {produto.tipoProduto}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(produto.status)}`}>
                          {produto.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {produto.temFranquia ? (
                          <span className="text-green-600 font-medium">
                            {produto.totalFranquias} franquia(s)
                          </span>
                        ) : (
                          <span className="text-gray-400">Sem franquia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerDetalhes(produto.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditarProduto(produto.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                            className="text-red-600 hover:text-red-900"
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
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
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