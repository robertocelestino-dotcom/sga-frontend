// src/services/vendedorService.ts
import api from './api';

// ============================================================
// TIPOS
// ============================================================

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

export interface VendedorResumoDTO {
    id: number;
    nomeRazao: string;
    nomeFantasia?: string;
    cargoFuncao?: string;
    status?: string;
    vendedorTipoId?: number;
    vendedorTipoDescricao?: string;
    ativo?: boolean;
}

export interface VendedorFiltro {
    nome?: string;
    ativo?: boolean;
    tipo?: string;
    page?: number;
    size?: number;
}

// ============================================================
// HELPERS
// ============================================================

const normalizarResposta = (resp: any): any[] => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.content)) return resp.content;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.items)) return resp.items;
    console.warn('⚠️ Formato de resposta desconhecido:', resp);
    return [];
};

// ============================================================
// SERVICE
// ============================================================

export const vendedorService = {
    async listar(filtros?: VendedorFiltro) {
        const response = await api.get('/vendedores', { params: filtros });
        return response.data;
    },

    async buscarPorId(id: number) {
        const response = await api.get(`/vendedores/${id}`);
        return response.data;
    },

    async criar(data: Partial<Vendedor>) {
        const response = await api.post('/vendedores', data);
        return response.data;
    },

    async atualizar(id: number, data: Partial<Vendedor>) {
        const response = await api.put(`/vendedores/${id}`, data);
        return response.data;
    },

    async excluir(id: number) {
        await api.delete(`/vendedores/${id}`);
    },

    async toggleAtivo(id: number) {
        const response = await api.patch(`/vendedores/${id}/toggle-ativo`);
        return response.data;
    },

    // Buscar todos os vendedores (independente do tipo)
    async listarAtivos(): Promise<VendedorResumoDTO[]> {
        try {
            console.log('🔍 [vendedorService] Buscando todos os vendedores...');
            const response = await api.get('/vendedores');
            const lista = normalizarResposta(response.data);
            console.log(`   ✅ Total: ${lista.length}`);
            return lista;
        } catch (error) {
            console.error('❌ [vendedorService] Erro em /vendedores:', error);
            return [];
        }
    },

    // ============================================================
    // 🔥 MÉTODOS QUE O AssociadoForm USA — com campo CORRETO
    // ============================================================

    /**
     * Buscar vendedores por tipo (1 = interno, 2 = externo).
     * Usa o campo CORRETO `vendedorTipoId` do DTO.
     */
    async buscarPorTipo(tipoId: 1 | 2): Promise<VendedorResumoDTO[]> {
        try {
            console.log(`🔍 [vendedorService] Buscando vendedores vendedorTipoId=${tipoId}...`);

            const response = await api.get('/vendedores');
            const todos = normalizarResposta(response.data);
            console.log(`   📥 Total de vendedores: ${todos.length}`);

            // 🔥 Filtra pelo campo CORRETO: vendedorTipoId
            const filtrados = todos.filter((v: any) => {
                const isAtivo = v.status === 'A' || v.ativo === true || v.ativo === undefined;
                if (!isAtivo) return false;
                return Number(v.vendedorTipoId) === tipoId;
            });

            console.log(`   ✅ vendedorTipoId=${tipoId}: ${filtrados.length} ativos`);
            if (filtrados.length > 0) {
                console.log(`   📋 IDs:`, filtrados.map((v: any) => `${v.id} (${v.nomeRazao})`));
            }

            return filtrados;
        } catch (error) {
            console.error(`❌ [vendedorService] Erro tipo ${tipoId}:`, error);
            return [];
        }
    },

    // Wrappers que o AssociadoForm chama
    async buscarVendedoresTipo1Ativos(): Promise<VendedorResumoDTO[]> {
        return vendedorService.buscarPorTipo(1);
    },

    async buscarVendedoresTipo2Ativos(): Promise<VendedorResumoDTO[]> {
        return vendedorService.buscarPorTipo(2);
    },

    async buscarOpcoes() {
        try {
            const response = await api.get('/vendedores/opcoes');
            return response.data;
        } catch {
            const data = await vendedorService.listarAtivos();
            return data.map((v: any) => ({
                id: v.id,
                label: v.nomeRazao || v.nome,
                value: v.id
            }));
        }
    },

    async buscarOpcoesPorTipo(tipo: string) {
        try {
            const response = await api.get(`/vendedores/opcoes/tipo/${tipo}`);
            return response.data;
        } catch {
            const data = await vendedorService.listarAtivos();
            return data
                .filter((v: any) => v.tipo === tipo)
                .map((v: any) => ({
                    id: v.id,
                    label: v.nomeRazao || v.nome,
                    value: v.id
                }));
        }
    },

    async listarPorTipo(tipo: string) {
        const response = await api.get(`/vendedores/tipo/${tipo}`);
        return response.data;
    },

    async healthCheck() {
        try {
            const response = await api.get('/vendedores/health');
            return response.data;
        } catch {
            return { status: 'DOWN', message: 'Serviço indisponível' };
        }
    }
};

export const vendedorOpcoes = vendedorService.buscarOpcoes;

export default vendedorService;