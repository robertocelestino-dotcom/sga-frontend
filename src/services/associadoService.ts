// src/services/associadoService.ts
//import { API_ENDPOINTS } from '../config/endpoints';
//import { defaultApi as api } from './api';
import api from './api';

const endpoints = {
  associados: {
    criar: '/api/associados',
    atualizar: (id: number) => `/api/associados/${id}`,
    buscarPorId: (id: number) => `/api/associados/${id}`,
    listar: '/api/associados',
    excluir: (id: number) => `/api/associados/${id}`,
  },
  vendedores: {
    listarAtivos: '/vendedores/ativos', // Se não existir, mude para '/api/vendedores'
    listar: '/vendedores',
  },
  categorias: {
    listarAtivas: '/categorias/ativas', // Se não existir, mude para '/api/categorias'
    listar: '/categorias',
  },
  planos: {
    listarAtivos: '/planos/ativos', // Se não existir, mude para '/api/planos'
    listar: '/planos',
  },
};

export interface AssociadoFiltros {
  page?: number;
  size?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
  codigoSpc?: string;
  cnpjCpf?: string;
  nomeRazao?: string;
  tipoPessoa?: string;
  status?: string;
}

export interface AssociadoResumoDTO {
  id: number;
  codigoSpc?: string;
  codigoRm?: string;
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  tipoPessoa: 'F' | 'J';
  status: 'A' | 'I';
  dataCadastro: string;
  faturamentoMinimo?: number;
  vendedorNome?: string;
  planoNome?: string;
  categoriaNome?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface AssociadoDTO {
  id?: number;
  codigoSpc?: string;
  codigoRm?: string;
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  tipoPessoa: 'F' | 'J';
  status: 'A' | 'I';
  dataCadastro: string;
  vendedorId?: number;
  planoId?: number;
  categoriaId?: number;
  faturamentoMinimo?: number;
  enderecos?: EnderecoDTO[];
  emails?: EmailDTO[];
  telefones?: TelefoneDTO[];
  definicoesNotificacao?: any[];
  definicoesFaturamento?: any[];
}

export interface EnderecoDTO {
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

export interface EmailDTO {
  id?: number;
  email: string;
  tipoEmail: string;
  ativo: boolean;
}

export interface TelefoneDTO {
  id?: number;
  ddd: string;
  numero: string;
  tipoTelefone: string;
  whatsapp: boolean;
  ativo: boolean;
}

export interface VendedorResumoDTO {
  id: number;
  nomeRazao: string;
  cargoFuncao?: string;
  status?: string;
}

export interface CategoriaResumoDTO {
  id: number;
  descricao: string;
  tipo?: string;
  status?: string;
}

export interface PlanoResumoDTO {
  id: number;
  nome: string;
  valor?: number;
  status?: string;
}

export interface OpcaoSelect {
  value: string;
  label: string;
}

export const associadoOpcoes = {
  tipoPessoa: [
    { value: 'F', label: 'Pessoa Física' },
    { value: 'J', label: 'Pessoa Jurídica' }
  ] as OpcaoSelect[],
  
  status: [
    { value: 'A', label: 'Ativo' },
    { value: 'I', label: 'Inativo' }
  ] as OpcaoSelect[],
  
  tipoEndereco: [
    { value: 'COMERCIAL', label: 'Comercial' },
    { value: 'RESIDENCIAL', label: 'Residencial' },
    { value: 'COBRANCA', label: 'Cobrança' },
    { value: 'ENTREGA', label: 'Entrega' }
  ] as OpcaoSelect[],
  
  tipoTelefone: [
    { value: 'CELULAR', label: 'Celular' },
    { value: 'COMERCIAL', label: 'Comercial' },
    { value: 'RESIDENCIAL', label: 'Residencial' },
    { value: 'FAX', label: 'Fax' }
  ] as OpcaoSelect[],
  
  tipoEmail: [
    { value: 'COMERCIAL', label: 'Comercial' },
    { value: 'PESSOAL', label: 'Pessoal' },
    { value: 'COBRANCA', label: 'Cobrança' }
  ] as OpcaoSelect[],
  
  estados: [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
  ] as OpcaoSelect[]
};

export const associadoService = {
  // CRUD de Associados
  criar: async (associado: AssociadoDTO): Promise<AssociadoDTO> => {
    try {
      const response = await api.post(endpoints.associados.criar, associado);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar associado:', error);
      throw error;
    }
  },

  atualizar: async (id: number, associado: AssociadoDTO): Promise<AssociadoDTO> => {
    try {
      const response = await api.put(endpoints.associados.atualizar(id), associado);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar associado:', error);
      throw error;
    }
  },

  buscarPorId: async (id: number): Promise<AssociadoDTO> => {
    try {
      const response = await api.get(endpoints.associados.buscarPorId(id));
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar associado:', error);
      throw error;
    }
  },

  listar: async (params?: AssociadoFiltros): Promise<PageResponse<AssociadoResumoDTO>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.direction) queryParams.append('direction', params.direction);
      if (params?.codigoSpc) queryParams.append('codigoSpc', params.codigoSpc);
      if (params?.cnpjCpf) queryParams.append('cnpjCpf', params.cnpjCpf);
      if (params?.nomeRazao) queryParams.append('nomeRazao', params.nomeRazao);
      if (params?.tipoPessoa) queryParams.append('tipoPessoa', params.tipoPessoa);
      if (params?.status) queryParams.append('status', params.status);
  
