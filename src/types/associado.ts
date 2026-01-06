// src/types/associado.ts
export interface AssociadoResumoDTO {
    id: number;
    codigoSpc: string;
    codigoRm: string;
    cnpjCpf: string;
    nomeRazao: string;
    nomeFantasia?: string;
    tipoPessoa: 'F' | 'J'; // F = Física, J = Jurídica
    status: 'A' | 'I' | 'S'; // A = Ativo, I = Inativo, S = Suspenso
    dataCadastro: string;
    
    // Relacionamentos básicos (apenas IDs ou nomes)
    vendedorId?: number;
    vendedorNome?: string;
    planoId?: number;
    planoNome?: string;
    categoriaId?: number;
    categoriaNome?: string;
  }
  
  export interface AssociadoDTO extends AssociadoResumoDTO {
    faturamentoMinimo?: number;
    
    // Listas de relacionamentos
    enderecos?: EnderecoDTO[];
    emails?: EmailDTO[];
    telefones?: TelefoneDTO[];
    definicoesNotificacao?: AssociadoDefNotificacaoDTO[];
    definicoesFaturamento?: AssociadoDefFaturamentoDTO[];
  }
  
  // Sub-entidades
  export interface EnderecoDTO {
    id?: number;
    tipoLogradouro?: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    cep: string;
    estado: string;
    tipoEndereco: 'COMERCIAL' | 'RESIDENCIAL' | 'COBRANCA';
  }
  
  export interface EmailDTO {
    id?: number;
    email: string;
    tipoEmail: 'PESSOAL' | 'COMERCIAL' | 'COBRANCA';
    ativo: boolean;
  }
  
  export interface TelefoneDTO {
    id?: number;
    ddd: string;
    numero: string;
    tipoTelefone: 'CELULAR' | 'COMERCIAL' | 'RESIDENCIAL' | 'FAX';
    whatsapp: boolean;
    ativo: boolean;
  }
  
  export interface AssociadoDefNotificacaoDTO {
    id?: number;
    produtoId: number;
    produtoNome?: string;
    valorDefinido?: number;
    dataAdesao?: string;
    dataInicio?: string;
    dataFim?: string;
    dataReinicio?: string;
    idTipoEnvio?: number;
    envioPadrao: 'S' | 'N';
    utilizaEnriquecimento: 'S' | 'N';
    deduzirDoPlano: 'S' | 'N';
    statusNoProcesso: 'A' | 'I';
    observacao?: string;
  }
  
  export interface AssociadoDefFaturamentoDTO {
    id?: number;
    planoId: number;
    planoNome?: string;
    valorDef?: number;
    diaEmissao?: number;
    diaVencimento?: number;
    observacao?: string;
  }
  
  // Filtros para busca
  export interface AssociadoFiltros {
    codigoSpc?: string;
    codigoRm?: string;
    cnpjCpf?: string;
    nomeRazao?: string;
    tipoPessoa?: 'F' | 'J';
    status?: 'A' | 'I' | 'S';
    vendedorId?: number;
    planoId?: number;
    categoriaId?: number;
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }