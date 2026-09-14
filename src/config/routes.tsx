// ============================================================
//                    ROUTES CONFIG
// ============================================================

// config/routes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { RouteGuard } from '../components/RouteGuard';

// Layout
import { Layout } from '../components/Layout/Layout';

// Páginas
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Unauthorized from '../pages/Unauthorized';

// Admin
import { Usuarios } from '../pages/admin/Usuarios';
import { UsuarioForm } from '../pages/admin/UsuarioForm';
import { Perfis } from '../pages/admin/Perfis';
import { PerfilForm } from '../pages/admin/PerfilForm';
import ConferenciaFaturamento from '../pages/faturamento/ConferenciaFaturamento';
// Outras páginas (importar conforme necessário)
// import Associados from '../pages/Associados';
// import Produtos from '../pages/Produtos';
// etc.

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Rotas Protegidas com Layout */}
            <Route element={<RouteGuard />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
            </Route>

            {/* Rotas com Permissões Específicas */}
            <Route element={<RouteGuard requiredPermissions={['USUARIO_VIEW']} />}>
                <Route element={<Layout />}>
                    <Route path="/admin/usuarios" element={<Usuarios />} />
                    <Route path="/admin/usuarios/novo" element={<UsuarioForm />} />
                    <Route path="/admin/usuarios/:id" element={<UsuarioForm />} />
                </Route>
            </Route>

            <Route element={<RouteGuard requiredPermissions={['PERFIL_VIEW']} />}>
                <Route element={<Layout />}>
                    <Route path="/admin/perfis" element={<Perfis />} />
                    <Route path="/admin/perfis/novo" element={<PerfilForm />} />
                    <Route path="/admin/perfis/:id" element={<PerfilForm />} />
                </Route>
            </Route>

            {/* Outras rotas protegidas */}
            <Route element={<RouteGuard requiredPermissions={['ASSOCIADO_VIEW']} />}>
                <Route element={<Layout />}>
                    {/* <Route path="/associados" element={<Associados />} /> */}
                </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
};