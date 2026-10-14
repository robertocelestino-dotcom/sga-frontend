// ============================================================
//                    MENU GENERATOR
// ============================================================

// components/MenuGenerator.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';

// Ícones simples
const IconMap: Record<string, string> = {
    'LayoutDashboard': '📊',
    'Database': '🗄️',
    'FileText': '📄',
    'UploadCloud': '☁️',
    'Bell': '🔔',
    'BarChart3': '📈',
    'Settings': '⚙️',
    'Users': '👥',
    'Package': '📦',
    'Layers': '📚',
    'UserCog': '👤⚙️',
    'Tags': '🏷️',
    'PlayCircle': '▶️',
    'FileCheck': '✅',
    'Ruler': '📏',
    'Server': '🖥️',
    'XCircle': '❌',
    'UserPlus': '👤➕',
    'FileUp': '📤',
    'XSquare': '❌',
    'PackagePlus': '📦➕',
    'CheckCircle': '✔️',
    'PieChart': '🍩',
    'ShieldCheck': '🛡️',
    'Activity': '📊',
    'RefreshCw': '🔄',
    'UserCheck': '✅👤',
    'Sliders': '🎛️',
    'PlusCircle': '➕',
    'Circle': '⬤',
    'ChevronDown': '▼',
    'ClipboardCheck': '📋✅'
};

const getIcon = (iconName: string): string => {
    return IconMap[iconName] || '📌';
};

export const MenuGenerator = () => {
    // 🔥 Extrai tudo o que é usado do store de uma só vez
    const { buildMenuTree, user, hasPermission } = useAuthStore();
    const menuTree = buildMenuTree();

    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());

    // Expandir menus baseado na rota atual
    useEffect(() => {
        const expandPath = (items: any[], path: string) => {
            for (const item of items) {
                if (item.caminho && (path === item.caminho || path.startsWith(item.caminho + '/'))) {
                    setExpandedMenus(prev => new Set(prev).add(item.id));
                    if (item.menuPaiId) {
                        const findParent = (list: any[], parentId: number) => {
                            for (const i of list) {
                                if (i.id === parentId) {
                                    setExpandedMenus(prev => new Set(prev).add(i.id));
                                    return;
                                }
                                if (i.subMenus) {
                                    findParent(i.subMenus, parentId);
                                }
                            }
                        };
                        findParent(menuTree, item.menuPaiId);
                    }
                    return;
                }
                if (item.subMenus) {
                    expandPath(item.subMenus, path);
                }
            }
        };
        expandPath(menuTree, location.pathname);
    }, [location.pathname, menuTree]);

    const toggleMenu = (menuId: number) => {
        const newExpanded = new Set(expandedMenus);
        if (newExpanded.has(menuId)) {
            newExpanded.delete(menuId);
        } else {
            newExpanded.add(menuId);
        }
        setExpandedMenus(newExpanded);
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const renderMenu = (items: any[], level: number = 0) => {
        return items.map(item => {
            const icon = getIcon(item.icone);
            const hasSubMenus = item.subMenus && item.subMenus.length > 0;
            const isExpanded = expandedMenus.has(item.id);
            const isActiveRoute = item.caminho ? isActive(item.caminho) : false;

            if (hasSubMenus) {
                return (
                    <div key={item.id} className="menu-group" style={{ paddingLeft: level * 16 }}>
                        <div
                            className={`menu-header ${isExpanded ? 'expanded' : ''} ${isActiveRoute ? 'active' : ''}`}
                            onClick={() => toggleMenu(item.id)}
                        >
                            <span className="menu-icon">{icon}</span>
                            <span className="menu-label">{item.nome}</span>
                            <span className={`menu-chevron ${isExpanded ? 'rotated' : ''}`}>▼</span>
                        </div>
                        {isExpanded && (
                            <div className="sub-menu">
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
                    className={`menu-item ${isActiveRoute ? 'active' : ''}`}
                    style={{ paddingLeft: level * 16 + 8 }}
                >
                    <span className="menu-icon">{icon}</span>
                    <span className="menu-label">{item.nome}</span>
                </Link>
            );
        });
    };

    // 🔥 Filtra menus conforme permissões do usuário.
    //    SUPER_ADMIN e ADMIN veem tudo.
    const filterMenuByPermissions = (items: any[]): any[] => {
        const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ROLE_SUPER_ADMIN';
        const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

        if (isSuperAdmin || isAdmin) {
            return items;
        }

        return items
            .map(item => {
                if (item.permissao && !hasPermission(item.permissao)) {
                    return null;
                }

                if (item.subMenus && item.subMenus.length > 0) {
                    const filteredChildren = filterMenuByPermissions(item.subMenus);
                    if (filteredChildren.length === 0) {
                        return null;
                    }
                    return { ...item, subMenus: filteredChildren };
                }

                return item;
            })
            .filter(item => item !== null);
    };

    const filteredMenuTree = filterMenuByPermissions(menuTree);

    if (!filteredMenuTree || filteredMenuTree.length === 0) {
        return <div className="menu-empty">Nenhum menu disponível</div>;
    }

    return <nav className="menu-container">{renderMenu(filteredMenuTree)}</nav>;
};