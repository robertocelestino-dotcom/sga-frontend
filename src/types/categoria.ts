// src/types/categoria.ts
export interface CategoriaResumoDTO {
    id: number;
    codigo: string;
    descricao: string;
    tipo: 'ASSOCIADO' | 'PRODUTO' | 'GERAL';
    status: 'ATIVO' | 'INATIVO';
    dataCadastro: string;
  }
  
  export interface CategoriaDTO extends CategoriaResumoDTO {
    subcategoriaDe?: number;
    nivel: number;
    corHex?: string;
    icone?: string;
    observacoes?: string;
  }
  
  export interface CategoriaFiltros {
    codigo?: string;
    descricao?: string;
    tipo?: 'ASSOCIADO' | 'PRODUTO' | 'GERAL';
    status?: 'ATIVO' | 'INATIVO';
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'asc' | 'desc';
  }