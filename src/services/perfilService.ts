// ============================================================
//                    PERFIL SERVICE
// ============================================================

// services/perfilService.ts
import api from './api';
import { Perfil } from '../types/auth';

export interface PerfilRequest {
    nome: string;
    descricao: string;
    ativo: boolean;
    menusIds?: number[];
    permissoesIds?: number[];
}

export const perfilService = {
    // 🔥 CORRIGIDO: adicionar /admin no caminho
    async listar(): Promise<Perfil[]> {
        const response = await api.get('/admin/perfis');
        return response.data;
    },

    async listarAtivos(): Promise<Perfil[]> {
        const response = await api.get('/admin/perfis/ativos');
        return response.data;
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

    async associarMenu(perfilId: number, menuId: number): Promise<void> {
        await api.post(`/admin/perfis/${perfilId}/menus/${menuId}`);
    },

    async removerMenu(perfilId: number, menuId: number): Promise<void> {
        await api.delete(`/admin/perfis/${perfilId}/menus/${menuId}`);
    },

    async associarPermissao(perfilId: number, permissaoId: number): Promise<void> {
        await api.post(`/admin/perfis/${perfilId}/permissoes/${permissaoId}`);
    },

    async removerPermissao(perfilId: number, permissaoId: number): Promise<void> {
        await api.delete(`/admin/perfis/${perfilId}/permissoes/${permissaoId}`);
    }
};