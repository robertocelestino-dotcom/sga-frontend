// src/pages/Login.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LogIn, Lock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import logoCdl from '../assets/logo-cdl.jpg';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'erro' | 'bloqueado' | 'aviso'>('erro');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ username, password });

      if (result.success) {
        navigate('/dashboard');
      } else {
        const msg = result.error || 'Erro ao fazer login';
        setErrorType(msg.toLowerCase().includes('bloquead') ? 'bloqueado' : 'erro');
        setError(msg);
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 423) {
        setErrorType('bloqueado');
        setError(`🔒 ${data?.message || 'Conta bloqueada. Contate o administrador.'}`);
      } else if (status === 401) {
        setErrorType('aviso');
        const restantes = data?.tentativasRestantes;
        if (restantes !== undefined && restantes > 0) {
          setError(`❌ Usuário ou senha incorretos. Você ainda tem ${restantes} tentativa(s).`);
        } else {
          setError(`❌ ${data?.message || 'Usuário ou senha incorretos.'}`);
        }
      } else {
        setErrorType('erro');
        setError(data?.message || error.message || 'Erro ao fazer login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'username' | 'password', value: string) => {
    setError('');
    if (field === 'username') setUsername(value);
    else setPassword(value);
  };

  const getErrorClasses = () => {
    switch (errorType) {
      case 'bloqueado':
        return 'bg-cdl-danger-50 border-cdl-danger-500 text-cdl-danger-600';
      case 'aviso':
        return 'bg-cdl-yellow-50 border-cdl-yellow-500 text-cdl-yellow-700';
      default:
        return 'bg-cdl-danger-50 border-cdl-danger-100 text-cdl-danger-500';
    }
  };

  const getErrorIconColor = () => {
    switch (errorType) {
      case 'bloqueado': return 'text-cdl-danger-500';
      case 'aviso': return 'text-cdl-yellow-600';
      default: return 'text-cdl-danger-500';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cdl-gradient-reverse relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cdl-yellow-500 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cdl-green-500 blur-3xl" />
      </div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] p-8 border-t-4 border-cdl-yellow-500">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={logoCdl}
              alt="CDL Fortaleza"
              className="h-20 w-auto mx-auto mb-4 object-contain"
            />
            <h2 className="text-2xl font-bold text-cdl-navy-700 mb-1">
              Sistema SGA
            </h2>
            <p className="text-gray-600 text-sm">
              Sistema de Gestão de Associados
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Erro */}
            {error && (
              <div className={`border rounded-lg p-4 flex items-start gap-2 ${getErrorClasses()}`}>
                <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${getErrorIconColor()}`} />
                <span className="text-sm font-medium whitespace-pre-line">{error}</span>
              </div>
            )}

            {/* Usuário */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-cdl-navy-700 mb-2">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={loading}
                autoComplete="username"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg
                           placeholder-gray-400 focus:outline-none focus:ring-2
                           focus:ring-cdl-navy-600 focus:border-cdl-navy-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => handleInputChange('username', e.target.value)}
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cdl-navy-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="block w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg
                             placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-cdl-navy-600 focus:border-cdl-navy-600
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-colors"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-cdl-navy-700 transition-colors disabled:opacity-50
                             disabled:cursor-not-allowed p-1 rounded"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg
                         text-sm font-semibold text-white bg-cdl-navy-700 hover:bg-cdl-navy-800
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cdl-navy-500
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all
                         active:scale-[.98]"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Entrar no Sistema
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <Lock size={12} />
              Conexão segura · SGA v1.0.0 · © 2025 CDL Fortaleza
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;