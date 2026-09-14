// App.tsx - VERSÃO COMPLETA COM CONTROLE DE ACESSO E PERMISSION GUARD
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

// ============================================================
// PÁGINAS - ASSOCIADOS
// ============================================================
import Associados from './pages/Associados'
import AssociadoForm from './pages/AssociadoForm'
import AssociadoDetalhes from './pages/AssociadoDetalhes'
import AtualizacaoAssociados from './pages/AtualizacaoAssociados'
import ImportacaoAssociados from './pages/ImportacaoAssociados'
import ParametrizacaoAssociados from './pages/ParametrizacaoAssociados'
import ConsumoFranquiaPage from './pages/ConsumoFranquiaPage'

// ============================================================
// PÁGINAS - PRODUTOS
// ============================================================
import Produtos from './pages/Produtos'
import ProdutoForm from './pages/ProdutoForm'
import ProdutoDetalhes from './pages/ProdutoDetalhes'

// ============================================================
// PÁGINAS - PLANOS
// ============================================================
import Planos from './pages/Planos'
import PlanoForm from './pages/PlanoForm'
import PlanoDetalhes from './pages/PlanoDetalhes'

// ============================================================
// PÁGINAS - FATURAMENTO
// ============================================================
import ProcessarFaturamento from './pages/ProcessarFaturamento'
import ReguaFaturamentoPage from './pages/faturamento/ReguaFaturamento'
import ReguaFaturamentoForm from './pages/faturamento/ReguaFaturamentoForm'
import ReguaAssociados from './pages/faturamento/ReguaAssociados'
import ReguaDetalhes from './pages/faturamento/ReguaDetalhes'
import CancelamentosPage from './pages/faturamento/Cancelamentos'
import IntegracaoRmPage from './pages/faturamento/IntegracaoRm'
import IntegracaoRmApi from './pages/faturamento/IntegracaoRmApi'
import FaturasGeradas from './pages/faturamento/FaturasGeradas'
import FaturaDetalhes from './pages/faturamento/FaturaDetalhes'
import ConferenciaFaturamento from './pages/faturamento/ConferenciaFaturamento'
import TabelasFaturamento from './pages/TabelasFaturamento'

// ============================================================
// PÁGINAS - IMPORTAÇÕES
// ============================================================
import ImportacaoSPC from './pages/ImportacaoSPC'
import ImportacaoBeneficios from './pages/ImportacaoBeneficios'
import ImportacaoFaturamentos from './pages/ImportacaoFaturamentos'
import ImportacaoCancelamentos from './pages/ImportacaoCancelamentos'

// ============================================================
// PÁGINAS - VERIFICAÇÃO
// ============================================================
import VerificacaoDashboard from './pages/VerificacaoDashboard'
import VerificacaoImportacao from './pages/VerificacaoImportacao'

// ============================================================
// PÁGINAS - GESTÃO
// ============================================================
import Beneficios from './pages/Beneficios'
import GestaoSPC from './pages/GestaoSPC'
import Servicos from './pages/Servicos'
import TabelaPrecos from './pages/TabelaPrecos'
import TabelaValores from './pages/TabelaValores'

// ============================================================
// PÁGINAS - NOTIFICAÇÕES E LOGS
// ============================================================
import Notificacoes from './pages/Notificacoes'
import LogsSistema from './pages/LogsSistema'
import HistoricoSincronizacoes from './pages/HistoricoSincronizacoes'

// ============================================================
// PÁGINAS - VENDEDORES E USUÁRIOS
// ============================================================
import Vendedores from './pages/Vendedores'
import Usuarios from './pages/Usuarios'

// ============================================================
// PÁGINAS - ADMIN (CONTROLE DE ACESSO)
// ============================================================
import { Usuarios as AdminUsuarios } from './pages/admin/Usuarios'
import { Perfis as AdminPerfis } from './pages/admin/Perfis'
import { UsuarioForm as AdminUsuarioForm } from './pages/admin/UsuarioForm'
import { PerfilForm as AdminPerfilForm } from './pages/admin/PerfilForm'

