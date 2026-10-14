// src/pages/ProdutoDetalhes.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  produtoService,
  ProdutoDTO,
  ProdutoResumoDTO,
} from '../services/produtoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import EmptyState from '../components/ui/EmptyState';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useMessage } from '../providers/MessageProvider';
import { PermissionGuard } from '../components/PermissionGuard';
import {
  FaEdit, FaTrash, FaArrowLeft, FaMoneyBillWave,
  FaTag, FaCheckCircle, FaTimesCircle, FaInfoCircle,
  FaClipboardList, FaExchangeAlt,
} from 'react-icons/fa';

const ProdutoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();

  const [loading, setLoading] = useState(true);
  const [produto, setProduto] = useState<ProdutoDTO | null>(null);
  const [franquias, setFranquias] = useState<ProdutoResumoDTO[]>([]);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ProdutoResumoDTO[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'franquias' | 'faturamento' | 'relacionados'>('geral');

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
        showToast('Erro ao carregar detalhes do produto', 'error');
        navigate('/produtos');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id, navigate, showToast]);

  const handleEditar = () => navigate(`/produtos/editar/${id}`);

  const handleExcluir = async () => {
    if (!produto) return;
    const ok = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o produto "${produto.nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await produtoService.excluir(produto.id!);
      showToast('Produto excluído com sucesso!', 'success');
      navigate('/produtos');
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      showToast(error.response?.data?.mensagem || 'Erro ao excluir produto', 'error');
    }
  };

  const handleAdicionarFranquia = () => {
    showToast('Funcionalidade em desenvolvimento', 'info');
  };

  const handleRemoverFranquia = async (franquiaId: number) => {
    if (!id) return;

    const ok = await showConfirm({
      title: 'Remover franquia',
      message: 'Deseja remover esta franquia do produto?',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (!ok) return;

    try {
      await produtoService.removerFranquia(parseInt(id), franquiaId);
      showToast('Franquia removida com sucesso!', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao remover franquia:', error);
      showToast('Erro ao remover franquia', 'error');
    }
  };

  const formatarValor = (valor: number | undefined) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const isAtivo = status === 'ATIVO';
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isAtivo
            ? 'bg-cdl-green-100 text-cdl-green-700'
            : 'bg-cdl-danger-50 text-cdl-danger-500'
        }`}
      >
        {isAtivo ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
        {status}
      </span>
    );
  };

  const getTipoProdutoBadge = (tipo: string) => {
    const cores: Record<string, string> = {
      FRANQUIA: 'bg-cdl-navy-100 text-cdl-navy-700',
      SERVICO: 'bg-cdl-navy-50 text-cdl-navy-700',
      PRODUTO: 'bg-cdl-green-100 text-cdl-green-700',
      ASSINATURA: 'bg-cdl-yellow-100 text-cdl-yellow-700',
    };
    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
          cores[tipo] || 'bg-cdl-neutral-100 text-cdl-neutral-500'
        }`}
      >
        {tipo}
      </span>
    );
  };

  if (loading) return <Loading />;

  if (!produto) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <BreadCrumb links={[{ label: 'Produtos', path: '/produtos' }, { label: 'Detalhes' }]} />
        <div className="bg-white rounded-xl shadow-cdl p-12 mt-6">
          <EmptyState
            icon="📦"
            title="Produto não encontrado"
            description="O produto solicitado não existe ou foi removido."
            action={
              <Link
                to="/produtos"
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ← Voltar para Produtos
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb links={[{ label: 'Produtos', path: '/produtos' }, { label: produto.nome }]} />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-cdl-navy-700">{produto.nome}</h1>
              {getStatusBadge(produto.status)}
              {getTipoProdutoBadge(produto.tipoProduto)}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FaTag className="text-cdl-navy-500" />
                <span>Código: <strong className="font-mono text-cdl-navy-700">{produto.codigo}</strong></span>
              </div>

              {produto.codigoRm && (
                <div className="flex items-center gap-1">
                  <FaTag className="text-cdl-navy-500" />
                  <span>RM: <strong className="font-mono text-cdl-navy-700">{produto.codigoRm}</strong></span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <FaMoneyBillWave className="text-cdl-green-600" />
                <span>Valor: <strong className="text-cdl-navy-700">{formatarValor(produto.valorUnitario)}</strong></span>
              </div>

              {produto.categoria && (
                <div className="flex items-center gap-1">
                  <FaClipboardList className="text-cdl-yellow-600" />
                  <span>Categoria: <strong className="text-cdl-navy-700">{produto.categoria}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/produtos"
              className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-50 flex items-center gap-2 font-medium
                         transition-colors"
            >
              <FaArrowLeft /> Voltar
            </Link>

            <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
              <button
                type="button"
                onClick={handleEditar}
                className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           flex items-center gap-2 font-medium transition-all active:scale-[.98]"
              >
                <FaEdit /> Editar
              </button>
            </PermissionGuard>

            <PermissionGuard requiredPermissions={['PRODUTO_DELETE']}>
              <button
                type="button"
                onClick={handleExcluir}
                className="px-4 py-2 bg-cdl-danger-500 text-white rounded-lg hover:bg-cdl-danger-600
                           flex items-center gap-2 font-medium transition-all active:scale-[.98]"
              >
                <FaTrash /> Excluir
              </button>
            </PermissionGuard>
          </div>
        </div>

        {/* Abas */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex flex-wrap gap-x-6">
            <button
              type="button"
              onClick={() => setAbaAtiva('geral')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                abaAtiva === 'geral'
                  ? 'border-cdl-navy-700 text-cdl-navy-700'
                  : 'border-transparent text-gray-500 hover:text-cdl-navy-700 hover:border-gray-300'
              }`}
            >
              <FaInfoCircle className="inline mr-2" /> Informações Gerais
            </button>

            {(franquias.length > 0 || produto.temFranquia) && (
              <button
                type="button"
                onClick={() => setAbaAtiva('franquias')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'franquias'
                    ? 'border-cdl-navy-700 text-cdl-navy-700'
                    : 'border-transparent text-gray-500 hover:text-cdl-navy-700 hover:border-gray-300'
                }`}
              >
                <FaExchangeAlt className="inline mr-2" /> Franquias ({franquias.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setAbaAtiva('faturamento')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                abaAtiva === 'faturamento'
                  ? 'border-cdl-navy-700 text-cdl-navy-700'
                  : 'border-transparent text-gray-500 hover:text-cdl-navy-700 hover:border-gray-300'
              }`}
            >
              <FaMoneyBillWave className="inline mr-2" /> Regras de Faturamento
            </button>

            {produtosRelacionados.length > 0 && (
              <button
                type="button"
                onClick={() => setAbaAtiva('relacionados')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === 'relacionados'
                    ? 'border-cdl-navy-700 text-cdl-navy-700'
                    : 'border-transparent text-gray-500 hover:text-cdl-navy-700 hover:border-gray-300'
                }`}
              >
                <FaClipboardList className="inline mr-2" /> Produtos Relacionados ({produtosRelacionados.length})
              </button>
            )}
          </nav>
        </div>

        {/* Aba: Franquias */}
        {abaAtiva === 'franquias' && (
          <div>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <h3 className="text-lg font-semibold text-cdl-navy-700">
                Franquias Inclusas no Produto
              </h3>

              {produto.tipoProduto !== 'FRANQUIA' && (
                <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                  <button
                    type="button"
                    onClick={handleAdicionarFranquia}
                    className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                               flex items-center gap-2 font-medium transition-all active:scale-[.98]"
                  >
                    <FaExchangeAlt /> Adicionar Franquia
                  </button>
                </PermissionGuard>
              )}
            </div>

            {franquias.length === 0 ? (
              <EmptyState
                icon="🔄"
                title="Nenhuma franquia vinculada"
                description="Este produto não possui franquias associadas."
                action={
                  produto.tipoProduto !== 'FRANQUIA' ? (
                    <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                      <button
                        type="button"
                        onClick={handleAdicionarFranquia}
                        className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg font-medium
                                   hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                      >
                        Adicionar Primeira Franquia
                      </button>
                    </PermissionGuard>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {franquias.map((franquia) => (
                  <div
                    key={franquia.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-cdl
                               hover:border-cdl-navy-200 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-cdl-navy-700">{franquia.nome}</h4>
                        <p className="text-sm text-gray-500 font-mono">{franquia.codigo}</p>
                      </div>

                      <div className="flex gap-1">
                        <Link
                          to={`/produtos/${franquia.id}`}
                          className="p-2 text-cdl-navy-700 hover:bg-cdl-navy-50 rounded transition-colors"
                          title="Ver detalhes"
                        >
                          <FaInfoCircle />
                        </Link>

                        <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                          <button
                            type="button"
                            onClick={() => handleRemoverFranquia(franquia.id)}
                            className="p-2 text-cdl-danger-500 hover:bg-cdl-danger-50 rounded transition-colors"
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
                        <span className="font-medium text-cdl-navy-700">
                          {formatarValor(franquia.valorUnitario)}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-cdl-navy-50 text-cdl-navy-700">
                          {franquia.tipoProduto}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            franquia.status === 'ATIVO'
                              ? 'bg-cdl-green-100 text-cdl-green-700'
                              : 'bg-cdl-danger-50 text-cdl-danger-500'
                          }`}
                        >
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
      </div>
    </div>
  );
};

export default ProdutoDetalhesPage;