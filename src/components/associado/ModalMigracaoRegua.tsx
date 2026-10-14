// src/components/associado/ModalMigracaoRegua.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import migracaoReguaService, {
  ReguaFaturamento,
  MigracaoReguaResponse,
  FaturaPendente,
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
  onSuccess,
}) => {
  const { showToast } = useMessage();

  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [novaReguaId, setNovaReguaId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [dataMigracao, setDataMigracao] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [carregandoReguas, setCarregandoReguas] = useState(false);
  const [verificacao, setVerificacao] = useState<MigracaoReguaResponse | null>(null);
  const [forcarMigracao, setForcarMigracao] = useState(false);
  const [step, setStep] = useState<StepType>('selecionar');
  const [faturasPendentes, setFaturasPendentes] = useState<FaturaPendente[]>([]);

  const [dataDisponivel, setDataDisponivel] = useState<boolean>(true);
  const [validandoData, setValidandoData] = useState<boolean>(false);
  const [mensagemData, setMensagemData] = useState<string>('');
  const [dataVerificada, setDataVerificada] = useState<boolean>(false);

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

  useEffect(() => {
    if (novaReguaId && dataMigracao && isOpen) {
      const timer = setTimeout(() => verificarDataDisponivel(dataMigracao), 600);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novaReguaId, dataMigracao, associadoId, isOpen]);

  const carregarReguas = async () => {
    setCarregandoReguas(true);
    try {
      const data = await migracaoReguaService.listarReguasDisponiveis(associadoId);
      setReguas(data);
      if (data.length === 0) showToast('⚠️ Nenhuma régua disponível para migração', 'warning');
    } catch (error) {
      console.error('❌ Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas disponíveis', 'error');
    } finally {
      setCarregandoReguas(false);
    }
  };

  const verificarDataDisponivel = async (data: string) => {
    if (!novaReguaId) {
      setDataDisponivel(true);
      setMensagemData('');
      setDataVerificada(false);
      return;
    }
    if (dataVerificada && dataDisponivel) return;

    setValidandoData(true);
    setMensagemData('🔄 Verificando disponibilidade da data...');

    try {
      const response = await migracaoReguaService.verificarDataMigracao(associadoId, novaReguaId, data);
      if (response.existe) {
        setDataDisponivel(false);
        setDataVerificada(true);

        const proximaData = new Date(data);
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
    if (!novaReguaId) { showToast('Selecione uma régua para migração', 'warning'); return; }
    if (!dataDisponivel) { showToast('⚠️ A data selecionada não está disponível.', 'warning'); return; }

    setLoading(true);
    setStep('verificando');

    try {
      const response = await migracaoReguaService.verificarMigracao(associadoId, novaReguaId);
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
    if (!dataDisponivel) { showToast('⚠️ A data selecionada não está disponível.', 'warning'); return; }

    setLoading(true);
    try {
      const response = await migracaoReguaService.migrarAssociado(
        associadoId,
        novaReguaId,
        motivo,
        forcarMigracao,
        dataMigracao
      );

      setVerificacao(response);
      setStep('resultado');

      if (response.status === 'SUCESSO') {
        showToast(`✅ ${response.mensagem}`, 'success');
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        showToast(response.mensagem, 'error');
      }
    } catch (error: any) {
      console.error('❌ Erro ao migrar régua:', error);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const [ano, mes, dia] = dateStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch { return dateStr; }
  };

  if (!isOpen) return null;

  const inputCls = (hasError: boolean) =>
    `w-full p-3 border rounded-lg bg-white transition-colors
     focus:outline-none focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600
     ${hasError ? 'border-cdl-danger-500' : 'border-gray-300'}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-cdl-navy-700 flex items-center gap-2">
                <span>🔄</span> Migrar Régua de Faturamento
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Associado: <strong className="text-cdl-navy-700">{associadoNome}</strong>{' '}
                <span className="text-gray-400">(ID: {associadoId})</span>
              </p>
              <p className="text-sm mt-0.5">
                <span className="text-gray-500">Régua Atual:</span>
                {reguaAtualId && reguaAtualNome ? (
                  <span className="ml-2 font-semibold text-cdl-navy-700">
                    {reguaAtualNome} <span className="text-gray-400 font-normal">(ID: {reguaAtualId})</span>
                  </span>
                ) : (
                  <span className="ml-2 text-gray-400 italic">Nenhuma régua associada</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700
                         transition-colors shrink-0 disabled:opacity-40"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {carregandoReguas && step === 'selecionar' ? (
            <div className="text-center py-8">
              <Loading />
            </div>
          ) : (
            <>
              {/* STEP 1: Selecionar */}
              {step === 'selecionar' && (
                <div>
                  <div className="mb-4 p-4 bg-cdl-navy-50 rounded-lg border border-cdl-navy-100">
                    <p className="text-sm text-cdl-navy-700">
                      <strong>Régua Atual:</strong>{' '}
                      {reguaAtualId && reguaAtualNome ? (
                        <span className="ml-2 font-medium">{reguaAtualNome} (ID: {reguaAtualId})</span>
                      ) : (
                        <span className="ml-2 text-gray-500 italic">Nenhuma</span>
                      )}
                    </p>
                    {!reguaAtualId && (
                      <p className="text-xs text-cdl-navy-600 mt-1">
                        💡 O associado será adicionado à nova régua selecionada
                      </p>
                    )}
                  </div>

                  {/* Nova Régua */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
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
                      className={inputCls(false)}
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
                      <p className="text-sm text-cdl-yellow-700 mt-1 font-medium">
                        ⚠️ Você selecionou a mesma régua atual
                      </p>
                    )}
                  </div>

                  {/* Data com validação */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
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
                      className={`w-full p-3 border rounded-lg bg-white transition-colors focus:outline-none focus:ring-2 ${
                        !dataDisponivel && dataVerificada
                          ? 'border-cdl-danger-500 focus:ring-cdl-danger-500'
                          : dataDisponivel && dataVerificada
                            ? 'border-cdl-green-500 focus:ring-cdl-green-500'
                            : 'border-gray-300 focus:ring-cdl-navy-600 focus:border-cdl-navy-600'
                      }`}
                      disabled={loading || validandoData}
                      min={new Date().toISOString().split('T')[0]}
                    />

                    {validandoData && (
                      <p className="text-sm text-cdl-navy-600 mt-1 flex items-center gap-2 font-medium">
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-cdl-navy-100 border-t-cdl-navy-700 animate-spin" />
                        Verificando disponibilidade da data...
                      </p>
                    )}

                    {!validandoData && mensagemData && dataVerificada && (
                      <p className={`text-sm mt-1 flex items-center gap-1 font-medium ${
                        dataDisponivel ? 'text-cdl-green-700' : 'text-cdl-danger-500'
                      }`}>
                        {mensagemData}
                      </p>
                    )}

                    {!dataDisponivel && dataVerificada && (
                      <div className="mt-2 p-2.5 bg-cdl-yellow-50 rounded-lg border border-cdl-yellow-200">
                        <p className="text-xs text-cdl-yellow-700 font-medium">
                          💡 Dica: Tente uma data diferente, como{' '}
                          {(() => {
                            const d = new Date(dataMigracao);
                            d.setDate(d.getDate() + 1);
                            return formatDate(d.toISOString().split('T')[0]);
                          })()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Motivo */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                      Motivo <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Descreva o motivo da migração..."
                      className={`${inputCls(false)} resize-none`}
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  {/* Botão Verificar */}
                  <button
                    type="button"
                    onClick={handleVerificar}
                    disabled={
                      !novaReguaId ||
                      loading ||
                      reguas.length === 0 ||
                      novaReguaId === reguaAtualId ||
                      !dataDisponivel ||
                      validandoData
                    }
                    className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 font-medium
                                transition-all active:scale-[.98] ${
                      !novaReguaId || loading || reguas.length === 0 || novaReguaId === reguaAtualId || !dataDisponivel || validandoData
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
                    }`}
                  >
                    {loading ? (
                      <span className="inline-block w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : validandoData ? (
                      <>
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Validando...
                      </>
                    ) : '🔍 Verificar Migração'}
                  </button>

                  {novaReguaId === reguaAtualId && (
                    <p className="text-sm text-cdl-yellow-700 mt-2 text-center font-medium">
                      ⚠️ Selecione uma régua diferente da atual
                    </p>
                  )}

                  {!dataDisponivel && dataVerificada && (
                    <p className="text-sm text-cdl-danger-500 mt-2 text-center font-medium">
                      ⚠️ Selecione uma data diferente para prosseguir
                    </p>
                  )}
                </div>
              )}

              {/* STEP 2: Verificando */}
              {step === 'verificando' && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                  <p className="text-cdl-navy-700 mt-4 font-medium">Verificando condições para migração...</p>
                </div>
              )}

              {/* STEP 3: Verificar - Faturas Pendentes */}
              {step === 'verificar' && verificacao && (
                <div>
                  <div className="mb-4 p-4 bg-cdl-yellow-50 rounded-lg border border-cdl-yellow-200 flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-cdl-yellow-700">
                        Associado possui faturas pendentes
                      </p>
                      <p className="text-sm text-cdl-yellow-600 mt-1">
                        {verificacao.totalFaturasPendentes} faturas pendentes encontradas.
                        A migração pode ser forçada, mas as faturas pendentes serão mantidas.
                      </p>
                    </div>
                  </div>

                  {faturasPendentes.length > 0 && (
                    <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-cdl-navy-50 sticky top-0">
                          <tr>
                            {['Fatura','Valor','Vencimento'].map((h, i) => (
                              <th
                                key={h}
                                className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                                  i === 1 ? 'text-right' : i === 2 ? 'text-center' : 'text-left'
                                }`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {faturasPendentes.map((fatura) => (
                            <tr key={fatura.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                              <td className="px-3 py-2 font-mono text-xs text-cdl-navy-700">{fatura.numeroFatura}</td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">
                                {formatCurrency(fatura.valorTotal)}
                              </td>
                              <td className="px-3 py-2 text-center text-xs text-gray-700">
                                {formatDate(fatura.dataVencimento)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mb-4 p-3 bg-cdl-yellow-50 border border-cdl-yellow-200 rounded-lg flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="forcarMigracao"
                      checked={forcarMigracao}
                      onChange={(e) => setForcarMigracao(e.target.checked)}
                      className="w-4 h-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <label htmlFor="forcarMigracao" className="text-sm text-cdl-yellow-700 font-medium cursor-pointer">
                      Sim, desejo forçar a migração mesmo com faturas pendentes
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleVoltar}
                      disabled={loading}
                      className="flex-1 p-3 border border-gray-300 text-cdl-navy-700 rounded-lg
                                 hover:bg-cdl-neutral-50 disabled:opacity-50 font-medium
                                 transition-colors"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmar}
                      disabled={!forcarMigracao || loading}
                      className="flex-1 p-3 bg-cdl-yellow-gradient text-cdl-navy-700 rounded-lg
                                 hover:brightness-105 disabled:bg-gray-400 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-2 font-medium
                                 transition-all active:scale-[.98]"
                    >
                      {loading ? (
                        <span className="inline-block w-5 h-5 rounded-full border-2 border-cdl-navy-700 border-t-transparent animate-spin" />
                      ) : '⚠️ Forçar Migração'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmar */}
              {step === 'confirmar' && verificacao && (
                <div>
                  <div className="mb-4 p-4 bg-cdl-green-50 rounded-lg border border-cdl-green-100 flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-cdl-green-700">Associado pode ser migrado</p>
                      <p className="text-sm text-cdl-green-600 mt-1">{verificacao.mensagem}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="p-3 bg-cdl-neutral-50 rounded-lg border border-cdl-neutral-100">
                      <span className="text-xs text-cdl-navy-600 font-medium">Régua Atual</span>
                      <p className="font-semibold text-cdl-navy-700 mt-0.5">
                        {verificacao.reguaOrigemNome || 'Nenhuma'}
                      </p>
                    </div>
                    <div className="p-3 bg-cdl-navy-50 rounded-lg border border-cdl-navy-100">
                      <span className="text-xs text-cdl-navy-600 font-medium">Nova Régua</span>
                      <p className="font-semibold text-cdl-navy-700 mt-0.5">{verificacao.reguaDestinoNome}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                    <span className="text-xs text-cdl-navy-600 font-medium">Data da Migração</span>
                    <p className="text-sm mt-1 font-semibold text-cdl-navy-700">
                      {formatDate(dataMigracao)}
                      {dataDisponivel && dataVerificada && (
                        <span className="ml-2 text-xs text-cdl-green-700">✅ Disponível</span>
                      )}
                    </p>
                  </div>

                  {motivo && (
                    <div className="mb-4 p-3 bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg">
                      <span className="text-xs text-cdl-navy-600 font-medium">Motivo</span>
                      <p className="text-sm mt-1 text-gray-700">{motivo}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleVoltar}
                      disabled={loading}
                      className="flex-1 p-3 border border-gray-300 text-cdl-navy-700 rounded-lg
                                 hover:bg-cdl-neutral-50 disabled:opacity-50 font-medium
                                 transition-colors"
                    >
                      ← Voltar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmar}
                      disabled={loading || !dataDisponivel}
                      className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 font-medium
                                  transition-all active:scale-[.98] ${
                        loading || !dataDisponivel
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-cdl-green-500 text-white hover:bg-cdl-green-600'
                      }`}
                    >
                      {loading ? (
                        <span className="inline-block w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      ) : !dataDisponivel ? (
                        '⚠️ Data indisponível'
                      ) : '✅ Confirmar Migração'}
                    </button>
                  </div>

                  {!dataDisponivel && (
                    <p className="text-sm text-cdl-danger-500 mt-2 text-center font-medium">
                      ⚠️ A data selecionada não está disponível. Volte e escolha outra data.
                    </p>
                  )}
                </div>
              )}

              {/* STEP 5: Resultado */}
              {step === 'resultado' && verificacao && (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">
                    {verificacao.status === 'SUCESSO' ? '🎉' : '❌'}
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${
                    verificacao.status === 'SUCESSO' ? 'text-cdl-green-700' : 'text-cdl-danger-600'
                  }`}>
                    {verificacao.status === 'SUCESSO' ? 'Migração Concluída!' : 'Erro na Migração'}
                  </h3>
                  <p className="text-gray-600">{verificacao.mensagem}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg">
                      <span className="text-xs text-cdl-navy-600 font-medium">Régua Origem</span>
                      <p className="font-semibold text-cdl-navy-700 mt-0.5">
                        {verificacao.reguaOrigemNome || 'Nenhuma'}
                      </p>
                    </div>
                    <div className="p-3 bg-cdl-green-50 border border-cdl-green-100 rounded-lg">
                      <span className="text-xs text-cdl-green-600 font-medium">Régua Destino</span>
                      <p className="font-semibold text-cdl-green-700 mt-0.5">
                        {verificacao.reguaDestinoNome}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                    <span className="text-xs text-cdl-navy-600 font-medium">Data da Migração</span>
                    <p className="text-sm mt-0.5 font-semibold text-cdl-navy-700">
                      {formatDate(dataMigracao)}
                    </p>
                  </div>

                  {verificacao.migracaoForcada && (
                    <div className="mt-3 p-3 bg-cdl-yellow-50 border border-cdl-yellow-200 rounded-lg">
                      <p className="text-sm text-cdl-yellow-700 font-medium">
                        ⚠️ Migração forçada com {verificacao.totalFaturasPendentes} faturas pendentes
                      </p>
                    </div>
                  )}

                  {verificacao.dataMigracao && (
                    <p className="text-xs text-gray-400 mt-4">
                      {new Date(verificacao.dataMigracao).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-6 px-8 py-3 bg-cdl-navy-700 text-white rounded-lg
                               hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
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