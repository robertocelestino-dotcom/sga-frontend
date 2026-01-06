// src/types/combobox.ts (ou adicione aos tipos existentes)
export interface VendedorOption {
    id: number;
    codigo?: string;
    nomeRazao: string;
    cargoFuncao?: string;
    status?: string;
  }
  
  export interface CategoriaOption {
    id: number;
    codigo?: string;
    descricao: string;
    tipo?: string;
    status?: string;
  }
  
  export interface PlanoOption {
    id: number;
    codigo?: string;
    nome: string;
    valorMensal?: number;
    status?: string;
  }
  
  