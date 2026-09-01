// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';  // 🔥 ADICIONAR Link e useNavigate
import { useAuthStore } from '../../stores/authStore';
import { PermissionGuard } from '../PermissionGuard';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/login');  // 🔥 REDIRECIONAR PARA LOGIN
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center px-4 lg:px-6 py-4">
        <div className="lg:hidden">
          <h2 className="text-lg font-semibold text-gray-800">SGA</h2>
        </div>
        
        <div className="hidden lg:block">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline-block text-gray-600 text-sm">
            Olá, {user?.nomeCompleto || user?.username}
          </span>
          <span className="hidden md:inline-block text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            {user?.perfilNome || user?.role}
          </span>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:inline-block text-gray-600 text-sm">
                ▼
              </span>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border">
                <div className="px-4 py-3 text-sm text-gray-700 border-b">
                  <div className="font-medium">{user?.nomeCompleto || user?.username}</div>
                  <div className="text-gray-500 text-xs">{user?.email}</div>
                  <div className="text-xs text-blue-600 mt-1">{user?.perfilNome || user?.role}</div>
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