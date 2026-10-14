// src/services/permissaoService.ts

import api from './api';
import { Permissao } from '../types/auth';

export const permissaoService = {
    /**
     * Lista TODAS as permissões do banco.
     * Usado pelo PerfilForm para montar a lista real — substitui a
     * lista hardcoded que estava corrompendo perfis a cada edição.
     */
    async listar(): Promise<Permissao[]> {
        const response = await api.get('/admin/permissoes');
        return response.data;
    },
};
