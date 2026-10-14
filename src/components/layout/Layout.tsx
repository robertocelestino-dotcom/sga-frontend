import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebar } from '../../hooks/useSidebar';

const Layout = () => {
  const {
    collapsed,
    isMobileOpen,
    isMobile,
    toggleSidebar,
    closeMobileSidebar,
  } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ============================================================ */}
      {/* SIDEBAR                                                     */}
      {/* ============================================================ */}
      <Sidebar
        collapsed={collapsed}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* ============================================================ */}
      {/* ÁREA PRINCIPAL (Header + Conteúdo)                          */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;