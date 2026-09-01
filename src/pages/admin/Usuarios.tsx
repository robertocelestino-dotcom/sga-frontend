// src/pages/admin/Usuarios.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock, Unlock, Search, UserCog } from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import { perfilService } from '../../services/perfilService';
import { PermissionGuard } from '../../components/PermissionGuard';
import { Usuario } from '../../types/auth';

export const Usuarios: React.FC = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [perfis, setPerfis] = useState<any[]>([]);

    useEffect(() => {
        carregarUsuarios();
        carregarPerfis();
    }, []);

    const carregarUsuarios = async () => {
        try {
            setLoading(true);
            const data = await usuarioService.listarTodos();
            setUsuarios(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarPerfis = async () => {
        try {
            const data = await perfilService.listar();
            setPerfis(data);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
        }
    };

    const handleBloquear = async (id: number) => {
        if (confirm('Deseja bloquear este usuário?')) {
            try {
                await usuarioService.bloquear(id);
                await carregarUsuarios();
            } catch (error) {
                console.error('Erro ao bloquear usuário:', error);
                alert('Erro ao bloquear usuário');
            }
        }
    };

    const handleDesbloquear = async (id: number) => {
        if (confirm('Deseja desbloquear este usuário?')) {
            try {
                await usuarioService.desbloquear(id);
                await carregarUsuarios();
            } catch (error) {
                console.error('Erro ao desbloquear usuário:', error);
                alert('Erro ao desbloquear usuário');
            }
        }
    };

    const handleDeletar = async (id: number) => {
        if (confirm('Deseja excluir este usuário?')) {
            try {
                await usuarioService.deletar(id);
                await carregarUsuarios();
            } catch (error) {
                console.error('Erro ao excluir usuário:', error);
                alert('Erro ao excluir usuário');
            }
        }
    };

    const getPerfilNome = (perfilId: number) => {
        const perfil = perfis.find(p => p.id === perfilId);
        return perfil?.nome || 'N/A';
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Carregando usuários...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Usuários do Sistema</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Gerencie os usuários e suas permissões de acesso
                    </p>
                </div>
                <PermissionGuard requiredPermissions={['USUARIO_CREATE']}>
                    <Link
                        to="/admin/usuarios/novo"
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Usuário
                    </Link>
                </PermissionGuard>
            </div>

            {/* Busca */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Perfil
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredUsuarios.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                    {usuario.username?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {usuario.username}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{usuario.nomeCompleto}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{usuario.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                {usuario.perfilNome || getPerfilNome(usuario.perfilId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    usuario.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                                {usuario.bloqueado && (
                                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                                                    <Link
                                                        to={`/admin/usuarios/${usuario.id}`}
                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>
                                                </PermissionGuard>
                                                {usuario.bloqueado ? (
                                                    <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                                                        <button
                                                            onClick={() => handleDesbloquear(usuario.id)}
                                                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                                            title="Desbloquear"
                                                        >
                                                            <Unlock size={18} />
                                                        </button>
                                                    </PermissionGuard>
                                                ) : (
                                                    <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                                                        <button
                                                            onClick={() => handleBloquear(usuario.id)}
                                                            className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50"
                                                            title="Bloquear"
                                                        >
                                                            <Lock size={18} />
                                                        </button>
                                                    </PermissionGuard>
                                                )}
                                                <PermissionGuard requiredPermissions={['USUARIO_DELETE']}>
                                                    <button
                                                        onClick={() => handleDeletar(usuario.id)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </PermissionGuard>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Total */}
            <div className="mt-4 text-sm text-gray-500">
                Total: {filteredUsuarios.length} usuário(s)
            </div>
        </div>
    );
};