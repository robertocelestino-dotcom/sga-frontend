// src/utils/formatUtils.ts

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada ex: R$ 1.234,56
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata uma data para o padrão brasileiro (dd/mm/yyyy) SEM timezone
 * @param dateStr - String de data (ISO ou Date)
 * @returns String formatada ex: 31/12/2024
 */
export const formatDateWithoutTimezone = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  
  // Se já estiver no formato DD/MM/YYYY, retorna direto
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateStr;
  }
  
  try {
    // Extrair partes da data manualmente (evita problemas de timezone)
    const partes = dateStr.split('T')[0].split('-');
    if (partes.length === 3) {
      const ano = partes[0];
      const mes = partes[1];
      const dia = partes[2];
      return `${dia}/${mes}/${ano}`;
    }
    
    // Fallback: usar UTC
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const dia = String(date.getUTCDate()).padStart(2, '0');
    const mes = String(date.getUTCMonth() + 1).padStart(2, '0');
    const ano = date.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  } catch {
    return dateStr;
  }
};

/**
 * Formata data e hora SEM timezone
 * @param dateStr - String de data
 * @returns String formatada ex: 31/12/2024 14:30
 */
export const formatDateTimeWithoutTimezone = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  
  try {
    const [data, hora] = dateStr.split('T');
    const dataFormatada = formatDateWithoutTimezone(data);
    if (hora) {
      const horaFormatada = hora.split('.')[0].slice(0, 5);
      return `${dataFormatada} ${horaFormatada}`;
    }
    return dataFormatada;
  } catch {
    return dateStr;
  }
};

/**
 * Formata uma data para o padrão brasileiro (dd/mm/yyyy)
 * @param dateStr - String de data (ISO ou Date)
 * @returns String formatada ex: 31/12/2024
 */
export const formatDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '-';
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

/**
 * Formata data e hora
 * @param dateStr - String de data
 * @returns String formatada ex: 31/12/2024 14:30
 */
export const formatDateTime = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '-';
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
};

/**
 * Formata um número com separador de milhar
 * @param value - Valor numérico
 * @returns String formatada ex: 1.234
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Formata um número com decimais
 * @param value - Valor numérico
 * @param decimals - Número de casas decimais
 * @returns String formatada ex: 1.234,56
 */
export const formatDecimal = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Formata CPF (###.###.###-##)
 * @param cpf - CPF com 11 dígitos
 * @returns CPF formatado
 */
export const formatCpf = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  const apenasNumeros = cpf.replace(/\D/g, '');
  if (apenasNumeros.length !== 11) return cpf;
  return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata CNPJ (##.###.###/####-##)
 * @param cnpj - CNPJ com 14 dígitos
 * @returns CNPJ formatado
 */
export const formatCnpj = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '';
  const apenasNumeros = cnpj.replace(/\D/g, '');
  if (apenasNumeros.length !== 14) return cnpj;
  return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Formata CPF ou CNPJ automaticamente
 * @param documento - CPF ou CNPJ
 * @returns Documento formatado
 */
export const formatDocumento = (documento: string | null | undefined): string => {
  if (!documento) return '';
  const apenasNumeros = documento.replace(/\D/g, '');
  if (apenasNumeros.length === 11) {
    return formatCpf(apenasNumeros);
  } else if (apenasNumeros.length === 14) {
    return formatCnpj(apenasNumeros);
  }
  return documento;
};

/**
 * Formata telefone ((##) ####-#### ou (##) #####-####)
 * @param ddd - DDD do telefone
 * @param numero - Número do telefone
 * @returns Telefone formatado
 */
export const formatTelefone = (ddd: string | null | undefined, numero: string | null | undefined): string => {
  if (!ddd && !numero) return '';
  const dddStr = ddd ? ddd.replace(/\D/g, '') : '';
  const numeroStr = numero ? numero.replace(/\D/g, '') : '';
  if (!dddStr && !numeroStr) return '';
  if (numeroStr.length === 8) {
    return `(${dddStr}) ${numeroStr.substring(0, 4)}-${numeroStr.substring(4)}`;
  } else if (numeroStr.length === 9) {
    return `(${dddStr}) ${numeroStr.substring(0, 5)}-${numeroStr.substring(5)}`;
  }
  return dddStr ? `(${dddStr}) ${numeroStr}` : numeroStr;
};

/**
 * Formata CEP (#####-###)
 * @param cep - CEP com 8 dígitos
 * @returns CEP formatado
 */
export const formatCep = (cep: string | null | undefined): string => {
  if (!cep) return '';
  const apenasNumeros = cep.replace(/\D/g, '');
  if (apenasNumeros.length !== 8) return cep;
  return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
};