      const url = `${endpoints.associados.listar}?${queryParams.toString()}`;
      console.log('📡 URL da requisição:', url); // Para debug
      
      const response = await api.get(url);
      console.log('✅ Resposta da API:', response.data); // Para debug
      
      // Se a resposta não tiver estrutura de paginação, adapte
      if (response.data && !response.data.content && Array.isArray(response.data)) {
        return {
          content: response.data,
          totalElements: response.data.length,
          totalPages: 1,
          size: params?.size || 10,
          number: params?.page || 0,
          first: true,
          last: true
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao listar associados:', error);
      
      // Se for erro 404 ou similar, retorne estrutura vazia
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint não encontrado, retornando vazio');
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: params?.size || 10,
          number: params?.page || 0,
          first: true,
          last: true
        };
      }
      
      throw error;
    }
  },

  excluir: async (id: number): Promise<void> => {
    try {
      await api.delete(endpoints.associados.excluir(id));
    } catch (error: any) {
      console.error('Erro ao excluir associado:', error);
      throw error;
    }
  },

  // ✅ NOVAS FUNÇÕES PARA OS COMBOBOX:

  // Listar vendedores ativos
  listarVendedores: async (): Promise<VendedorResumoDTO[]> => {
    try {
      const response = await api.get(endpoints.vendedores.listarAtivos);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      return [];
    }
  },

  // Listar categorias ativas
  listarCategorias: async (): Promise<CategoriaResumoDTO[]> => {
    try {
      const response = await api.get(endpoints.categorias.listarAtivas);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  },

  // Listar planos ativos
  listarPlanos: async (): Promise<PlanoResumoDTO[]> => {
    try {
      // Se não tiver endpoint de planos ainda, retorna array vazio
      if (!endpoints.planos?.listarAtivos) {
        return [];
      }
      const response = await api.get(endpoints.planos.listarAtivos);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }
  },

  // Outras funções auxiliares
  formatarCnpjCpf: (cnpjCpf: string): string => {
    if (!cnpjCpf) return '';
    
    const apenasNumeros = cnpjCpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpjCpf;
  },

  formatarCep: (cep: string): string => {
    if (!cep) return '';
    const apenasNumeros = cep.replace(/\D/g, '');
    if (apenasNumeros.length === 8) {
      return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  },

  formatarTelefone: (ddd: string, numero: string): string => {
    if (!ddd || !numero) return '';
    const apenasNumeros = numero.replace(/\D/g, '');
    
    if (apenasNumeros.length === 8) {
      return `(${ddd}) ${apenasNumeros.replace(/(\d{4})(\d{4})/, '$1-$2')}`;
    } else if (apenasNumeros.length === 9) {
      return `(${ddd}) ${apenasNumeros.replace(/(\d{5})(\d{4})/, '$1-$2')}`;
    }
    
    return `(${ddd}) ${numero}`;
  }
};