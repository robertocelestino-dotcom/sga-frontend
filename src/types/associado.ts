// src/types/associado.ts - VERSÃO ATUALIZADA
export interface Associado {
  id?: number;
  codigoSpc?: string;
  codigoRm?: string;
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  tipoPessoa: 'F' | 'J';
  status: 'A' | 'I';
  dataCadastro: string;
  dataFiliacao?: string; // NOVO CAMPO
  vendedorId?: number;
  vendedorNome?: string;
  vendedorExternoId?: number; // NOVO CAMPO
  vendedorExternoNome?: string; // NOVO CAMPO
  planoId?: number;
  planoNome?: string;
  categoriaId?: number;
  categoriaNome?: string;
  faturamentoMinimo?: number;
  enderecos?: Endereco[];
  telefones?: Telefone[];
  emails?: Email[];
  definicoesNotificacao?: any[];
  definicoesFaturamento?: any[];
}

export interface Endereco {
  id?: number;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  tipoEndereco: string;
}

export interface Telefone {
  id?: number;
  ddd: string;
  numero: string;
  tipoTelefone: string;
  whatsapp: boolean;
  ativo: boolean;
}

export interface Email {
  id?: number;
  email: string;
  tipoEmail: string;
  ativo: boolean;
}