// src/components/BreadCrumb.tsx - Atualizar
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

interface BreadCrumbProps {
  atual: string;
  links?: Array<{ label: string; path?: string }>;
}

const BreadCrumb: React.FC<BreadCrumbProps> = ({ atual, links = [] }) => {
  const location = useLocation();
  
  // Mapeamento de rotas para breadcrumbs automáticos
  const getBreadcrumbFromPath = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let accumulatedPath = '';
    for (const path of paths) {
      accumulatedPath += `/${path}`;
      
      // Mapeamento de nomes amigáveis
      const nameMap: Record<string, string> = {
        'produtos': 'Produtos',
        'associados': 'Associados',
        'usuarios': 'Usuários',
        'dashboard': 'Dashboard',
        'novo': 'Novo',
        'editar': 'Editar',
        'importacao-spc': 'Importação SPC'
      };
      
      const name = nameMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
      
      breadcrumbs.push({
        name,
        path: accumulatedPath
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = links.length > 0 
    ? links.map((link, index) => ({
        name: link.label,
        path: link.path,
        isLast: index === links.length - 1
      }))
    : getBreadcrumbFromPath().map((crumb, index, array) => ({
        ...crumb,
        isLast: index === array.length - 1
      }));

  return (
    <nav className="flex items-center text-sm text-gray-600 mb-6" aria-label="Breadcrumb">
      <Link to="/dashboard" className="hover:text-gray-900">
        <FaHome className="inline mr-2" />
        Home
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <FaChevronRight className="mx-2 text-gray-400" size={12} />
          
          {crumb.isLast ? (
            <span className="font-medium text-gray-800">
              {crumb.name}
            </span>
          ) : crumb.path ? (
            <Link to={crumb.path} className="hover:text-gray-900">
              {crumb.name}
            </Link>
          ) : (
            <span>{crumb.name}</span>
          )}
        </div>
      ))}
    </nav>
  );
};

export default BreadCrumb;