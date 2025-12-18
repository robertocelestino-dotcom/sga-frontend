// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'

interface AuthState {
  user: any | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  authChecked: boolean
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
      authChecked: false,

      login: async (credentials) => {
        set({ loading: true })
        try {
          console.log('🔄 Iniciando processo de login...')
          const response = await authAPI.login(credentials)
          const { token } = response

          // Cria usuário mock baseado no username (mantendo comportamento atual)
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
            loading: false,
            authChecked: true
          })

          localStorage.setItem('authToken', token)
          console.log('✅ Login realizado com sucesso!', { user, token })
          return { success: true }
        } catch (error: any) {
          console.error('❌ Erro no login:', error)
          const errorMessage = error.response?.data?.message || error.response?.data?.erro || error.message || 'Erro ao fazer login'

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            authChecked: true
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
          // authAPI.logout faz apenas limpeza do token no frontend conforme implementado
          await authAPI.logout()
        } catch (error) {
          console.error('Erro durante logout:', error)
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            authChecked: true
          })
          localStorage.removeItem('authToken')
          console.log('✅ Logout realizado com sucesso')
        }
      },

      checkAuth: async () => {
        // evita chamadas concorrentes ou repetidas
        if (get().loading) {
          console.log('⏳ checkAuth já em execução, ignorando chamada duplicada')
          return get().isAuthenticated
        }
        if (get().authChecked) {
          console.log('✅ Autenticação já verificada anteriormente')
          return get().isAuthenticated
        }

        const token = get().token
        console.log('🔄 Verificando autenticação...', { token })

        if (!token) {
          console.log('❌ Nenhum token encontrado')
          set({ authChecked: true })
          return false
        }

        set({ loading: true })
        try {
          // Primeiro valida se o token é válido (chamada leve)
          const validate = await authAPI.validateToken()
          if (!validate || !validate.valid) {
            console.warn('⚠️ Token inválido segundo backend')
            // limpa estado
            await get().logout()
            set({ authChecked: true, loading: false })
            return false
          }

          // Token validado — tenta popular o perfil (se disponível)
          try {
            const user = await authAPI.getProfile()
            set({ user, isAuthenticated: true, authChecked: true })
            console.log('✅ Autenticação válida', { user })
            return true
          } catch (err) {
            console.warn('⚠️ Não foi possível obter perfil, usando apenas token', err)
            // ainda assim consideramos autenticado (tem token válido)
            set({ isAuthenticated: true, authChecked: true })
            return true
          }
        } catch (error) {
          console.error('❌ Erro ao verificar autenticação:', error)
          await get().logout()
          set({ authChecked: true })
          return false
        } finally {
          set({ loading: false })
        }
      },

      initialize: () => {
        // Rehidratar token do localStorage (se existir)
        const token = localStorage.getItem('authToken')
        if (token) {
          // Não marcamos isAuthenticated true aqui — vamos validar o token
          set({ token })
          console.log('🔄 Store inicializada com token existente')

          // Chama checkAuth para validar token (apenas uma vez)
          // Note: chamamos sem await aqui porque initialize é síncrono, mas checkAuth fará o trabalho.
          get().checkAuth().catch(err => console.error('Erro ao validar token durante initialize:', err))
        } else {
          console.log('🔄 Store inicializada sem token')
          set({ authChecked: true })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        authChecked: state.authChecked
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
