// src/hooks/useSidebar.ts
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sga-sidebar-collapsed';
const MOBILE_BREAKPOINT = 1024; // lg do Tailwind

export const useSidebar = () => {
  // ============================================================
  // Estado desktop (persiste no localStorage)
  // ============================================================
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  // ============================================================
  // Estado mobile (drawer aberto/fechado)
  // ============================================================
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ============================================================
  // Detectar se é mobile
  // ============================================================
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      // Se virou desktop, fecha o drawer mobile
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // Persistir estado collapsed no localStorage
  // ============================================================
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Ignora erros de localStorage (ex: modo privado)
    }
  }, [collapsed]);

  // ============================================================
  // Ações
  // ============================================================
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen(prev => !prev);
    } else {
      setCollapsed(prev => !prev);
    }
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return {
    collapsed,
    setCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    isMobile,
    toggleSidebar,
    closeMobileSidebar,
  };
};