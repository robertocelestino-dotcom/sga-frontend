// src/types/plano.ts
export interface PlanoResumoDTO {
    id: number;
    codigo: string;
    plano: string;
    descricao?: string;
    valorMensal: number;
    status: 'ATIVO' | 'INATIVO';
    dataCadastro: string;
  }
  
  export interface PlanoDTO extends PlanoResumoDTO {
    valorAnual?: number;
    periodicidade: 'MENSAL' | 'ANUAL' | 'SEMESTRAL' | 'TRIMESTRAL';
    limiteAssociados?: number;
    limiteConsultas?: number;
    incluiSuporte: boolean;
    diasCarencia?: number;
    observacoes?: string;
  }
  
  export interface PlanoFiltros {
    codigo?: string;
    plano?: string;
    status?: 'ATIVO' | 'INATIVO';
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }