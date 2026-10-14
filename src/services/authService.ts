// ============================================================
//                    AUTH SERVICE
// ============================================================

import api from './api';
import { LoginRequest, AuthResponse } from '../types/auth';

export const authService = {
    async login(data: LoginRequest): Promise<AuthResponse> {
        const response = await api.post('/auth/login', {
            username: data.username,
            password: data.password
        });
        return response.data;
    },

    /**
     * Logout — encerra a sessão ATUAL.
     * Deve ser chamado ANTES de limpar o store (para o token estar disponível).
     */
    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.warn('⚠️ Erro ao notificar logout no backend:', error);
        }
    },

    /**
     * Logout ALL — encerra TODAS as sessões do usuário.
     */
    async logoutAll(): Promise<void> {
        try {
            await api.post('/auth/logout-all');
        } catch (error) {
            console.warn('⚠️ Erro ao notificar logout-all no backend:', error);
        }
    },

    /**
     * Troca a senha do usuário autenticado.
     * Não exige permissão USUARIO_EDIT — qualquer autenticado pode.
     */
    async trocarMinhaSenha(senhaAtual: string, senhaNova: string): Promise<void> {
        await api.post('/auth/me/trocar-senha', {
            senhaAtual,
            senhaNova
        });
    },

    /**
     * 🔥 Atualiza a foto do usuário autenticado (avatar em base64).
     */
    async atualizarMinhaFoto(fotoBase64: string): Promise<{ fotoBase64: string }> {
        const response = await api.post('/auth/me/foto', { fotoBase64 });
        return response.data;
    },

    /**
     * 🔥 Remove a foto do usuário autenticado.
     */
    async removerMinhaFoto(): Promise<void> {
        await api.delete('/auth/me/foto');
    }
};