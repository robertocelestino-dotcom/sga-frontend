// src/pages/ProdutoDetalhes.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  produtoService,
  ProdutoDTO,
  ProdutoResumoDTO
} from '../services/produtoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
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
        // Dados principais
        const produtoData = await produtoService.buscarPorId(parseInt(id));
        setProduto(produtoData);
        
        // Franquias do produto
        if (produtoData.franquiasIds && produtoData.franquiasIds.length > 0) {
          const franquiasData = await produtoService.getFranquiasDoProduto(parseInt(id));
          setFranquias(franquiasData);
        }
        
        // Produtos relacionados
        if (produtoData.produtosRelacionadosIds && produtoData.produtosRelacionadosIds.length > 0) {
          const relacionadosData = await produtoService.getProdutosRelacionados(parseInt(id));
          setProdutosRelacionados(relacionadosData);
        }
        
        // Se for franquia, buscar produtos que a usam
        if (produtoData.tipoProduto === 'FRANQUIA') {
          // Esta funcionalidade precisaria ser implementada no backend
          // Por enquanto deixamos vazio ou podemos implementar uma busca
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
    // Implementar modal para adicionar franquia
    alert('Funcionalidade em desenvolvimento');
  };

  const handleRemoverFranquia = (franquiaId: number) => {
    if (!id) return;
    
    if (confirm('Deseja remover esta franquia do produto?')) {
      produtoService.removerFranquia(parseInt(id), franquiaId)
        .then(() => {
          alert('Franquia removida com sucesso!');
          // Recarregar dados
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
            
            <button
              onClick={handleEditar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaEdit /> Editar
            </button>
            
            <button
              onClick={handleExcluir}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FaTrash /> Excluir
            </button>
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

        {/* Conteúdo das Abas */}
        <div className="mt-6">
          {/* Aba: Informações Gerais */}
          {abaAtiva === 'geral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna 1: Dados Básicos */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Dados do Produto
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Descrição</label>
                      <p className="mt-1 text-gray-800">
                        {produto.descricao || 'Sem descrição'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Unidade de Medida</label>
                        <p className="mt-1 text-gray-800 font-medium">
                          {produto.unidadeMedida || 'UNIDADE'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Modalidade</label>
                        <p className="mt-1 text-gray-800 font-medium">
                          {produto.modalidade || 'Não definida'}
                        </p>
                      </div>
                    </div>
                    
                    {produto.tipoProduto === 'FRANQUIA' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Limite de Franquia</label>
                          <p className="mt-1 text-gray-800 font-medium">
                            {produto.limiteFranquia || 'Não definido'}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Período</label>
                          <p className="mt-1 text-gray-800 font-medium">
                            {produto.periodoFranquia || 'Não definido'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Auditoria */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Informações de Auditoria
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Criado em</label>
                        <p className="mt-1 text-gray-800">
                          {formatarData(produto.criadoEm)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Atualizado em</label>
                        <p className="mt-1 text-gray-800">
                          {formatarData(produto.atualizadoEm)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Criado por</label>
                        <p className="mt-1 text-gray-800">
                          {produto.usuarioCriacao || 'Sistema'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Atualizado por</label>
                        <p className="mt-1 text-gray-800">
                          {produto.usuarioAtualizacao || 'Sistema'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Estatísticas e Ações Rápidas */}
              <div className="space-y-6">
                {/* Cartões de Resumo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="text-sm text-blue-600 font-medium">Franquias</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
                      {franquias.length}
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      {produto.temFranquia ? 'Com franquias' : 'Sem franquias'}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="text-sm text-green-600 font-medium">Relacionados</div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {produtosRelacionados.length}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      Produtos vinculados
                    </div>
                  </div>
                </div>

                {/* Status de Faturamento */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Status de Faturamento</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cobrança Automática</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        produto.geraCobrancaAutomatica 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.geraCobrancaAutomatica ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cobrança Periódica</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        produto.cobrancaPeriodica 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {produto.cobrancaPeriodica ? 'Ativa' : 'Não aplicável'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Permite Desconto</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        produto.permiteDesconto 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.permiteDesconto ? 'Sim' : 'Não'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Exige Autorização</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        produto.exigeAutorizacao 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {produto.exigeAutorizacao ? `Nível ${produto.nivelAutorizacao}` : 'Não'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-gray-800 mb-3">Ações Rápidas</h4>
                  
                  <div className="space-y-2">
                    {produto.tipoProduto !== 'FRANQUIA' && (
                      <button
                        onClick={handleAdicionarFranquia}
                        className="w-full px-3 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 rounded flex items-center gap-2"
                      >
                        <FaExchangeAlt />
                        Adicionar Franquia
                      </button>
                    )}
                    
                    <Link
                      to="/faturamento"
                      className="block w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center gap-2"
                    >
                      <FaMoneyBillWave />
                      Ver Faturamentos
                    </Link>
                    
                    <button
                      onClick={() => navigator.clipboard.writeText(produto.codigo)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 rounded flex items-center gap-2"
                    >
                      <FaClipboardList />
                      Copiar Código
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba: Franquias */}
          {abaAtiva === 'franquias' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Franquias Inclusas no Produto
                </h3>
                
                {produto.tipoProduto !== 'FRANQUIA' && (
                  <button
                    onClick={handleAdicionarFranquia}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <FaExchangeAlt /> Adicionar Franquia
                  </button>
                )}
              </div>
              
              {franquias.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FaExchangeAlt className="mx-auto text-4xl text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Nenhuma franquia vinculada
                  </h4>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Este produto não possui franquias associadas. Adicione franquias para 
                    configurar limites de uso e períodos de renovação.
                  </p>
                  {produto.tipoProduto !== 'FRANQUIA' && (
                    <button
                      onClick={handleAdicionarFranquia}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Adicionar Primeira Franquia
                    </button>
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
                          
                          <button
                            onClick={() => handleRemoverFranquia(franquia.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Remover franquia"
                          >
                            <FaTrash />
                          </button>
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

          {/* Aba: Regras de Faturamento */}
          {abaAtiva === 'faturamento' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configurações de Cobrança */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMoneyBillWave /> Configurações de Cobrança
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">Cobrança Automática</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        produto.geraCobrancaAutomatica 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.geraCobrancaAutomatica ? 'ATIVA' : 'INATIVA'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">Tipo de Cobrança</span>
                      <span className="font-medium">
                        {produto.cobrancaPeriodica ? 'Periódica' : 'Única'}
                      </span>
                    </div>
                    
                    {produto.cobrancaPeriodica && (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">Periodicidade</span>
                          <span className="font-medium">
                            {produto.periodicidadeCobranca || 'Mensal'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-700">Dia da Cobrança</span>
                          <span className="font-medium">
                            {produto.diaCobranca ? `Dia ${produto.diaCobranca}` : 'Não definido'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Regras de Desconto */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaTag /> Regras de Desconto
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">Permite Desconto</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        produto.permiteDesconto 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {produto.permiteDesconto ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                    
                    {produto.permiteDesconto && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Desconto Máximo</span>
                        <span className="font-medium text-lg text-green-600">
                          {produto.descontoMaximo || 0}%
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-4">
                      <p className="text-sm text-gray-500">
                        Os descontos são aplicados durante o processo de faturamento e 
                        podem exigir autorização dependendo do valor.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Controles de Autorização */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaShieldAlt /> Controles de Autorização
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-700">Exige Autorização</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        produto.exigeAutorizacao 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {produto.exigeAutorizacao ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                    
                    {produto.exigeAutorizacao && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-700">Nível de Autorização</span>
                        <span className="font-medium text-lg text-yellow-600">
                          Nível {produto.nivelAutorizacao || 1}
                        </span>
                      </div>
                    )}
                    
                    <div className="pt-4">
                      <p className="text-sm text-gray-500">
                        Produtos que exigem autorização precisam de aprovação 
                        antes de serem faturados. O nível define a hierarquia necessária.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impacto no Faturamento */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Impacto no Faturamento
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-blue-600 font-medium mb-1">
                        Valor Base para Faturamento
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatarValor(produto.valorUnitario)}
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        por {produto.unidadeMedida?.toLowerCase() || 'unidade'}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">
                        <strong>Regras aplicáveis:</strong>
                      </p>
                      <ul className="list-disc pl-5 space-y-1">
                        {produto.geraCobrancaAutomatica && (
                          <li>Cobrança gerada automaticamente na importação</li>
                        )}
                        {produto.cobrancaPeriodica && (
                          <li>Cobrança recorrente {produto.periodicidadeCobranca?.toLowerCase()}</li>
                        )}
                        {produto.permiteDesconto && (
                          <li>Desconto máximo de {produto.descontoMaximo || 0}% aplicável</li>
                        )}
                        {produto.exigeAutorizacao && (
                          <li>Requer autorização nível {produto.nivelAutorizacao || 1}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aba: Produtos Relacionados */}
          {abaAtiva === 'relacionados' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Produtos Relacionados (MIX)
              </h3>
              
              {produtosRelacionados.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FaClipboardList className="mx-auto text-4xl text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    Nenhum produto relacionado
                  </h4>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Este produto não possui outros produtos relacionados. 
                    Produtos MIX geralmente têm componentes relacionados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtosRelacionados.map(relacionado => (
                    <Link
                      key={relacionado.id}
                      to={`/produtos/${relacionado.id}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-blue-300"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 hover:text-blue-600">
                            {relacionado.nome}
                          </h4>
                          <p className="text-sm text-gray-500">{relacionado.codigo}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          relacionado.tipoProduto === 'FRANQUIA' 
                            ? 'bg-purple-100 text-purple-800' 
                            : relacionado.tipoProduto === 'SERVICO'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {relacionado.tipoProduto}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Valor:</span>
                          <span className="font-medium">
                            {formatarValor(relacionado.valorUnitario)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            relacionado.status === 'ATIVO' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {relacionado.status}
                          </span>
                        </div>
                        
                        {relacionado.temFranquia && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Franquias:</span>
                            <span className="text-purple-600 font-medium">
                              {relacionado.totalFranquias}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutoDetalhesPage;