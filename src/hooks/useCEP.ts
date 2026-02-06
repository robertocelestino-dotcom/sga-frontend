// src/hooks/useCEP.ts - VERSÃO MELHORADA
import { useState, useCallback, useRef } from 'react';

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

// Cache em memória para CEPs já buscados
const cepCache = new Map<string, { data: EnderecoViaCEP; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

// Função para validar se um CEP é válido
const validarCEPNumerico = (cep: string): boolean => {
  const cepLimpo = cep.replace(/\D/g, '');
  
  // Verificar se tem 8 dígitos
  if (cepLimpo.length !== 8) {
    return false;
  }
  
  // Verificar se não é um CEP com padrão repetido
  const padroesInvalidos = [
    '00000000', '11111111', '22222222', '33333333',
    '44444444', '55555555', '66666666', '77777777',
    '88888888', '99999999'
  ];
  
  if (padroesInvalidos.includes(cepLimpo)) {
    return false;
  }
  
  // Verificar dígito verificador para alguns estados (opcional)
  // Esta é uma validação básica, pode ser expandida
  
  return true;
};

// Função para verificar se o CEP está no cache
const obterDoCache = (cep: string): EnderecoViaCEP | null => {
  const cacheEntry = cepCache.get(cep);
  
  if (cacheEntry) {
    const agora = Date.now();
    // Verificar se o cache ainda é válido
    if (agora - cacheEntry.timestamp < CACHE_DURATION) {
      console.log(`📦 CEP ${cep} encontrado no cache`);
      return cacheEntry.data;
    } else {
      // Cache expirado, remover
      cepCache.delete(cep);
    }
  }
  
  return null;
};

// Função para salvar no cache
const salvarNoCache = (cep: string, data: EnderecoViaCEP) => {
  cepCache.set(cep, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 CEP ${cep} salvo no cache`);
};

export const useCEP = () => {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState('');
  const [ultimoCEPBuscado, setUltimoCEPBuscado] = useState<string>('');
  
  // Referência para controlar requisições em andamento
  const requisicoesAtivas = useRef<Map<string, AbortController>>(new Map());

  const buscarCEP = useCallback(async (cep: string): Promise<EnderecoViaCEP | null> => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    console.log(`🔍 Buscando CEP: ${cepLimpo}`);
    
    // 1. Validação básica
    if (cepLimpo.length !== 8) {
      setErro('CEP deve ter 8 dígitos');
      return null;
    }
    
    // 2. Validação de CEP inválido
    if (!validarCEPNumerico(cepLimpo)) {
      setErro('CEP inválido');
      return null;
    }
    
    // 3. Verificar se já está buscando este CEP
    if (ultimoCEPBuscado === cepLimpo && buscando) {
      console.log(`⏳ Já buscando CEP ${cepLimpo}, aguarde...`);
      return null;
    }
    
    // 4. Verificar cache primeiro
    const cacheData = obterDoCache(cepLimpo);
    if (cacheData) {
      setUltimoCEPBuscado(cepLimpo);
      return cacheData;
    }
    
    setBuscando(true);
    setErro('');
    setUltimoCEPBuscado(cepLimpo);
    
    // Cancelar requisição anterior para o mesmo CEP
    if (requisicoesAtivas.current.has(cepLimpo)) {
      requisicoesAtivas.current.get(cepLimpo)?.abort();
    }
    
    const controller = new AbortController();
    requisicoesAtivas.current.set(cepLimpo, controller);
    
    try {
      console.log(`🚀 Fazendo requisição para ViaCEP: ${cepLimpo}`);
      
      // Timeout de 10 segundos
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000);
      
      // Tentar ViaCEP primeiro
      let response: Response;
      let data: EnderecoViaCEP;
      
      try {
        response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`ViaCEP retornou status ${response.status}`);
        }
        
        data = await response.json();
        
      } catch (viaCepError: any) {
        console.warn('⚠️ ViaCEP falhou, tentando API alternativa...', viaCepError);
        
        // Fallback para API alternativa
        try {
          const fallbackResponse = await fetch(`https://brasilapi.com.br/api/cep/v2/${cepLimpo}`, {
            signal: controller.signal
          });
          
          if (!fallbackResponse.ok) {
            throw new Error('API alternativa também falhou');
          }
          
          const fallbackData = await fallbackResponse.json();
          
          // Converter formato da BrasilAPI para formato ViaCEP
          data = {
            cep: fallbackData.cep,
            logradouro: fallbackData.street || '',
            complemento: fallbackData.complement || '',
            bairro: fallbackData.neighborhood || '',
            localidade: fallbackData.city || '',
            uf: fallbackData.state || '',
            erro: fallbackData.errors ? true : false
          };
          
        } catch (fallbackError) {
          console.error('❌ Todas as APIs de CEP falharam:', fallbackError);
          throw new Error('Não foi possível consultar o CEP. Tente novamente mais tarde.');
        }
      }
      
      // Limpar controller da lista de ativos
      requisicoesAtivas.current.delete(cepLimpo);
      
      if (data.erro) {
        setErro('CEP não encontrado');
        return null;
      }
      
      // Salvar no cache
      salvarNoCache(cepLimpo, data);
      
      console.log(`✅ CEP encontrado:`, data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Erro ao buscar CEP:', error);
      
      // Limpar controller da lista de ativos
      requisicoesAtivas.current.delete(cepLimpo);
      
      if (error.name === 'AbortError') {
        setErro('Tempo esgotado para buscar CEP');
      } else {
        setErro(error.message || 'Erro ao buscar CEP');
      }
      
      return null;
    } finally {
      setBuscando(false);
    }
  }, [buscando, ultimoCEPBuscado]);

  // Função para limpar cache específico
  const limparCacheCEP = useCallback((cep?: string) => {
    if (cep) {
      cepCache.delete(cep.replace(/\D/g, ''));
      console.log(`🧹 Cache do CEP ${cep} limpo`);
    } else {
      cepCache.clear();
      console.log('🧹 Cache de CEPs totalmente limpo');
    }
  }, []);

  return {
    buscarCEP,
    buscando,
    erro,
    ultimoCEPBuscado,
    limparCacheCEP
  };
};