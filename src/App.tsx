// src/App.tsx
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { MessageProvider } from './providers/MessageProvider'

import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Importe todas as páginas que você tem na estrutura
import Associados from './pages/Associados'
import AssociadoForm from './pages/AssociadoForm' // ADICIONE ESTE IMPORT
import AssociadoDetalhes from './pages/AssociadoDetalhes' // ADICIONE ESTE IMPORT
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

// PÁGINAS DE PRODUTOS
import Produtos from './pages/Produtos'
import ProdutoForm from './pages/ProdutoForm'
import ProdutoDetalhes from './pages/ProdutoDetalhes'

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
              <Route path="associados/novo" element={<AssociadoForm />} /> {/* ADICIONE ESTA LINHA */}
              <Route path="associados/editar/:id" element={<AssociadoForm />} /> {/* ADICIONE ESTA LINHA */}
              <Route path="associados/:id" element={<AssociadoDetalhes />} /> {/* ADICIONE ESTA LINHA */}
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="parametrizacao-associados" element={<ParametrizacaoAssociados />} />
              <Route path="tabela-precos" element={<TabelaPrecos />} />
              <Route path="tabela-valores" element={<TabelaValores />} />

              {/* Produtos */}
              <Route path="produtos" element={<Produtos />} />
              <Route path="produtos/novo" element={<ProdutoForm />} />
              <Route path="produtos/editar/:id" element={<ProdutoForm />} />
              <Route path="produtos/:id" element={<ProdutoDetalhes />} />

              {/* Importação */}
              <Route path="importacao-spc" element={<ImportacaoSPC />} />
              <Route path="importacao-associados" element={<ImportacaoAssociados />} />
              <Route path="importacao-beneficios" element={<ImportacaoBeneficios />} />
              <Route path="importacao-faturamentos" element={<ImportacaoFaturamentos />} />

              {/* Rotas de verificação */}
              <Route
                path="importacao-spc/:importacaoId/verificacao"
                element={<VerificacaoDashboard />}
              />
              <Route
                path="importacao-spc/:importacaoId/verificacao-old"
                element={<VerificacaoImportacao />}
              />

              {/* Faturamento */}
              <Route path="processar-faturamento" element={<ProcessarFaturamento />} />
              <Route path="tabelas-faturamento" element={<TabelasFaturamento />} />

              {/* Gestão */}
              <Route path="beneficios" element={<Beneficios />} />
              <Route path="servicos" element={<Servicos />} />
              <Route path="gestao-spc" element={<GestaoSPC />} />
              <Route path="atualizacao-associados" element={<AtualizacaoAssociados />} />

              {/* Verificação */}
              <Route path="verificacao-dashboard" element={<VerificacaoDashboard />} />

              {/* Páginas extras que podem não ter sido criadas ainda - deixe comentadas */}
              {/* 
              <Route path="importacao-produtos" element={<ImportacaoProdutos />} />
              <Route path="relatorios-produtos" element={<RelatoriosProdutos />} />
              */}
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