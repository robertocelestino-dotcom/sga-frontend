// src/App.tsx
import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Associados from './pages/Associados'
import ImportacaoSPC from './pages/ImportacaoSPC'
import ProcessarFaturamento from './pages/ProcessarFaturamento'
import ParametrizacaoAssociados from './pages/ParametrizacaoAssociados'
// Import outras páginas conforme necessário

// Componente para rotas públicas
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// Componente para rotas privadas
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Rota pública - Login */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Rotas privadas com layout */}
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="associados" element={<Associados />} />
            <Route path="importacao-spc" element={<ImportacaoSPC />} />
            <Route path="processar-faturamento" element={<ProcessarFaturamento />} />
            <Route path="parametrizacao-associados" element={<ParametrizacaoAssociados />} />
            {/* Adicione outras rotas aqui */}
          </Route>

          {/* Rota fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App