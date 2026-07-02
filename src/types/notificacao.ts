// src/types/notificacao.ts
export interface NotificacaoSumarizada {
  idRemessa: number;
  tipoEnvio: string;
  competencia: string;
  dataMovimento: string;
  codigoAssociado: number;
  nomeAssociado: string;
  totalRegistrosDigital: number;
  smsSemEnriquecimento: number;
  smsComEnriquecimento: number;
  totalSms: number;
  emailsSemEnriquecimento: number;
  emailsComEnriquecimento: number;
  totalEmail: number;
  cartasEnviadas: number;
  naoEnviada: number;
}

export interface NotificacaoAssociado {
  id: number;
  associadoId: number;
  reguaId?: number;
  mesReferencia: number;
  anoReferencia: number;
  periodoInicio: string;
  periodoFim: string;
  codigoSpc?: string;
  totalRegistros: number;
  smsSemEnriquecimento: number;
  smsComEnriquecimento: number;
  smsTotal: number;
  emailsSemEnriquecimento: number;
  emailsComEnriquecimento: number;
  emailsTotal: number;
  cartasTotal: number;
  naoEnviadas: number;
  valorTotal: number;
  processadoFatura: boolean;
  faturaId?: number;
}

export interface SincronizacaoResponse {
  success: boolean;
  message: string;
  mes: number;
  ano: number;
  associadosProcessados: number;
  dataSincronizacao: string;
}

export interface NotificacaoAgrupada {
  competencia: string;
  codigoAssociado: number;
  nomeAssociado: string;
  totalRegistrosDigital: number;
  smsSemEnriquecimento: number;
  smsComEnriquecimento: number;
  totalSms: number;
  emailsSemEnriquecimento: number;
  emailsComEnriquecimento: number;
  totalEmail: number;
  cartasEnviadas: number;
  naoEnviada: number;
}