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

// Função de validação para CPF/CNPJ (a ser implementada)
const validarCnpj = (cnpj: string): boolean => {
  // Por enquanto, manter validação existente
  // A partir de julho/2026, implementar a nova validação
  const cnpjLimpo = cnpj.replace(/[^\w]/g, ''); // Agora \w inclui letras e números
  
  if (cnpjLimpo.length !== 14) return false;
  
  // Se for composto apenas por números, validar como CNPJ antigo
  if (/^\d+$/.test(cnpjLimpo)) {
    // Manter validação atual do CNPJ numérico
    return validarCnpjNumerico(cnpjLimpo);
  }
  
  // Se tiver letras, validar como novo CNPJ alfanumérico
  return validarCnpjAlfanumerico(cnpjLimpo);
};

// Função específica para validar o novo formato alfanumérico
const validarCnpjAlfanumerico = (cnpj: string): boolean => {
  // Placeholder: implementar a lógica de validação do módulo 11 com ASCII
  // quando a Receita Federal publicar a especificação completa
  console.warn('Validação de CNPJ alfanumérico será implementada até julho/2026');
  return true; // Temporário
};

