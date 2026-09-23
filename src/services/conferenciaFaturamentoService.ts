// src/services/conferenciaFaturamentoService.ts

import api from './api';
import {
    ConferenciaFaturamentoDTO,
    ConferenciaResumoDTO,
    ConferenciaFaturaDetalheDTO
} from '../types/conferenciaFaturamento';

export interface FiltroConferencia {
    reguaId?: number;
    dataInicio?: string;
    dataFim?: string;
    codigoSpc?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: string;
}

class ConferenciaFaturamentoService {

    /**
     * Lista faturas com filtros e paginação
     */
    async listarConferencia(filtro: FiltroConferencia): Promise<{
        content: ConferenciaFaturamentoDTO[];
        totalPages: number;
        totalElements: number;
        size: number;
        number: number;
    }> {
        const params: any = {
            page: filtro.page ?? 0,
            size: filtro.size ?? 20,
            sort: filtro.sort ?? 'dataEmissao',
            direction: filtro.direction ?? 'desc'
        };

        if (filtro.reguaId) params.reguaId = filtro.reguaId;
        if (filtro.dataInicio) params.dataInicio = filtro.dataInicio;
        if (filtro.dataFim) params.dataFim = filtro.dataFim;
        if (filtro.codigoSpc && filtro.codigoSpc.trim() !== '') {
            params.codigoSpc = filtro.codigoSpc.trim();
        }
        // 🔥 Status: só envia se não for vazio e não for "Todos"
        if (filtro.status && filtro.status.trim() !== '' && filtro.status !== 'Todos') {
            params.status = filtro.status;
        }

        console.log('📤 [Conferência] Buscando com filtros:', params);

        const response = await api.get('/faturamento/conferencia/faturas', { params });

        console.log('📥 [Conferência] Resposta:', {
            totalElements: response.data.totalElements,
            totalPages: response.data.totalPages,
            registros: response.data.content?.length || 0
        });

        return response.data;
    }

    /**
     * Busca resumo da conferência
     */
    async resumoConferencia(
        reguaId?: number,
        dataInicio?: string,
        dataFim?: string,
        codigoSpc?: string,
        status?: string
    ): Promise<ConferenciaResumoDTO> {
        const params: any = {};

        if (reguaId) params.reguaId = reguaId;
        if (dataInicio) params.dataInicio = dataInicio;
        if (dataFim) params.dataFim = dataFim;
        if (codigoSpc && codigoSpc.trim() !== '') params.codigoSpc = codigoSpc.trim();
        if (status && status.trim() !== '' && status !== 'Todos') params.status = status;

        console.log('📤 [Conferência] Buscando resumo:', params);

        const response = await api.get('/faturamento/conferencia/resumo', { params });

        console.log('📥 [Conferência] Resumo:', response.data);

        return response.data;
    }

    /**
     * Detalha uma fatura específica
     */
    async detalharConferencia(faturaId: number): Promise<ConferenciaFaturaDetalheDTO> {
        console.log('📤 [Conferência] Detalhando fatura:', faturaId);
        const response = await api.get(`/faturamento/conferencia/fatura/${faturaId}`);
        return response.data;
    }

    /**
     * 🔥 Exportar TODAS as faturas filtradas para CSV
     */
    async exportarCSV(
        reguaId?: number,
        dataInicio?: string,
        dataFim?: string,
        codigoSpc?: string,
        status?: string
    ): Promise<Blob> {
        const params: any = {};

        if (reguaId) params.reguaId = reguaId;
        if (dataInicio) params.dataInicio = dataInicio;
        if (dataFim) params.dataFim = dataFim;
        if (codigoSpc && codigoSpc.trim() !== '') params.codigoSpc = codigoSpc.trim();
        if (status && status.trim() !== '' && status !== 'Todos') params.status = status;

        console.log('📤 [Conferência] Exportando CSV (todos):', params);

        const response = await api.get('/faturamento/conferencia/exportar-csv', {
            params,
            responseType: 'blob',
            headers: { 'Accept': 'text/csv' }
        });

        console.log('📥 [Conferência] CSV recebido, tamanho:', response.data.size);

        if (response.data.size === 0) {
            throw new Error('Arquivo CSV vazio');
        }

        return response.data;
    }

    /**
     * 🔥 Exportar apenas as faturas SELECIONADAS para CSV
     */
    async exportarCSVSelecionados(faturaIds: number[]): Promise<Blob> {
        console.log('📤 [Conferência] Exportando CSV (selecionados):', faturaIds.length);

        const response = await api.post(
            '/faturamento/conferencia/exportar-csv-selecionados',
            { faturaIds },
            {
                responseType: 'blob',
                headers: {
                    'Accept': 'text/csv',
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📥 [Conferência] CSV recebido, tamanho:', response.data.size);

        if (response.data.size === 0) {
            throw new Error('Arquivo CSV vazio');
        }

        return response.data;
    }
}

export const conferenciaFaturamentoService = new ConferenciaFaturamentoService();
export default conferenciaFaturamentoService;