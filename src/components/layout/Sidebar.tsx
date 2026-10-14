// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  FaHome,
  FaUsers,
  FaFileImport,
  FaFileInvoiceDollar,
  FaCog,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaBox,
  FaUserPlus,
  FaClipboardCheck,
  FaTag,
  FaCalendarAlt,
  FaPlay,
  FaTrashAlt,
  FaExchangeAlt,
  FaCloudUploadAlt,
  FaEnvelope,
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

const getIcon = (iconName: string, size: number = 18) => {
  const Icon = iconMap[iconName];
  return Icon ? <Icon size={size} /> : <FaCog size={size} />;
};

// ============================================================
// PROPS
// ============================================================
interface SidebarProps {
  collapsed: boolean;
  isMobile: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar = ({ collapsed, isMobile, isMobileOpen, onCloseMobile }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { menus, buildMenuTree } = useAuthStore();
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [menuAberto, setMenuAberto] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buildMenuTree && typeof buildMenuTree === 'function') {
      try {
        const tree = buildMenuTree();
        setMenuTree(tree);
      } catch (error) {
        console.error('❌ Sidebar: erro ao construir árvore:', error);
        setMenuTree([]);
      }
    } else {
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

  //const isActive = (path: string) => {
  //  return location.pathname === path || location.pathname.startsWith(`${path}/`);
  //};
  const isActive = (path: string) => {
    // Remove o prefixo /sga antes de comparar
    // Porque com basename="/sga", o window.location.pathname é "/sga/dashboard"
    // mas os Links usam "/dashboard"
    const currentPath = location.pathname.replace(/^\/sga/, '') || '/';
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
    if (isMobile) onCloseMobile();
  };

  const handleLinkClick = () => {
    // Em mobile, fecha o drawer ao clicar em qualquer link
    if (isMobile) onCloseMobile();
  };

  // Largura efetiva: colapsado = 72px (w-18), expandido = 256px (w-64)
  // Em mobile, sempre expandido (para leitura)
  const sidebarWidth = isMobile ? 'w-64' : collapsed ? 'w-[72px]' : 'w-64';

  // ============================================================
  // RENDER DE CADA ITEM DE MENU
  // ============================================================
  const renderMenu = (items: any[], level: number = 0) => {
    if (!items || items.length === 0) {
      return !collapsed ? (
        <div className="text-white/50 text-sm p-2">Nenhum menu disponível</div>
      ) : null;
    }

    return items.map((item) => {
      const hasSubMenus = item.subMenus && item.subMenus.length > 0;
      const isExpanded = menuAberto[item.id] || false;
      const isActiveRoute = item.caminho ? isActive(item.caminho) : false;

      const isParentActive = hasSubMenus && item.subMenus.some((sub: any) =>
        sub.caminho && isActive(sub.caminho)
      );

      // ============================================================
      // MODO COLAPSADO — só ícone, com tooltip
      // ============================================================
      if (collapsed && !isMobile) {
        // Se tem submenus, apenas mostra o ícone (não expande)
        if (hasSubMenus) {
          return (
            <div key={item.id} className="relative group/item">
              <button
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                  isParentActive
                    ? 'bg-cdl-navy-800 text-white'
                    : 'hover:bg-cdl-navy-800/60 text-white/80 hover:text-white'
                }`}
                title={item.nome}
              >
                {getIcon(item.icone, 20)}
              </button>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.nome}
              </div>
            </div>
          );
        }

        // Sem submenus — link simples
        return (
          <Link
            key={item.id}
            to={item.caminho || '#'}
            onClick={handleLinkClick}
            className={`relative flex items-center justify-center p-2 rounded-lg transition-colors group/item ${
              isActiveRoute
                ? 'bg-cdl-navy-800 text-white'
                : 'text-white/80 hover:bg-cdl-navy-800/60 hover:text-white'
            }`}
            title={item.nome}
          >
            {isActiveRoute && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cdl-yellow-500 rounded-r-full" />
            )}
            {getIcon(item.icone, 20)}
            {/* Tooltip */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.nome}
            </div>
          </Link>
        );
      }

      // ============================================================
      // MODO EXPANDIDO — comportamento original
      // ============================================================
      if (hasSubMenus) {
        return (
          <div key={item.id} className="space-y-1">
            <button
              onClick={() => toggleMenu(item.id)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors text-sm ${
                isExpanded || isParentActive
                  ? 'bg-cdl-navy-800 text-white'
                  : 'hover:bg-cdl-navy-800/60 text-white/80 hover:text-white'
              }`}
              style={{ paddingLeft: level * 16 + 12 }}
            >
              <div className="flex items-center gap-3">
                {getIcon(item.icone)}
                <span className="font-medium">{item.nome}</span>
              </div>
              {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
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
          onClick={handleLinkClick}
          className={`relative flex items-center gap-3 p-2 rounded-lg transition-colors text-sm ${
            isActiveRoute
              ? 'bg-cdl-navy-800 text-white font-semibold'
              : 'text-white/80 hover:bg-cdl-navy-800/60 hover:text-white'
          }`}
          style={{ paddingLeft: level * 16 + 20 }}
        >
          {isActiveRoute && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cdl-yellow-500 rounded-r-full" />
          )}
          {getIcon(item.icone)}
          <span className="font-medium">{item.nome}</span>
        </Link>
      );
    });
  };

  // ============================================================
  // CONTEÚDO INTERNO (reutilizado em desktop e mobile)
  // ============================================================
  const sidebarContent = (
    <div className={`h-full bg-cdl-navy-700 text-white flex flex-col transition-all duration-300 ${sidebarWidth}`}>
      <div className={`flex-1 overflow-y-auto ${collapsed && !isMobile ? 'p-2' : 'p-4'}`}>

        {/* LOGO */}
        <button
          onClick={handleLogoClick}
          className={`w-full flex items-center justify-center mb-4 rounded-lg hover:bg-cdl-navy-800/50 transition-colors group ${
            collapsed && !isMobile ? 'p-2' : 'p-2 mb-6'
          }`}
          title="Ir para o Dashboard"
        >
          <img
            //src="/logo-cdl.jpg"
            src={`${import.meta.env.BASE_URL}logo-cdl.jpg`}
            alt="CDL Fortaleza"
            className={`object-contain transition-transform group-hover:scale-105 ${
              collapsed && !isMobile ? 'h-10 w-10 rounded' : 'h-14 w-auto max-w-full'
            }`}
          />
        </button>

        {/* Separador */}
        <div className="h-px bg-white/10 mb-4"></div>

        {/* MENU */}
        <nav className="space-y-1">
          {renderMenu(menuTree)}
        </nav>
      </div>

      {/* Rodapé */}
      {(!collapsed || isMobile) && (
        <div className="p-4 pt-6 border-t border-white/10 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-white/60">SGA v1.0.0</p>
            <p className="text-xs text-white/40 mt-1">© 2025 CDL Fortaleza</p>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className={`h-full bg-cdl-navy-700 text-white flex-shrink-0 ${sidebarWidth} ${isMobile ? 'fixed inset-y-0 left-0 z-40' : ''}`}>
        <div className="p-4">
          <div className="flex items-center justify-center mb-6 h-16">
            <div className="animate-pulse bg-cdl-navy-800 w-40 h-12 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-cdl-navy-800 h-10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // MOBILE — DRAWER com backdrop
  // ============================================================
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // ============================================================
  // DESKTOP — sidebar fixo
  // ============================================================
  return (
    <div className={`flex-shrink-0 transition-all duration-300 ${sidebarWidth}`}>
      {sidebarContent}
    </div>
  );
};

export default Sidebar;