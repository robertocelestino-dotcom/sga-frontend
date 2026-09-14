// src/services/conferenciaFaturamentoService.ts

import api from './api';
import { 
    ConferenciaFaturamentoDTO, 
    ConferenciaResumoDTO, 
    ConferenciaFaturaDetalheDTO 
} from '../types/conferenciaFaturamento';

export const conferenciaFaturamentoService = {

    /**
     * Lista todas as faturas com comparação com a nota de débito
     */
    async listarConferencia(
        params: {
            reguaId?: number;
            dataInicio?: string;
            dataFim?: string;
            codigoSpc?: string;
            status?: string;
            page?: number;
            size?: number;
            sort?: string;
            direction?: 'asc' | 'desc';
        }
    ): Promise<{
        content: ConferenciaFaturamentoDTO[];
        totalElements: number;
        totalPages: number;
        size: number;
        number: number;
    }> {
        const response = await api.get('/faturamento/conferencia/faturas', { params });
        return response.data;
    },

    /**
     * Detalha uma fatura específica com comparação item a item
     */
    async detalharConferencia(faturaId: number): Promise<ConferenciaFaturaDetalheDTO> {
        const response = await api.get(`/faturamento/conferencia/fatura/${faturaId}`);
        return response.data;
    },

    /**
     * Resumo da conferência por período
     */
    async resumoConferencia(
        reguaId?: number,
        dataInicio?: string,
        dataFim?: string,
        codigoSpc?: string,
        status?: string
    ): Promise<ConferenciaResumoDTO> {
        const response = await api.get('/faturamento/conferencia/resumo', {
            params: { reguaId, dataInicio, dataFim, codigoSpc, status }
        });
        return response.data;
    },

    /**
     * Exportar CSV com os dados da conferência
     */
    async exportarCSV(
        reguaId?: number,
        dataInicio?: string,
        dataFim?: string,
        codigoSpc?: string
    ): Promise<Blob> {
        const response = await api.get('/faturamento/conferencia/exportar-csv', {
            params: { reguaId, dataInicio, dataFim, codigoSpc },
            responseType: 'blob'
        });
        return response.data;
    }
};