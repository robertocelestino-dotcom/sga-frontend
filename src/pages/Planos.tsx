// src/pages/Planos.tsx - VERSÃO CDL
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
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);

  const carregarPlanos = async () => {
    setLoading(true);
    try {
      const r = await planoService.listar({
        page: pagina, size: 10, sort: 'nome', direction: 'asc', nome: filtro,
      });
      setPlanos(r.content || []);
      setTotalPaginas(r.totalPages || 0);
      setTotalElementos(r.totalElements || 0);
    } catch (e) {
      console.error(e);
      showToast('Erro ao carregar planos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarPlanos(); }, [pagina]);

  const handlePesquisar = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(0);
    carregarPlanos();
  };

  const handleNovo = () => navigate('/planos/novo');
  const handleEditar = (id: number) => navigate(`/planos/editar/${id}`);
  const handleVisualizar = (id: number) => navigate(`/planos/${id}`);

  const handleExcluir = async (id: number, nome: string) => {
    const ok = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Deseja realmente excluir o plano "${nome}"?`,
      confirmText: 'Sim, excluir', cancelText: 'Não, cancelar', type: 'warning',
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
    ({ ATIVO: 'bg-cdl-green-100 text-cdl-green-700',
       INATIVO: 'bg-cdl-danger-50 text-cdl-danger-500' }[s] ?? 'bg-cdl-neutral-100 text-cdl-neutral-500');

  const temFiltro = !!filtro.trim();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb links={[{ label: 'Planos' }]} />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700">Planos</h1>
            <p className="text-gray-600 mt-1">Gerencie os planos e suas franquias</p>
          </div>

          <PermissionGuard requiredPermissions={['PLANO_CREATE']}>
            <button
              onClick={handleNovo}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 flex items-center gap-2 font-medium
                         transition-all active:scale-[.98]"
            >
              <span>➕</span> Novo Plano
            </button>
          </PermissionGuard>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <form onSubmit={handlePesquisar} className="flex gap-3">
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Pesquisar por nome do plano..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
            >Buscar</button>
          </form>
        </div>

        {/* Tabela / Skeleton / Empty */}
        {loading && planos.length === 0 ? (
          <TableSkeleton rows={8} cols={5} />
        ) : planos.length === 0 ? (
          <EmptyState
            icon="📋"
            title={temFiltro ? 'Nenhum plano corresponde à busca' : 'Nenhum plano cadastrado ainda'}
            description={
              temFiltro
                ? `Não encontramos planos com o nome "${filtro}".`
                : 'Crie o primeiro plano para começar a organizar seus produtos e franquias.'
            }
            action={
              temFiltro ? (
                <button
                  onClick={() => { setFiltro(''); setPagina(0); carregarPlanos(); }}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >🔄 Limpar busca</button>
              ) : (
                <PermissionGuard requiredPermissions={['PLANO_CREATE']}>
                  <button
                    onClick={handleNovo}
                    className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  >➕ Criar Primeiro Plano</button>
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
                    {['Nome','Valor','Tipo','Status','Ações'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {planos.map((plano) => (
                    <tr key={plano.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{plano.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {formatarValor(plano.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-cdl-navy-100 text-cdl-navy-800 rounded-full">
                          {plano.tipoPlano}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(plano.status)}`}>
                          {plano.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <PermissionGuard requiredPermissions={['PLANO_VIEW']}>
                            <button
                              onClick={() => handleVisualizar(plano.id!)}
                              className="text-cdl-navy-700 hover:text-cdl-navy-900 p-1 rounded hover:bg-cdl-navy-50 transition-colors"
                              title="Visualizar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PLANO_EDIT']}>
                            <button
                              onClick={() => handleEditar(plano.id!)}
                              className="text-cdl-navy-600 hover:text-cdl-navy-800 p-1 rounded hover:bg-cdl-navy-50 transition-colors"
                              title="Editar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </PermissionGuard>
                          <PermissionGuard requiredPermissions={['PLANO_DELETE']}>
                            <button
                              onClick={() => handleExcluir(plano.id!, plano.nome)}
                              className="text-cdl-danger-500 hover:text-cdl-danger-600 p-1 rounded hover:bg-cdl-danger-50 transition-colors"
                              title="Excluir"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Mostrando {planos.length} de {totalElementos} planos
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagina(Math.max(0, pagina - 1))}
                    disabled={pagina === 0}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white
                               hover:border-cdl-navy-300 disabled:opacity-50 transition-colors"
                  >Anterior</button>
                  <span className="px-3 py-1">Página {pagina + 1} de {totalPaginas}</span>
                  <button
                    onClick={() => setPagina(Math.min(totalPaginas - 1, pagina + 1))}
                    disabled={pagina === totalPaginas - 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white
                               hover:border-cdl-navy-300 disabled:opacity-50 transition-colors"
                  >Próxima</button>
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