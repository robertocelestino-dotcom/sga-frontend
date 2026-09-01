// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario, Menu, AuthResponse, LoginRequest, LoginResult } from '../types/auth';
import { authService } from '../services/authService';

interface AuthState {
    user: Usuario | null;
    menus: Menu[];
    permissoes: string[];
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    initialized: boolean;

    // Ações
    login: (credentials: LoginRequest) => Promise<LoginResult>;
    logout: () => void;
    setAuth: (response: AuthResponse) => void;
    checkAuth: () => void;
    initialize: () => void;
    hasPermission: (permissao: string) => boolean;
    hasAnyPermission: (permissoes: string[]) => boolean;
    hasAllPermissions: (permissoes: string[]) => boolean;
    getMenus: () => Menu[];
    buildMenuTree: () => Menu[];
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            menus: [],
            permissoes: [],
            token: null,
            isAuthenticated: false,
            loading: false,
            initialized: false,

            initialize: () => {
                const state = get();
                if (state.token && state.user) {
                    set({ isAuthenticated: true, initialized: true });
                    console.log('✅ Store reidratada com sucesso', state.user);
                } else {
                    set({ initialized: true });
                    console.log('🔄 Store inicializada sem token');
                }
            },

            checkAuth: () => {
                const state = get();
                if (state.token && state.user) {
                    set({ isAuthenticated: true });
                    console.log('✅ Autenticação já verificada anteriormente');
                } else {
                    set({ isAuthenticated: false });
                    console.log('❌ Usuário não autenticado');
                }
            },

            login: async (credentials: LoginRequest) => {
                set({ loading: true });
                console.log('🔄 Iniciando processo de login...');
                try {
                    const response = await authService.login(credentials);
                    console.log('📥 Resposta do login:', response);
                    
                    const { token, usuario, menus, permissoes } = response;
                    
                    set({
                        user: usuario,
                        menus: menus || [],
                        permissoes: permissoes || [],
                        token: token,
                        isAuthenticated: true,
                        loading: false
                    });

                    console.log('✅ Login realizado com sucesso!', { usuario, menus: menus?.length, permissoes: permissoes?.length });
                    return { success: true };
                } catch (error: any) {
                    console.error('❌ Erro no login:', error);
                    set({ loading: false });
                    return {
                        success: false,
                        error: error.response?.data?.message || error.message || 'Erro ao fazer login'
                    };
                }
            },

            logout: () => {
                console.log('🔄 Realizando logout...');
                set({
                    user: null,
                    menus: [],
                    permissoes: [],
                    token: null,
                    isAuthenticated: false,
                    loading: false
                });
                localStorage.removeItem('auth-storage');
                console.log('✅ Logout realizado com sucesso');
            },

            setAuth: (response: AuthResponse) => {
                console.log('🔄 Configurando autenticação...');
                set({
                    user: response.usuario,
                    menus: response.menus || [],
                    permissoes: response.permissoes || [],
                    token: response.token,
                    isAuthenticated: true,
                    loading: false
                });
                console.log('✅ Autenticação configurada');
            },

            hasPermission: (permissao: string) => {
                const permissoes = get().permissoes;
                return permissoes.includes(permissao);
            },

            hasAnyPermission: (permissoes: string[]) => {
                const userPermissoes = get().permissoes;
                return permissoes.some(p => userPermissoes.includes(p));
            },

            hasAllPermissions: (permissoes: string[]) => {
                const userPermissoes = get().permissoes;
                return permissoes.every(p => userPermissoes.includes(p));
            },

            getMenus: () => {
                const menus = get().menus;
                return menus ? menus.filter(m => m.ativo !== false) : [];
            },

            buildMenuTree: () => {
                const menus = get().menus || [];
                console.log('🔄 Construindo árvore de menus:', menus);
                
                if (!menus || menus.length === 0) {
                    console.warn('⚠️ Nenhum menu disponível');
                    return [];
                }

                const menuMap = new Map<number, Menu>();
                const roots: Menu[] = [];

                // Primeiro, criar todos os menus com subMenus vazio
                menus.forEach(menu => {
                    menuMap.set(menu.id, { ...menu, subMenus: [] });
                });

                // Depois, construir a árvore
                menuMap.forEach(menu => {
                    if (menu.menuPaiId && menuMap.has(menu.menuPaiId)) {
                        const parent = menuMap.get(menu.menuPaiId)!;
                        parent.subMenus.push(menu);
                    } else {
                        roots.push(menu);
                    }
                });

                // Ordenar
                roots.sort((a, b) => a.ordem - b.ordem);
                roots.forEach(root => {
                    root.subMenus.sort((a, b) => a.ordem - b.ordem);
                });

                console.log('✅ Árvore de menus construída:', roots.length, 'menus raiz');
                return roots;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                menus: state.menus,
                permissoes: state.permissoes,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => {
                console.log('🔄 Iniciando reidratação do store...');
                return (state) => {
                    if (state) {
                        console.log('✅ Store reidratada com sucesso', state.user);
                        state.initialized = true;
                    } else {
                        console.log('🔄 Store inicializada sem token');
                    }
                };
            }
        }
    )
);