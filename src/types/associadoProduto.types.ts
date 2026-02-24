// src/types/associadoDefFaturamento.types.ts

export interface AssociadoDefFaturamento {
    id?: number;
    associadoId: number;
    planoId?: number | null;
    valorDef?: number | null;
    diaEmissao: number;
    diaVencimento: number;
    observacao?: string | null;
  }
  
  export interface AssociadoDefFaturamentoResumo {
    id: number;
    associadoId: number;
    associadoNome: string;
    planoId?: number;
    planoNome?: string;
    valorDef?: number;
    diaEmissao: number;
    diaVencimento: number;
    observacao?: string;
  }
  
  export interface ConfiguracaoFaturamento {
    id?: number;
    planoId?: number | null;
    valorDef?: number | null;
    diaEmissao: number;
    diaVencimento: number;
    observacao?: string | null;
  }
  
  export interface AssociadoDefFaturamentoFrontend extends AssociadoDefFaturamento {
    // Extensão para uso no frontend, se necessário
  }