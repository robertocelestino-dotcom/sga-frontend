// services/menuService.ts
import api from './api';
import { Menu } from '../types/auth';

export const menuService = {
    async listar(): Promise<Menu[]> {
        const response = await api.get('/menus');
        return response.data;
    },

    async listarPorPerfil(perfilId: number): Promise<Menu[]> {
        const response = await api.get(`/menus/perfil/${perfilId}`);
        return response.data;
    },

    async listarPrincipais(): Promise<Menu[]> {
        const response = await api.get('/menus/principais');
        return response.data;
    },

    async buscarPorId(id: number): Promise<Menu> {
        const response = await api.get(`/menus/${id}`);
        return response.data;
    },

    async criar(data: Partial<Menu>): Promise<Menu> {
        const response = await api.post('/menus', data);
        return response.data;
    },

    async atualizar(id: number, data: Partial<Menu>): Promise<Menu> {
        const response = await api.put(`/menus/${id}`, data);
        return response.data;
    },

    async deletar(id: number): Promise<void> {
        await api.delete(`/menus/${id}`);
    }
};