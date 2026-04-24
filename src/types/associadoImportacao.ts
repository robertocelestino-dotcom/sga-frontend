// Tipos para importação de associados
export interface AssociadoImportacaoLinha {
    // Dados obrigatórios
    tipoPessoa: 'F' | 'J';
    cnpjCpf: string;
    nomeRazao: string;
    nomeFantasia?: string;
    
    // Dados de relacionamento
    codigoVendedor?: string;
    codigoVendedorExterno?: string;
    codigoPlano?: string;
    codigoCategoria?: string;
    
    // Códigos externos
    codigoSpc?: string;
    codigoRm?: string;
    
    // Dados de endereço
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    tipoEndereco?: 'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA';
    
    // Dados de telefone
    ddd?: string;
    telefone?: string;
    tipoTelefone?: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX';
    whatsapp?: boolean;
    
    // Dados de email
    email?: string;
    tipoEmail?: 'PESSOAL' | 'COMERCIAL' | 'COBRANCA';
    
    // Dados financeiros
    faturamentoMinimo?: number;
    dataFiliacao?: string;
    
    // Status
    status?: 'A' | 'I' | 'S';
    
    // Controle de erros
    linha?: number;
    erros?: string[];
  }
  
  export interface ResultadoImportacao {
    totalLinhas: number;
    linhasProcessadas: number;
    linhasComErro: number;
    associadosImportados: number;
    erros: Array<{
      linha: number;
      mensagem: string;
      dados: AssociadoImportacaoLinha;
    }>;
    detalhes: AssociadoImportacaoLinha[];
    criados?: number;
    atualizados?: number;
    configuracoesCriadas?: number; // 🔥 NOVO CAMPO
  }