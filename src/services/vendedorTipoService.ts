// src/services/vendedorTipoService.ts
import api from './api'; // Import como default

export const vendedorTipoService = {
  // Listar todos
  async listarTodos() {
    try {
      const response = await api.get('/vendedor-tipos');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar tipos de vendedor:', error);
      return [];
    }
  },

  async buscarPorId(id: number) {
    try {
      const response = await api.get(`/vendedor-tipos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipo de vendedor:', error);
      throw error;
    }
  },

  // Buscar por descrição
  async buscarPorDescricao(descricao: string) {
    try {
      const response = await api.get('/api/vendedor-tipos/buscar', {
        params: { descricao }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar tipo por descrição:', error);
      return [];
    }
  },

  // Criar novo
  async criar(vendedorTipo: any) {
    try {
      const response = await api.post('/api/vendedor-tipos', vendedorTipo);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar tipo de vendedor:', error);
      throw error;
    }
  },

  // Atualizar
  async atualizar(id: number, vendedorTipo: any) {
    try {
      const response = await api.put(`/api/vendedor-tipos/${id}`, vendedorTipo);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tipo de vendedor:', error);
      throw error;
    }
  },

  // Excluir
  async excluir(id: number) {
    try {
      await api.delete(`/api/vendedor-tipos/${id}`);
    } catch (error) {
      console.error('Erro ao excluir tipo de vendedor:', error);
      throw error;
    }
  },

  // Contar total
  async contarTotal() {
    try {
      const response = await api.get('/api/vendedor-tipos/count');
      return response.data;
    } catch (error) {
      console.error('Erro ao contar tipos de vendedor:', error);
      return 0;
    }
  },

  // Verificar se existe por descrição
  async existePorDescricao(descricao: string) {
    try {
      const response = await api.get('/api/vendedor-tipos/existe', {
        params: { descricao }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao verificar existência:', error);
      return false;
    }
  },
};