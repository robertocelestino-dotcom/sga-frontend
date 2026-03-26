import api from './api';

export interface PlanoDTO {
  id?: number;
  nome: string;
  descricao?: string;
  valor: number;
  status: string;
  tipoPlano: string;
  quantidadeMinima: number;
  quantidadeMaxima: number;
  permiteExcedente: boolean;
  faturamentoAntecipado: boolean;
  diaFaturamento: number;
  observacao?: string;
}

export const planoService = {
  async criar(plano: PlanoDTO): Promise<PlanoDTO> {
    const response = await api.post('/planos', plano);
    return response.data;
  },

  async atualizar(id: number, plano: PlanoDTO): Promise<PlanoDTO> {
    const response = await api.put(`/planos/${id}`, plano);
    return response.data;
  },

  async buscarPorId(id: number): Promise<PlanoDTO> {
    const response = await api.get(`/planos/${id}`);
    return response.data;
  },

  async listar(filtros?: any): Promise<any> {
    const response = await api.get('/planos', { params: filtros });
    return response.data;
  },

  async excluir(id: number): Promise<void> {
    await api.delete(`/planos/${id}`);
  }
};

export const planoOpcoes = {
  status: [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' }
  ],
  tipoPlano: [
    { value: 'MENSAL', label: 'Mensal' },
    { value: 'BIMESTRAL', label: 'Bimestral' },
    { value: 'TRIMESTRAL', label: 'Trimestral' },
    { value: 'SEMESTRAL', label: 'Semestral' },
    { value: 'ANUAL', label: 'Anual' }
  ]
};