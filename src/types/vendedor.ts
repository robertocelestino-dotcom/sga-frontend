// src/types/vendedor.ts
export interface VendedorResumoDTO {
    id: number;
    codigo: string;
    nomeRazao: string;
    cpfCnpj: string;
    email: string;
    telefone: string;
    status: 'ATIVO' | 'INATIVO';
    dataCadastro: string;
  }
  
  export interface VendedorDTO extends VendedorResumoDTO {
    nomeFantasia?: string;
    tipoPessoa: 'F' | 'J';
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    comissaoPercentual?: number;
    observacoes?: string;
  }
  
  export interface VendedorFiltros {
    codigo?: string;
    nomeRazao?: string;
    cpfCnpj?: string;
    status?: 'ATIVO' | 'INATIVO';
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }