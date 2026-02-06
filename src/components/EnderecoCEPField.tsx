// src/components/EnderecoCEPField.tsx - VERSÃO COMPLETA CORRIGIDA
import React from 'react';

interface EnderecoCEPFieldProps {
  tipoEndereco: 'COMERCIAL' | 'COBRANCA' | 'ENTREGA' | 'RESIDENCIAL';
  valor?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  onChange: (field: string, value: string) => void;
  associadoOpcoes?: {
    tipoEndereco: Array<{ value: string; label: string }>;
    estados: Array<{ value: string; label: string }>;
  };
  estaBuscandoCEP?: boolean;
  erroCEP?: string;
  onBuscarCEP: () => void;
}

const EnderecoCEPField: React.FC<EnderecoCEPFieldProps> = ({
  tipoEndereco,
  valor,
  onChange,
  associadoOpcoes,
  estaBuscandoCEP = false,
  erroCEP = '',
  onBuscarCEP
}) => {
  // 🔥 VALORES PADRÃO PARA OPÇÕES
  const opcoesSeguras = associadoOpcoes || {
    tipoEndereco: [
      { value: 'COMERCIAL', label: 'Comercial' },
      { value: 'RESIDENCIAL', label: 'Residencial' },
      { value: 'COBRANCA', label: 'Cobrança' },
      { value: 'ENTREGA', label: 'Entrega' }
    ],
    estados: [
      { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
      { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
      { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
      { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
      { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
      { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
      { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
      { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
      { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
      { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
      { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
      { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
      { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
      { value: 'TO', label: 'Tocantins' }
    ]
  };

  // 🔥 VALORES PADRÃO PARA VALOR
  const valorSeguro = valor || {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  };

  const cepCompleto = valorSeguro.cep.replace(/\D/g, '').length === 8;
  const cepParcial = valorSeguro.cep.replace(/\D/g, '').length > 0 && !cepCompleto;
  
  const getIndicadorCor = () => {
    if (estaBuscandoCEP) return 'border-yellow-500 bg-yellow-50';
    if (erroCEP) return 'border-red-500 bg-red-50';
    if (cepCompleto && valorSeguro.logradouro) return 'border-green-500 bg-green-50';
    if (cepCompleto) return 'border-blue-500 bg-blue-50';
    if (cepParcial) return 'border-gray-300 bg-gray-50';
    return 'border-gray-300 bg-white';
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cepDigitado = e.target.value;
    const apenasNumeros = cepDigitado.replace(/\D/g, '');
    let cepFormatado = apenasNumeros;
    
    if (apenasNumeros.length > 5) {
      cepFormatado = apenasNumeros.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    
    if (cepFormatado.length > 9) {
      cepFormatado = cepFormatado.substring(0, 9);
    }
    
    onChange('cep', cepFormatado);
  };

  const getValorCampo = (campo: string): string => {
    const campoMap: Record<string, string> = {
      'logradouro': valorSeguro.logradouro || '',
      'bairro': valorSeguro.bairro || '',
      'cidade': valorSeguro.cidade || '',
      'estado': valorSeguro.estado || '',
      'numero': valorSeguro.numero || '',
      'complemento': valorSeguro.complemento || ''
    };
    return campoMap[campo] || '';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* CAMPO CEP COM INDICADOR VISUAL */}
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            CEP *
          </label>
          
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 border rounded-md text-xs font-medium ${getIndicadorCor()}`}>
              {estaBuscandoCEP ? (
                <span className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                  Buscando...
                </span>
              ) : erroCEP ? (
                <span className="text-red-700">❌ Inválido</span>
              ) : cepCompleto && valorSeguro.logradouro ? (
                <span className="text-green-700">✅ Completo</span>
              ) : cepCompleto ? (
                <span className="text-blue-700">✓ Válido</span>
              ) : cepParcial ? (
                <span className="text-gray-600">⏳ Digitando...</span>
              ) : (
                <span className="text-gray-500">⏳ Aguardando</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={valorSeguro.cep}
              onChange={handleCEPChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                erroCEP ? 'border-red-300 bg-red-50' : 
                estaBuscandoCEP ? 'border-yellow-300 bg-yellow-50' :
                cepCompleto ? 'border-green-300 bg-green-50' : 'border-gray-300'
              }`}
              placeholder="00000-000"
              maxLength={9}
              disabled={estaBuscandoCEP}
            />
            
            {estaBuscandoCEP && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            )}
            
            {cepCompleto && !estaBuscandoCEP && !erroCEP && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={onBuscarCEP}
            disabled={estaBuscandoCEP || !valorSeguro.cep || valorSeguro.cep.replace(/\D/g, '').length !== 8}
            className={`px-5 py-3 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap transition-all ${
              estaBuscandoCEP 
                ? 'bg-yellow-500 text-white cursor-wait' 
                : valorSeguro.cep && valorSeguro.cep.replace(/\D/g, '').length === 8
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {estaBuscandoCEP ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Buscando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar CEP
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 space-y-1">
          {erroCEP && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <svg className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-700">{erroCEP}</p>
            </div>
          )}
          
          {cepParcial && !erroCEP && !estaBuscandoCEP && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m0 0h-1m1 0v4m0 0l2.5 2.5M18 10a8 8 0 11-16 0 8 8 0 0116 0z" />
              </svg>
              <span>Digite os 8 dígitos para buscar automaticamente</span>
            </div>
          )}
          
          {cepCompleto && !erroCEP && !estaBuscandoCEP && !valorSeguro.logradouro && (
            <div className="flex items-center gap-2 text-xs text-yellow-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>CEP válido, mas não encontrado. Preencha manualmente.</span>
            </div>
          )}
          
          {valorSeguro.logradouro && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Endereço encontrado e preenchido automaticamente</span>
            </div>
          )}
        </div>
      </div>
      
      {['logradouro', 'bairro', 'cidade', 'estado'].map((campo) => {
        const valorCampo = getValorCampo(campo);
        const preenchido = !!valorCampo;
        const label = campo === 'logradouro' ? 'Logradouro *' :
                     campo === 'bairro' ? 'Bairro *' :
                     campo === 'cidade' ? 'Cidade *' : 'Estado *';
        
        return (
          <div key={campo} className={campo === 'logradouro' || campo === 'estado' ? 'md:col-span-2' : ''}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {label}
              </label>
              
              {preenchido && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  ✓ Preenchido
                </span>
              )}
            </div>
            
            {campo === 'estado' ? (
              <select
                value={valorSeguro.estado}
                onChange={(e) => onChange('estado', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  preenchido ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Selecione o estado...</option>
                {opcoesSeguras.estados.map(estado => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={valorCampo}
                onChange={(e) => onChange(campo, e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  preenchido ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
                placeholder={
                  campo === 'logradouro' ? 'Rua, Avenida, etc.' :
                  campo === 'bairro' ? 'Centro' :
                  'São Paulo'
                }
                required
              />
            )}
          </div>
        );
      })}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número *
        </label>
        <input
          type="text"
          value={valorSeguro.numero}
          onChange={(e) => onChange('numero', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="123"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Complemento
        </label>
        <input
          type="text"
          value={valorSeguro.complemento || ''}
          onChange={(e) => onChange('complemento', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Apto, Sala, etc."
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Endereço
        </label>
        <select
          value={tipoEndereco}
          onChange={(e) => onChange('tipoEndereco', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {opcoesSeguras.tipoEndereco.map(tipo => (
            <option key={tipo.value} value={tipo.value}>
              {tipo.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EnderecoCEPField;