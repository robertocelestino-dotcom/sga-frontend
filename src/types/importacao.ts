export interface ImportacaoSPC {
    id: number;
    nomeArquivo: string;
    dataImportacao: string;
    status: 'IMPORTADO' | 'PROCESSADO' | 'ERRO';
    headers: HeaderSPC[];
    parametros: ParametrosSPC[];
    notasDebito: NotaDebitoSPC[];
    traillers: TraillerSPC[];
  }
  
  export interface HeaderSPC {
    id: number;
    nomeEntidade: string;
    dataRefFaturamento: string;
    dataGravacao: string;
    nomeArquivo: string;
    descricaoArquivo: string;
    codigoEntidade: string;
    enderecoEntidade: string;
    bairroEntidade: string;
    cepEntidade: string;
    cidadeEntidade: string;
    ufEntidade: string;
    telefoneEntidade: string;
    faxEntidade: string;
    cnpjEntidade: string;
    inscricaoEstadual: string;
    inscricaoMunicipal: string;
    importacao: ImportacaoSPC;
  }
  
  export interface ParametrosSPC {
    id: number;
    tipoRegistro: string;
    dataReferencia: string;
    valorFatVencto1: number;
    data1oVencimento: string;
    data2oVencimento: string;
    quantDiasAtraso: number;
    percJurosAposVencto: number;
    valorMultaAposVencto: number;
    dataInicioPeriodoRef: string;
    dataFimPeriodoRef: string;
    valorFaturamentoMinimo: number;
    importacao: ImportacaoSPC;
  }
  
  export interface NotaDebitoSPC {
    id: number;
    tipoRegistro: string;
    dataVencimento: string;
    numeroFatura: string;
    numeroNotaDebito: string;
    valorNota: number;
    codigoSocio: string;
    nomeAssociado: string;
    enderecoCobranca: string;
    bairroCobranca: string;
    cepCobranca: string;
    cidadeCobranca: string;
    ufCobranca: string;
    telefoneCobranca: string;
    tipoPessoa: string;
    cnpjCic: string;
    inscricaoEstadual: string;
    importacao: ImportacaoSPC;
    itens: ItemSPC[];
  }
  
  export interface ItemSPC {
    id: number;
    tipoRegistro: string;
    quantidadeServicos: number;
    descricaoServico: string;
    valorUnitario: number;
    valorTotal: number;
    creditoDebito: string;
    tipoProduto: string;
    codigoProdutoComercial: string;
    codigoContabil: string;
    numeroNotaDebito: string;
    sequenciaNotaDebito: string;
    codigoProduto: string;
    codigoMeioAcesso: string;
    tipoProdutoDetalhe: string;
    incideISS: string;
    notaDebito: NotaDebitoSPC;
    importacao: ImportacaoSPC;
  }
  
  export interface TraillerSPC {
    id: number;
    tipoRegistro: string;
    qtdeTotalRegistros: number;
    qtdeTotalBoletos: number;
    valorTotalBoletos: number;
    importacao: ImportacaoSPC;
  }
  
  export interface ImportacaoDetalhesResponse {
    importacao: ImportacaoSPC;
    totalHeaders: number;
    totalParametros: number;
    totalNotas: number;
    totalItens: number;
    totalTraillers: number;
  }