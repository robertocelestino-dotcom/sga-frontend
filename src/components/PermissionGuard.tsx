// components/PermissionGuard.tsx
import React, { ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface PermissionGuardProps {
    children: ReactNode;
    requiredPermissions?: string[];
    requiredRoles?: string[];
    requiredAny?: boolean;
    fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    requiredPermissions = [],  // ✅ VALOR PADRÃO
    requiredRoles = [],        // ✅ VALOR PADRÃO
    requiredAny = false,
    fallback = null,
}) => {
    const { user, permissoes } = useAuthStore();

    // Verificar roles
    const hasRequiredRole = () => {
        if (!requiredRoles || requiredRoles.length === 0) return true;
        const userRole = user?.role || '';
        return requiredRoles.some(role => userRole === role);
    };

    // Verificar permissões
    const hasRequiredPermission = () => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        const userPermissoes = permissoes || [];
        if (requiredAny) {
            return requiredPermissions.some(p => userPermissoes.includes(p));
        }
        return requiredPermissions.every(p => userPermissoes.includes(p));
    };

    const hasAccess = hasRequiredRole() && hasRequiredPermission();

    if (!hasAccess) {
        return fallback;
    }

    return <>{children}</>;
};