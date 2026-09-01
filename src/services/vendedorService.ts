// src/services/vendedorService.ts
import api from './api';

export interface Vendedor {
    id: number;
    nome: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    ativo: boolean;
    tipo?: string;
    dataCriacao?: string;
}

export interface VendedorFiltro {
    nome?: string;
    ativo?: boolean;
    tipo?: string;
    page?: number;
    size?: number;
}

export const vendedorService = {
    // Listar vendedores com filtros
    async listar(filtros?: VendedorFiltro) {
        const response = await api.get('/vendedores', { params: filtros });
        return response.data;
    },

    // Buscar vendedor por ID
    async buscarPorId(id: number) {
        const response = await api.get(`/vendedores/${id}`);
        return response.data;
    },

    // Criar vendedor
    async criar(data: Partial<Vendedor>) {
        const response = await api.post('/vendedores', data);
        return response.data;
    },

    // Atualizar vendedor
    async atualizar(id: number, data: Partial<Vendedor>) {
        const response = await api.put(`/vendedores/${id}`, data);
        return response.data;
    },

    // Excluir vendedor
    async excluir(id: number) {
        await api.delete(`/vendedores/${id}`);
    },

    // Ativar/Desativar vendedor
    async toggleAtivo(id: number) {
        const response = await api.patch(`/vendedores/${id}/toggle-ativo`);
        return response.data;
    },

    // Listar vendedores ativos (para selects)
    async listarAtivos() {
        const response = await api.get('/vendedores/ativos');
        return response.data;
    },

    // Buscar opções para combo (simplificado)
    async buscarOpcoes() {
        try {
            const response = await api.get('/vendedores/opcoes');
            return response.data;
        } catch {
            // Fallback: buscar todos e mapear
            const data = await vendedorService.listarAtivos();
            return data.map((v: any) => ({
                id: v.id,
                label: v.nome,
                value: v.id
            }));
        }
    },

    // Buscar opções por tipo
    async buscarOpcoesPorTipo(tipo: string) {
        try {
            const response = await api.get(`/vendedores/opcoes/tipo/${tipo}`);
            return response.data;
        } catch {
            // Fallback: buscar todos e filtrar
            const data = await vendedorService.listarAtivos();
            return data
                .filter((v: any) => v.tipo === tipo)
                .map((v: any) => ({
                    id: v.id,
                    label: v.nome,
                    value: v.id
                }));
        }
    },

    // Buscar vendedores por tipo
    async listarPorTipo(tipo: string) {
        const response = await api.get(`/vendedores/tipo/${tipo}`);
        return response.data;
    },

    // Health check
    async healthCheck() {
        try {
            const response = await api.get('/vendedores/health');
            return response.data;
        } catch {
            return { status: 'DOWN', message: 'Serviço de vendedores indisponível' };
        }
    }
};

// 🔥 EXPORTAÇÃO PARA COMPATIBILIDADE COM O VENDEDORES.tsx
export const vendedorOpcoes = vendedorService.buscarOpcoes;

// Exportação padrão
export default vendedorService;