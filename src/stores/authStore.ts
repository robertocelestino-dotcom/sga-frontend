// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

interface AuthState {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials) => {
        set({ loading: true })
        try {
          console.log('🔄 Iniciando processo de login...')
          const response = await authAPI.login(credentials)
          const { token } = response
          
          // Cria usuário mock baseado no username
          const user = {
            id: '1',
            name: 'Administrador',
            username: credentials.username,
            role: 'ADMIN',
            email: `${credentials.username}@sistema.com`
          }
          
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            loading: false 
          })
          
          localStorage.setItem('authToken', token)
          console.log('✅ Login realizado com sucesso!', { user, token })
          return { success: true }
        } catch (error: any) {
          console.error('❌ Erro no login:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Erro ao fazer login'
          
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            loading: false 
          })
          localStorage.removeItem('authToken')
          return { 
            success: false, 
            error: errorMessage
          }
        }
      },

      logout: async () => {
        try {
          console.log('🔄 Realizando logout...')
          await authAPI.logout()
        } catch (error) {
          console.error('Erro durante logout:', error)
        } finally {
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false,
            loading: false 
          })
          localStorage.removeItem('authToken')
          console.log('✅ Logout realizado com sucesso')
        }
      },

      checkAuth: async () => {
        const { token } = get()
        console.log('🔄 Verificando autenticação...', { token })
        
        if (!token) {
          console.log('❌ Nenhum token encontrado')
          return false
        }
        
        try {
          // Tenta obter o perfil do usuário
          const user = await authAPI.getProfile()
          set({ user, isAuthenticated: true })
          console.log('✅ Autenticação válida', { user })
          return true
        } catch (error) {
          console.error('❌ Erro ao verificar autenticação:', error)
          // Se não conseguir obter o perfil, verifica se temos token
          const { token } = get()
          if (token) {
            console.log('⚠️  Usando autenticação baseada apenas no token')
            set({ isAuthenticated: true })
            return true
          }
          get().logout()
          return false
        }
      },

      initialize: () => {
        const token = localStorage.getItem('authToken')
        if (token) {
          set({ token, isAuthenticated: true })
          console.log('🔄 Store inicializada com token existente')
        } else {
          console.log('🔄 Store inicializada sem token')
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('❌ Erro ao reidratar store:', error)
          } else {
            console.log('✅ Store reidratada com sucesso', state)
          }
        }
      }
    }
  )
)

// Inicializa a store quando o módulo é carregado
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}