// ============================================================
// ANIMAÇÕES
// ============================================================
import './styles/animations.css'

// ============================================================
// ROTA PÚBLICA
// ============================================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// ============================================================
// ROTA PRIVADA (com verificação de autenticação)
// ============================================================
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// ============================================================
// APP PRINCIPAL
// ============================================================
function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
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

              {/* ============================================================ */}
              {/* ASSOCIADOS - PERMISSÃO: ASSOCIADO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="associados"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                    <Associados />
                  </PermissionGuard>
                }
              />
              <Route
                path="associados/novo"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
                    <AssociadoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="associados/editar/:id"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_EDIT']}>
                    <AssociadoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="associados/:id"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                    <AssociadoDetalhes />
                  </PermissionGuard>
                }
              />
              <Route
                path="associados/:id/consumo-franquia"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                    <ConsumoFranquiaPage />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* IMPORTAÇÃO DE ASSOCIADOS - PERMISSÃO: ASSOCIADO_CREATE */}
              {/* ============================================================ */}
              <Route
                path="importacao-associados"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
                    <ImportacaoAssociados />
                  </PermissionGuard>
                }
              />
              <Route
                path="atualizacao-associados"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_EDIT']}>
                    <AtualizacaoAssociados />
                  </PermissionGuard>
                }
              />
              <Route
                path="parametrizacao-associados"
                element={
                  <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                    <ParametrizacaoAssociados />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* PRODUTOS - PERMISSÃO: PRODUTO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="produtos"
                element={
                  <PermissionGuard requiredPermissions={['PRODUTO_VIEW']}>
                    <Produtos />
                  </PermissionGuard>
                }
              />
              <Route
                path="produtos/novo"
                element={
                  <PermissionGuard requiredPermissions={['PRODUTO_CREATE']}>
                    <ProdutoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="produtos/editar/:id"
                element={
                  <PermissionGuard requiredPermissions={['PRODUTO_EDIT']}>
                    <ProdutoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="produtos/:id"
                element={
                  <PermissionGuard requiredPermissions={['PRODUTO_VIEW']}>
                    <ProdutoDetalhes />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* PLANOS - PERMISSÃO: PLANO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="planos"
                element={
                  <PermissionGuard requiredPermissions={['PLANO_VIEW']}>
                    <Planos />
                  </PermissionGuard>
                }
              />
              <Route
                path="planos/novo"
                element={
                  <PermissionGuard requiredPermissions={['PLANO_CREATE']}>
                    <PlanoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="planos/editar/:id"
                element={
                  <PermissionGuard requiredPermissions={['PLANO_EDIT']}>
                    <PlanoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="planos/:id"
                element={
                  <PermissionGuard requiredPermissions={['PLANO_VIEW']}>
                    <PlanoDetalhes />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* FATURAMENTO - PERMISSÃO: FATURA_VIEW / FATURA_PROCESS */}
              {/* ============================================================ */}
              {/* ✅ CORRIGIDO: FATURA_CREATE → FATURA_PROCESS */}
              <Route
                path="faturamento/processar"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_PROCESS']}>
                    <ProcessarFaturamento />
                  </PermissionGuard>
                }
              />
              {/* ✅ CORRIGIDO: FATURA_CREATE → FATURA_PROCESS */}
              <Route
                path="processar-faturamento"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_PROCESS']}>
                    <ProcessarFaturamento />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/faturas"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <FaturasGeradas />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/faturas/:id"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <FaturaDetalhes />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/cancelamentos"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <CancelamentosPage />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* RÉGUA DE FATURAMENTO - PERMISSÃO: FATURA_VIEW */}
              {/* ✅ CORRIGIDO: REGUA_VIEW/REGUA_CREATE/REGUA_EDIT → FATURA_VIEW */}
              {/* ============================================================ */}
              <Route
                path="faturamento/regua"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ReguaFaturamentoPage />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/regua/novo"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ReguaFaturamentoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/regua/editar/:id"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ReguaFaturamentoForm />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/regua/:id/detalhes"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ReguaDetalhes />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/regua/:id/associados"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ReguaAssociados />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* CONFERÊNCIA DE FATURAMENTO - PERMISSÃO: FATURA_VIEW */}
              {/* ============================================================ */}
              <Route
                path="faturamento/conferencia"
                element={
                  <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                    <ConferenciaFaturamento />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* INTEGRAÇÕES RM - PERMISSÃO: INTEGRACAO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="faturamento/integracoes/rm"
                element={
                  <PermissionGuard requiredPermissions={['INTEGRACAO_VIEW']}>
                    <IntegracaoRmPage />
                  </PermissionGuard>
                }
              />
              <Route
                path="faturamento/integracoes/rm-api"
                element={
                  <PermissionGuard requiredPermissions={['INTEGRACAO_VIEW']}>
                    <IntegracaoRmApi />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* IMPORTAÇÕES - PERMISSÃO: IMPORTACAO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="importacao-spc"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <ImportacaoSPC />
                  </PermissionGuard>
                }
              />
              <Route
                path="importacao-beneficios"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <ImportacaoBeneficios />
                  </PermissionGuard>
                }
              />
              <Route
                path="importacao-faturamentos"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <ImportacaoFaturamentos />
                  </PermissionGuard>
                }
              />
              <Route
                path="importacao-cancelamentos"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <ImportacaoCancelamentos />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* VERIFICAÇÃO - PERMISSÃO: IMPORTACAO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="importacao-spc/:importacaoId/verificacao"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <VerificacaoDashboard />
                  </PermissionGuard>
                }
              />
              <Route
                path="importacao-spc/:importacaoId/verificacao-old"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <VerificacaoImportacao />
                  </PermissionGuard>
                }
              />
              <Route
                path="verificacao-dashboard"
                element={
                  <PermissionGuard requiredPermissions={['IMPORTACAO_VIEW']}>
                    <VerificacaoDashboard />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* NOTIFICAÇÕES - PERMISSÃO: NOTIFICACAO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="notificacoes"
                element={
                  <PermissionGuard requiredPermissions={['NOTIFICACAO_VIEW']}>
                    <Notificacoes />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* LOGS E HISTÓRICO - PERMISSÃO: LOG_VIEW */}
              {/* ============================================================ */}
              <Route
                path="logs"
                element={
                  <PermissionGuard requiredPermissions={['LOG_VIEW']}>
                    <LogsSistema />
                  </PermissionGuard>
                }
              />
              <Route
                path="sincronizacoes"
                element={
                  <PermissionGuard requiredPermissions={['LOG_VIEW']}>
                    <HistoricoSincronizacoes />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* VENDEDORES - PERMISSÃO: VENDEDOR_VIEW */}
              {/* ============================================================ */}
              <Route
                path="vendedores"
                element={
                  <PermissionGuard requiredPermissions={['VENDEDOR_VIEW']}>
                    <Vendedores />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* USUÁRIOS (LEGADO) - PERMISSÃO: USUARIO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="usuarios"
                element={
                  <PermissionGuard requiredPermissions={['USUARIO_VIEW']}>
                    <Usuarios />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* GESTÃO (BENEFÍCIOS, SERVIÇOS, SPC, TABELAS) - PERMISSÃO: GESTAO_VIEW */}
              {/* ============================================================ */}
              <Route
                path="beneficios"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <Beneficios />
                  </PermissionGuard>
                }
              />
              <Route
                path="servicos"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <Servicos />
                  </PermissionGuard>
                }
              />
              <Route
                path="gestao-spc"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <GestaoSPC />
                  </PermissionGuard>
                }
              />
              <Route
                path="tabelas-faturamento"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <TabelasFaturamento />
                  </PermissionGuard>
                }
              />
              <Route
                path="tabela-precos"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <TabelaPrecos />
                  </PermissionGuard>
                }
              />
              <Route
                path="tabela-valores"
                element={
                  <PermissionGuard requiredPermissions={['GESTAO_VIEW']}>
                    <TabelaValores />
                  </PermissionGuard>
                }
              />

              {/* ============================================================ */}
              {/* ADMIN - CONTROLE DE ACESSO */}
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