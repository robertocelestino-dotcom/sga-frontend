// src/services/associadoService.ts - VERSÃO COMPLETA ATUALIZADA
import api from './api';

const endpoints = {
  associados: {
    criar: '/associados',
    atualizar: (id: number) => `/associados/${id}`,
    buscarPorId: (id: number) => `/associados/${id}`,
    listar: '/associados',
    excluir: (id: number) => `/associados/${id}`,
    reativar: (id: number) => `/associados/${id}/reativar`,
  },
  vendedores: {
    listarAtivos: '/vendedores/ativos',
    listar: '/vendedores',
  },
  categorias: {
    listarAtivas: '/categorias/ativas',
    listar: '/categorias',
  },
  planos: {
    listarAtivos: '/planos/ativos',
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
  status: 'A' | 'I' | 'S'; // ADICIONADO 'S' PARA SUSPENSO
  dataCadastro: string;
  dataFiliacao?: string;
  
  // NOVOS CAMPOS DE STATUS
  dataInativacao?: string;
  dataInicioSuspensao?: string;
  dataFimSuspensao?: string;
  motivoInativacao?: string;
  motivoSuspensao?: string;
  
  faturamentoMinimo?: number;
  vendedorId?: number;
  vendedorNome?: string;
  vendedorExternoId?: number;
  vendedorExternoNome?: string;
  planoId?: number;
  planoNome?: string;
  categoriaId?: number;
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
  status: 'A' | 'I' | 'S'; // ADICIONADO 'S' PARA SUSPENSO
  dataCadastro: string;
  dataFiliacao?: string;
  
  // NOVOS CAMPOS DE STATUS
  dataInativacao?: string;
  dataInicioSuspensao?: string;
  dataFimSuspensao?: string;
  motivoInativacao?: string;
  motivoSuspensao?: string;
  
  vendedorId?: number;
  vendedorNome?: string;
  vendedorExternoId?: number;
  vendedorExternoNome?: string;
  planoId?: number;
  planoNome?: string;
  categoriaId?: number;
  categoriaNome?: string;
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
    { value: 'I', label: 'Inativo' },
    { value: 'S', label: 'Suspenso' } // ADICIONADO SUSPENSO
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
      // Validações antes de enviar
      const dadosValidados = validarDadosAssociado(associado);
      const response = await api.post(endpoints.associados.criar, dadosValidados);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar associado:', error);
      throw error;
    }
  },

  atualizar: async (id: number, associado: AssociadoDTO): Promise<AssociadoDTO> => {
    try {
      // Validações antes de enviar
      const dadosValidados = validarDadosAssociado(associado);
      const response = await api.put(endpoints.associados.atualizar(id), dadosValidados);
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
      console.log('🔍 URL FINAL que será chamada:', url);
      
      const response = await api.get(url);
      console.log('✅ Resposta do backend:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao listar associados:', error);
      
      if (error.config) {
        console.error('🔍 URL completa que falhou:', error.config.baseURL + error.config.url);
      }
      
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint não encontrado');
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

  reativarAssociado: async (id: number, motivo?: string): Promise<AssociadoDTO> => {
    try {
      const response = await api.post(endpoints.associados.reativar(id), { motivo });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao reativar associado:', error);
      throw error;
    }
  },

  // ✅ FUNÇÕES PARA OS COMBOBOX:
  listarVendedores: async (): Promise<VendedorResumoDTO[]> => {
    try {
      console.log('🔄 Buscando vendedores da API real...');
      
      // Usa o vendedorService que agora está correto
      const { vendedorService } = await import('./vendedorService');
      const vendedores = await vendedorService.listarAtivos();
      
      // Converte para o tipo esperado
      return vendedores.map(v => ({
        id: v.id,
        nomeRazao: v.nomeRazao,
        cargoFuncao: v.cargoFuncao || 'Vendedor',
        status: v.status
      }));
    } catch (error) {
      console.error('❌ Erro ao buscar vendedores:', error);
      return [];
    }
  },
  
  atualizarEnderecos: async (associadoId: number, enderecos: EnderecoDTO[]): Promise<EnderecoDTO[]> => {
    try {
      console.log('📤 Atualizando endereços para associado ID:', associadoId);
      console.log('🏠 Endereços enviados:', enderecos);
      
      const response = await api.put(`/associados/${associadoId}/enderecos`, enderecos);
      console.log('✅ Endereços atualizados com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar endereços:', error);
      throw error;
    }
  },

  atualizarTelefones: async (associadoId: number, telefones: TelefoneDTO[]): Promise<TelefoneDTO[]> => {
    try {
      console.log('📤 Atualizando telefones para associado ID:', associadoId);
      
      const response = await api.put(`/associados/${associadoId}/telefones`, telefones);
      console.log('✅ Telefones atualizados com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar telefones:', error);
      throw error;
    }
  },

  atualizarEmails: async (associadoId: number, emails: EmailDTO[]): Promise<EmailDTO[]> => {
    try {
      console.log('📤 Atualizando emails para associado ID:', associadoId);
      
      const response = await api.put(`/associados/${associadoId}/emails`, emails);
      console.log('✅ Emails atualizados com sucesso:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar emails:', error);
      throw error;
    }
  },

  // Métodos para buscar separadamente (opcional)
  buscarEnderecos: async (associadoId: number): Promise<EnderecoDTO[]> => {
    try {
      const response = await api.get(`/associados/${associadoId}/enderecos`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar endereços:', error);
      return [];
    }
  },

  buscarTelefones: async (associadoId: number): Promise<TelefoneDTO[]> => {
    try {
      const response = await api.get(`/associados/${associadoId}/telefones`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar telefones:', error);
      return [];
    }
  },

  buscarEmails: async (associadoId: number): Promise<EmailDTO[]> => {
    try {
      const response = await api.get(`/associados/${associadoId}/emails`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar emails:', error);
      return [];
    }
  },

  listarCategorias: async (): Promise<CategoriaResumoDTO[]> => {
    try {
      const response = await api.get(endpoints.categorias.listarAtivas);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  },

  listarPlanos: async (): Promise<PlanoResumoDTO[]> => {
    try {
      const response = await api.get(endpoints.planos.listarAtivos);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      return [];
    }
  },

  listarPlanosParaCombo: async (): Promise<any[]> => {

  try {
    console.log('🔄 Buscando planos para combo...');
    
    // Tenta endpoint específico para combo
    let response;
    try {
      response = await api.get('/planos/ativos');
    } catch (error) {
      console.log('⚠️ Endpoint /ativos não disponível, tentando padrão...');
      response = await api.get('/planos/');
    }
    
    console.log('📋 Resposta da API de planos:', response.data);
    
    let planosData = response.data;
    
    // Se for resposta paginada, extrai o conteúdo
    if (planosData && typeof planosData === 'object' && planosData.content) {
      planosData = planosData.content;
    }
    
    // Garante que é um array
    if (!Array.isArray(planosData)) {
      console.warn('⚠️ Planos não é array, convertendo:', planosData);
      planosData = [];
    }
    
    // Normaliza os dados para garantir estrutura consistente
    const planosNormalizados = planosData.map((plano: any) => ({
      id: plano.id || 0,
      plano: plano.plano || plano.descricao || plano.nome || `Plano ${plano.id}`,
      descricao: plano.descricao || plano.plano || plano.nome || `Plano ${plano.id}`,
      nome: plano.nome || plano.plano || plano.descricao || `Plano ${plano.id}`,
      status: plano.status || 'ATIVO',
      tipo: plano.tipo || 'GERAL',
      valorMensal: plano.valorMensal || plano.valor || plano.faturamentoMinimo || 0,
      faturamentoMinimo: plano.faturamentoMinimo || plano.valorMensal || plano.valor || 0,
      raw: plano
    }));
    
    console.log(`✅ ${planosNormalizados.length} plano(s) normalizado(s)`);
    return planosNormalizados;
  } catch (error) {
    console.error('❌ Erro ao buscar planos para combo:', error);
    return [];
  }

},

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

// Função auxiliar para validar dados antes de enviar
const validarDadosAssociado = (associado: AssociadoDTO): AssociadoDTO => {
  const dadosValidados = { ...associado };
  
  // Se status é Inativo
  if (dadosValidados.status === 'I') {
    // Garantir data de inativação
    if (!dadosValidados.dataInativacao) {
      dadosValidados.dataInativacao = new Date().toISOString().split('T')[0];
    }
    // Limpar campos de suspensão
    dadosValidados.dataInicioSuspensao = undefined;
    dadosValidados.dataFimSuspensao = undefined;
    dadosValidados.motivoSuspensao = undefined;
  }
  
  // Se status é Suspenso
  if (dadosValidados.status === 'S') {
    // Garantir data de início
    if (!dadosValidados.dataInicioSuspensao) {
      dadosValidados.dataInicioSuspensao = new Date().toISOString().split('T')[0];
    }
    // Garantir data de fim (padrão: 30 dias)
    if (!dadosValidados.dataFimSuspensao) {
      const inicio = new Date(dadosValidados.dataInicioSuspensao);
      inicio.setDate(inicio.getDate() + 30);
      dadosValidados.dataFimSuspensao = inicio.toISOString().split('T')[0];
    }
    // Limpar campos de inativação
    dadosValidados.dataInativacao = undefined;
    dadosValidados.motivoInativacao = undefined;
  }
  
  // Se status é Ativo
  if (dadosValidados.status === 'A') {
    // Limpar todos os campos de status
    dadosValidados.dataInativacao = undefined;
    dadosValidados.dataInicioSuspensao = undefined;
    dadosValidados.dataFimSuspensao = undefined;
    dadosValidados.motivoInativacao = undefined;
    dadosValidados.motivoSuspensao = undefined;
  }
  
  return dadosValidados;
};