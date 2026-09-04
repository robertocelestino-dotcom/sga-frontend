// src/pages/admin/Perfis.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    Plus, Edit, Trash2, Shield, CheckCircle, XCircle, Search, 
    Crown, UserCog, Users, User, Wrench, Eye, UserCheck,
    Award, Star, Briefcase, Settings, UserCircle, EyeOff
} from 'lucide-react';
import { perfilService } from '../../services/perfilService';
import { PermissionGuard } from '../../components/PermissionGuard';
import { Perfil } from '../../types/auth';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useMessage } from '../../providers/MessageProvider';
import { useAuthStore } from '../../stores/authStore';

// 🔥 MAPEAMENTO DE ÍCONES POR PERFIL
const getPerfilIcon = (nome: string) => {
    const nomeUpper = nome?.toUpperCase() || '';
    
    if (nomeUpper.includes('SUPER_ADMIN') || nomeUpper.includes('SUPER ADMIN')) {
        return { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    }
    if (nomeUpper.includes('ADMIN')) {
        return { icon: UserCog, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    }
    if (nomeUpper.includes('GERENTE')) {
        return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' };
    }
    if (nomeUpper.includes('TECNICO') || nomeUpper.includes('TÉCNICO')) {
        return { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' };
    }
    if (nomeUpper.includes('OPERADOR')) {
        return { icon: User, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' };
    }
    if (nomeUpper.includes('CONSULTA')) {
        return { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
    // Fallback
    return { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' };
};

// 🔥 MAPEAMENTO DE CORES DE BACKGROUND
const getPerfilBgColor = (nome: string) => {
    const nomeUpper = nome?.toUpperCase() || '';
    if (nomeUpper.includes('SUPER_ADMIN')) return 'bg-gradient-to-r from-yellow-50 to-yellow-100/50';
    if (nomeUpper.includes('ADMIN')) return 'bg-gradient-to-r from-red-50 to-red-100/50';
    if (nomeUpper.includes('GERENTE')) return 'bg-gradient-to-r from-blue-50 to-blue-100/50';
    if (nomeUpper.includes('TECNICO')) return 'bg-gradient-to-r from-purple-50 to-purple-100/50';
    if (nomeUpper.includes('OPERADOR')) return 'bg-gradient-to-r from-green-50 to-green-100/50';
    if (nomeUpper.includes('CONSULTA')) return 'bg-gradient-to-r from-gray-50 to-gray-100/50';
    return 'bg-white';
};

// 🔥 MAPEAMENTO DE BADGES
const getPerfilBadge = (nome: string) => {
    const nomeUpper = nome?.toUpperCase() || '';
    if (nomeUpper.includes('SUPER_ADMIN')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-200 text-yellow-800">⭐</span>;
    }
    if (nomeUpper.includes('ADMIN')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-200 text-red-800">🔑</span>;
    }
    if (nomeUpper.includes('GERENTE')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-blue-200 text-blue-800">📋</span>;
    }
    if (nomeUpper.includes('TECNICO')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-purple-200 text-purple-800">🔧</span>;
    }
    if (nomeUpper.includes('OPERADOR')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-green-200 text-green-800">⚙️</span>;
    }
    if (nomeUpper.includes('CONSULTA')) {
        return <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-gray-200 text-gray-600">👁️</span>;
    }
    return null;
};

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

    // 🔥 VERIFICAR PERMISSÕES DO USUÁRIO
    const isSuperAdmin = user?.perfilNome === 'SUPER_ADMIN' || permissoes.includes('SUPER_ADMIN');
    const isAdmin = user?.perfilNome === 'ADMIN' || permissoes.includes('ADMIN');
    const podeVerPerfis = permissoes.includes('PERFIL_VIEW') || isSuperAdmin || isAdmin;
    const podeEditarPerfis = permissoes.includes('PERFIL_EDIT') || isSuperAdmin || isAdmin;
    const podeCriarPerfis = permissoes.includes('PERFIL_CREATE') || isSuperAdmin || isAdmin;
    const podeDeletarPerfis = permissoes.includes('PERFIL_DELETE') || isSuperAdmin || isAdmin;

    // 🔥 VERIFICAR SE O PERFIL É VISÍVEL PARA O USUÁRIO
    const isPerfilVisivel = (perfil: Perfil): boolean => {
        // SUPER_ADMIN vê tudo
        if (isSuperAdmin) return true;
        
        // ADMIN vê todos exceto SUPER_ADMIN
        if (isAdmin) {
            return perfil.nome !== 'SUPER_ADMIN';
        }
        
        // Usuários com PERFIL_VIEW vêem todos
        if (podeVerPerfis) return true;
        
        // Usuários com permissões de edição/criação/exclusão vêem todos
        if (podeEditarPerfis || podeCriarPerfis || podeDeletarPerfis) return true;
        
        // Se não tem nenhuma permissão de perfil, não vê nada
        return false;
    };

    // 🔥 FILTRAR PERFIS VISÍVEIS
    const perfisVisiveis = useMemo(() => {
        return perfis.filter(p => isPerfilVisivel(p));
    }, [perfis]);

    useEffect(() => {
        carregarPerfis();
    }, []);

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

    const perfisFiltrados = perfisVisiveis.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(perfisFiltrados.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const perfisPaginados = perfisFiltrados.slice(startIndex, endIndex);

    const getStatusBadge = (ativo: boolean) => {
        if (ativo) {
            return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle size={12} /> Ativo</span>;
        }
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12} /> Inativo</span>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Carregando perfis...</p>
                </div>
            </div>
        );
    }

    // 🔥 SE NÃO TIVER PERMISSÃO PARA VER PERFIS
    if (!podeVerPerfis && !isSuperAdmin && !isAdmin) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Acesso Restrito</h2>
                    <p className="text-gray-500">Você não tem permissão para visualizar perfis de acesso.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🛡️ Perfis de Acesso</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Gerencie os perfis e suas permissões no sistema
                        {perfisVisiveis.length < perfis.length && (
                            <span className="ml-2 text-xs text-gray-400">
                                ({perfisVisiveis.length} visíveis de {perfis.length} total)
                            </span>
                        )}
                    </p>
                </div>
                {/* 🔥 PERFIL_CREATE */}
                {podeCriarPerfis && (
                    <Link
                        to="/admin/perfis/novo"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Perfil
                    </Link>
                )}
            </div>

            {/* 🔥 INDICADOR DE PERFIL OCULTO */}
            {perfisVisiveis.length < perfis.length && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <EyeOff size={18} className="text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                        Alguns perfis estão ocultos pois você não tem permissão para visualizá-los.
                    </span>
                </div>
            )}

            {/* Filtros e Busca */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou descrição..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Total: {perfisFiltrados.length} perfis</span>
                    </div>
                </div>
            </div>

            {/* Tabela de Perfis */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Perfil
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descrição
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Menus
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Permissões
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {perfisPaginados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        {searchTerm ? 'Nenhum perfil encontrado para esta busca' : 'Nenhum perfil cadastrado'}
                                    </td>
                                </tr>
                            ) : (
                                perfisPaginados.map((perfil) => {
                                    const { icon: Icon, color, bg, border } = getPerfilIcon(perfil.nome);
                                    const bgColor = getPerfilBgColor(perfil.nome);
                                    const badge = getPerfilBadge(perfil.nome);
                                    
                                    // 🔥 VERIFICAR SE O PERFIL É EDITÁVEL
                                    const isEditable = podeEditarPerfis || isSuperAdmin || isAdmin;
                                    const isDeletable = podeDeletarPerfis || isSuperAdmin || isAdmin;

                                    return (
                                        <tr key={perfil.id} className={`hover:bg-gray-50 transition-colors ${bgColor}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${bg} ${border}`}>
                                                        <Icon size={20} className={color} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center text-sm font-medium text-gray-900">
                                                            {perfil.nome}
                                                            {badge}
                                                        </div>
                                                        <div className="text-xs text-gray-500">ID: {perfil.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                    {perfil.descricao || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                    {perfil.menus?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                                    {perfil.permissoes?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(perfil.ativo)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* 🔥 PERFIL_EDIT */}
                                                    {isEditable && (
                                                        <Link
                                                            to={`/admin/perfis/${perfil.id}`}
                                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                                            title="Editar perfil"
                                                        >
                                                            <Edit size={18} />
                                                        </Link>
                                                    )}
                                                    {!isEditable && (
                                                        <span className="text-gray-300 p-1" title="Sem permissão para editar">
                                                            <Edit size={18} className="opacity-30" />
                                                        </span>
                                                    )}

                                                    {/* 🔥 PERFIL_DELETE */}
                                                    {isDeletable && (
                                                        <button
                                                            onClick={() => handleDeleteClick(perfil)}
                                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                                            title="Excluir perfil"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    )}
                                                    {!isDeletable && (
                                                        <span className="text-gray-300 p-1" title="Sem permissão para excluir">
                                                            <Trash2 size={18} className="opacity-30" />
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t">
                        <div className="text-sm text-gray-500">
                            Mostrando {startIndex + 1} - {Math.min(endIndex, perfisFiltrados.length)} de {perfisFiltrados.length}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                            >
                                ◀ Anterior
                            </button>
                            <span className="px-3 py-1 text-gray-600">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                            >
                                Próxima ▶
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Confirmação */}
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