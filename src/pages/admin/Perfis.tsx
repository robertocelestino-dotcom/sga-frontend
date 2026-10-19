// src/pages/admin/Perfis.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Shield, CheckCircle, XCircle, Search,
  Crown, UserCog, Briefcase, Wrench, User, Eye, EyeOff,
} from 'lucide-react';
import { perfilService } from '../../services/perfilService';
import { Perfil } from '../../types/auth';
import ConfirmModal from '../../components/ui/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState';
import { useMessage } from '../../providers/MessageProvider';
import { useAuthStore } from '../../stores/authStore';

/* ============================================================
   MAPEAMENTOS CDL
   ============================================================ */
const getPerfilIcon = (nome: string) => {
  const nomeUpper = nome?.toUpperCase() || '';
  if (nomeUpper.includes('SUPER_ADMIN') || nomeUpper.includes('SUPER ADMIN')) {
    return { icon: Crown, color: 'text-cdl-yellow-700', bg: 'bg-cdl-yellow-100', border: 'border-cdl-yellow-200' };
  }
  if (nomeUpper.includes('ADMIN')) {
    return { icon: UserCog, color: 'text-cdl-danger-500', bg: 'bg-cdl-danger-50', border: 'border-cdl-danger-100' };
  }
  if (nomeUpper.includes('GERENTE')) {
    return { icon: Briefcase, color: 'text-cdl-navy-700', bg: 'bg-cdl-navy-50', border: 'border-cdl-navy-100' };
  }
  if (nomeUpper.includes('TECNICO') || nomeUpper.includes('TÉCNICO')) {
    return { icon: Wrench, color: 'text-cdl-navy-600', bg: 'bg-cdl-navy-100', border: 'border-cdl-navy-200' };
  }
  if (nomeUpper.includes('OPERADOR')) {
    return { icon: User, color: 'text-cdl-green-700', bg: 'bg-cdl-green-50', border: 'border-cdl-green-100' };
  }
  if (nomeUpper.includes('CONSULTA')) {
    return { icon: Eye, color: 'text-cdl-neutral-500', bg: 'bg-cdl-neutral-100', border: 'border-cdl-neutral-100' };
  }
  return { icon: Shield, color: 'text-cdl-navy-700', bg: 'bg-cdl-navy-50', border: 'border-cdl-navy-100' };
};

const getPerfilBgColor = (nome: string) => {
  const nomeUpper = nome?.toUpperCase() || '';
  if (nomeUpper.includes('SUPER_ADMIN')) return 'bg-cdl-yellow-50/60';
  if (nomeUpper.includes('ADMIN')) return 'bg-cdl-danger-50/40';
  if (nomeUpper.includes('GERENTE')) return 'bg-cdl-navy-50/40';
  if (nomeUpper.includes('TECNICO')) return 'bg-cdl-navy-50/60';
  if (nomeUpper.includes('OPERADOR')) return 'bg-cdl-green-50/40';
  if (nomeUpper.includes('CONSULTA')) return 'bg-cdl-neutral-50';
  return '';
};

const getPerfilBadge = (nome: string) => {
  const nomeUpper = nome?.toUpperCase() || '';
  if (nomeUpper.includes('SUPER_ADMIN')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-yellow-200 text-cdl-yellow-700">⭐</span>;
  }
  if (nomeUpper.includes('ADMIN')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-danger-100 text-cdl-danger-500">🔑</span>;
  }
  if (nomeUpper.includes('GERENTE')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-navy-100 text-cdl-navy-700">📋</span>;
  }
  if (nomeUpper.includes('TECNICO')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-navy-100 text-cdl-navy-600">🔧</span>;
  }
  if (nomeUpper.includes('OPERADOR')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-green-100 text-cdl-green-700">⚙️</span>;
  }
  if (nomeUpper.includes('CONSULTA')) {
    return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-cdl-neutral-100 text-cdl-neutral-500">👁️</span>;
  }
  return null;
};

/* ============================================================
   COMPONENTE
   ============================================================ */
