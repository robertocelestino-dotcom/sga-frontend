// src/services/perfilService.ts

import api from './api';
import { Perfil } from '../types/auth';

export interface PerfilRequest {
    nome: string;
    descricao: string;
    ativo?: boolean;
    menusIds?: number[];
    permissoesIds?: number[];
}

export const perfilService = {
    // Listar todos os perfis
    async listar(): Promise<Perfil[]> {
        const response = await api.get('/admin/perfis');
        return response.data;
    },

    // 🔥 Listar perfis com verificação de permissão
    async listarComPermissao(permissoesUsuario: string[]): Promise<Perfil[]> {
        const todos = await this.listar();
        
        // Filtrar perfis baseado nas permissões do usuário
        return todos.filter(perfil => {
            // SUPER_ADMIN sempre vê tudo
            if (permissoesUsuario.includes('SUPER_ADMIN')) {
                return true;
            }
            
            // ADMIN vê todos exceto SUPER_ADMIN
            if (permissoesUsuario.includes('ADMIN')) {
                return perfil.nome !== 'SUPER_ADMIN';
            }
            
            // Usuários com permissão PERFIL_VIEW veem todos
            if (permissoesUsuario.includes('PERFIL_VIEW')) {
                return true;
            }
            
            // Outros usuários só veem perfis que podem gerenciar
            const podeVer = permissoesUsuario.includes('PERFIL_VIEW');
            const podeEditar = permissoesUsuario.includes('PERFIL_EDIT');
            const podeCriar = permissoesUsuario.includes('PERFIL_CREATE');
            const podeDeletar = permissoesUsuario.includes('PERFIL_DELETE');
            
            // Se não tem nenhuma permissão de perfil, não vê nada
            if (!podeVer && !podeEditar && !podeCriar && !podeDeletar) {
                return false;
            }
            
            return true;
        });
    },

    async buscarPorId(id: number): Promise<Perfil> {
        const response = await api.get(`/admin/perfis/${id}`);
        return response.data;
    },

    async criar(data: PerfilRequest): Promise<Perfil> {
        const response = await api.post('/admin/perfis', data);
        return response.data;
    },

    async atualizar(id: number, data: PerfilRequest): Promise<Perfil> {
        const response = await api.put(`/admin/perfis/${id}`, data);
        return response.data;
    },

    async deletar(id: number): Promise<void> {
        await api.delete(`/admin/perfis/${id}`);
    },

    async listarAtivos(): Promise<Perfil[]> {
        const response = await api.get('/admin/perfis/ativos');
        return response.data;
    }
};