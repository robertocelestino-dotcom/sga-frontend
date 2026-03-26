export interface PlanoProdutoFranquia {
    id: number;
    planoId: number;
    planoNome: string;
    produtoId: number;
    produtoNome: string;
    franquiaId: number;
    franquiaNome: string;
    limiteFranquia: number;
    periodoFranquia: 'MENSAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    valorExcedente?: number;
    permiteExcedente: boolean;
    ativo: boolean;
  }
  
  export interface AssociadoPlano {
    id: number;
    associadoId: number;
    associadoNome: string;
    planoId: number;
    planoNome: string;
    planoValor: number;
    dataAdesao: string;
    dataCancelamento?: string;
    status: 'ATIVO' | 'CANCELADO' | 'SUSPENSO';
    observacao?: string;
    produtosDoPlano: PlanoProdutoFranquia[];
  }
  
  export interface ConsumoFranquia {
    id?: number;
    associadoId: number;
    associadoNome: string;
    planoId: number;
    planoNome: string;
    produtoId: number;
    produtoNome: string;
    franquiaId: number;
    franquiaNome: string;
    ano: number;
    mes: number;
    utilizado: number;
    limite: number;
    disponivel: number;
    excedente: number;
    valorExcedente?: number;
    percentualUtilizado: number;
    status: 'NORMAL' | 'ATENCAO' | 'CRITICO' | 'EXCEDIDO' | 'SEM_LIMITE';
    dataUltimoConsumo?: string;
  }
  
  export interface RegistrarConsumoDTO {
    associadoId: number;
    produtoId: number;
    quantidade: number;
    data?: string;
  }
  