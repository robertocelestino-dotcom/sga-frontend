// src/pages/Vendedores.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { vendedorService, Vendedor, vendedorOpcoes } from '../services/vendedorService';
import { PermissionGuard } from '../components/PermissionGuard';

export const Vendedores: React.FC = () => {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const [formData, setFormData] = useState({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        tipo: 'COMERCIAL'
    });

    useEffect(() => {
        carregarVendedores();
    }, []);

    const carregarVendedores = async () => {
        try {
            setLoading(true);
            const data = await vendedorService.listar();
            setVendedores(data);
        } catch (error) {
            console.error('Erro ao carregar vendedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirModal = (vendedor?: Vendedor) => {
        if (vendedor) {
            setSelectedVendedor(vendedor);
            setFormData({
                nome: vendedor.nome || '',
                cpf: vendedor.cpf || '',
                email: vendedor.email || '',
                telefone: vendedor.telefone || '',
                tipo: vendedor.tipo || 'COMERCIAL'
            });
        } else {
            setSelectedVendedor(null);
            setFormData({
                nome: '',
                cpf: '',
                email: '',
                telefone: '',
                tipo: 'COMERCIAL'
            });
        }
        setShowModal(true);
    };

    const handleFecharModal = () => {
        setShowModal(false);
        setSelectedVendedor(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedVendedor) {
                await vendedorService.atualizar(selectedVendedor.id, formData);
                alert('Vendedor atualizado com sucesso!');
            } else {
                await vendedorService.criar(formData);
                alert('Vendedor criado com sucesso!');
            }
            handleFecharModal();
            await carregarVendedores();
        } catch (error: any) {
            console.error('Erro ao salvar vendedor:', error);
            alert(error.response?.data?.message || 'Erro ao salvar vendedor');
        }
    };

    const handleToggleAtivo = async (id: number) => {
        try {
            await vendedorService.toggleAtivo(id);
            await carregarVendedores();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status do vendedor');
        }
    };

    const handleExcluir = async (id: number) => {
        if (confirm('Deseja excluir este vendedor?')) {
            try {
                await vendedorService.excluir(id);
                await carregarVendedores();
            } catch (error) {
                console.error('Erro ao excluir vendedor:', error);
                alert('Erro ao excluir vendedor');
            }
        }
    };

    const filteredVendedores = vendedores.filter(v =>
        v.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.cpf?.includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Carregando vendedores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vendedores</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Gerencie os vendedores e representantes comerciais
                    </p>
                </div>
                <PermissionGuard requiredPermissions={['VENDEDOR_CREATE']}>
                    <button
                        onClick={() => handleAbrirModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Vendedor
                    </button>
                </PermissionGuard>
            </div>

            {/* Busca */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou email..."
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
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CPF
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
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
                            {filteredVendedores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum vendedor encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredVendedores.map((vendedor) => (
                                    <tr key={vendedor.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {vendedor.nome}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {vendedor.cpf || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {vendedor.email || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                {vendedor.tipo || 'COMERCIAL'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                vendedor.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {vendedor.ativo ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                <PermissionGuard requiredPermissions={['VENDEDOR_EDIT']}>
                                                    <button
                                                        onClick={() => handleAbrirModal(vendedor)}
                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard requiredPermissions={['VENDEDOR_EDIT']}>
                                                    <button
                                                        onClick={() => handleToggleAtivo(vendedor.id)}
                                                        className={`p-1 rounded hover:bg-gray-50 ${
                                                            vendedor.ativo ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                                        }`}
                                                        title={vendedor.ativo ? 'Desativar' : 'Ativar'}
                                                    >
                                                        {vendedor.ativo ? <UserX size={18} /> : <UserCheck size={18} />}
                                                    </button>
                                                </PermissionGuard>
                                                <PermissionGuard requiredPermissions={['VENDEDOR_DELETE']}>
                                                    <button
                                                        onClick={() => handleExcluir(vendedor.id)}
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

            <div className="mt-4 text-sm text-gray-500">
                Total: {filteredVendedores.length} vendedor(es)
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {selectedVendedor ? 'Editar Vendedor' : 'Novo Vendedor'}
                            </h2>
                            <button
                                onClick={handleFecharModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Digite o nome do vendedor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CPF
                                </label>
                                <input
                                    type="text"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Digite o CPF"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Digite o email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefone
                                </label>
                                <input
                                    type="text"
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Digite o telefone"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={formData.tipo}
                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="COMERCIAL">Comercial</option>
                                    <option value="REPRESENTANTE">Representante</option>
                                    <option value="INTERNO">Interno</option>
                                    <option value="EXTERNO">Externo</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={handleFecharModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {selectedVendedor ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vendedores;