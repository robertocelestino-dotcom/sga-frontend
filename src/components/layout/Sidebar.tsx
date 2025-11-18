import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    cadastros: false,
    gestaoServicos: false,
    gestaoFaturamento: false,
    importacoes: false
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const menuStructure = [
    {
      name: 'Dashboard',
      path: '/',
      icon: '📊',
    },
    {
      name: 'Cadastros',
      key: 'cadastros',
      icon: '📋',
      items: [
        { name: 'Associados', path: '/cadastros/associados', icon: '👥' },
        { name: 'Usuários', path: '/cadastros/usuarios', icon: '👤' }
      ]
    },
    {
      name: 'Gestão de Serviços',
      key: 'gestaoServicos',
      icon: '🛠️',
      items: [
        { name: 'Serviços', path: '/servicos/gestao/servicos', icon: '🔧' },
        { name: 'Produtos', path: '/servicos/gestao/produtos', icon: '📦' },
        { name: 'Tabela de Valores', path: '/servicos/gestao/tabela-valores', icon: '💰' }
      ]
    },
    {
      name: 'Gestão de Faturamento',
      key: 'gestaoFaturamento',
      icon: '💳',
      items: [
        { name: 'SPC', path: '/faturamento/gestao/spc', icon: '📄' },
        { name: 'Benefícios', path: '/faturamento/gestao/beneficios', icon: '🎁' },
        { name: 'Tabela de Preços', path: '/faturamento/gestao/tabela-precos', icon: '📋' }
      ]
    },
    {
      name: 'Importações',
      key: 'importacoes',
      icon: '📥',
      items: [
        { name: 'Associados', path: '/importacoes/associados', icon: '👥' },
        { name: 'Faturamentos', path: '/importacoes/faturamentos', icon: '💳' }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-gray-800 text-white rounded-lg shadow-lg"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-800 text-white min-h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Simplificado */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Segoe UI, sans-serif' }}>SGA</h1>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'Segoe UI, sans-serif' }}>Sistema de Gestão</p>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* User Info Simplificado */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ fontFamily: 'Segoe UI, sans-serif' }}>
                {user?.username}
              </p>
              <button
                onClick={logout}
                className="text-xs text-gray-400 hover:text-white mt-1"
                style={{ fontFamily: 'Segoe UI, sans-serif' }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {/* Navigation - Sem Scroll */}
        <nav className="flex-1">
          {menuStructure.map((item) => (
            <div key={item.path || item.key} className="border-b border-gray-700 last:border-b-0">
              {'path' in item ? (
                // Item simples (Dashboard)
                <Link
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center px-4 py-3 transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  style={{ fontFamily: 'Segoe UI, sans-serif' }}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ) : (
                // Menu com subitens
                <div>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition-colors"
                    style={{ fontFamily: 'Segoe UI, sans-serif' }}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </div>
                    <span className={`transform transition-transform ${openMenus[item.key] ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {openMenus[item.key] && (
                    <div className="bg-gray-750">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center px-8 py-2 transition-colors ${
                            location.pathname === subItem.path
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                          style={{ fontFamily: 'Segoe UI, sans-serif' }}
                        >
                          <span className="mr-3 text-sm">{subItem.icon}</span>
                          <span className="text-sm">{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;