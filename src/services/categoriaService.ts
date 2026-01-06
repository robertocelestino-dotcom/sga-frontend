// src/services/categoriaService.ts
import { api } from './api';
import { endpoints } from '../config/endpoints';
import { CategoriaOption } from '../types/combobox';

export const categoriaService = {
  // Listar categorias ativas para combobox
  listarAtivas: async (): Promise<CategoriaOption[]> => {
    try {
      const response = await api.get(endpoints.categorias.listarAtivas);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias ativas:', error);
      return [];
    }
  },
  
  // Listar por tipo
  listarPorTipo: async (tipo: string): Promise<CategoriaOption[]> => {
    try {
      const response = await api.get(`${endpoints.categorias.listar}/por-tipo/${tipo}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar categorias do tipo ${tipo}:`, error);
      return [];
    }
  },
};