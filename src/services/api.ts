// src/services/api.ts

import axios from "axios";

/* ============================================================================
   CONFIGURAÇÃO GLOBAL AXIOS
   ============================================================================ */
const api = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 600000, // 🔥 10 MINUTOS PADRÃO
  headers: { 
    "Content-Type": "application/json",
    "X-Usuario": "SISTEMA"
  },
});

// 🔥 INTERCEPTOR DE REQUISIÇÃO COM TIMEOUT DINÂMICO
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const usuario = localStorage.getItem("usuario") || "SISTEMA";
    config.headers["X-Usuario"] = usuario;
    
    // 🔥 AUMENTAR TIMEOUT PARA ENDPOINTS PESADOS
    const url = config.url || '';
    if (url.includes('/simular') || 
        url.includes('/processar') || 
        url.includes('/exportar') ||
        url.includes('/gerar-fatura') ||
        url.includes('/processar-assincrono') ||
        url.includes('/processamento-status')) {
      config.timeout = 1200000; // 🔥 20 MINUTOS
      if (process.env.NODE_ENV === "development") {
        console.log(`⏰ Timeout aumentado para 20min: ${url}`);
      }
    }
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        timeout: config.timeout,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// 🔥 INTERCEPTOR DE RESPOSTA COM TRATAMENTO DE TIMEOUT
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // 🔥 TRATAMENTO ESPECÍFICO PARA TIMEOUT
    if (error.code === 'ECONNABORTED' && error.message?.includes('timeout')) {
      console.error('⏰ TIMEOUT:', error.config?.url);
      error.isTimeout = true;
      error.userMessage = '⏰ A operação está demorando muito. Tente com menos dados ou processe em lotes menores.';
    }
    
    console.error("❌ API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      isTimeout: error.isTimeout || false
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("usuario");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

/* ============================================================================
   AUTENTICAÇÃO
   ============================================================================ */
export const authAPI = {
  async login(credentials: { username: string; password: string }) {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  async logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuario");
    return Promise.resolve();
  },

  async getProfile() {
    await api.get("/auth/teste");
    return {
      id: "0",
      username: "usuario",
      name: "Usuário logado",
      role: "USER",
    };
  },

  async validateToken() {
    try {
      await api.get("/auth/teste");
      return { valid: true };
    } catch {
      return { valid: false };
    }
  },
};

/* ============================================================================
   IMPORTAÇÃO SPC — COMPLETO
   ============================================================================ */
export const importacaoSPCService = {
  async uploadArquivo(arquivo: File) {
    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const response = await api.post("/importacao-spc/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000, // 5 minutos para upload
    });

    return response.data;
  },

  async buscarImportacao(id: number) {
    try {
      const response = await api.get(`/importacao-spc/${id}`);
      return response.data;
    } catch {
      return {
        id,
        nomeArquivo: "arquivo.txt",
        status: "PROCESSADO",
        dataImportacao: new Date(),
        quantidadeRegistros: 0,
        totalValor: 0,
      };
    }
  },

  async listarImportacoes() {
    const response = await api.get("/importacao-spc");
    return response.data;
  },

  async listarItensImportacao(id: number) {
    try {
      const response = await api.get(`/importacao-spc/${id}/itens`);
      return response.data;
    } catch {
      return { itens: [] };
    }
  },

  async verificar(importacaoId: number) {
    const response = await api.get(`/verificacao-importacao/${importacaoId}`);
    return response.data;
  },

  async verificacaoImportacao(id: number) {
    const response = await api.get(`/importacao-spc/${id}/verificacao`);
    return response.data;
  },

  async obterDivergenciasDetalhadas(importacaoId: number) {
    const response = await api.get(`/verificacao-importacao/${importacaoId}/detalhadas`);
    return response.data;
  },

  async verificarAssociados(id: number) {
    try {
      const response = await api.get(`/importacao-spc/${id}/verificar-associados`);
      return response.data;
    } catch {
      console.warn("⚠️ Endpoint /verificar-associados não existe — fallback mock");
      return {
        quantidadeArquivo: 0,
        quantidadeBanco: 0,
        diferenca: 0,
        associadosDivergentes: [],
      };
    }
  },

  async healthCheck() {
    const response = await api.get("/importacao-spc/health");
    return response.data;
  },
};

/* ============================================================================
   SERVIÇO DE VERIFICAÇÃO (LEGADO)
   ============================================================================ */
export const verificacaoService = {
  async verificarImportacao(importacaoId: number) {
    const response = await api.get(`/importacao-spc/${importacaoId}/verificar`);
    return response.data;
  },

  async obterRelatorio(importacaoId: number) {
    const response = await api.get(`/importacao-spc/${importacaoId}/relatorio`);
    return response.data;
  },

  async obterEstatisticas(importacaoId: number) {
    const response = await api.get(`/importacao-spc/${importacaoId}/estatisticas`);
    return response.data;
  },

  async obterTimeline(importacaoId: number) {
    const response = await api.get(`/importacao-spc/${importacaoId}/timeline`);
    return response.data;
  },

  async obterDivergenciasDetalhadas(importacaoId: number) {
    const response = await api.get(`/importacao-spc/${importacaoId}/divergencias-detalhadas`);
    return response.data;
  },

  async healthCheck() {
    const response = await api.get("/importacao-spc/health");
    return response.data;
  },
};

