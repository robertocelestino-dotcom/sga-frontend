// src/pages/admin/UsuarioForm.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, User, Mail, Lock, Shield, Eye, EyeOff,
  Crown, UserCog, Briefcase, Wrench, CheckCircle, XCircle,
  Calendar, AlertCircle,
} from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import { perfilService } from '../../services/perfilService';
import { useMessage } from '../../providers/MessageProvider';

/* ============================================================
   MAPEAMENTO DE ÍCONES CDL
   ============================================================ */
const getPerfilIcon = (nome: string) => {
  const nomeUpper = nome?.toUpperCase() || '';
  if (nomeUpper.includes('SUPER_ADMIN'))
    return { icon: Crown, color: 'text-cdl-yellow-700', bg: 'bg-cdl-yellow-100' };
  if (nomeUpper.includes('ADMIN'))
    return { icon: UserCog, color: 'text-cdl-danger-500', bg: 'bg-cdl-danger-50' };
  if (nomeUpper.includes('GERENTE'))
    return { icon: Briefcase, color: 'text-cdl-navy-700', bg: 'bg-cdl-navy-50' };
  if (nomeUpper.includes('TECNICO'))
    return { icon: Wrench, color: 'text-cdl-navy-600', bg: 'bg-cdl-navy-100' };
  if (nomeUpper.includes('OPERADOR'))
    return { icon: User, color: 'text-cdl-green-700', bg: 'bg-cdl-green-50' };
  if (nomeUpper.includes('CONSULTA'))
    return { icon: Eye, color: 'text-cdl-neutral-500', bg: 'bg-cdl-neutral-100' };
  return { icon: Shield, color: 'text-cdl-navy-700', bg: 'bg-cdl-navy-50' };
};

/* ============================================================
   COMPONENTE
   ============================================================ */
