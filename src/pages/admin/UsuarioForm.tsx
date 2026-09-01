// src/pages/admin/UsuarioForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ArrowLeft, Save, User, Mail, Lock, Shield, Eye, EyeOff,
    Crown, UserCog, Briefcase, Wrench, CheckCircle, XCircle
} from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import { perfilService } from '../../services/perfilService';
import { useMessage } from '../../providers/MessageProvider';

// MAPEAMENTO DE ÍCONES POR PERFIL
const getPerfilIcon = (nome: string) => {
    const nomeUpper = nome?.toUpperCase() || '';
    if (nomeUpper.includes('SUPER_ADMIN')) return { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (nomeUpper.includes('ADMIN')) return { icon: UserCog, color: 'text-red-600', bg: 'bg-red-100' };
    if (nomeUpper.includes('GERENTE')) return { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' };
    if (nomeUpper.includes('TECNICO')) return { icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-100' };
    if (nomeUpper.includes('OPERADOR')) return { icon: User, color: 'text-green-600', bg: 'bg-green-100' };
    if (nomeUpper.includes('CONSULTA')) return { icon: Eye, color: 'text-gray-600', bg: 'bg-gray-100' };
    return { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' };
};

export const UsuarioForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const { showToast } = useMessage();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        senha: '',
        nomeCompleto: '',
        perfilId: '',
        ativo: true
    });

    useEffect(() => {
        carregarPerfis();
        if (isEditing) {
            carregarUsuario();
        }
    }, [id]);

    const carregarPerfis = async () => {
        try {
            const data = await perfilService.listarAtivos();
            setPerfis(data);
        } catch (error) {
            console.error('Erro ao carregar perfis:', error);
            showToast('❌ Erro ao carregar perfis', 'error');
        }
    };

    const carregarUsuario = async () => {
        try {
            setLoading(true);
            const data = await usuarioService.buscarPorId(Number(id));
            setFormData({
                username: data.username,
                email: data.email,
                senha: '',
                nomeCompleto: data.nomeCompleto,
                perfilId: String(data.perfilId || ''),
                ativo: data.ativo
            });
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            showToast('❌ Erro ao carregar dados do usuário', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Validações
            if (!formData.username) {
                showToast('⚠️ Usuário é obrigatório', 'warning');
                setSaving(false);
                return;
            }
            if (!formData.nomeCompleto) {
                showToast('⚠️ Nome completo é obrigatório', 'warning');
                setSaving(false);
                return;
            }
            if (!formData.email) {
                showToast('⚠️ Email é obrigatório', 'warning');
                setSaving(false);
                return;
            }
            if (!formData.perfilId) {
                showToast('⚠️ Perfil é obrigatório', 'warning');
                setSaving(false);
                return;
            }
            if (!isEditing && !formData.senha) {
                showToast('⚠️ Senha é obrigatória', 'warning');
                setSaving(false);
                return;
            }
            if (!isEditing && formData.senha.length < 6) {
                showToast('⚠️ A senha deve ter no mínimo 6 caracteres', 'warning');
                setSaving(false);
                return;
            }

            if (isEditing) {
                // 🔥 1. Atualizar dados básicos
                const updateData = {
                    nomeCompleto: formData.nomeCompleto,
                    email: formData.email,
                    perfilId: Number(formData.perfilId),
                    ativo: formData.ativo
                };
                await usuarioService.atualizar(Number(id), updateData);
                
                // 🔥 2. Se uma nova senha foi informada, alterar (usando resetar senha)
                if (formData.senha && formData.senha.length >= 6) {
                    // 🔥 Usar resetar senha (não precisa da senha atual)
                    await usuarioService.resetarSenha(Number(id), formData.senha);
                }
                
                showToast(`✅ Usuário "${formData.username}" atualizado com sucesso!`, 'success');
            } else {
                await usuarioService.criar({
                    username: formData.username,
                    email: formData.email,
                    senha: formData.senha,
                    nomeCompleto: formData.nomeCompleto,
                    perfilId: Number(formData.perfilId),
                    ativo: formData.ativo
                });
                showToast(`✅ Usuário "${formData.username}" criado com sucesso!`, 'success');
            }
            navigate('/admin/usuarios');
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            const errorMsg = error.response?.data?.message || '❌ Erro ao salvar usuário';
            showToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const getSelectedPerfilInfo = () => {
        const perfil = perfis.find(p => p.id === Number(formData.perfilId));
        if (perfil) {
            return getPerfilIcon(perfil.nome);
        }
        return { icon: Shield, color: 'text-gray-400', bg: 'bg-gray-100' };
    };

    const selectedPerfilInfo = getSelectedPerfilInfo();
    const SelectedIcon = selectedPerfilInfo.icon;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/usuarios')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {isEditing ? 'Atualize as informações do usuário' : 'Crie um novo usuário no sistema'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <User size={16} className="inline mr-2" />
                            Usuário *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            disabled={isEditing}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                isEditing ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="Digite o nome de usuário"
                        />
                        {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">🔒 O nome de usuário não pode ser alterado</p>
                        )}
                    </div>

                    {/* Nome Completo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            name="nomeCompleto"
                            value={formData.nomeCompleto}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite o nome completo"
                        />
                    </div>
                </div>

                {/* Email e Senha */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Mail size={16} className="inline mr-2" />
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Digite o email"
                        />
                    </div>

                    {/* Senha */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Lock size={16} className="inline mr-2" />
                            {isEditing ? '🔑 Nova Senha (opcional)' : '🔑 Senha *'}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="senha"
                                value={formData.senha}
                                onChange={handleChange}
                                required={!isEditing}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                                placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'Digite a senha'}
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {isEditing && (
                            <p className="text-xs text-gray-500 mt-1">💡 Preencha apenas se quiser alterar a senha</p>
                        )}
                        {!isEditing && (
                            <p className="text-xs text-gray-500 mt-1">🔒 A senha deve ter no mínimo 6 caracteres</p>
                        )}
                    </div>
                </div>

                {/* Perfil e Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Perfil */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Shield size={16} className="inline mr-2" />
                            Perfil de Acesso *
                        </label>
                        <select
                            name="perfilId"
                            value={formData.perfilId}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Selecione um perfil</option>
                            {perfis.map((perfil) => {
                                return (
                                    <option key={perfil.id} value={perfil.id}>
                                        {perfil.nome} - {perfil.descricao}
                                    </option>
                                );
                            })}
                        </select>
                        {formData.perfilId && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className={`p-1.5 rounded ${selectedPerfilInfo.bg}`}>
                                    <SelectedIcon size={16} className={selectedPerfilInfo.color} />
                                </div>
                                <span className="text-xs text-gray-500">
                                    Perfil selecionado: {perfis.find(p => p.id === Number(formData.perfilId))?.nome}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="ativo"
                                    checked={formData.ativo}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Usuário ativo</span>
                            </label>
                            <span className={`text-xs px-2 py-1 rounded-full ${formData.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {formData.ativo ? <CheckCircle size={12} className="inline mr-1" /> : <XCircle size={12} className="inline mr-1" />}
                                {formData.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Informações adicionais (apenas edição) */}
                {isEditing && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Informações do Usuário</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">ID:</span>
                                <span className="ml-2 font-medium">{id}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Criado em:</span>
                                <span className="ml-2 font-medium">-</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Último login:</span>
                                <span className="ml-2 font-medium">-</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Tentativas:</span>
                                <span className="ml-2 font-medium">0</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/usuarios')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? '⏳ Salvando...' : (isEditing ? '💾 Atualizar' : '➕ Criar')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UsuarioForm;