export const Perfis: React.FC = () => {
  const { showToast } = useMessage();
  const { permissoes, user } = useAuthStore();

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [perfilSelecionado, setPerfilSelecionado] = useState<Perfil | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const isSuperAdmin = user?.perfilNome === 'SUPER_ADMIN' || permissoes.includes('SUPER_ADMIN');
  const isAdmin = user?.perfilNome === 'ADMIN' || permissoes.includes('ADMIN');
  const podeVerPerfis = permissoes.includes('PERFIL_VIEW') || isSuperAdmin || isAdmin;
  const podeEditarPerfis = permissoes.includes('PERFIL_EDIT') || isSuperAdmin || isAdmin;
  const podeCriarPerfis = permissoes.includes('PERFIL_CREATE') || isSuperAdmin || isAdmin;
  const podeDeletarPerfis = permissoes.includes('PERFIL_DELETE') || isSuperAdmin || isAdmin;

  const isPerfilVisivel = (perfil: Perfil): boolean => {
    if (isSuperAdmin) return true;
    if (isAdmin) return perfil.nome !== 'SUPER_ADMIN';
    if (podeVerPerfis) return true;
    if (podeEditarPerfis || podeCriarPerfis || podeDeletarPerfis) return true;
    return false;
  };

  const perfisVisiveis = useMemo(() => perfis.filter((p) => isPerfilVisivel(p)), [perfis]);

  useEffect(() => { carregarPerfis(); }, []);

  const carregarPerfis = async () => {
    try {
      setLoading(true);
      const data = await perfilService.listar();
      setPerfis(data);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
      showToast('❌ Erro ao carregar perfis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (perfil: Perfil) => {
    setPerfilSelecionado(perfil);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (perfilSelecionado) {
      try {
        await perfilService.deletar(perfilSelecionado.id);
        showToast(`✅ Perfil "${perfilSelecionado.nome}" excluído com sucesso!`, 'success');
        await carregarPerfis();
      } catch (error: any) {
        console.error('Erro ao excluir perfil:', error);
        const errorMsg = error.response?.data?.message || '❌ Erro ao excluir perfil';
        showToast(errorMsg, 'error');
      } finally {
        setDeleteModalOpen(false);
        setPerfilSelecionado(null);
      }
    }
  };

  const perfisFiltrados = perfisVisiveis.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(perfisFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const perfisPaginados = perfisFiltrados.slice(startIndex, endIndex);

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-green-100 text-cdl-green-700 inline-flex items-center gap-1">
          <CheckCircle size={12} /> Ativo
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-danger-50 text-cdl-danger-500 inline-flex items-center gap-1">
        <XCircle size={12} /> Inativo
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cdl-navy-100 border-t-cdl-navy-700 mb-4" />
          <p className="text-cdl-navy-700 font-medium">Carregando perfis...</p>
        </div>
      </div>
    );
  }

  if (!podeVerPerfis && !isSuperAdmin && !isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-cdl-navy-700 mb-2">Acesso Restrito</h2>
            <p className="text-gray-500">Você não tem permissão para visualizar perfis de acesso.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Perfis de Acesso</h1>
          <p className="text-gray-600">
            Gerencie os perfis e suas permissões no sistema
            {perfisVisiveis.length < perfis.length && (
              <span className="ml-2 text-xs text-gray-400">
                ({perfisVisiveis.length} visíveis de {perfis.length} total)
              </span>
            )}
          </p>
        </div>
        {podeCriarPerfis && (
          <Link
            to="/admin/perfis/novo"
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
          >
            ➕ Novo Perfil
          </Link>
        )}
      </div>

      {/* ===== Aviso de perfis ocultos ===== */}
      {perfisVisiveis.length < perfis.length && (
        <div className="mb-6 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg flex items-center gap-2">
          <EyeOff size={18} className="text-cdl-yellow-700" />
          <span className="text-sm text-cdl-yellow-700 font-medium">
            Alguns perfis estão ocultos pois você não tem permissão para visualizá-los.
          </span>
        </div>
      )}

      {/* ===== Card principal ===== */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Busca */}
        <div className="px-6 py-4 border-b border-gray-200 bg-cdl-neutral-50">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Total: <span className="font-semibold text-cdl-navy-700">{perfisFiltrados.length}</span> perfis
            </div>
          </div>
        </div>

        {/* Tabela / Empty */}
        {perfisFiltrados.length === 0 ? (
          <EmptyState
            icon="🛡️"
            title={searchTerm ? 'Nenhum perfil encontrado' : 'Nenhum perfil cadastrado'}
            description={
              searchTerm
                ? `Nada foi encontrado para "${searchTerm}". Ajuste a busca.`
                : 'Crie o primeiro perfil de acesso para começar.'
            }
            action={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  🔄 Limpar busca
                </button>
              ) : podeCriarPerfis ? (
                <Link
                  to="/admin/perfis/novo"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-cdl-navy-700 text-white
                             rounded-lg font-medium hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  ➕ Criar Primeiro Perfil
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Perfil','Descrição','Menus','Permissões','Status','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          i === 2 || i === 3 || i === 4 ? 'text-center' : i === 5 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {perfisPaginados.map((perfil) => {
                    const { icon: Icon, color, bg, border } = getPerfilIcon(perfil.nome);
                    const bgColor = getPerfilBgColor(perfil.nome);
                    const badge = getPerfilBadge(perfil.nome);
                    const isEditable = podeEditarPerfis || isSuperAdmin || isAdmin;
                    const isDeletable = podeDeletarPerfis || isSuperAdmin || isAdmin;

                    return (
                      <tr key={perfil.id} className={`hover:bg-cdl-navy-50/40 transition-colors ${bgColor}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${bg} ${border} border`}>
                              <Icon size={20} className={color} />
                            </div>
                            <div>
                              <div className="flex items-center text-sm font-medium text-cdl-navy-700">
                                {perfil.nome}
                                {badge}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">ID: {perfil.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {perfil.descricao || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-navy-100 text-cdl-navy-700">
                            {perfil.menus?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100">
                            {perfil.permissoes?.length || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(perfil.ativo)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {isEditable ? (
                              <Link
                                to={`/admin/perfis/${perfil.id}`}
                                className="p-1 text-cdl-yellow-600 hover:text-cdl-yellow-700 hover:bg-cdl-yellow-50 rounded transition-colors"
                                title="Editar perfil"
                              >
                                ✏️
                              </Link>
                            ) : (
                              <span className="p-1 text-gray-300" title="Sem permissão para editar">
                                🚫
                              </span>
                            )}

                            {isDeletable ? (
                              <button
                                onClick={() => handleDeleteClick(perfil)}
                                className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                                title="Excluir perfil"
                              >
                                🗑️
                              </button>
                            ) : (
                              <span className="p-1 text-gray-300" title="Sem permissão para excluir">
                                🚫
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> -{" "}
                    <span className="font-medium">{Math.min(endIndex, perfisFiltrados.length)}</span>{" "}
                    de <span className="font-medium">{perfisFiltrados.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{currentPage}</span> de{" "}
                      <span className="font-medium">{totalPages}</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
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

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="🗑️ Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o perfil "${perfilSelecionado?.nome}"?\n\nEsta ação não poderá ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default Perfis;