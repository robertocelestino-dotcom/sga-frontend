
// src/config/endpoints.ts
export const API_ENDPOINTS = {
  
  // Vendedores
  vendedores: {
    listarAtivos: `${API_BASE_URL}/vendedores/ativos`,
    listar: `${API_BASE_URL}/vendedores`,
    criar: `${API_BASE_URL}/vendedores`,
    atualizar: (id: number) => `${API_BASE_URL}/vendedores/${id}`,
    buscarPorId: (id: number) => `${API_BASE_URL}/vendedores/${id}`,
    excluir: (id: number) => `${API_BASE_URL}/vendedores/${id}`,
  },
  
  // Categorias
  categorias: {
    listarAtivas: `${API_BASE_URL}/categorias/ativas`,
    listar: `${API_BASE_URL}/categorias/`,
    criar: `${API_BASE_URL}/categorias`,
    atualizar: (id: number) => `${API_BASE_URL}/categorias/${id}`,
    buscarPorId: (id: number) => `${API_BASE_URL}/categorias/${id}`,
    excluir: (id: number) => `${API_BASE_URL}/categorias/${id}`,
  },
  
  // Planos 
  planos: {
    listarAtivos: `${API_BASE_URL}/planos/ativos`,
    listar: `${API_BASE_URL}/planos`,
    criar: `${API_BASE_URL}/planos`,
    atualizar: (id: number) => `${API_BASE_URL}/planos/${id}`,
    buscarPorId: (id: number) => `${API_BASE_URL}/planos/${id}`,
    excluir: (id: number) => `${API_BASE_URL}/planos/${id}`,
  },

  // Verificação
    VERIFICACAO: {
      BASE: '/verificacao',
      IMPORTACAO: (id: number) => `/verificacao/importacao/${id}`,
      ULTIMA: '/verificacao/ultima-importacao',
      DIVERGENCIAS: (id: number) => `/verificacao/${id}/divergencias-detalhadas`,
      ASSOCIADOS: (id: number) => `/verificacao/${id}/associados`,
      IMPORTACOES: '/verificacao/importacoes',
      IMPORTACOES_PAGINADAS: (page: number, size: number) => 
        `/verificacao/importacoes/paginadas?page=${page}&size=${size}`,
      NOTAS: (importacaoId: number, page?: number, size?: number, filtro?: string) => {
        let url = `/verificacao/${importacaoId}/notas`;
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', page.toString());
        if (size !== undefined) params.append('size', size.toString());
        if (filtro) params.append('filtro', filtro);
        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
      },
      DETALHES_NOTA: (notaId: number) => `/verificacao/notas/${notaId}/detalhes`,
      EXPORTAR_PDF: (id: number) => `/verificacao/${id}/exportar/resumo-pdf`,
      EXPORTAR_CSV: (id: number) => `/verificacao/${id}/exportar/notas-csv`,
      EXPORTAR_EXCEL: (id: number) => `/verificacao/${id}/exportar/notas-excel`,
      HEALTH: '/verificacao/health',
    },
    
    // Importação
    IMPORTACAO: {
      BASE: '/importacao',
      UPLOAD: '/importacao/upload',
      LISTAR: '/importacao/listar',
      DETALHES: (id: number) => `/importacao/${id}`,
      RESUMO: (id: number) => `/importacao/${id}/resumo`,
    },
    
    // Autenticação
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
      VALIDATE: '/auth/validate',
    }
  
};
