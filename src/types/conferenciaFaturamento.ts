// src/types/conferenciaFaturamento.ts

export interface ConferenciaFaturamentoDTO {
    faturaId: number;
    numeroFatura: string;
    dataEmissao: string;
    statusFatura: string;
    valorFatura: number;

    notaId: number;
    numeroNotaDebito: string;
    dataVencimento: string;
    valorNota: number;
    tipoArquivo: string;

    associadoId: number;
    codigoSpc: string;
    codigoRm: string;
    nomeRazao: string;

    qtdItensNota: number;
    qtdItensFatura: number;
    diferencaItens: number;

    qtdFranquiasNota: number;
    qtdFranquiasFatura: number;
    diferencaFranquias: number;

    diferencaValor: number;
    statusConferencia: 'OK' | 'DIFERENCA' | 'ATENCAO' | 'ERRO';
    observacao: string;
}

export interface ConferenciaResumoDTO {
    totalFaturas: number;
    totalComDiferenca: number;
    totalSemDiferenca: number;
    totalComErro: number;
    totalComAtencao: number;
    somaDiferencas: number;
    maiorDiferenca: number;
    menorDiferenca: number;
    mediaDiferenca: number;
    totalItensNota: number;
    totalItensFatura: number;
    totalFranquiasNota: number;
    totalFranquiasFatura: number;
    totalFranquiasRemovidas: number;
    totalAssociados: number;
    somaValorNotas: number;
    somaValorFaturas: number;
}

export interface ItemComparacaoDTO {
    codigo: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    tipo: 'NOTA' | 'FATURA' | 'AMBOS';
    status: 'OK' | 'REMOVIDO' | 'ADICIONADO' | 'MODIFICADO';
}

export interface ConferenciaFaturaDetalheDTO {
    faturaId: number;
    numeroFatura: string;
    dataEmissao: string;
    statusFatura: string;
    valorFatura: number;

    notaId: number;
    numeroNotaDebito: string;
    dataVencimento: string;
    valorNota: number;

    associadoId: number;
    codigoSpc: string;
    codigoRm: string;
    nomeRazao: string;

    diferencaValor: number;
    diferencaItens: number;
    statusConferencia: 'OK' | 'DIFERENCA' | 'ATENCAO' | 'ERRO';
    observacao: string;

    itensNota: ItemComparacaoDTO[];
    itensFatura: ItemComparacaoDTO[];
    itensRemovidos: ItemComparacaoDTO[];
    itensAdicionados: ItemComparacaoDTO[];
    itensModificados: ItemComparacaoDTO[];
}