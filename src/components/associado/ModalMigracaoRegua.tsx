// src/components/associado/ModalMigracaoRegua.tsx

import React, { useState, useEffect } from 'react';
import migracaoReguaService, { 
  ReguaFaturamento, 
  MigracaoReguaResponse,
  FaturaPendente 
} from '../../services/migracaoReguaService';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';

interface ModalMigracaoReguaProps {
  isOpen: boolean;
  onClose: () => void;
  associadoId: number;
  associadoNome: string;
  reguaAtualId: number;
  reguaAtualNome: string;
  onSuccess: () => void;
}

type StepType = 'selecionar' | 'verificando' | 'verificar' | 'confirmar' | 'resultado';

const ModalMigracaoRegua: React.FC<ModalMigracaoReguaProps> = ({
  isOpen,
  onClose,
  associadoId,
  associadoNome,
  reguaAtualId,
  reguaAtualNome,
  onSuccess
}) => {
  const { showToast } = useMessage();
  
  // ========== ESTADOS ==========
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [novaReguaId, setNovaReguaId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [dataMigracao, setDataMigracao] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [carregandoReguas, setCarregandoReguas] = useState(false);
  const [verificacao, setVerificacao] = useState<MigracaoReguaResponse | null>(null);
  const [forcarMigracao, setForcarMigracao] = useState(false);
  const [step, setStep] = useState<StepType>('selecionar');
  const [faturasPendentes, setFaturasPendentes] = useState<FaturaPendente[]>([]);

  // ========== NOVOS ESTADOS PARA VALIDAÇÃO DE DATA ==========
  const [dataDisponivel, setDataDisponivel] = useState<boolean>(true);
  const [validandoData, setValidandoData] = useState<boolean>(false);
  const [mensagemData, setMensagemData] = useState<string>('');
  const [dataVerificada, setDataVerificada] = useState<boolean>(false);

  // ========== LOGS PARA DEBUG ==========
  useEffect(() => {
    if (isOpen) {
      console.log('📌 Modal aberto - Associado:', associadoNome);
      console.log('📌 Associado ID:', associadoId);
      console.log('📌 Régua atual ID:', reguaAtualId);
      console.log('📌 Régua atual Nome:', reguaAtualNome);
    }
  }, [isOpen, associadoNome, associadoId, reguaAtualId, reguaAtualNome]);

  // ========== CARREGAR RÉGUAS ==========
  useEffect(() => {
    if (isOpen) {
      carregarReguas();
      setStep('selecionar');
      setNovaReguaId(null);
      setMotivo('');
      setVerificacao(null);
      setForcarMigracao(false);
      setFaturasPendentes([]);
      setDataMigracao(new Date().toISOString().split('T')[0]);
      setDataDisponivel(true);
      setMensagemData('');
      setDataVerificada(false);
    }
  }, [isOpen, associadoId]);

  // ========== VERIFICAR DATA QUANDO RÉGUA OU DATA MUDAR ==========
  useEffect(() => {
    if (novaReguaId && dataMigracao && isOpen) {
      const timer = setTimeout(() => {
        verificarDataDisponivel(dataMigracao);
      }, 600); // Debounce de 600ms
      
      return () => clearTimeout(timer);
    }
  }, [novaReguaId, dataMigracao, associadoId, isOpen]);

  // ========== FUNÇÕES ==========

  const carregarReguas = async () => {
    setCarregandoReguas(true);
    try {
      console.log('📡 Carregando réguas disponíveis para migração...');
      const data = await migracaoReguaService.listarReguasDisponiveis(associadoId);
      console.log('📥 Réguas disponíveis:', data);
      setReguas(data);
      
      if (data.length === 0) {
        showToast('⚠️ Nenhuma régua disponível para migração', 'warning');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas disponíveis', 'error');
    } finally {
      setCarregandoReguas(false);
    }
  };

  // 🔥 FUNÇÃO PARA VERIFICAR SE A DATA JÁ FOI USADA
  const verificarDataDisponivel = async (data: string) => {
    if (!novaReguaId) {
      setDataDisponivel(true);
      setMensagemData('');
      setDataVerificada(false);
      return;
    }

    // Não verificar se a data é a mesma que já foi verificada
    if (dataVerificada && dataDisponivel) {
      return;
    }

    setValidandoData(true);
    setMensagemData('🔄 Verificando disponibilidade da data...');

    try {
      const response = await migracaoReguaService.verificarDataMigracao(associadoId, novaReguaId, data);
      
      if (response.existe) {
        setDataDisponivel(false);
        setDataVerificada(true);
        
        // Sugerir próxima data disponível
        const dataAtual = new Date(data);
        const proximaData = new Date(dataAtual);
        proximaData.setDate(proximaData.getDate() + 1);
        const proximaDataStr = proximaData.toISOString().split('T')[0];
        
        setMensagemData(
          `⚠️ Já existe uma migração para esta data. Tente ${proximaDataStr.replace(/-/g, '/')} ou outra data.`
        );
      } else {
        setDataDisponivel(true);
        setDataVerificada(true);
        setMensagemData('✅ Data disponível para migração');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar data:', error);
      setDataDisponivel(true);
      setMensagemData('');
    } finally {
      setValidandoData(false);
    }
  };

  const handleVerificar = async () => {
    if (!novaReguaId) {
      showToast('Selecione uma régua para migração', 'warning');
      return;
    }

    if (!dataDisponivel) {
      showToast('⚠️ A data selecionada não está disponível. Selecione outra data.', 'warning');
      return;
    }

    setLoading(true);
    setStep('verificando');

    try {
      console.log('🔍 Verificando migração para régua:', novaReguaId);
      const response = await migracaoReguaService.verificarMigracao(associadoId, novaReguaId);
      console.log('📥 Resposta da verificação:', response);
      
      setVerificacao(response);

      if (response.faturasPendentes) {
        setFaturasPendentes(response.faturasPendentesList || []);
        setStep('verificar');
        showToast(`⚠️ Associado possui ${response.totalFaturasPendentes} faturas pendentes`, 'warning');
      } else if (response.status === 'PODE_MIGRAR') {
        setStep('confirmar');
        showToast('✅ Associado pode ser migrado', 'success');
      } else if (response.status === 'MESMA_REGUA') {
        showToast(response.mensagem, 'info');
        setStep('selecionar');
      } else {
        showToast(response.mensagem, 'info');
        setStep('selecionar');
      }
    } catch (error: any) {
      console.error('❌ Erro ao verificar migração:', error);
      showToast(error.response?.data?.mensagem || 'Erro ao verificar migração', 'error');
      setStep('selecionar');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!novaReguaId) return;

    if (!dataDisponivel) {
      showToast('⚠️ A data selecionada não está disponível. Selecione outra data.', 'warning');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Confirmando migração para régua:', novaReguaId);
      console.log('📋 Dados:', { associadoId, novaReguaId, motivo, forcarMigracao, dataMigracao });
      
      const response = await migracaoReguaService.migrarAssociado(
        associadoId,
        novaReguaId,
        motivo,
        forcarMigracao,
        dataMigracao
      );

      console.log('📥 Resposta da migração:', response);
      setVerificacao(response);
      setStep('resultado');

      if (response.status === 'SUCESSO') {
        showToast(`✅ ${response.mensagem}`, 'success');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        showToast(response.mensagem, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao migrar régua:', error);
      
      // 🔥 TRATAR ERRO DE DATA DUPLICADA
      if (error.response?.data?.message?.includes('mesma data')) {
        showToast('⚠️ Já existe uma migração com esta data. Por favor, selecione outra data.', 'warning');
        setDataDisponivel(false);
        setDataVerificada(false);
        setStep('selecionar');
      } else {
        showToast(error.response?.data?.mensagem || 'Erro ao migrar régua', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    setStep('selecionar');
    setVerificacao(null);
    setForcarMigracao(false);
    setFaturasPendentes([]);
    setDataDisponivel(true);
    setMensagemData('');
    setDataVerificada(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [ano, mes, dia] = dateStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dateStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🔄 Migrar Régua de Faturamento</h2>
            <p className="text-sm text-gray-500">
              Associado: <strong>{associadoNome}</strong> (ID: {associadoId})
            </p>
            <p className="text-sm mt-1">
              <span className="text-gray-500">Régua Atual:</span>
              {reguaAtualId && reguaAtualNome ? (
                <span className="ml-2 font-medium text-blue-600">
                  {reguaAtualNome} (ID: {reguaAtualId})
                </span>
              ) : (
                <span className="ml-2 text-gray-400">Nenhuma régua associada</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {carregandoReguas && step === 'selecionar' ? (
            <div className="text-center py-8">
              <Loading />
              <p className="text-gray-500 mt-2">Carregando réguas disponíveis...</p>
            </div>
          ) : (
            <>
              {/* STEP 1: Selecionar Régua */}
              {step === 'selecionar' && (
                <div>
                  {/* Régua Atual */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Régua Atual:</strong> 
                      {reguaAtualId && reguaAtualNome ? (
                        <span className="ml-2 font-medium">
                          {reguaAtualNome} (ID: {reguaAtualId})
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-500">Nenhuma</span>
                      )}
                    </p>
                    {!reguaAtualId && (
                      <p className="text-xs text-blue-600 mt-1">
                        💡 O associado será adicionado à nova régua selecionada
                      </p>
                    )}
                  </div>

                  {/* Nova Régua */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Régua *
                    </label>
                    <select
                      value={novaReguaId || ''}
                      onChange={(e) => {
                        setNovaReguaId(Number(e.target.value));
                        setDataDisponivel(true);
                        setMensagemData('');
                        setDataVerificada(false);
                      }}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="">Selecione uma régua...</option>
                      {reguas.map((regua) => (
                        <option key={regua.id} value={regua.id}>
                          {regua.nome} {regua.ehPadrao ? '⭐' : ''}
                          {regua.id === reguaAtualId && ' (Atual)'}
                        </option>
                      ))}
                    </select>
                    {reguas.length === 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        Nenhuma régua disponível para migração
                      </p>
                    )}
                    {novaReguaId === reguaAtualId && (
                      <p className="text-sm text-yellow-600 mt-1">
                        ⚠️ Você selecionou a mesma régua atual
                      </p>
                    )}
                  </div>

                  {/* 🔥 DATA DA MIGRAÇÃO COM VALIDAÇÃO */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data da Migração *
                    </label>
                    <input
                      type="date"
                      value={dataMigracao}
                      onChange={(e) => {
                        setDataMigracao(e.target.value);
                        setDataDisponivel(true);
                        setMensagemData('');
                        setDataVerificada(false);
                      }}
                      className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                        !dataDisponivel && dataVerificada
                          ? 'border-red-500 focus:ring-red-500' 
                          : dataDisponivel && dataVerificada
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      disabled={loading || validandoData}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    
                    {/* 🔥 INDICADOR DE VALIDAÇÃO DA DATA */}
                    {validandoData && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                        Verificando disponibilidade da data...
                      </p>
                    )}
                    
                    {!validandoData && mensagemData && dataVerificada && (
                      <p className={`text-sm mt-1 flex items-center gap-1 ${
                        dataDisponivel ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span>{dataDisponivel ? '✅' : '❌'}</span>
                        {mensagemData}
                      </p>
                    )}
                    
                    {!dataDisponivel && dataVerificada && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-700">
                          💡 Dica: Tente uma data diferente, como{' '}
                          {(() => {
                            const dataAtual = new Date(dataMigracao);
                            dataAtual.setDate(dataAtual.getDate() + 1);
                            return formatDate(dataAtual.toISOString().split('T')[0]);
                          })()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Motivo */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo (opcional)
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo da migração..."
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  {/* Botão Verificar */}
                  <button
                    onClick={handleVerificar}
                    disabled={
                      !novaReguaId || 
                      loading || 
                      reguas.length === 0 || 
                      novaReguaId === reguaAtualId || 
                      !dataDisponivel ||
                      validandoData
                    }
                    className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 ${
                      !novaReguaId || loading || reguas.length === 0 || novaReguaId === reguaAtualId || !dataDisponivel || validandoData
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : validandoData ? (
                      <>
                        <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Validando...
                      </>
                    ) : (
                      '🔍 Verificar Migração'
                    )}
                  </button>
                  
                  {novaReguaId === reguaAtualId && (
                    <p className="text-sm text-yellow-600 mt-2 text-center">
                      ⚠️ Selecione uma régua diferente da atual
                    </p>
                  )}
                  
                  {!dataDisponivel && dataVerificada && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      ⚠️ Selecione uma data diferente para prosseguir
                    </p>
                  )}
                </div>
              )}

              {/* STEP 2: Verificando */}
              {step === 'verificando' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Verificando condições para migração...</p>
                </div>
              )}

              {/* STEP 3: Verificar - Faturas Pendentes */}
              {step === 'verificar' && verificacao && (
                <div>
                  <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Associado possui faturas pendentes
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {verificacao.totalFaturasPendentes} faturas pendentes encontradas.
                          A migração pode ser forçada, mas as faturas pendentes serão mantidas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {faturasPendentes.length > 0 && (
                    <div className="mb-4 max-h-48 overflow-y-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fatura</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Valor</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Vencimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {faturasPendentes.map((fatura) => (
                            <tr key={fatura.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-xs">{fatura.numeroFatura}</td>
                              <td className="px-3 py-2 text-right font-medium">
                                {formatCurrency(fatura.valorTotal)}
                              </td>
                              <td className="px-3 py-2 text-center text-xs">
                                {formatDate(fatura.dataVencimento)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mb-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="forcarMigracao"
                      checked={forcarMigracao}
                      onChange={(e) => setForcarMigracao(e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label htmlFor="forcarMigracao" className="text-sm text-gray-700">
                      Sim, desejo forçar a migração mesmo com faturas pendentes
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleVoltar}
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      disabled={loading}
                    >
                      ⬅ Voltar
                    </button>
                    <button
                      onClick={handleConfirmar}
                      disabled={!forcarMigracao || loading}
                      className="flex-1 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        '⚠️ Forçar Migração'
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmar Migração */}
              {step === 'confirmar' && verificacao && (
                <div>
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Associado pode ser migrado
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          {verificacao.mensagem}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Régua Atual</span>
                      <p className="font-medium">{verificacao.reguaOrigemNome || 'Nenhuma'}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-500">Nova Régua</span>
                      <p className="font-medium text-blue-700">{verificacao.reguaDestinoNome}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-sm">Data da Migração</span>
                    <p className="text-sm mt-1 font-medium text-blue-600">
                      {formatDate(dataMigracao)} 
                      {dataDisponivel && dataVerificada && (
                        <span className="ml-2 text-xs text-green-600">✅ Disponível</span>
                      )}
                    </p>
                  </div>

                  {motivo && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500 text-sm">Motivo</span>
                      <p className="text-sm mt-1">{motivo}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleVoltar}
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      disabled={loading}
                    >
                      ⬅ Voltar
                    </button>
                    <button
                      onClick={handleConfirmar}
                      disabled={loading || !dataDisponivel}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 ${
                        loading || !dataDisponivel
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : !dataDisponivel ? (
                        '⚠️ Data indisponível'
                      ) : (
                        '✅ Confirmar Migração'
                      )}
                    </button>
                  </div>
                  
                  {!dataDisponivel && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      ⚠️ A data selecionada não está disponível. Volte e escolha outra data.
                    </p>
                  )}
                </div>
              )}

              {/* STEP 5: Resultado */}
              {step === 'resultado' && verificacao && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">
                    {verificacao.status === 'SUCESSO' ? '🎉' : '❌'}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {verificacao.status === 'SUCESSO' ? 'Migração Concluída!' : 'Erro na Migração'}
                  </h3>
                  <p className="text-gray-600">{verificacao.mensagem}</p>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Régua Origem</span>
                      <p className="font-medium">{verificacao.reguaOrigemNome || 'Nenhuma'}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-500">Régua Destino</span>
                      <p className="font-medium text-green-700">{verificacao.reguaDestinoNome}</p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-sm">Data da Migração</span>
                    <p className="text-sm mt-1 font-medium">
                      {formatDate(dataMigracao)}
                    </p>
                  </div>

                  {verificacao.migracaoForcada && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-700">
                        ⚠️ Migração forçada com {verificacao.totalFaturasPendentes} faturas pendentes
                      </p>
                    </div>
                  )}

                  {verificacao.dataMigracao && (
                    <p className="text-sm text-gray-400 mt-4">
                      {new Date(verificacao.dataMigracao).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <button
                    onClick={onClose}
                    className="mt-6 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-8"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalMigracaoRegua;