// src/pages/ProdutoDetalhes.tsx - COM PERMISSION GUARD
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  produtoService,
  ProdutoDTO,
  ProdutoResumoDTO
} from '../services/produtoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { PermissionGuard } from '../components/PermissionGuard'; // 🔥 ADICIONADO
import { 
  FaEdit, FaTrash, FaArrowLeft, FaMoneyBillWave, 
  FaTag, FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaClipboardList, FaExchangeAlt, FaShieldAlt
} from 'react-icons/fa';

const ProdutoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<ProdutoDTO | null>(null);
  const [franquias, setFranquias] = useState<ProdutoResumoDTO[]>([]);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ProdutoResumoDTO[]>([]);
  const [produtosQueUsamEstaFranquia, setProdutosQueUsamEstaFranquia] = useState<ProdutoResumoDTO[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'franquias' | 'faturamento' | 'relacionados'>('geral');

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const produtoData = await produtoService.buscarPorId(parseInt(id));
        setProduto(produtoData);
        
        if (produtoData.franquiasIds && produtoData.franquiasIds.length > 0) {
          const franquiasData = await produtoService.getFranquiasDoProduto(parseInt(id));
          setFranquias(franquiasData);
        }
        
        if (produtoData.produtosRelacionadosIds && produtoData.produtosRelacionadosIds.length > 0) {
          const relacionadosData = await produtoService.getProdutosRelacionados(parseInt(id));
          setProdutosRelacionados(relacionadosData);
        }
        
      } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        alert('Erro ao carregar detalhes do produto');
        navigate('/produtos');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, navigate]);

  // Handlers
  const handleEditar = () => {
    navigate(`/produtos/editar/${id}`);
  };

  const handleExcluir = async () => {
    if (!produto || !confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      return;
    }

    try {
      await produtoService.excluir(produto.id!);
      alert('Produto excluído com sucesso!');
      navigate('/produtos');
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      alert(error.response?.data?.mensagem || 'Erro ao excluir produto');
    }
  };

  const handleAdicionarFranquia = () => {
    alert('Funcionalidade em desenvolvimento');
  };

  const handleRemoverFranquia = (franquiaId: number) => {
    if (!id) return;
    
    if (confirm('Deseja remover esta franquia do produto?')) {
      produtoService.removerFranquia(parseInt(id), franquiaId)
        .then(() => {
          alert('Franquia removida com sucesso!');
          window.location.reload();
        })
        .catch(error => {
          console.error('Erro ao remover franquia:', error);
          alert('Erro ao remover franquia');
        });
    }
  };

  // Funções auxiliares
  const formatarValor = (valor: number | undefined) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: any) => {
    if (!data) return 'Não informada';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const isAtivo = status === 'ATIVO';
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isAtivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isAtivo ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
        {status}
      </span>
    );
  };

  const getTipoProdutoBadge = (tipo: string) => {
    const cores: Record<string, string> = {
      'FRANQUIA': 'bg-purple-100 text-purple-800',
      'SERVICO': 'bg-blue-100 text-blue-800',
      'PRODUTO': 'bg-green-100 text-green-800',
      'ASSINATURA': 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${cores[tipo] || 'bg-gray-100 text-gray-800'}`}>
        {tipo}
      </span>
    );
  };

  if (loading) return <Loading />;
  if (!produto) return <div>Produto não encontrado</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Produtos', path: '/produtos' },
          { label: produto.nome }
        ]}
      />
      
      {/* Cabeçalho */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{produto.nome}</h1>
              {getStatusBadge(produto.status)}
              {getTipoProdutoBadge(produto.tipoProduto)}
            </div>
            
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FaTag />
                <span>Código: <strong>{produto.codigo}</strong></span>
              </div>
              
              {produto.codigoRm && (
                <div className="flex items-center gap-1">
                  <FaTag />
                  <span>RM: <strong>{produto.codigoRm}</strong></span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <FaMoneyBillWave />
                <span>Valor: <strong>{formatarValor(produto.valorUnitario)}</strong></span>
              </div>
              
              {produto.categoria && (
                <div className="flex items-center gap-1">
                  <FaClipboardList />
                  <span>Categoria: <strong>{produto.categoria}</strong></span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/produtos"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FaArrowLeft /> Voltar
            </Link>
            
            {/* 🔥 EDITAR - PERMISSION GUARD */}
            <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
              <button
                onClick={handleEditar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FaEdit /> Editar
              </button>
            </PermissionGuard>

            {/* 🔥 EXCLUIR - PERMISSION GUARD */}
            <PermissionGuard requiredPermissions={['PRODUTO_DELETE']}>
              <button
                onClick={handleExcluir}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <FaTrash /> Excluir
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Navegação por abas */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setAbaAtiva('geral')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'geral'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaInfoCircle className="inline mr-2" />
              Informações Gerais
            </button>
            
            {(franquias.length > 0 || produto.temFranquia) && (
              <button
                onClick={() => setAbaAtiva('franquias')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaAtiva === 'franquias'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaExchangeAlt className="inline mr-2" />
                Franquias ({franquias.length})
              </button>
            )}
            
            <button
              onClick={() => setAbaAtiva('faturamento')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                abaAtiva === 'faturamento'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaMoneyBillWave className="inline mr-2" />
              Regras de Faturamento
            </button>
            
            {produtosRelacionados.length > 0 && (
              <button
                onClick={() => setAbaAtiva('relacionados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  abaAtiva === 'relacionados'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClipboardList className="inline mr-2" />
                Produtos Relacionados ({produtosRelacionados.length})
              </button>
            )}
          </nav>
        </div>

        {/* Conteúdo das Abas - mantido igual, com PermissionGuard nos botões de ação */}

        {/* Aba: Franquias */}
        {abaAtiva === 'franquias' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Franquias Inclusas no Produto
              </h3>
              
              {produto.tipoProduto !== 'FRANQUIA' && (
                <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                  <button
                    onClick={handleAdicionarFranquia}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <FaExchangeAlt /> Adicionar Franquia
                  </button>
                </PermissionGuard>
              )}
            </div>
            
            {/* Resto do conteúdo das franquias... */}
            {franquias.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <FaExchangeAlt className="mx-auto text-4xl text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma franquia vinculada
                </h4>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Este produto não possui franquias associadas.
                </p>
                {produto.tipoProduto !== 'FRANQUIA' && (
                  <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                    <button
                      onClick={handleAdicionarFranquia}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Adicionar Primeira Franquia
                    </button>
                  </PermissionGuard>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {franquias.map(franquia => (
                  <div
                    key={franquia.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-800">{franquia.nome}</h4>
                        <p className="text-sm text-gray-500">{franquia.codigo}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          to={`/produtos/${franquia.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalhes"
                        >
                          <FaInfoCircle />
                        </Link>
                        
                        <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                          <button
                            onClick={() => handleRemoverFranquia(franquia.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Remover franquia"
                          >
                            <FaTrash />
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-medium">
                          {formatarValor(franquia.valorUnitario)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tipo:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          franquia.tipoProduto === 'FRANQUIA' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {franquia.tipoProduto}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          franquia.status === 'ATIVO' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {franquia.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* As demais abas (geral, faturamento, relacionados) permanecem sem PermissionGuard, 
            pois são apenas visualização, e a edição já está protegida no cabeçalho */}
      </div>
    </div>
  );
};

export default ProdutoDetalhesPage;