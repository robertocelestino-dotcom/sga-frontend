// src/types/rmApi.types.ts

export interface RmApiConfig {
    id?: number;
    nome: string;
    descricao?: string;
    wsUrl: string;
    wsUsername: string;
    wsPassword: string;
    wsColigada: string;
    wsSistema: string;
    wsUsuario: string;
    wsDataServer: string;
    wsTimeout: number;
    wsTentativas: number;
    wsAutoReconnect: boolean;
    ativo: boolean;
    integracaoAutomatica: boolean;
}

export interface RmApiIntegracaoItem {
    notaId: number;
    faturaId?: number;
    sucesso: boolean;
    idMov?: number;
    mensagem: string;
}

export interface RmApiIntegracaoResponse {
    sucesso: boolean;
    mensagem: string;
    totalProcessados: number;
    totalSucessos: number;
    totalErros: number;
    itens: RmApiIntegracaoItem[];
}

export interface RmApiIntegracaoRequest {
    notaIds: number[];
    configuracaoId?: number;
}

// 🔥 TIPOS PARA PRÉ-VISUALIZAÇÃO
export interface RmApiValidacaoItem {
    codigoProduto: string;
    descricao: string;
    quantidade: string;
    valorUnitario: string;
    valorTotal: string;
    indice: number;
}

export interface RmApiValidacaoDados {
    associadoId: number;
    associadoNome: string;
    codigoSpc: string;
    dataEmissao: string;
    dataVencimento: string;
    valorTotal: string;
    quantidadeItens: number;
    itens: RmApiValidacaoItem[];
}

export interface RmApiValidacao {
    dados: RmApiValidacaoDados;
    erros: string[];
    avisos: string[];
    valido: boolean;
}

export interface RmApiPreVisualizacaoItem {
    notaId: number;
    faturaId: number;
    numeroFatura: string;
    xml: string;
    validacao: RmApiValidacao;
    temErros: boolean;
    erro?: string;
}

export interface RmApiPreVisualizacaoResponse {
    sucesso: boolean;
    mensagem?: string;
    total: number;
    configuracao: RmApiConfig;
    detalhes: RmApiPreVisualizacaoItem[];
}