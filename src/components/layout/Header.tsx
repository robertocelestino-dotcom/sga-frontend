// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { PermissionGuard } from '../PermissionGuard';
import Avatar from '../Avatar';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
    } catch (error) {
      console.warn('⚠️ Erro no logout:', error);
    }
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b flex-shrink-0">
      <div className="flex justify-between items-center px-4 lg:px-6 py-4 gap-4">

        {/* ============================================================ */}
        {/* BOTÃO HAMBURGUER + TÍTULO                                    */}
        {/* ============================================================ */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Alternar menu"
            aria-label="Alternar menu lateral"
          >
            <Menu size={22} className="text-gray-700" />
          </button>

          <h2 className="text-lg lg:text-xl font-semibold text-gray-800 truncate">
            Sistema de Gestão de Associados
          </h2>
        </div>

        {/* ============================================================ */}
        {/* AÇÕES DO USUÁRIO                                             */}
        {/* ============================================================ */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <span className="hidden sm:inline-block text-gray-600 text-sm">
            Olá, {user?.nomeCompleto || user?.username}
          </span>
          <span className="hidden md:inline-block text-xs px-2 py-1 bg-cdl-navy-50 text-cdl-navy-700 rounded-full font-medium">
            {user?.perfilNome || user?.role}
          </span>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              {/* 🔥 Avatar com foto ou inicial */}
              <Avatar
                fotoBase64={user?.fotoBase64}
                nome={user?.nomeCompleto || user?.username || 'U'}
                size={32}
              />
              <span className="hidden md:inline-block text-gray-600 text-sm">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                {/* 🔥 Cartão do usuário com avatar */}
                <div className="px-4 py-3 text-sm text-gray-700 border-b">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar
                      fotoBase64={user?.fotoBase64}
                      nome={user?.nomeCompleto || user?.username || 'U'}
                      size={40}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {user?.nomeCompleto || user?.username}
                      </div>
                      <div className="text-gray-500 text-xs truncate">{user?.email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-cdl-navy-700 font-medium">
                    {user?.perfilNome || user?.role}
                  </div>
                </div>

                <Link
                  to="/perfil"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Meu Perfil
                </Link>

                <PermissionGuard requiredPermissions={['USUARIO_VIEW']}>
                  <Link
                    to="/admin/usuarios"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Gerenciar Usuários
                  </Link>
                </PermissionGuard>

                <div className="border-t my-1"></div>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;