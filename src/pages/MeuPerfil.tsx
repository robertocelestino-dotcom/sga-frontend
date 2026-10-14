// src/pages/MeuPerfil.tsx - VERSÃO CDL
import React, { useState, useRef } from 'react';
import {
  User, Mail, Shield, Lock, Eye, EyeOff, CheckCircle,
  AlertCircle, Smartphone, LogOut, Info, Camera, Upload, X,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';
import { useMessage } from '../providers/MessageProvider';
import Avatar from '../components/Avatar';

const MeuPerfil: React.FC = () => {
  const { user, logoutAll, atualizarFoto, removerFoto } = useAuthStore();
  const { showToast, showConfirm } = useMessage();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState('');

  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ============================================================
     TROCAR SENHA
     ============================================================ */
  const validar = (): boolean => {
    setErroSenha('');
    if (!senhaAtual.trim()) { setErroSenha('Informe a senha atual'); return false; }
    if (!novaSenha || novaSenha.length < 6) { setErroSenha('Nova senha deve ter no mínimo 6 caracteres'); return false; }
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(novaSenha)) { setErroSenha('Nova senha deve conter letras e números'); return false; }
    if (novaSenha === senhaAtual) { setErroSenha('A nova senha não pode ser igual à atual'); return false; }
    if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não conferem'); return false; }
    return true;
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setSalvandoSenha(true);
    try {
      await authService.trocarMinhaSenha(senhaAtual, novaSenha);
      showToast('✅ Senha alterada com sucesso!', 'success');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Erro ao alterar senha';
      setErroSenha(msg);
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setSalvandoSenha(false);
    }
  };

  /* ============================================================
     FOTO
     ============================================================ */
  const handleSelecionarFoto = () => fileInputRef.current?.click();

  const handleFotoSelecionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Selecione uma imagem (JPG, PNG)', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('❌ Imagem muito grande. Máximo: 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewFoto(base64);
      setSalvandoFoto(true);
      try {
        await authService.atualizarMinhaFoto(base64);
        atualizarFoto(base64);
        showToast('✅ Foto atualizada com sucesso!', 'success');
        setPreviewFoto(null);
      } catch (error: any) {
        const msg = error.response?.data?.message || error.message || 'Erro ao atualizar foto';
        showToast(`❌ ${msg}`, 'error');
        setPreviewFoto(null);
      } finally {
        setSalvandoFoto(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = async () => {
    const confirmado = await showConfirm({
      title: '🗑️ Remover foto',
      message: 'Tem certeza que deseja remover sua foto de perfil?',
      confirmText: 'Sim, remover',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (!confirmado) return;

    setSalvandoFoto(true);
    try {
      await authService.removerMinhaFoto();
      removerFoto();
      showToast('🗑️ Foto removida com sucesso!', 'success');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Erro ao remover foto';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setSalvandoFoto(false);
    }
  };

  /* ============================================================
     LOGOUT ALL
     ============================================================ */
  const handleLogoutAll = async () => {
    const confirmado = await showConfirm({
      title: '🔐 Sair de todos os dispositivos',
      message: 'Tem certeza? Você será desconectado de TODOS os dispositivos onde está logado, incluindo este.',
      confirmText: 'Sim, sair de todos',
      cancelText: 'Cancelar',
      type: 'warning',
    });
    if (!confirmado) return;

    try {
      await logoutAll();
      showToast('🔐 Todas as sessões foram encerradas.', 'success');
      window.location.href = '/sga/login';
    } catch (error) {
      showToast('❌ Erro ao encerrar sessões', 'error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cdl-navy-700 flex items-center gap-2">
          <span>👤</span> Meu Perfil
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Gerencie suas informações pessoais e segurança
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA */}
        <div className="lg:col-span-1 space-y-6">
          {/* Cartão do usuário */}
          <div className="bg-white rounded-xl shadow-cdl p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar
                fotoBase64={previewFoto || user?.fotoBase64}
                nome={user?.nomeCompleto || user?.username || 'U'}
                size={96}
                className="mx-auto border-4 border-white shadow-cdl"
              />
              <button
                type="button"
                onClick={handleSelecionarFoto}
                disabled={salvandoFoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-cdl-navy-700 text-white rounded-full
                           flex items-center justify-center shadow-cdl hover:bg-cdl-navy-800
                           disabled:opacity-50 transition-all active:scale-[.95]"
                title="Trocar foto"
              >
                {salvandoFoto ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFotoSelecionada}
                className="hidden"
              />
            </div>

            <h2 className="text-lg font-semibold text-cdl-navy-700">
              {user?.nomeCompleto || user?.username}
            </h2>
            <p className="text-sm text-gray-500 mt-1 break-all">{user?.email}</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full
                               bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100">
                <Shield size={12} className="inline mr-1" />
                {user?.perfilNome || user?.role}
              </span>
            </div>

            {/* Ações foto */}
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleSelecionarFoto}
                disabled={salvandoFoto}
                className="text-xs px-3 py-1.5 bg-cdl-navy-50 text-cdl-navy-700 rounded-lg
                           hover:bg-cdl-navy-100 disabled:opacity-50 transition-colors
                           flex items-center gap-1 font-medium"
              >
                <Upload size={12} />
                {user?.fotoBase64 ? 'Trocar' : 'Adicionar'}
              </button>

              {user?.fotoBase64 && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  disabled={salvandoFoto}
                  className="text-xs px-3 py-1.5 bg-cdl-danger-50 text-cdl-danger-500 rounded-lg
                             hover:bg-cdl-danger-100 disabled:opacity-50 transition-colors
                             flex items-center gap-1 font-medium"
                >
                  <X size={12} /> Remover
                </button>
              )}
            </div>
          </div>

          {/* Dica de segurança */}
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-cdl-navy-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-cdl-navy-700">Dica de segurança</p>
                <p className="text-xs text-cdl-navy-600 mt-1">
                  Use senhas fortes e únicas. Nunca compartilhe sua senha com ninguém.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações da conta */}
          <div className="bg-white rounded-xl shadow-cdl p-6">
            <h3 className="text-lg font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
              <User size={20} className="text-cdl-navy-700" />
              Informações da Conta
            </h3>
            <div className="space-y-3">
              {[
                { icon: User,   label: 'Usuário:', value: user?.username,     mono: true },
                { icon: User,   label: 'Nome:',    value: user?.nomeCompleto },
                { icon: Mail,   label: 'E-mail:',  value: user?.email },
                { icon: Shield, label: 'Perfil:',  value: user?.perfilNome || user?.role },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <row.icon size={16} className="text-cdl-navy-400 flex-shrink-0" />
                  <span className="text-cdl-navy-600 w-24 font-medium">{row.label}</span>
                  <span className={`font-medium text-cdl-navy-700 ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Trocar senha */}
          <div className="bg-white rounded-xl shadow-cdl p-6">
            <h3 className="text-lg font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
              <Lock size={20} className="text-cdl-navy-700" />
              Trocar Senha
            </h3>

            {erroSenha && (
              <div className="mb-4 p-3 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-cdl-danger-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-cdl-danger-600 font-medium">{erroSenha}</span>
              </div>
            )}

            <form onSubmit={handleTrocarSenha} className="space-y-4">
              {[
                { label: 'Senha atual',         value: senhaAtual,     setter: setSenhaAtual,     ph: 'Digite sua senha atual' },
                { label: 'Nova senha',          value: novaSenha,      setter: setNovaSenha,      ph: 'Mínimo 6 caracteres com letras e números' },
                { label: 'Confirmar nova senha', value: confirmarSenha, setter: setConfirmarSenha, ph: 'Repita a nova senha' },
              ].map((f) => (
                <div key={f.label}>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                    {f.label}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    required
                    disabled={salvandoSenha}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 disabled:opacity-50 transition-colors"
                    placeholder={f.ph}
                  />
                </div>
              ))}

              <div className="flex items-center gap-2">
                <input
                  id="showPassword"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 text-cdl-navy-700 border-gray-300 rounded focus:ring-cdl-navy-600"
                />
                <label htmlFor="showPassword" className="text-sm text-cdl-navy-700 font-medium flex items-center gap-1">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  Mostrar senhas
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvandoSenha}
                  className="px-6 py-2.5 bg-cdl-navy-700 text-white rounded-lg
                             hover:bg-cdl-navy-800 disabled:opacity-50 transition-all
                             active:scale-[.98] flex items-center gap-2 font-medium"
                >
                  {salvandoSenha ? (
                    <>
                      <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Alterar senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sessões ativas */}
          <div className="bg-white rounded-xl shadow-cdl p-6">
            <h3 className="text-lg font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
              <Smartphone size={20} className="text-cdl-navy-700" />
              Sessões Ativas
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-cdl-green-50 border border-cdl-green-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cdl-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={20} className="text-cdl-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cdl-green-700">Sessão atual</p>
                    <p className="text-xs text-cdl-green-600">Este dispositivo</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-cdl-green-200 text-cdl-green-700 rounded-full font-bold">
                  ATIVA
                </span>
              </div>

              <div className="text-xs text-cdl-navy-600 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                💡 Você pode estar logado em outros dispositivos. Se desconfiar de algo, use o botão
                abaixo para encerrar <strong>todas as sessões</strong>.
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleLogoutAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-3
                           bg-cdl-danger-50 text-cdl-danger-600 border border-cdl-danger-100
                           rounded-lg hover:bg-cdl-danger-100 transition-colors font-medium"
              >
                <LogOut size={18} />
                Sair de todos os dispositivos
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Encerra todas as sessões ativas. Você precisará fazer login novamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeuPerfil;