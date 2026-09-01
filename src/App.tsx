// App.tsx - ATUALIZADO COM CONTROLE DE ACESSO E TODAS AS IMPORTAÇÕES
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { MessageProvider } from './providers/MessageProvider'

// Components de Controle de Acesso
import { RouteGuard } from './components/RouteGuard'
import { PermissionGuard } from './components/PermissionGuard'

// Layout
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Unauthorized from './pages/Unauthorized'

// Importe todas as páginas que você tem na estrutura
import Associados from './pages/Associados'
import AssociadoForm from './pages/AssociadoForm'
import AssociadoDetalhes from './pages/AssociadoDetalhes'
import AtualizacaoAssociados from './pages/AtualizacaoAssociados'
import Beneficios from './pages/Beneficios'
import GestaoSPC from './pages/GestaoSPC'
import ImportacaoAssociados from './pages/ImportacaoAssociados'
import ImportacaoBeneficios from './pages/ImportacaoBeneficios'
import ImportacaoFaturamentos from './pages/ImportacaoFaturamentos'
import ImportacaoSPC from './pages/ImportacaoSPC'
import ParametrizacaoAssociados from './pages/ParametrizacaoAssociados'
import ProcessarFaturamento from './pages/ProcessarFaturamento'
import Servicos from './pages/Servicos'
import TabelaPrecos from './pages/TabelaPrecos'
import TabelasFaturamento from './pages/TabelasFaturamento'
import TabelaValores from './pages/TabelaValores'
import Usuarios from './pages/Usuarios'
import VerificacaoDashboard from './pages/VerificacaoDashboard'
import VerificacaoImportacao from './pages/VerificacaoImportacao'
import LogsSistema from './pages/LogsSistema'

// PÁGINAS DE PRODUTOS
import Produtos from './pages/Produtos'
import ProdutoForm from './pages/ProdutoForm'
import ProdutoDetalhes from './pages/ProdutoDetalhes'

// PÁGINA DE CONSUMO DE FRANQUIAS
import ConsumoFranquiaPage from './pages/ConsumoFranquiaPage'

// PÁGINAS DE PLANOS
import Planos from './pages/Planos'
import PlanoForm from './pages/PlanoForm'
import PlanoDetalhes from './pages/PlanoDetalhes'

// PÁGINAS DE FATURAMENTO
import ReguaFaturamentoPage from './pages/faturamento/ReguaFaturamento'
import ReguaFaturamentoForm from './pages/faturamento/ReguaFaturamentoForm'
import ReguaAssociados from './pages/faturamento/ReguaAssociados'
import ReguaDetalhes from './pages/faturamento/ReguaDetalhes'
import CancelamentosPage from './pages/faturamento/Cancelamentos'
import IntegracaoRmPage from './pages/faturamento/IntegracaoRm'
import FaturasGeradas from './pages/faturamento/FaturasGeradas'
import FaturaDetalhes from './pages/faturamento/FaturaDetalhes'

// NOVAS PÁGINAS
import ImportacaoCancelamentos from './pages/ImportacaoCancelamentos'
import Notificacoes from './pages/Notificacoes'
import HistoricoSincronizacoes from './pages/HistoricoSincronizacoes'
import Vendedores from './pages/Vendedores'

// INTEGRAÇÃO RM API
import IntegracaoRmApi from './pages/faturamento/IntegracaoRmApi'

// ADMIN - CONTROLE DE ACESSO
import { Usuarios as AdminUsuarios } from './pages/admin/Usuarios'
import { Perfis as AdminPerfis } from './pages/admin/Perfis'
import { UsuarioForm as AdminUsuarioForm } from './pages/admin/UsuarioForm'
import { PerfilForm as AdminPerfilForm } from './pages/admin/PerfilForm'

// ANIMAÇÕES
import './styles/animations.css'

// -----------------------
// Rotas Públicas
// -----------------------
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// -----------------------
// Rotas Privadas (com verificação de autenticação)
// -----------------------
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { initialize, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Inicializar o store (verificar token salvo)
    initialize()
  }, [initialize])

  return (
    <MessageProvider>
      <Router>
        <div className="App">
          <Routes>

            {/* ============================================== */}
            {/* ROTA LOGIN (PÚBLICA) */}
            {/* ============================================== */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* ============================================== */}
            {/* ROTA UNAUTHORIZED (PÚBLICA) */}
            {/* ============================================== */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ============================================== */}
            {/* ROTAS PRIVADAS COM LAYOUT */}
            {/* ============================================== */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              {/* Redirecionamento padrão */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* ========== DASHBOARD ========== */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* ========== CADASTROS ========== */}
              {/* Associados */}
              <Route path="associados" element={<Associados />} />
              <Route path="associados/novo" element={<AssociadoForm />} />
              <Route path="associados/editar/:id" element={<AssociadoForm />} />
              <Route path="associados/:id" element={<AssociadoDetalhes />} />
              
              {/* Consumo de Franquias */}
              <Route path="associados/:id/consumo-franquia" element={<ConsumoFranquiaPage />} />
              
              {/* Usuários (antigo) */}
              <Route path="usuarios" element={<Usuarios />} />
              
              {/* Vendedores */}
              <Route path="vendedores" element={<Vendedores />} />
              
              {/* Parâmetros */}
              <Route path="parametrizacao-associados" element={<ParametrizacaoAssociados />} />
              <Route path="tabela-precos" element={<TabelaPrecos />} />
              <Route path="tabela-valores" element={<TabelaValores />} />

              {/* ========== PRODUTOS ========== */}
              <Route path="produtos" element={<Produtos />} />
              <Route path="produtos/novo" element={<ProdutoForm />} />
              <Route path="produtos/editar/:id" element={<ProdutoForm />} />
              <Route path="produtos/:id" element={<ProdutoDetalhes />} />

              {/* ========== PLANOS ========== */}
              <Route path="planos" element={<Planos />} />
              <Route path="planos/novo" element={<PlanoForm />} />
              <Route path="planos/editar/:id" element={<PlanoForm />} />
              <Route path="planos/:id" element={<PlanoDetalhes />} />

              {/* ========== IMPORTAÇÕES ========== */}
              <Route path="importacao-spc" element={<ImportacaoSPC />} />
              <Route path="importacao-associados" element={<ImportacaoAssociados />} />
              <Route path="importacao-beneficios" element={<ImportacaoBeneficios />} />
              <Route path="importacao-faturamentos" element={<ImportacaoFaturamentos />} />
              <Route path="importacao-cancelamentos" element={<ImportacaoCancelamentos />} />

              {/* ========== VERIFICAÇÃO DE IMPORTAÇÕES ========== */}
              <Route path="importacao-spc/:importacaoId/verificacao" element={<VerificacaoDashboard />} />
              <Route path="importacao-spc/:importacaoId/verificacao-old" element={<VerificacaoImportacao />} />

              {/* ========== FATURAMENTO ========== */}
              <Route path="faturamento">
                <Route path="regua" element={<ReguaFaturamentoPage />} />
                <Route path="regua/novo" element={<ReguaFaturamentoForm />} />
                <Route path="regua/editar/:id" element={<ReguaFaturamentoForm />} />
                <Route path="regua/:id/detalhes" element={<ReguaDetalhes />} />
                <Route path="regua/:id/associados" element={<ReguaAssociados />} />
                <Route path="processar" element={<ProcessarFaturamento />} />
                <Route path="faturas" element={<FaturasGeradas />} />
                <Route path="faturas/:id" element={<FaturaDetalhes />} />
                <Route path="cancelamentos" element={<CancelamentosPage />} />
                
                {/* Integrações RM */}
                <Route path="integracoes/rm" element={<IntegracaoRmPage />} />
                <Route path="integracoes/rm-api" element={<IntegracaoRmApi />} />
              </Route>

              {/* Faturamento (legado) */}
              <Route path="processar-faturamento" element={<ProcessarFaturamento />} />
              <Route path="tabelas-faturamento" element={<TabelasFaturamento />} />

              {/* ========== GESTÃO ========== */}
              <Route path="beneficios" element={<Beneficios />} />
              <Route path="servicos" element={<Servicos />} />
              <Route path="gestao-spc" element={<GestaoSPC />} />
              <Route path="atualizacao-associados" element={<AtualizacaoAssociados />} />

              {/* ========== NOTIFICAÇÕES ========== */}
              <Route path="notificacoes" element={<Notificacoes />} />

              {/* ========== VERIFICAÇÃO ========== */}
              <Route path="verificacao-dashboard" element={<VerificacaoDashboard />} />

              {/* ========== RELATÓRIOS E LOGS ========== */}
              <Route path="logs" element={<LogsSistema />} />
              <Route path="sincronizacoes" element={<HistoricoSincronizacoes />} />

              {/* ============================================================ */}
              {/* ADMINISTRAÇÃO - CONTROLE DE ACESSO (Novo) */}
              {/* ============================================================ */}
              <Route
                path="admin/usuarios"
                element={
                  <PermissionGuard requiredPermissions={['USUARIO_VIEW']}>
                    <AdminUsuarios />
                  </PermissionGuard>
                }
              />
              <Route
                path="admin/usuarios/novo"
                element={
                  <PermissionGuard requiredPermissions={['USUARIO_CREATE']}>
                    <AdminUsuarioForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="admin/usuarios/:id"
                element={
                  <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                    <AdminUsuarioForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="admin/perfis"
                element={
                  <PermissionGuard requiredPermissions={['PERFIL_VIEW']}>
                    <AdminPerfis />
                  </PermissionGuard>
                }
              />
              <Route
                path="admin/perfis/novo"
                element={
                  <PermissionGuard requiredPermissions={['PERFIL_CREATE']}>
                    <AdminPerfilForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="admin/perfis/:id"
                element={
                  <PermissionGuard requiredPermissions={['PERFIL_EDIT']}>
                    <AdminPerfilForm />
                  </PermissionGuard>
                }
              />

            </Route>

            {/* ============================================== */}
            {/* FALLBACK - Redireciona para dashboard */}
            {/* ============================================== */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </div>
      </Router>
    </MessageProvider>
  )
}

export default App