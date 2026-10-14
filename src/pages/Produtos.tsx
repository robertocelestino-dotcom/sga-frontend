// src/pages/Produtos.tsx - VERSÃO CDL
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  produtoService,
  ProdutoResumoDTO,
  ProdutoFiltros,
  produtoOpcoes
} from '../services/produtoService';
import { planoProdutoFranquiaService } from '../services/planoProdutoFranquiaService';
import BreadCrumb from '../components/BreadCrumb';
import { useMessage } from '../providers/MessageProvider';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuthStore } from '../stores/authStore';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';

/* ========== HOOK DEBOUNCE (inalterado) ========== */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debouncedValue;
};

/* ========== MODAL FRANQUIA ========== */
const ModalFranquia: React.FC<{
  aberto: boolean; onFechar: () => void; produto: any; franquia: any;
}> = ({ aberto, onFechar, produto, franquia }) => {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-cdl-lg max-w-md w-full
                      border-t-4 border-cdl-navy-700 animate-slide-up max-h-[92vh] flex flex-col">
        <div className="p-5 sm:p-6 border-b border-gray-200 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-cdl-navy-700">Franquia do Produto</h3>
            <button onClick={onFechar} className="text-gray-400 hover:text-cdl-navy-700 p-1 rounded-lg hover:bg-cdl-neutral-50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">Produto</label>
            <p className="text-gray-900 font-medium">{produto?.nome}</p>
            <p className="text-sm text-gray-500">Código RM: {produto?.codigoRm || produto?.codigo || 'N/A'}</p>
            <p className="text-xs text-gray-400 mt-1">ID interno: {produto?.id}</p>
          </div>
          {franquia ? (
            <div className="bg-cdl-navy-50 p-4 rounded-lg border border-cdl-navy-100">
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Franquia Associada</label>
              <p className="text-gray-900 font-medium">{franquia.nome}</p>
              <p className="text-sm text-gray-600">Código RM: {franquia.codigoRm || franquia.codigo || 'N/A'}</p>
              {franquia.limiteFranquia && (
                <p className="text-sm text-gray-600 mt-2">Limite: {franquia.limiteFranquia} consultas</p>
              )}
            </div>
          ) : (
            <div className="bg-cdl-neutral-50 p-4 rounded-lg text-center">
              <p className="text-gray-500">Este produto não possui franquia associada</p>
              <p className="text-xs text-gray-400 mt-2">Código RM: {produto?.codigoRm || produto?.codigo}</p>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onFechar}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         font-medium transition-all active:scale-[.98]"
            >Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProdutosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const { hasPermission } = useAuthStore();

  const [produtos, setProdutos] = useState<ProdutoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalFranquiaAberto, setModalFranquiaAberto] = useState(false);
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<any>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);

  const [inputValues, setInputValues] = useState({
    codigo: '', nome: '', status: '', tipoProduto: '', categoria: ''
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<ProdutoFiltros>({
    page: 0, size: 10, sort: 'nome', direction: 'asc',
  });

  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0, totalPages: 0, size: 10, number: 0,
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const nomeInputRef = useRef<HTMLInputElement>(null);
  const codigoInputRef = useRef<HTMLInputElement>(null);

  const debouncedNome = useDebounce(inputValues.nome, 500);
  const debouncedCodigo = useDebounce(inputValues.codigo, 500);

  const mapearFiltros = useCallback((): ProdutoFiltros => {
    const f: ProdutoFiltros = {
      page: 0, size: filtrosAtivos.size,
      sort: filtrosAtivos.sort, direction: filtrosAtivos.direction,
    };
    if (debouncedCodigo) f.codigoRm = debouncedCodigo;
    if (debouncedNome) f.nome = debouncedNome;
    if (inputValues.status) f.status = inputValues.status;
    if (inputValues.tipoProduto) f.tipoProduto = inputValues.tipoProduto;
    if (inputValues.categoria) f.categoria = inputValues.categoria;
    return f;
  }, [debouncedCodigo, debouncedNome, inputValues.status, inputValues.tipoProduto, inputValues.categoria, filtrosAtivos.size, filtrosAtivos.sort, filtrosAtivos.direction]);

  useEffect(() => {
    setFiltrosAtivos(prev => ({ ...prev, ...mapearFiltros(), page: 0 }));
  }, [debouncedNome, debouncedCodigo, inputValues.status, inputValues.tipoProduto, inputValues.categoria, mapearFiltros]);

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
          number: response.number,
        });
      } else {
        setProdutos([]);
        showToast('Nenhum produto encontrado', 'info');
      }
    } catch (error) {
      console.error(error);
      showToast('Erro ao carregar produtos. Tente novamente.', 'error');
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtivos, showToast]);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  const handleVerFranquia = async (produto: ProdutoResumoDTO) => {
    try {
      const produtoCompleto = {
        ...produto,
        codigoRm: produto.codigoRm || produto.codigo,
        codigoOriginal: produto.codigo,
      };
      setProdutoSelecionado(produtoCompleto);

      const associacoes = await planoProdutoFranquiaService.listarPorProduto(produto.id);
      let franquiaEncontrada: any = null;

      if (associacoes && associacoes.length > 0) {
        const p = associacoes[0];
        if (p.franquia) franquiaEncontrada = p.franquia;
        else if (p.franquiaId) franquiaEncontrada = await produtoService.buscarPorId(p.franquiaId);
        else if (p.franquiaNome) {
          franquiaEncontrada = {
            id: p.franquiaId, nome: p.franquiaNome,
            codigoRm: p.franquiaCodigo, codigo: p.franquiaCodigo,
            limiteFranquia: p.limiteFranquia, periodoFranquia: p.periodoFranquia,
          };
        }
      }
      setFranquiaSelecionada(franquiaEncontrada);
      setModalFranquiaAberto(true);
    } catch (error) {
      console.error(error);
      showToast('Erro ao buscar franquia do produto', 'error');
    }
  };

  const handleInputChange = (c: keyof typeof inputValues, v: string) =>
    setInputValues(prev => ({ ...prev, [c]: v }));

  const handleSelectChange = (c: keyof typeof inputValues, v: string) =>
    setInputValues(prev => ({ ...prev, [c]: v }));

  const limparFiltros = () => {
    setInputValues({ codigo: '', nome: '', status: '', tipoProduto: '', categoria: '' });
    showToast('Filtros limpos', 'info');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  };

  const handleNovoProduto = () => navigate('/produtos/novo');
  const handleEditarProduto = (id: number) => navigate(`/produtos/editar/${id}`);
  const handleVerDetalhes = (id: number) => navigate(`/produtos/${id}`);

  const handleExcluirProduto = async (id: number, nome: string) => {
    const ok = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o produto "${nome}"?`,
      confirmText: 'Excluir', cancelText: 'Cancelar', type: 'danger',
    });
    if (!ok) return;
    try {
      await produtoService.excluir(id);
      showToast('Produto excluído com sucesso!', 'success');
      carregarProdutos();
    } catch (error: any) {
      showToast(error.response?.data?.mensagem || 'Erro ao excluir produto.', 'error');
    }
  };

  const handlePaginaChange = (p: number) => setFiltrosAtivos(prev => ({ ...prev, page: p }));

  const formatarValor = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getStatusColor = (s: string) =>
    ({ ATIVO: 'bg-cdl-green-100 text-cdl-green-700',
       INATIVO: 'bg-cdl-danger-50 text-cdl-danger-500',
       SUSPENSO: 'bg-cdl-yellow-100 text-cdl-yellow-700' }[s] ?? 'bg-cdl-neutral-100 text-cdl-neutral-500');

  const getTipoProdutoColor = (t: string) =>
    ({ FRANQUIA: 'bg-cdl-navy-100 text-cdl-navy-800',
       PLANO: 'bg-cdl-navy-50 text-cdl-navy-700',
       CONSULTA: 'bg-blue-100 text-blue-800',
       INSUMO: 'bg-cdl-green-100 text-cdl-green-700',
       SERVICO: 'bg-cdl-yellow-100 text-cdl-yellow-700' }[t] ?? 'bg-cdl-neutral-100 text-cdl-neutral-500');

  const isFiltrando = debouncedNome !== inputValues.nome || debouncedCodigo !== inputValues.codigo;
  const temFiltroAtivo = Object.values(inputValues).some(v => v);

  return (
    <div className="p-6">
      <BreadCrumb atual="Produtos" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Gestão de Produtos</h1>
          <p className="text-gray-600">
            Total: <span className="font-semibold text-cdl-navy-700">{paginaInfo.totalElements}</span> produto(s) | Exibindo: {produtos.length}
            {isFiltrando && <span className="ml-2 text-cdl-navy-600 text-sm">(buscando...)</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg hover:bg-cdl-navy-50 flex items-center gap-2 transition-colors"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button
            onClick={carregarProdutos}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg hover:bg-cdl-navy-100 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>

          <PermissionGuard requiredPermissions={['PRODUTO_CREATE']}>
            <button
              onClick={handleNovoProduto}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 flex items-center gap-2 font-medium
                         transition-all active:scale-[.98]"
            >
              ➕ Novo Produto
            </button>
          </PermissionGuard>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cdl-navy-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={carregarProdutos}
                disabled={loading}
                className="px-3 py-1.5 bg-cdl-navy-700 text-white text-sm rounded-md
                           hover:bg-cdl-navy-800 disabled:opacity-50 transition-all"
              >🔍 Buscar Agora</button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >🗑️ Limpar Tudo</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código RM
                {inputValues.codigo && debouncedCodigo !== inputValues.codigo && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <input
                ref={codigoInputRef}
                type="text"
                value={inputValues.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
                placeholder="Ex: 04.01.03.69832"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
                {inputValues.nome && debouncedNome !== inputValues.nome && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <input
                ref={nomeInputRef}
                type="text"
                value={inputValues.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
                placeholder="Digite para buscar..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={inputValues.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
              >
                <option value="">Todos os Status</option>
                {produtoOpcoes.status.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={inputValues.tipoProduto}
                onChange={(e) => handleSelectChange('tipoProduto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
              >
                <option value="">Todos os Tipos</option>
                {produtoOpcoes.tipoProduto.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={inputValues.categoria}
                onChange={(e) => handleSelectChange('categoria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
              >
                <option value="">Todas as Categorias</option>
                {produtoOpcoes.categoria.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && produtos.length === 0 ? (
          <TableSkeleton rows={10} cols={7} />
        ) : produtos.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Nenhum produto encontrado"
            description={
              temFiltroAtivo
                ? 'Tente ajustar os filtros de busca ou limpe-os.'
                : 'Comece cadastrando seu primeiro produto.'
            }
            action={
              temFiltroAtivo ? (
                <button
                  onClick={limparFiltros}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >🔄 Limpar filtros</button>
              ) : (
                <PermissionGuard requiredPermissions={['PRODUTO_CREATE']}>
                  <button
                    onClick={handleNovoProduto}
                    className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  >➕ Criar Primeiro Produto</button>
                </PermissionGuard>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Código RM','Nome','Valor','Tipo','Status','Franquia','Ações'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtos.map(produto => (
                    <tr key={produto.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {produto.codigoRm || produto.codigo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{produto.nomeCompleto}</div>
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
                            className="px-3 py-1 bg-cdl-navy-100 text-cdl-navy-700 rounded
                                       hover:bg-cdl-navy-200 transition-colors flex items-center gap-1"
                            title="Ver franquia do produto"
                          >
                            <span>📦</span> Ver Franquia
                          </button>
                        ) : (
                          <span className="text-gray-400">❌ Sem franquia</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <PermissionGuard requiredPermissions={['PRODUTO_VIEW']}>
                            <button
                              onClick={() => handleVerDetalhes(produto.id)}
                              className="p-1 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                              title="Ver detalhes"
                            >👁️</button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                            <button
                              onClick={() => handleEditarProduto(produto.id)}
                              className="p-1 text-cdl-yellow-600 hover:text-cdl-yellow-700 hover:bg-cdl-yellow-50 rounded transition-colors"
                              title="Editar"
                            >✏️</button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PRODUTO_DELETE']}>
                            <button
                              onClick={() => handleExcluirProduto(produto.id, produto.nome)}
                              className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                              title="Excluir"
                            >🗑️</button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{produtos.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> produtos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300 disabled:opacity-50 transition-colors"
                    >← Anterior</button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                      <span className="font-medium">{paginaInfo.totalPages}</span>
                    </span>
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300 disabled:opacity-50 transition-colors"
                    >Próxima →</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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