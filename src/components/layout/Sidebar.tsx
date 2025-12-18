// src/components/layout/Sidebar.tsx - ATUALIZAR
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaUsers,
  FaFileImport,
  FaMoneyBillWave,
  FaCog,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaBox,
  FaUserPlus,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaTag,
  FaDollarSign
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState({
    cadastro: false,
    importacao: false,
    faturamento: false,
    gestao: false
  });

  const toggleMenu = (menu: string) => {
    setMenuAberto(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaHome size={18} />,
      exact: true
    },
    {
      name: 'Cadastro',
      icon: <FaUserPlus size={18} />,
      submenu: [
        {
          name: 'Produtos',
          path: '/produtos',
          icon: <FaBox size={16} />,
          description: 'Gestão de produtos e serviços'
        },
        {
          name: 'Associados',
          path: '/associados',
          icon: <FaUsers size={16} />,
          description: 'Cadastro de associados'
        },
        {
          name: 'Usuários',
          path: '/usuarios',
          icon: <FaUserPlus size={16} />,
          description: 'Gestão de usuários'
        },
        {
          name: 'Parâmetros',
          path: '/parametrizacao-associados',
          icon: <FaCog size={16} />,
          description: 'Configurações do sistema'
        },
        {
          name: 'Tabela de Preços',
          path: '/tabela-precos',
          icon: <FaTag size={16} />,
          description: 'Preços e valores'
        },
        {
          name: 'Tabela de Valores',
          path: '/tabela-valores',
          icon: <FaDollarSign size={16} />,
          description: 'Valores e tarifas'
        }
      ]
    },
    {
      name: 'Importação',
      icon: <FaFileImport size={18} />,
      submenu: [
        {
          name: 'Importar SPC',
          path: '/importacao-spc',
          icon: <FaFileImport size={16} />
        },
        {
          name: 'Importar Associados',
          path: '/importacao-associados',
          icon: <FaUsers size={16} />
        },
        {
          name: 'Importar Benefícios',
          path: '/importacao-beneficios',
          icon: <FaClipboardList size={16} />
        },
        {
          name: 'Importar Faturamentos',
          path: '/importacao-faturamentos',
          icon: <FaFileInvoiceDollar size={16} />
        },
        {
          name: 'Verificar Importação',
          path: '/verificacao-importacao',
          icon: <FaChartBar size={16} />
        }
      ]
    },
    {
      name: 'Faturamento',
      icon: <FaMoneyBillWave size={18} />,
      submenu: [
        {
          name: 'Processar Faturamento',
          path: '/processar-faturamento',
          icon: <FaFileInvoiceDollar size={16} />
        },
        {
          name: 'Tabelas de Faturamento',
          path: '/tabelas-faturamento',
          icon: <FaClipboardList size={16} />
        }
      ]
    },
    {
      name: 'Gestão',
      icon: <FaChartBar size={18} />,
      submenu: [
        {
          name: 'Benefícios',
          path: '/beneficios',
          icon: <FaClipboardList size={16} />
        },
        {
          name: 'Serviços',
          path: '/servicos',
          icon: <FaCog size={16} />
        },
        {
          name: 'Gestão SPC',
          path: '/gestao-spc',
          icon: <FaChartBar size={16} />
        },
        {
          name: 'Atualização Associados',
          path: '/atualizacao-associados',
          icon: <FaUsers size={16} />
        }
      ]
    },
    {
      name: 'Verificação',
      path: '/verificacao-dashboard',
      icon: <FaChartBar size={18} />
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="h-full bg-gray-900 text-white w-64 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FaBox size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">SGA</h1>
            <p className="text-xs text-gray-400">Sistema de Gestão</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.name.toLowerCase())}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      menuAberto[item.name.toLowerCase() as keyof typeof menuAberto]
                        ? 'bg-gray-800 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {menuAberto[item.name.toLowerCase() as keyof typeof menuAberto] ? (
                      <FaChevronDown size={14} />
                    ) : (
                      <FaChevronRight size={14} />
                    )}
                  </button>

                  {menuAberto[item.name.toLowerCase() as keyof typeof menuAberto] && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.path!}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            isActive(subitem.path!)
                              ? 'bg-blue-900 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          {subitem.icon}
                          <div className="flex-1">
                            <span className="text-sm font-medium">{subitem.name}</span>
                            {subitem.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{subitem.description}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.path!}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive(item.path!)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Versão do Sistema */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="text-center">
            <p className="text-xs text-gray-500">SGA v1.0.0</p>
            <p className="text-xs text-gray-500 mt-1">© 2025 Sistema de Gestão</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;