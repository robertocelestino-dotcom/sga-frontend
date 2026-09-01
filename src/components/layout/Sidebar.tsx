// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
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
  FaDollarSign,
  FaClipboardCheck,
  FaCalendarAlt,
  FaPlay,
  FaTrashAlt,
  FaExchangeAlt,
  FaCloudUploadAlt,
  FaEnvelope,
  FaPlug,
  FaUserCog,
  FaShieldAlt,
  FaSlidersH,
  FaDatabase,
} from 'react-icons/fa';

// Mapeamento de ícones
const iconMap: Record<string, any> = {
  'LayoutDashboard': FaHome,
  'Database': FaDatabase,
  'FileText': FaFileInvoiceDollar,
  'UploadCloud': FaCloudUploadAlt,
  'Bell': FaEnvelope,
  'BarChart3': FaChartBar,
  'Settings': FaCog,
  'Users': FaUsers,
  'Package': FaBox,
  'Layers': FaClipboardCheck,
  'UserCog': FaUserCog,
  'Tags': FaTag,
  'PlayCircle': FaPlay,
  'FileCheck': FaClipboardCheck,
  'Ruler': FaCalendarAlt,
  'Server': FaDatabase,
  'XCircle': FaTrashAlt,
  'UserPlus': FaUserPlus,
  'FileUp': FaFileImport,
  'XSquare': FaTrashAlt,
  'PackagePlus': FaBox,
  'CheckCircle': FaClipboardCheck,
  'PieChart': FaChartBar,
  'ShieldCheck': FaShieldAlt,
  'Activity': FaChartBar,
  'RefreshCw': FaExchangeAlt,
  'UserCheck': FaUserCog,
  'Sliders': FaSlidersH,
  'PlusCircle': FaUserPlus,
};

const getIcon = (iconName: string) => {
  const Icon = iconMap[iconName];
  return Icon ? <Icon size={18} /> : <FaCog size={18} />;
};

const Sidebar = () => {
  const location = useLocation();
  const { menus, buildMenuTree } = useAuthStore();
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [menuAberto, setMenuAberto] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 Sidebar: menus recebidos:', menus);
    
    if (buildMenuTree && typeof buildMenuTree === 'function') {
      try {
        const tree = buildMenuTree();
        console.log('✅ Sidebar: árvore construída:', tree);
        setMenuTree(tree);
      } catch (error) {
        console.error('❌ Sidebar: erro ao construir árvore:', error);
        setMenuTree([]);
      }
    } else {
      console.warn('⚠️ Sidebar: buildMenuTree não é uma função');
      setMenuTree([]);
    }
    setLoading(false);
  }, [menus, buildMenuTree]);

  const toggleMenu = (menuId: number) => {
    setMenuAberto(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderMenu = (items: any[], level: number = 0) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-gray-500 text-sm p-2">
          Nenhum menu disponível
        </div>
      );
    }

    return items.map((item) => {
      const Icon = getIcon(item.icone);
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const isExpanded = menuAberto[item.id] || false;
      const isActiveRoute = item.caminho ? isActive(item.caminho) : false;

      // Verificar se o menu está ativo (para destacar)
      const isParentActive = hasSubMenus && item.subMenus.some((sub: any) => 
        sub.caminho && isActive(sub.caminho)
      );

      if (hasSubMenus) {
        return (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-sm ${
                isExpanded || isParentActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 text-gray-300'
              }`}
              style={{ paddingLeft: level * 16 + 12 }}
            >
              <div className="flex items-center gap-3">
                {Icon}
                <span className="font-medium">{item.nome}</span>
              </div>
              {isExpanded ? (
                <FaChevronDown size={12} />
              ) : (
                <FaChevronRight size={12} />
              )}
            </button>

            {isExpanded && (
              <div className="ml-4 space-y-1">
                {renderMenu(item.subMenus, level + 1)}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.id}
          to={item.caminho || '#'}
          className={`flex items-center gap-3 p-2 rounded-lg transition-colors text-sm ${
            isActiveRoute
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
          style={{ paddingLeft: level * 16 + 20 }}
        >
          {Icon}
          <span className="font-medium">{item.nome}</span>
        </Link>
      );
    });
  };

  if (loading) {
    return (
      <div className="h-full bg-gray-900 text-white w-64 flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FaBox size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">SGA</h1>
              <p className="text-xs text-gray-400">Carregando...</p>
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-gray-800 h-10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
          {renderMenu(menuTree)}
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