/* ============================================================================
   DASHBOARD DE VERIFICAÇÃO
   ============================================================================ */
export async function getImportacoesLista() {
  const response = await api.get("/verificacao-importacao/listar");
  return response.data;
}

export async function fetchVerificacao(importacaoId: number) {
  const response = await api.get(`/verificacao-importacao/${importacaoId}/resumo`);
  return response.data;
}

export async function exportResumoCSV(importacaoId: number) {
  const response = await api.get(
    `/verificacao-importacao/${importacaoId}/resumo/csv`,
    { responseType: "blob", timeout: 120000 }
  );

  const blob = new Blob([response.data], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `resumo_${importacaoId}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportResumoPDF(importacaoId: number) {
  const response = await api.get(
    `/verificacao-importacao/${importacaoId}/resumo/pdf`,
    { responseType: "blob", timeout: 120000 }
  );

  const blob = new Blob([response.data], {
    type: "application/pdf",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `resumo_${importacaoId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ============================================================================
   NOTAS DE DÉBITO
   ============================================================================ */
export async function listarNotas(
  importacaoId: number,
  page = 0,
  size = 10,
  filtro = ""
) {
  const response = await api.get(`/notas-debito`, {
    params: {
      importacaoId,
      page,
      size,
      filtro,
    },
  });
  return response.data;
}

export async function getNotaDetalhes(notaId: number) {
  const response = await api.get(`/notas-debito/${notaId}`);
  return response.data;
}

export async function visualizarNotaPDF(notaId: number) {
  const response = await api.get(
    `/notas-debito/${notaId}/pdf`,
    { responseType: "blob", timeout: 120000 }
  );

  const blob = new Blob([response.data], {
    type: "application/pdf",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('target', '_blank');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/* ============================================================================
   SERVIÇO DE PRODUTOS
   ============================================================================ */
export const produtoAPI = {
  async listarProdutos(params?: any) {
    const response = await api.get("/produtos", { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },

  async criarProduto(data: any) {
    const response = await api.post("/produtos", data);
    return response.data;
  },

  async atualizarProduto(id: number, data: any) {
    const response = await api.put(`/produtos/${id}`, data);
    return response.data;
  },

  async excluirProduto(id: number) {
    await api.delete(`/produtos/${id}`);
  },

  async listarFranquiasDisponiveis() {
    const response = await api.get("/produtos/franquias/disponiveis");
    return response.data;
  },

  async listarProdutosAtivos() {
    const response = await api.get("/produtos/ativos");
    return response.data;
  },

  async listarProdutosComFranquia() {
    const response = await api.get("/produtos/franquias");
    return response.data;
  },

  async listarProdutosSPC() {
    const response = await api.get("/produtos/spc");
    return response.data;
  },

  async listarProdutosMix() {
    const response = await api.get("/produtos/mix");
    return response.data;
  },

  async getFranquiasDoProduto(produtoId: number) {
    const response = await api.get(`/produtos/${produtoId}/franquias`);
    return response.data;
  },

  async getProdutosRelacionados(produtoId: number) {
    const response = await api.get(`/produtos/${produtoId}/relacionados`);
    return response.data;
  },

  async getEstatisticas() {
    const response = await api.get("/produtos/estatisticas");
    return response.data;
  },

  async getProdutosParaFaturamento() {
    const response = await api.get("/produtos/faturamento/disponiveis");
    return response.data;
  },

  async healthCheck() {
    try {
      const response = await api.get("/produtos/health");
      return response.data;
    } catch (error: any) {
      return { status: "DOWN", error: error.message };
    }
  }
};

/* ============================================================================
   SERVIÇO DE ASSOCIADOS
   ============================================================================ */
export const associadoAPI = {
  async listarAssociados(params?: any) {
    const response = await api.get("/associados", { params });
    return response.data;
  },

  async buscarPorId(id: number) {
    const response = await api.get(`/associados/${id}`);
    return response.data;
  },

  async criarAssociado(data: any) {
    const response = await api.post("/associados", data);
    return response.data;
  },

  async atualizarAssociado(id: number, data: any) {
    const response = await api.put(`/associados/${id}`, data);
    return response.data;
  },

  async excluirAssociado(id: number) {
    await api.delete(`/associados/${id}`);
  },

  async adicionarEndereco(associadoId: number, endereco: any) {
    const response = await api.post(`/associados/${associadoId}/enderecos`, endereco);
    return response.data;
  },

  async atualizarEndereco(associadoId: number, enderecoId: number, endereco: any) {
    const response = await api.put(`/associados/${associadoId}/enderecos/${enderecoId}`, endereco);
    return response.data;
  },

  async removerEndereco(associadoId: number, enderecoId: number) {
    await api.delete(`/associados/${associadoId}/enderecos/${enderecoId}`);
  },

  async adicionarEmail(associadoId: number, email: any) {
    const response = await api.post(`/associados/${associadoId}/emails`, email);
    return response.data;
  },

  async atualizarEmail(associadoId: number, emailId: number, email: any) {
    const response = await api.put(`/associados/${associadoId}/emails/${emailId}`, email);
    return response.data;
  },

  async removerEmail(associadoId: number, emailId: number) {
    await api.delete(`/associados/${associadoId}/emails/${emailId}`);
  },

  async adicionarTelefone(associadoId: number, telefone: any) {
    const response = await api.post(`/associados/${associadoId}/telefones`, telefone);
    return response.data;
  },

  async atualizarTelefone(associadoId: number, telefoneId: number, telefone: any) {
    const response = await api.put(`/associados/${associadoId}/telefones/${telefoneId}`, telefone);
    return response.data;
  },

  async removerTelefone(associadoId: number, telefoneId: number) {
    await api.delete(`/associados/${associadoId}/telefones/${telefoneId}`);
  },

  async listarVendedores() {
    const response = await api.get("/associados/vendedores");
    return response.data;
  },

  async listarPlanos() {
    const response = await api.get("/associados/planos");
    return response.data;
  },

  async listarCategorias() {
    const response = await api.get("/associados/categorias");
    return response.data;
  },

  async healthCheck() {
    try {
      const response = await api.get("/associados/health");
      return response.data;
    } catch (error: any) {
      return { status: "DOWN", error: error.message };
    }
  }
};

/* ============================================================================
   HANDLER DE ERROS
   ============================================================================ */
export const errorHandler = {
  getErrorMessage(error: any): string {
    if (error?.response?.data?.erro) return error.response.data.erro;
    if (error?.response?.data?.message) return error.response.data.message;
    
    if (error.isTimeout || error.code === "ECONNABORTED") {
      return "⏰ A operação está demorando muito. Tente com menos dados ou processe em lotes menores.";
    }

    if (error.code === "ERR_NETWORK") {
      return "Erro de conexão. Verifique se o servidor está online.";
    }

    if (error.response?.status === 413) {
      return "Arquivo muito grande. Máximo permitido: 100MB.";
    }

    if (error.response?.status === 415) {
      return "Tipo de arquivo inválido. Apenas .txt é permitido.";
    }

    if (error.response?.status === 404) return "Recurso não encontrado.";
    if (error.response?.status === 400) return "Dados inválidos.";
    if (error.response?.status === 500) return "Erro interno do servidor. Tente novamente.";

    return error.message || "Erro desconhecido.";
  },

  isNetworkError: (e: any) => e?.code === "ERR_NETWORK",
  isTimeoutError: (e: any) => e?.isTimeout || e?.code === "ECONNABORTED",
};

/* ============================================================================
   SERVIÇO DE LOGS DO SISTEMA
   ============================================================================ */
export const sistemaLogAPI = {
  async buscarLogs(filtros: any) {
    const response = await api.get("/sistema-log", { params: filtros });
    return response.data;
  },

  async buscarLogPorId(id: number) {
    const response = await api.get(`/sistema-log/${id}`);
    return response.data;
  },

  async buscarLogsPorRegistro(tabela: string, idRegistro: number) {
    const response = await api.get(`/sistema-log/registro/${tabela}/${idRegistro}`);
    return response.data;
  },

  async buscarLogsPorPeriodo(dataInicio: string, dataFim: string) {
    const response = await api.get(`/sistema-log/periodo`, {
      params: { dataInicio, dataFim }
    });
    return response.data;
  },

  async buscarOpcoesTabelas() {
    try {
      const response = await api.get("/sistema-log/tabelas");
      return response.data;
    } catch {
      return ['Associado', 'Produto', 'Vendedor', 'Usuario', 'Plano', 'Categoria'];
    }
  },

  async buscarOpcoesAcoes() {
    try {
      const response = await api.get("/sistema-log/acoes");
      return response.data;
    } catch {
      return ['CREATE', 'UPDATE', 'DELETE', 'READ', 'ERRO'];
    }
  },

  async buscarOpcoesModulos() {
    try {
      const response = await api.get("/sistema-log/modulos");
      return response.data;
    } catch {
      return ['ASSOCIADOS', 'PRODUTOS', 'VENDEDORES', 'USUARIOS', 'SISTEMA'];
    }
  },

  async limparLogsAntigos(dias: number) {
    const response = await api.delete(`/sistema-log/limpar/${dias}`);
    return response.data;
  },

  async healthCheck() {
    try {
      const response = await api.get("/sistema-log/health");
      return response.data;
    } catch {
      return { status: "DOWN", message: "Serviço de logs não disponível" };
    }
  }
};

// 🔥 EXPORTAÇÃO PADRÃO
export default api;