// src/pages/Planos.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { planoService, PlanoDTO } from '../services/planoService';
import BreadCrumb from '../components/BreadCrumb';
import { useMessage } from '../providers/MessageProvider';
import { PermissionGuard } from '../components/PermissionGuard';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';

const Planos: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();

  const [planos, setPlanos] = useState<PlanoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputFiltro, setInputFiltro] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [size] = useState(10);

  const carregarPlanos = async (filtroParaUsar = filtroAtivo, pageParaUsar = pagina) => {
    setLoading(true);
    try {
      const r = await planoService.listar({
        page: pageParaUsar,
        size,
        sort: 'nome',
        direction: 'asc',
        nome: filtroParaUsar || undefined,
      });
      setPlanos(r.content || []);
      setTotalPaginas(r.totalPages || 0);
      setTotalElementos(r.totalElements || 0);
    } catch (e) {
      console.error(e);
      showToast('Erro ao carregar planos', 'error');
      setPlanos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPlanos(filtroAtivo, pagina);
  }, [pagina]);

  const handleBuscarAgora = () => {
    setFiltroAtivo(inputFiltro);
    setPagina(0);
    carregarPlanos(inputFiltro, 0);
  };

  const limparFiltros = () => {
    setInputFiltro('');
    setFiltroAtivo('');
    setPagina(0);
    carregarPlanos('', 0);
    showToast('Filtros limpos', 'info');
  };

  const handleNovo = () => navigate('/planos/novo');
  const handleEditar = (id: number) => navigate(`/planos/editar/${id}`);
  const handleVisualizar = (id: number) => navigate(`/planos/${id}`);

  const handleExcluir = async (id: number, nome: string) => {
    const ok = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Deseja realmente excluir o plano "${nome}"?`,
      confirmText: 'Sim, excluir',
      cancelText: 'Não, cancelar',
      type: 'warning',
    });
    if (!ok) return;
    try {
      await planoService.excluir(id);
      showToast('Plano excluído com sucesso!', 'success');
      carregarPlanos();
    } catch (e) {
      console.error(e);
      showToast('Erro ao excluir plano', 'error');
    }
  };

  const formatarValor = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const getStatusBadge = (s: string) =>
    ({
      ATIVO: 'bg-cdl-green-100 text-cdl-green-700',
      INATIVO: 'bg-cdl-danger-50 text-cdl-danger-500',
    }[s] ?? 'bg-cdl-neutral-100 text-cdl-neutral-500');

  const temFiltroAtivo = !!filtroAtivo.trim();

  return (
    <div className="p-6">
      <BreadCrumb atual="Planos" />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Gestão de Planos</h1>
          <p className="text-gray-600">
            Total: <span className="font-semibold text-cdl-navy-700">{totalElementos}</span> plano(s) |
            Exibindo: {planos.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <button
            onClick={() => carregarPlanos()}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-100
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>

          <PermissionGuard requiredPermissions={['PLANO_CREATE']}>
            <button
              onClick={handleNovo}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                         hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
            >
              ➕ Novo Plano
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* ===== Filtros ===== */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cdl-navy-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={handleBuscarAgora}
                disabled={loading}
                className="px-3 py-1.5 bg-cdl-navy-700 text-white text-sm rounded-md
                           hover:bg-cdl-navy-800 disabled:opacity-50 transition-all"
              >
                🔍 Buscar Agora
              </button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md
                           hover:bg-gray-300 transition-colors"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Plano
              </label>
              <input
                type="text"
                value={inputFiltro}
                onChange={(e) => setInputFiltro(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBuscarAgora();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                placeholder="Digite para buscar..."
              />
            </div>
          </div>

          {/* Chips de filtros ativos */}
          {temFiltroAtivo && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-100 text-cdl-navy-800">
                  Nome: {filtroAtivo}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Tabela ===== */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && planos.length === 0 ? (
          <TableSkeleton rows={10} cols={5} />
        ) : loading && planos.length > 0 ? (
          <div className="relative">
            <div className="opacity-40 pointer-events-none">
              <TableSkeleton rows={planos.length} cols={5} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-cdl flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                <span className="text-sm font-medium text-cdl-navy-700">Atualizando…</span>
              </div>
            </div>
          </div>
        ) : planos.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhum plano encontrado"
            description={
              temFiltroAtivo
                ? 'Tente ajustar os filtros de busca ou limpe-os para ver todos.'
                : 'Comece cadastrando seu primeiro plano.'
            }
            action={
              temFiltroAtivo ? (
                <button
                  onClick={limparFiltros}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  🔄 Limpar filtros
                </button>
              ) : (
                <PermissionGuard requiredPermissions={['PLANO_CREATE']}>
                  <button
                    onClick={handleNovo}
                    className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  >
                    ➕ Criar Primeiro Plano
                  </button>
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
                    {['Nome', 'Valor', 'Tipo', 'Status', 'Ações'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {planos.map((plano) => (
                    <tr
                      key={plano.id}
                      className="hover:bg-cdl-navy-50/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{plano.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatarValor(plano.valor)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-cdl-navy-100 text-cdl-navy-800">
                          {plano.tipoPlano}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                            plano.status
                          )}`}
                        >
                          {plano.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <PermissionGuard requiredPermissions={['PLANO_VIEW']}>
                            <button
                              onClick={() => handleVisualizar(plano.id!)}
                              className="p-1 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                              title="Ver detalhes"
                            >
                              👁️
                            </button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PLANO_EDIT']}>
                            <button
                              onClick={() => handleEditar(plano.id!)}
                              className="p-1 text-cdl-yellow-600 hover:text-cdl-yellow-700 hover:bg-cdl-yellow-50 rounded transition-colors"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PLANO_DELETE']}>
                            <button
                              onClick={() => handleExcluir(plano.id!, plano.nome)}
                              className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{planos.length}</span> de{' '}
                    <span className="font-medium">{totalElementos}</span> planos
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagina(Math.max(0, pagina - 1))}
                      disabled={pagina === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{pagina + 1}</span> de{' '}
                      <span className="font-medium">{totalPaginas}</span>
                    </span>
                    <button
                      onClick={() => setPagina(Math.min(totalPaginas - 1, pagina + 1))}
                      disabled={pagina === totalPaginas - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default Planos;