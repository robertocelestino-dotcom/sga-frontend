// utils/cnpjUtils.ts

/**
 * Converte um caractere para seu valor base para cálculo do DV
 * Conforme especificação: valor ASCII - 48
 * Ex: 'A' (ASCII 65) -> 65 - 48 = 17
 */
export function converterCaractereParaValor(char: string): number {
    if (!char) return 0;
    
    // Se for número, retorna o próprio número
    if (/^\d$/.test(char)) {
      return parseInt(char, 10);
    }
    
    // Se for letra, converte para maiúsculo e calcula: ASCII - 48
    const charUpper = char.toUpperCase();
    const asciiCode = charUpper.charCodeAt(0);
    return asciiCode - 48;
  }
  
  /**
   * Calcula o dígito verificador para CNPJ alfanumérico (módulo 11)
   * Esta é uma preparação; a fórmula exata será confirmada pela RFB
   */
  export function calcularDigitoVerificador(base: string): string {
    const fatores = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    
    for (let i = 0; i < base.length; i++) {
      const valor = converterCaractereParaValor(base[i]);
      soma += valor * fatores[i];
    }
    
    const resto = soma % 11;
    const dv = resto < 2 ? 0 : 11 - resto;
    
    return dv.toString();
  }
  
  /**
   * Formata CNPJ para exibição (incluindo letras)
   * Formato: XX.XXX.XXX/XXXX-XX (agora suporta letras)
   */
  export function formatarCnpjAlfanumerico(cnpj: string): string {
    const cnpjLimpo = cnpj.replace(/[^\w]/g, '').toUpperCase();
    
    if (cnpjLimpo.length !== 14) return cnpj;
    
    return `${cnpjLimpo.substring(0, 2)}.${cnpjLimpo.substring(2, 5)}.${cnpjLimpo.substring(5, 8)}/${cnpjLimpo.substring(8, 12)}-${cnpjLimpo.substring(12, 14)}`;
  }

/**
 * Verifica se um CNPJ está no novo formato alfanumérico
 */
export function isCnpjAlfanumerico(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/[^\w]/g, '');
    
    // Se tiver letras, é o novo formato
    if (/[A-Za-z]/.test(cnpjLimpo)) {
    return true;
    }
    
    return false;
}

/**
 * Normaliza CNPJ para envio ao backend (sempre maiúsculo, sem formatação)
 */
export function normalizarCnpj(cnpj: string): string {
    return cnpj.replace(/[^\w]/g, '').toUpperCase();
}
