// App.tsx - ATUALIZADO COM TODAS AS IMPORTAÇÕES DAS PÁGINAS DE FATURAMENTO
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { MessageProvider } from './providers/MessageProvider'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

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

// 🔥 PÁGINAS DE FATURAMENTO
import ReguaFaturamentoPage from './pages/faturamento/ReguaFaturamento'
import ReguaFaturamentoForm from './pages/faturamento/ReguaFaturamentoForm'
import ReguaAssociados from './pages/faturamento/ReguaAssociados'
import ReguaDetalhes from './pages/faturamento/ReguaDetalhes'
import CancelamentosPage from './pages/faturamento/Cancelamentos'
import IntegracaoRmPage from './pages/faturamento/IntegracaoRm'
import FaturasGeradas from './pages/faturamento/FaturasGeradas'
import FaturaDetalhes from './pages/faturamento/FaturaDetalhes'

// 🔥 NOVAS PÁGINAS
import ImportacaoCancelamentos from './pages/ImportacaoCancelamentos'

// Adicione esta animação ao seu index.css
import './styles/animations.css'

// -----------------------
// Rotas Públicas
// -----------------------
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// -----------------------
// Rotas Privadas
// -----------------------
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <MessageProvider>
      <Router>
        <div className="App">
          <Routes>

            {/* ROTA LOGIN */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* ROTAS PRIVADAS COM LAYOUT */}
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

              {/* Dashboard */}
              <Route path="dashboard" element={<Dashboard />} />

              {/* Cadastro */}
              <Route path="associados" element={<Associados />} />
              <Route path="associados/novo" element={<AssociadoForm />} />
              <Route path="associados/editar/:id" element={<AssociadoForm />} />
              <Route path="associados/:id" element={<AssociadoDetalhes />} />
              
              {/* ROTA DE CONSUMO DE FRANQUIAS */}
              <Route path="associados/:id/consumo-franquia" element={<ConsumoFranquiaPage />} />
              
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="parametrizacao-associados" element={<ParametrizacaoAssociados />} />
              <Route path="tabela-precos" element={<TabelaPrecos />} />
              <Route path="tabela-valores" element={<TabelaValores />} />

              {/* Produtos */}
              <Route path="produtos" element={<Produtos />} />
              <Route path="produtos/novo" element={<ProdutoForm />} />
              <Route path="produtos/editar/:id" element={<ProdutoForm />} />
              <Route path="produtos/:id" element={<ProdutoDetalhes />} />

              {/* Planos */}
              <Route path="planos" element={<Planos />} />
              <Route path="planos/novo" element={<PlanoForm />} />
              <Route path="planos/editar/:id" element={<PlanoForm />} />
              <Route path="planos/:id" element={<PlanoDetalhes />} />

              {/* Importação */}
              <Route path="importacao-spc" element={<ImportacaoSPC />} />
              <Route path="importacao-associados" element={<ImportacaoAssociados />} />
              <Route path="importacao-beneficios" element={<ImportacaoBeneficios />} />
              <Route path="importacao-faturamentos" element={<ImportacaoFaturamentos />} />
              
              {/* 🔥 NOVA ROTA: Importação de Cancelamentos */}
              <Route path="importacao-cancelamentos" element={<ImportacaoCancelamentos />} />

              {/* Rotas de verificação */}
              <Route
                path="importacao-spc/:importacaoId/verificacao"
                element={<VerificacaoDashboard />}
              />
              <Route
                path="importacao-spc/:importacaoId/verificacao-old"
                element={<VerificacaoImportacao />}
              />

              {/* 🔥 ROTAS DE FATURAMENTO */}
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
                <Route path="integracoes/rm" element={<IntegracaoRmPage />} />
              </Route>

              {/* Faturamento (legado) */}
              <Route path="processar-faturamento" element={<ProcessarFaturamento />} />
              <Route path="tabelas-faturamento" element={<TabelasFaturamento />} />

              {/* Gestão */}
              <Route path="beneficios" element={<Beneficios />} />
              <Route path="servicos" element={<Servicos />} />
              <Route path="gestao-spc" element={<GestaoSPC />} />
              <Route path="atualizacao-associados" element={<AtualizacaoAssociados />} />

              {/* Verificação */}
              <Route path="verificacao-dashboard" element={<VerificacaoDashboard />} />

              {/* Logs do Sistema */}
              <Route path="logs" element={<LogsSistema />} />

            </Route>

            {/* FALLBACK - Redireciona para dashboard se rota não existir */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </MessageProvider>
  )
}

export default App