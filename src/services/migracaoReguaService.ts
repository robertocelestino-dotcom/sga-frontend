// src/services/migracaoReguaService.ts

import api from './api';

// ============================================================
// INTERFACES
// ============================================================

export interface ReguaFaturamento {
  id: number;
  nome: string;
  descricao: string;
  diaEmissao: number;
  diaVencimento: number;
  periodo: string;
  sequencia: number;
  tipoArquivo: string;
  ordemImportacao: number;
  ehPadrao: boolean;
  ativo: boolean;
  cor: string;
  icone: string;
  permiteMigracao: boolean;
  reguaDestinoMigracaoId: number;
  tipoProcessamento: string;
}

export interface FaturaPendente {
  id: number;
  numeroFatura: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  mesReferencia: number;
  anoReferencia: number;
}

export interface MigracaoReguaResponse {
  associadoId: number;
  associadoNome: string;
  reguaOrigemId: number;
  reguaOrigemNome: string;
  reguaDestinoId: number;
  reguaDestinoNome: string;
  dataMigracao: string;
  dataInicio: string;
  status: string;
  mensagem: string;
  historicoId: number;
  faturasPendentes: boolean;
  totalFaturasPendentes: number;
  migracaoForcada: boolean;
  faturasPendentesList: FaturaPendente[];
}

// 🔥 DTO PARA HISTÓRICO DE MIGRAÇÃO
export interface HistoricoMigracaoDTO {
  id: number;
  associadoId: number;
  associadoNome: string;
  reguaOrigemId: number;
  reguaOrigemNome: string;
  reguaDestinoId: number;
  reguaDestinoNome: string;
  dataMigracao: string;
  usuario: string;
  motivo: string;
  status: string;
  observacao: string;
  faturasPendentes: number;
  migracaoForcada: boolean;
}

export interface VerificacaoDataResponse {
  existe: boolean;
  data: string;
  associadoId: number;
  reguaId: number;
  mensagem: string;
}

// ============================================================
// SERVICE
// ============================================================

class MigracaoReguaService {

  /**
   * 🔥 VERIFICA SE JÁ EXISTE UMA MIGRAÇÃO COM A DATA INFORMADA
   */
  async verificarDataMigracao(associadoId: number, reguaId: number, data: string): Promise<VerificacaoDataResponse> {
    const response = await api.get(`/regua-faturamento/associados/${associadoId}/verificar-data-migracao`, {
      params: { reguaId, data }
    });
    return response.data;
  }

  /**
   * 🔥 LISTA TODAS AS RÉGUAS ATIVAS
   */
  async listarTodasReguas(): Promise<ReguaFaturamento[]> {
    try {
      const response = await api.get('/regua-faturamento/ativas');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar réguas:', error);
      try {
        const response = await api.get('/regua-faturamento');
        return response.data.content || response.data || [];
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Verifica se o associado pode ser migrado
   */
  async verificarMigracao(associadoId: number, reguaId: number): Promise<MigracaoReguaResponse> {
    const response = await api.get(`/regua-faturamento/associados/${associadoId}/verificar-migracao/${reguaId}`);
    return response.data;
  }

  /**
   * Executa a migração do associado
   */
  async migrarAssociado(
    associadoId: number,
    novaReguaId: number,
    motivo: string,
    forcarMigracao: boolean = false,
    dataMigracao?: string
  ): Promise<MigracaoReguaResponse> {
    const payload = {
      associadoId,
      novaReguaId,
      motivo: motivo || null,
      forcarMigracao,
      dataMigracao: dataMigracao || new Date().toISOString().split('T')[0]
    };

    const response = await api.post(`/regua-faturamento/associados/${associadoId}/migrar`, payload);
    return response.data;
  }

  /**
   * 🔥 BUSCA HISTÓRICO DE MIGRAÇÕES DE UM ASSOCIADO (RETORNA DTO)
   */
  async buscarHistorico(associadoId: number): Promise<HistoricoMigracaoDTO[]> {
    const response = await api.get(`/regua-faturamento/associados/${associadoId}/historico-migracao`);
    return response.data;
  }

  /**
   * Lista réguas disponíveis para migração
   */
  async listarReguasDisponiveis(associadoId: number): Promise<ReguaFaturamento[]> {
    const response = await api.get(`/regua-faturamento/associados/${associadoId}/reguas-disponiveis`);
    return response.data;
  }

  /**
   * Obtém a régua ativa do associado
   */
  async buscarReguaAtivaDoAssociado(associadoId: number): Promise<any> {
    try {
      console.log(`🔍 Buscando régua ativa do associado ${associadoId}`);
      const response = await api.get(`/regua-faturamento/associado/ativo/${associadoId}`);
      console.log('📥 Resposta do backend:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar régua do associado ${associadoId}:`, error);
      return null;
    }
  }

  /**
   * Busca a régua do associado (mais recente, ativa ou inativa)
   */
  async buscarReguaAssociado(associadoId: number): Promise<any> {
    try {
      console.log(`🔍 Buscando régua do associado ${associadoId} (qualquer status)`);
      const response = await api.get(`/regua-faturamento/associado/${associadoId}/regua`);
      console.log('📥 Resposta do backend:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Erro ao buscar régua do associado ${associadoId}:`, error);
      return null;
    }
  }
}

export default new MigracaoReguaService();