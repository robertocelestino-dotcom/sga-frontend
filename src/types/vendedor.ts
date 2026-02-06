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
    vendedorTipoId: number;
    vendedorTipoDescricao: string;
  }
  
  export interface VendedorResumoDTO {
    id: number;
    nomeRazao: string;
    nomeFantasia?: string;
    cargoFuncao?: string;
    status: 'ATIVO' | 'INATIVO';
    vendedorTipoId: number;
    vendedorTipoDescricao: string;
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

  export interface VendedorTipoDTO {
    id: number;
    descricao: string;
    ativo: boolean
  }
  
  export interface VendedorDTO {
    id?: number;
    nomeRazao: string;
    nomeFantasia?: string;
    cargoFuncao?: string;
    status: string;
    observacao?: string;
    dataCadastro?: string;
    vendedorTipoId: number;
    vendedorTipoDescricao?: string;
  }

