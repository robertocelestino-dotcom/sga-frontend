// ============================================================
//                    AUTH SERVICE
// ============================================================

// services/authService.ts
import api from './api';
import { LoginRequest, AuthResponse } from '../types/auth';

export const authService = {
    async login(data: LoginRequest): Promise<AuthResponse> {
        console.log('📤 authService.login - dados recebidos:', data);
        console.log('📤 authService.login - username:', data.username);
        console.log('📤 authService.login - password:', data.password);
        
        // 🔥 CORRIGIDO: enviar 'password' em vez de 'senha'
        const response = await api.post('/auth/login', {
            username: data.username,
            password: data.password  // ✅ AGORA ENVIA 'password'
        });
        
        console.log('📥 authService.login - resposta:', response.data);
        return response.data;
    },

    async logout(): Promise<void> {
        await api.post('/auth/logout');
    },

    async refreshToken(): Promise<{ token: string }> {
        const response = await api.post('/auth/refresh');
        return response.data;
    }
};