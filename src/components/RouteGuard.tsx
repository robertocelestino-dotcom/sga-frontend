// ============================================================
//                    ROUTE GUARD
// ============================================================

// components/RouteGuard.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface RouteGuardProps {
    requiredPermissions?: string[];
    requiredAny?: boolean;
    redirectTo?: string;
}

export const RouteGuard = ({
    requiredPermissions = [],
    requiredAny = false,
    redirectTo = '/login'
}: RouteGuardProps) => {
    const { isAuthenticated, hasPermission, hasAnyPermission } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    if (requiredPermissions.length > 0) {
        const hasAccess = requiredAny
            ? hasAnyPermission(requiredPermissions)
            : requiredPermissions.every(p => hasPermission(p));

        if (!hasAccess) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
};