export const UsuarioForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { showToast } = useMessage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [usuarioOriginal, setUsuarioOriginal] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    senha: '',
    nomeCompleto: '',
    perfilId: '',
    ativo: true,
  });

  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    senha?: string;
    nomeCompleto?: string;
    perfilId?: string;
  }>({});

  useEffect(() => {
    carregarPerfis();
    if (isEditing) carregarUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setUsuarioOriginal(data);
      setFormData({
        username: data.username,
        email: data.email,
        senha: '',
        nomeCompleto: data.nomeCompleto,
        perfilId: String(data.perfilId || ''),
        ativo: data.ativo,
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.username.trim()) newErrors.username = 'Usuário é obrigatório';
    else if (formData.username.length < 3) newErrors.username = 'Usuário deve ter no mínimo 3 caracteres';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
      newErrors.username = 'Usuário deve conter apenas letras, números e underscore';

    if (!formData.nomeCompleto.trim()) newErrors.nomeCompleto = 'Nome completo é obrigatório';
    else if (formData.nomeCompleto.length < 3)
      newErrors.nomeCompleto = 'Nome deve ter no mínimo 3 caracteres';

    if (!formData.email.trim()) newErrors.email = 'Email é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Email inválido';

    if (!formData.perfilId) newErrors.perfilId = 'Perfil é obrigatório';

    if (!isEditing && !formData.senha) newErrors.senha = 'Senha é obrigatória';
    else if (formData.senha && formData.senha.length < 6)
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    else if (formData.senha && !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(formData.senha))
      newErrors.senha = 'Senha deve conter letras e números';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('⚠️ Por favor, corrija os erros no formulário', 'warning');
      const firstError = document.querySelector('.border-cdl-danger-500');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const updateData = {
          nomeCompleto: formData.nomeCompleto.trim(),
          email: formData.email.trim(),
          perfilId: Number(formData.perfilId),
          ativo: formData.ativo,
        };

        await usuarioService.atualizar(Number(id), updateData);

        if (formData.senha && formData.senha.length >= 6) {
          await usuarioService.resetarSenha(Number(id), formData.senha);
          showToast(`✅ Usuário "${formData.username}" atualizado com nova senha!`, 'success');
        } else {
          showToast(`✅ Usuário "${formData.username}" atualizado com sucesso!`, 'success');
        }
      } else {
        const dados = {
          username: formData.username.trim(),
          email: formData.email.trim(),
          senha: formData.senha,
          nomeCompleto: formData.nomeCompleto.trim(),
          perfilId: Number(formData.perfilId),
          ativo: formData.ativo,
        };

        await usuarioService.criar(dados);
        showToast(`✅ Usuário "${formData.username}" criado com sucesso!`, 'success');
      }
      navigate('/admin/usuarios');
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      const errorMsg = error.response?.data?.message || '❌ Erro ao salvar usuário';

      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        if (backendErrors.username) setErrors((prev) => ({ ...prev, username: backendErrors.username }));
        if (backendErrors.email) setErrors((prev) => ({ ...prev, email: backendErrors.email }));
        showToast('⚠️ Erro de validação. Verifique os campos destacados.', 'warning');
      } else {
        showToast(errorMsg, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const getSelectedPerfilInfo = () => {
    const perfil = perfis.find((p) => p.id === Number(formData.perfilId));
    if (perfil) return getPerfilIcon(perfil.nome);
    return { icon: Shield, color: 'text-gray-400', bg: 'bg-cdl-neutral-100' };
  };

  const selectedPerfilInfo = getSelectedPerfilInfo();
  const SelectedIcon = selectedPerfilInfo.icon;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cdl-navy-100 border-t-cdl-navy-700 mb-4" />
          <p className="text-cdl-navy-700 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/usuarios')}
          className="p-2 hover:bg-cdl-navy-50 rounded-lg transition-colors text-cdl-navy-700"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700 flex items-center gap-2">
            {isEditing ? <><span>✏️</span> Editar Usuário</> : <><span>➕</span> Novo Usuário</>}
          </h1>
          <p className="text-gray-600 text-sm">
            {isEditing ? 'Atualize as informações do usuário' : 'Crie um novo usuário no sistema'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-cdl p-6 space-y-6">
        {/* Username + Nome */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
              <User size={16} className="inline mr-2" /> Usuário *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={isEditing}
              className={`w-full px-4 py-2.5 border rounded-lg transition-colors ${
                isEditing
                  ? 'bg-cdl-neutral-100 cursor-not-allowed text-gray-500'
                  : 'bg-white focus:outline-none focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600'
              } ${errors.username ? 'border-cdl-danger-500' : 'border-gray-300'}`}
              placeholder="Digite o nome de usuário"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-cdl-danger-500 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.username}
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">🔒 O nome de usuário não pode ser alterado</p>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-500 mt-1">💡 Use apenas letras, números e underscore</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              name="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 border rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors ${
                errors.nomeCompleto ? 'border-cdl-danger-500' : 'border-gray-300'
              }`}
              placeholder="Digite o nome completo"
            />
            {errors.nomeCompleto && (
              <p className="mt-1 text-xs text-cdl-danger-500 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.nomeCompleto}
              </p>
            )}
          </div>
        </div>

        {/* Email + Senha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
              <Mail size={16} className="inline mr-2" /> Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 border rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors ${
                errors.email ? 'border-cdl-danger-500' : 'border-gray-300'
              }`}
              placeholder="Digite o email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-cdl-danger-500 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
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
                className={`w-full px-4 py-2.5 pr-10 border rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors ${
                  errors.senha ? 'border-cdl-danger-500' : 'border-gray-300'
                }`}
                placeholder={isEditing ? 'Deixe em branco para manter a atual' : 'Digite a senha'}
                minLength={6}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-cdl-navy-700 transition-colors"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.senha && (
              <p className="mt-1 text-xs text-cdl-danger-500 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.senha}
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">💡 Preencha apenas se quiser alterar a senha</p>
            )}
            {!isEditing && (
              <p className="text-xs text-gray-500 mt-1">🔒 Mínimo 6 caracteres, com letras e números</p>
            )}
          </div>
        </div>

        {/* Perfil + Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
              <Shield size={16} className="inline mr-2" /> Perfil de Acesso *
            </label>
            <select
              name="perfilId"
              value={formData.perfilId}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2.5 border rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors ${
                errors.perfilId ? 'border-cdl-danger-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione um perfil</option>
              {perfis.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome} - {perfil.descricao}
                </option>
              ))}
            </select>
            {errors.perfilId && (
              <p className="mt-1 text-xs text-cdl-danger-500 flex items-center gap-1 font-medium">
                <AlertCircle size={12} /> {errors.perfilId}
              </p>
            )}
            {formData.perfilId && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                <div className={`p-1.5 rounded ${selectedPerfilInfo.bg}`}>
                  <SelectedIcon size={16} className={selectedPerfilInfo.color} />
                </div>
                <span className="text-xs text-cdl-navy-700 font-medium">
                  Perfil selecionado:{" "}
                  {perfis.find((p) => p.id === Number(formData.perfilId))?.nome}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Status</label>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="w-4 h-4 text-cdl-navy-700 border-gray-300 rounded focus:ring-cdl-navy-600"
                />
                <span className="text-sm text-cdl-navy-700 font-medium">Usuário ativo</span>
              </label>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                formData.ativo
                  ? 'bg-cdl-green-100 text-cdl-green-700'
                  : 'bg-cdl-danger-50 text-cdl-danger-500'
              }`}>
                {formData.ativo ? (
                  <><CheckCircle size={12} /> Ativo</>
                ) : (
                  <><XCircle size={12} /> Inativo</>
                )}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">💡 Usuários inativos não podem acessar o sistema</p>
          </div>
        </div>

        {/* Info adicional (edição) */}
        {isEditing && usuarioOriginal && (
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-cdl-navy-700 mb-3 flex items-center gap-2">
              <Calendar size={16} /> 📋 Informações do Usuário
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-cdl-navy-600 text-xs block">ID</span>
                <span className="font-mono font-medium text-cdl-navy-700">{id}</span>
              </div>
              <div>
                <span className="text-cdl-navy-600 text-xs block">Criado em</span>
                <span className="font-medium text-gray-900">{formatDate(usuarioOriginal.criadoEm)}</span>
              </div>
              <div>
                <span className="text-cdl-navy-600 text-xs block">Último login</span>
                <span className="font-medium text-gray-900">
                  {formatDate(usuarioOriginal.ultimoLogin) || 'Nunca'}
                </span>
              </div>
              <div>
                <span className="text-cdl-navy-600 text-xs block">Tentativas</span>
                <span className="font-medium text-gray-900">{usuarioOriginal.tentativasLogin || 0}</span>
              </div>
            </div>
            {usuarioOriginal.bloqueado && (
              <div className="mt-3 flex items-center gap-2 text-sm text-cdl-yellow-700 bg-cdl-yellow-50 border border-cdl-yellow-100 p-2.5 rounded-lg">
                <AlertCircle size={16} />
                <span className="font-medium">⚠️ Este usuário está bloqueado</span>
              </div>
            )}
          </div>
        )}

        {/* Resumo perfil atual (edição) */}
        {isEditing && usuarioOriginal && usuarioOriginal.perfilNome && (
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-cdl-navy-700 mb-1 flex items-center gap-2">
              <Shield size={16} /> Perfil Atual: {usuarioOriginal.perfilNome}
            </h4>
            <p className="text-xs text-cdl-navy-600">
              Alterar o perfil irá atualizar as permissões de acesso do usuário
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin/usuarios')}
            className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 rounded-lg
                       hover:bg-cdl-neutral-50 transition-colors font-medium"
          >
            ❌ Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-cdl-navy-700 text-white
                       rounded-lg hover:bg-cdl-navy-800 transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Save size={20} />
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Salvando...
              </>
            ) : isEditing ? '💾 Atualizar' : '➕ Criar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuarioForm;