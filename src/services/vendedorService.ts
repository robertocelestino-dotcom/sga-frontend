// src/services/vendedorService.ts
import { api } from './api'; 
import { endpoints } from '../config/endpoints';
import { VendedorOption } from '../types/combobox';

export const vendedorService = {
  // Listar vendedores ativos para combobox
  listarAtivos: async (): Promise<VendedorOption[]> => {
    try {
      const response = await api.get(endpoints.vendedores.listarAtivos);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar vendedores ativos:', error);
      return [];
    }
  },
  
  // Listar todos com paginação
  listar: async (page: number = 0, size: number = 10, nome?: string, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      ...(nome && { nome }),
      ...(status && { status })
    });
    
    const response = await api.get(`${endpoints.vendedores.listar}?${params}`);
    return response.data;
  },
  
  // Buscar por ID
  buscarPorId: async (id: number) => {
    const response = await api.get(endpoints.vendedores.buscarPorId(id));
    return response.data;
  },
};