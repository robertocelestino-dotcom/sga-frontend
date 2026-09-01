// src/services/usuarioService.ts
import api from './api';
import { Usuario } from '../types/auth';

export interface UsuarioRequest {
    username: string;
    email: string;
    senha: string;
    nomeCompleto: string;
    perfilId: number;
    ativo?: boolean;
}

export interface UsuarioUpdateRequest {
    nomeCompleto: string;
    email: string;
    perfilId: number;
    ativo?: boolean;
}

export const usuarioService = {
    // Listar todos os usuários
    async listarTodos(): Promise<Usuario[]> {
        const response = await api.get('/admin/usuarios');
        return response.data;
    },

    // Buscar usuário por ID
    async buscarPorId(id: number): Promise<Usuario> {
        const response = await api.get(`/admin/usuarios/${id}`);
        return response.data;
    },

    // Criar usuário
    async criar(data: UsuarioRequest): Promise<Usuario> {
        const response = await api.post('/admin/usuarios', data);
        return response.data;
    },

    // Atualizar usuário
    async atualizar(id: number, data: UsuarioUpdateRequest): Promise<Usuario> {
        const response = await api.put(`/admin/usuarios/${id}`, data);
        return response.data;
    },

    // Alterar senha
    async alterarSenha(id: number, senhaAtual: string, novaSenha: string): Promise<void> {
        await api.patch(`/admin/usuarios/${id}/alterar-senha`, { senhaAtual, novaSenha });
    },

    // Resetar senha
    async resetarSenha(id: number, novaSenha: string): Promise<void> {
        await api.patch(`/admin/usuarios/${id}/resetar-senha`, { novaSenha });
    },

    // Bloquear usuário
    async bloquear(id: number): Promise<void> {
        await api.patch(`/admin/usuarios/${id}/bloquear`);
    },

    // Desbloquear usuário
    async desbloquear(id: number): Promise<void> {
        await api.patch(`/admin/usuarios/${id}/desbloquear`);
    },

    // Excluir usuário
    async deletar(id: number): Promise<void> {
        await api.delete(`/admin/usuarios/${id}`);
    }
};