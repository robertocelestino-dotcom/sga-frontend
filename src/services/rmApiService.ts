// src/services/rmApiService.ts

import api from './api';
import { RmApiConfig, RmApiIntegracaoRequest, RmApiIntegracaoResponse } from '../types/rmApi.types';

export const rmApiService = {

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================

    /**
     * Lista todas as configurações
     */
    async listarConfiguracoes(): Promise<RmApiConfig[]> {
        const response = await api.get('/rm-api/configuracoes');
        return response.data;
    },

    /**
     * Lista configurações ativas
     */
    async listarConfiguracoesAtivas(): Promise<RmApiConfig[]> {
        const response = await api.get('/rm-api/configuracoes/ativas');
        return response.data;
    },

    /**
     * Busca configuração ativa
     */
    async buscarConfiguracaoAtiva(): Promise<RmApiConfig> {
        const response = await api.get('/rm-api/configuracoes/ativa');
        return response.data;
    },

    /**
     * Busca configuração por ID
     */
    async buscarPorId(id: number): Promise<RmApiConfig> {
        const response = await api.get(`/rm-api/configuracoes/${id}`);
        return response.data;
    },

    /**
     * Cria nova configuração
     */
    async criarConfiguracao(data: RmApiConfig): Promise<RmApiConfig> {
        const response = await api.post('/rm-api/configuracoes', data);
        return response.data;
    },

    /**
     * Atualiza configuração
     */
    async atualizarConfiguracao(id: number, data: RmApiConfig): Promise<RmApiConfig> {
        const response = await api.put(`/rm-api/configuracoes/${id}`, data);
        return response.data;
    },

    /**
     * Exclui configuração
     */
    async excluirConfiguracao(id: number): Promise<void> {
        await api.delete(`/rm-api/configuracoes/${id}`);
    },

    /**
     * Ativa configuração
     */
    async ativarConfiguracao(id: number): Promise<void> {
        await api.post(`/rm-api/configuracoes/${id}/ativar`);
    },

    // ============================================================
    // INTEGRAÇÃO
    // ============================================================

    /**
     * Integra notas via API
     */
    async integrar(request: RmApiIntegracaoRequest): Promise<RmApiIntegracaoResponse> {
        const response = await api.post('/rm-api/integrar', request);
        return response.data;
    },

    /**
     * Integra notas automaticamente (usa config ativa)
     */
    async integrarAutomatico(request: RmApiIntegracaoRequest): Promise<RmApiIntegracaoResponse> {
        const response = await api.post('/rm-api/integrar/automatico', request);
        return response.data;
    },

    /**
     * Testa conexão com WebService
     */
    async testarConexao(config: RmApiConfig): Promise<boolean> {
        const response = await api.post('/rm-api/testar-conexao', config);
        return response.data;
    },

    // ============================================================
    // 🔥 PRÉ-VISUALIZAR XML
    // ============================================================
    async preVisualizarXml(request: RmApiIntegracaoRequest): Promise<any> {
        const response = await api.post('/rm-api/pre-visualizar-xml', request);
        return response.data;
    }

};