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

/**
 * Normaliza uma string de role removendo prefixo ROLE_ e uppercase.
 */
const normalizeRole = (role?: string | null): string =>
    (role || '').toUpperCase().replace(/^ROLE_/, '').trim();

/**
 * Extrai todas as possíveis representações do role/perfil do usuário.
 * Cobre diferentes formatos que o backend pode retornar.
 */
const extractUserRoles = (user: any): string[] => {
    if (!user) return [];

    const candidates: (string | undefined | null)[] = [
        user.role,
        user.perfil?.nome,
        user.perfil?.descricao,
        user.perfilNome,
        typeof user.perfil === 'string' ? user.perfil : undefined,
    ];

    // Suporte a arrays de perfis/roles
    if (Array.isArray(user.perfis)) {
        candidates.push(...user.perfis.map((p: any) => p?.nome ?? p));
    }
    if (Array.isArray(user.roles)) {
        candidates.push(...user.roles);
    }

    return candidates
        .filter(Boolean)
        .map((v: any) => normalizeRole(String(v)));
};

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    requiredPermissions = [],
    requiredRoles = [],
    requiredAny = false,
    fallback = null,
}) => {
    const { user, permissoes } = useAuthStore();

    // ============================================================
    // 🔓 BYPASS PARA SUPER_ADMIN / ADMIN
    // SUPER_ADMIN e ADMIN possuem acesso total por definição.
    // Isso evita bloqueios por permissões granulares ausentes
    // (ex: REGUA_VIEW, FATURA_CREATE) que o backend não criou.
    // ============================================================
    const userRoles = extractUserRoles(user);
    const isPrivileged =
        userRoles.includes('SUPER_ADMIN') ||
        userRoles.includes('ADMIN') ||
        userRoles.includes('SUPERADMIN'); // fallback para variantes

    // Se for SUPER_ADMIN/ADMIN e NÃO houver exigência explícita de role,
    // libera o acesso direto.
    if (isPrivileged && requiredRoles.length === 0) {
        return <>{children}</>;
    }

    // ============================================================
    // VERIFICAÇÃO DE ROLES (comportamento original preservado)
    // ============================================================
    const hasRequiredRole = (): boolean => {
        if (!requiredRoles || requiredRoles.length === 0) return true;
        return requiredRoles.some(role =>
            userRoles.includes(normalizeRole(role))
        );
    };

    // ============================================================
    // VERIFICAÇÃO DE PERMISSÕES (comportamento original preservado)
    // ============================================================
    const hasRequiredPermission = (): boolean => {
        if (!requiredPermissions || requiredPermissions.length === 0) return true;
        const userPermissoes = permissoes || [];
        if (requiredAny) {
            return requiredPermissions.some(p => userPermissoes.includes(p));
        }
        return requiredPermissions.every(p => userPermissoes.includes(p));
    };

    const hasAccess = hasRequiredRole() && hasRequiredPermission();

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};