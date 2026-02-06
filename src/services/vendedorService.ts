// src/services/vendedorService.ts - VERSÃO FINAL COM API REAL
import api from './api';

export interface VendedorDTO {
  id: number;
  nomeRazao: string;
  nomeFantasia?: string;
  cargoFuncao?: string;
  status: string;
  vendedorTipoId: number;  // ← campo correto do backend
  vendedorTipoDescricao: string;
}

const vendedorService = {
  // Método PRINCIPAL: Buscar vendedores ativos por tipo
  async buscarAtivosPorTipoParaDropdown(tipoId: number): Promise<VendedorDTO[]> {
    try {
      console.log(`🔍 Buscando vendedores ativos tipo ${tipoId}`);
      
      // Busca todos os vendedores ativos e filtra pelo tipo
      const response = await api.get('/vendedores');
      const todosVendedores = response.data.content || [];
      
      // Filtra: ativos (status 'A') e do tipo especificado
      const filtrados = todosVendedores.filter((v: VendedorDTO) => 
        v.status === 'A' && v.vendedorTipoId === tipoId
      );
      
      console.log(`✅ Encontrados ${filtrados.length} vendedores tipo ${tipoId}`);
      return filtrados;
    } catch (error: any) {
      console.error(`❌ Erro ao buscar vendedores tipo ${tipoId}:`, error);
      return [];
    }
  },

  // Listar TODOS os vendedores (para combobox geral)
  async listarAtivos(): Promise<VendedorDTO[]> {
    try {
      console.log('🔍 Buscando todos vendedores ativos');
      
      const response = await api.get('/vendedores');
      const todosVendedores = response.data.content || [];
      
      // Filtra apenas ativos
      const ativos = todosVendedores.filter((v: VendedorDTO) => v.status === 'A');
      
      console.log(`✅ Total de vendedores ativos: ${ativos.length}`);
      return ativos;
    } catch (error) {
      console.error('❌ Erro ao listar vendedores ativos:', error);
      return [];
    }
  },

  // Método para compatibilidade (mantém os métodos existentes)
  async buscarVendedoresTipo1() {
    return this.buscarAtivosPorTipoParaDropdown(1);
  },

  async buscarVendedoresTipo2() {
    return this.buscarAtivosPorTipoParaDropdown(2);
  },

  async buscarVendedoresTipo1Ativos() {
    return this.buscarAtivosPorTipoParaDropdown(1);
  },

  async buscarVendedoresTipo2Ativos() {
    return this.buscarAtivosPorTipoParaDropdown(2);
  },

  async buscarAtivosParaDropdown() {
    return this.listarAtivos();
  },

  // CRUD básico
  async buscarPorId(id: number): Promise<VendedorDTO> {
    try {
      const response = await api.get(`/vendedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar vendedor:', error);
      throw error;
    }
  },

  async listar(page: number = 0, size: number = 10, nome?: string, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        ...(nome && { nome }),
        ...(status && { status })
      });
      
      const response = await api.get(`/vendedores?${params}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar vendedores:', error);
      throw error;
    }
  },

  async criar(vendedor: Partial<VendedorDTO>): Promise<VendedorDTO> {
    try {
      const response = await api.post('/vendedores', vendedor);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar vendedor:', error);
      throw error;
    }
  },

  async atualizar(id: number, vendedor: Partial<VendedorDTO>): Promise<VendedorDTO> {
    try {
      const response = await api.put(`/vendedores/${id}`, vendedor);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar vendedor:', error);
      throw error;
    }
  },

  async excluir(id: number): Promise<void> {
    try {
      await api.delete(`/vendedores/${id}`);
    } catch (error) {
      console.error('❌ Erro ao excluir vendedor:', error);
      throw error;
    }
  }
  
};

export { vendedorService };
