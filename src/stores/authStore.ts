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

    login: (credentials: LoginRequest) => Promise<LoginResult>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    setAuth: (response: AuthResponse) => void;
    atualizarFoto: (fotoBase64: string) => void;
    removerFoto: () => void;
    hasPermission: (permissao: string) => boolean;
    hasAnyPermission: (permissoes: string[]) => boolean;
    hasAllPermissions: (permissoes: string[]) => boolean;
    getMenus: () => Menu[];
    buildMenuTree: () => Menu[];
    initialize: () => void;
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
                } else {
                    set({ initialized: true });
                }
            },

            login: async (credentials: LoginRequest) => {
                set({ loading: true });
                try {
                    const response = await authService.login(credentials);
                    const { token, usuario, menus, permissoes } = response;

                    set({
                        user: usuario,
                        menus: menus || [],
                        permissoes: permissoes || [],
                        token: token,
                        isAuthenticated: true,
                        loading: false
                    });

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

            logout: async () => {
                try {
                    await authService.logout();
                } catch (error) {
                    console.warn('⚠️ Falha ao notificar logout:', error);
                }

                set({
                    user: null,
                    menus: [],
                    permissoes: [],
                    token: null,
                    isAuthenticated: false,
                    loading: false
                });
                localStorage.removeItem('auth-storage');
            },

            logoutAll: async () => {
                try {
                    await authService.logoutAll();
                } catch (error) {
                    console.warn('⚠️ Falha ao notificar logout-all:', error);
                }

                set({
                    user: null,
                    menus: [],
                    permissoes: [],
                    token: null,
                    isAuthenticated: false,
                    loading: false
                });
                localStorage.removeItem('auth-storage');
            },

            setAuth: (response: AuthResponse) => {
                set({
                    user: response.usuario,
                    menus: response.menus || [],
                    permissoes: response.permissoes || [],
                    token: response.token,
                    isAuthenticated: true,
                    loading: false
                });
            },

            atualizarFoto: (fotoBase64: string) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: { ...currentUser, fotoBase64 }
                    });
                }
            },

            removerFoto: () => {
                const currentUser = get().user;
                if (currentUser) {
                    set({
                        user: { ...currentUser, fotoBase64: undefined }
                    });
                }
            },

            hasPermission: (permissao: string) => {
                return get().permissoes.includes(permissao);
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

            /**
             * 🔥 Constrói a árvore de menus de forma robusta.
             *
             * O backend pode enviar em 2 formatos:
             *
             *  A) ÁRVORE (formato atual após a otimização do AuthController):
             *     8 menus raiz, cada um com seus subMenus já aninhados.
             *     Nesse caso apenas ordenamos recursivamente e retornamos.
             *
             *  B) FLAT (formato legado): 28 menus soltos, cada um com menuPaiId.
             *     Nesse caso reconstruímos a árvore pelo menuPaiId (comportamento
             *     original do store).
             *
             * A detecção é automática: se algum menu já tem subMenus preenchidos,
             * tratamos como árvore (A). Caso contrário, flat (B).
             */
            buildMenuTree: () => {
                const menus = get().menus || [];
                if (!menus || menus.length === 0) return [];

                // Detecção do formato
                const temSubMenusAninhados = menus.some(
                    (m) => m.subMenus && Array.isArray(m.subMenus) && m.subMenus.length > 0
                );

                if (temSubMenusAninhados) {
                    // 🟢 Formato ÁRVORE — apenas ordena recursivamente
                    const ordenarRecursivo = (arr: Menu[]): Menu[] => {
                        const copia = arr.map((m) => ({
                            ...m,
                            subMenus:
                                m.subMenus && m.subMenus.length > 0
                                    ? ordenarRecursivo(m.subMenus)
                                    : []
                        }));
                        copia.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
                        return copia;
                    };
                    return ordenarRecursivo(menus);
                }

                // 🟡 Formato FLAT — reconstrói árvore pelo menuPaiId
                const menuMap = new Map<number, Menu>();
                const roots: Menu[] = [];

                menus.forEach((menu) => {
                    menuMap.set(menu.id, { ...menu, subMenus: [] });
                });

                menuMap.forEach((menu) => {
                    if (menu.menuPaiId && menuMap.has(menu.menuPaiId)) {
                        const parent = menuMap.get(menu.menuPaiId)!;
                        parent.subMenus.push(menu);
                    } else {
                        roots.push(menu);
                    }
                });

                const ordenarRecursivo = (arr: Menu[]): Menu[] => {
                    arr.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
                    arr.forEach((m) => {
                        if (m.subMenus && m.subMenus.length > 0) {
                            ordenarRecursivo(m.subMenus);
                        }
                    });
                    return arr;
                };

                return ordenarRecursivo(roots);
            }
        }),
        {
            name: 'auth-storage',
            // 🔥 Só persiste o essencial. fotoBase64 fica de fora
            //    e é recarregada do backend a cada boot.
            partialize: (state) => ({
                user: state.user
                    ? {
                        ...state.user,
                        fotoBase64: undefined
                      }
                    : null,
                menus: state.menus,
                permissoes: state.permissoes,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
            onRehydrateStorage: () => {
                return (state) => {
                    if (state) {
                        state.initialized = true;
                    }
                };
            }
        }
    )
);