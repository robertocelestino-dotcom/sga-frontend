// src/types/fatura.types.ts

export interface FaturaResumoDTO {
    id: number;
    numeroFatura: string;
    associadoId: number;
    associadoNome: string;
    cnpjCpf: string;
    dataEmissao: string;
    dataVencimento: string;
    valorTotal: number;
    status: string;
    processadoRm: boolean;
    mesReferencia: number;
    anoReferencia: number;
    notaDebitoId?: number;
}

export interface FaturaDetalheDTO extends FaturaResumoDTO {
    observacao?: string;
    usuarioCriacao?: string;
    criadoEm: string;
    itens: FaturaItemDTO[];
}

export interface FaturaItemDTO {
    id: number;
    codigoProduto: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    tipoLancamento: string;
}