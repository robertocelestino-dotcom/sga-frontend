// src/services/cepService.ts
export interface EnderecoViaCEP {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
  }
  
  export const cepService = {
    async buscarCEP(cep: string): Promise<EnderecoViaCEP | null> {
      try {
        const cepLimpo = cep.replace(/\D/g, '');
        
        if (cepLimpo.length !== 8) {
          return null;
        }
  
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data: EnderecoViaCEP = await response.json();
        
        if (data.erro) {
          return null;
        }
        
        return data;
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
      }
    }
  };
  