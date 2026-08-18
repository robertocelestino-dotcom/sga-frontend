// src/pages/ProcessarFaturamento.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import ModalSelecaoAssociados from '../components/faturamento/ModalSelecaoAssociados';
import ModalConfirmacaoProcessamento from '../components/faturamento/ModalConfirmacaoProcessamento';
import ModalResultadoProcessamento from '../components/faturamento/ModalResultadoProcessamento';
import Loading from '../components/Loading';

interface ProcessamentoConfig {
  reguaId?: number;
  mesReferencia: number;
  anoReferencia: number;
  gerarNotas: boolean;
  integrarRM: boolean;
}

interface ProcessamentoStatus {
  taskId: string;
  status: string;
  progresso: number;
  mensagem: string;
  dataInicio: string;
  dataFim: string;
  resultado: any;
  totalAssociados: number;
  usuario: string;
}

interface ResumoFaturamento {
  totalAssociados: number;
  totalFaturas: number;
  valorTotal: number;
  detalhesPorAssociado?: Array<{
    associadoId: number;
    associadoNome: string;
    valor: number;
    itens?: Array<{
      codigoProduto: string;
      descricao: string;
      quantidade: number;
      valorUnitario: number;
      valorTotal: number;
    }>;
  }>;
}

const LIMITE_DETALHES = 100;
const MAX_TENTATIVAS_POLLING = 120;
const BATCH_SIZE = 100; // 🔥 TAMANHO DO LOTE PARA SIMULAÇÃO

const ProcessarFaturamento: React.FC = () => {
  const { showToast } = useMessage();
  
  const [modalSelecaoAberta, setModalSelecaoAberta] = useState(false);
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false);
  const [modalResultadoAberta, setModalResultadoAberta] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [mensagemLonga, setMensagemLonga] = useState<string | null>(null);
  const [resultado, setResultado] = useState(null);
  const [resumo, setResumo] = useState<ResumoFaturamento | null>(null);
  const [configSelecionada, setConfigSelecionada] = useState<ProcessamentoConfig | null>(null);
  const [associadosSelecionados, setAssociadosSelecionados] = useState<number[]>([]);
  const [modoExecucao, setModoExecucao] = useState<'simular' | 'processar'>('simular');
  
  // 🔥 ESTADOS PARA PROCESSAMENTO ASSÍNCRONO
  const [taskId, setTaskId] = useState<string | null>(null);
  const [percentual, setPercentual] = useState(0);
  const [statusProcessamento, setStatusProcessamento] = useState<string>('');
  const [tentativasPolling, setTentativasPolling] = useState(0);
  const [tempoRestante, setTempoRestante] = useState<string>('');
  const [cancelando, setCancelando] = useState(false);
  const [processandoAssincrono, setProcessandoAssincrono] = useState(false);
  const [progressoLote, setProgressoLote] = useState({ atual: 0, total: 0 });
  
  // 🔥 REF PARA POLLING
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 🔥 DADOS PARA CONFIRMAÇÃO
  const [dadosConfirmacao, setDadosConfirmacao] = useState<{
    dataEmissao: string;
    dataVencimento: string;
    observacao: string;
  }>({
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observacao: ''
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // 🔥 CANCELAR PROCESSAMENTO
  const cancelarProcessamento = async () => {
    if (!taskId) return;
    
    if (!confirm('⚠️ Tem certeza que deseja cancelar o processamento?')) {
      return;
    }
    
    setCancelando(true);
    
    try {
      const response = await api.post(`/faturamento/processamento-cancelar/${taskId}`);
      
      if (response.data.success) {
        showToast('⏹️ Processamento cancelado com sucesso!', 'info');
        setStatusProcessamento('CANCELADO');
        setMensagemLonga('Processamento cancelado pelo usuário');
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setProcessando(false);
        setProcessandoAssincrono(false);
      }
    } catch (error) {
      console.error('❌ Erro ao cancelar processamento:', error);
      showToast('⚠️ Erro ao cancelar processamento', 'error');
    } finally {
      setCancelando(false);
    }
  };

  // 🔥 SIMULAR (NÃO SALVA) - COM SUPORTE A LOTES
  const handleSimular = useCallback(async (associadosIds: number[], config: ProcessamentoConfig) => {
    console.log('📌 SIMULAÇÃO - Iniciando');
    console.log('  - Associados:', associadosIds.length);
    console.log('  - Config:', config);
    
    setAssociadosSelecionados(associadosIds);
    setConfigSelecionada(config);
    setModoExecucao('simular');
    
    setProcessando(true);
    setMensagemLonga('🔄 Simulando faturamento...');
    
    try {
      const total = associadosIds.length;
      
      // 🔥 SE MAIS DE 500, PROCESSAR EM LOTES
      if (total > 500) {
        showToast(`📊 Processando ${total} associados em lotes de ${BATCH_SIZE}...`, 'info');
        
        let allResults: any = {
          associadosProcessados: 0,
          totalNotasGeradas: 0,
          valorTotalDebito: 0,
          detalhes: []
        };
        
        const batchSize = BATCH_SIZE;
        let processed = 0;
        
        for (let i = 0; i < total; i += batchSize) {
          const batch = associadosIds.slice(i, i + batchSize);
          const loteAtual = Math.floor(i / batchSize) + 1;
          const totalLotes = Math.ceil(total / batchSize);
          
          setProgressoLote({ atual: loteAtual, total: totalLotes });
          setMensagemLonga(`🔄 Simulando lote ${loteAtual}/${totalLotes} (${batch.length} associados)...`);
          
          const payload = {
            associadosIds: batch,
            mesReferencia: config.mesReferencia,
            anoReferencia: config.anoReferencia,
            gerarNotas: false,
            integrarRM: false,
            reguaId: config.reguaId,
            simular: true
          };
          
          try {
            const response = await api.post('/faturamento/simular', payload, {
              timeout: 600000 // 10 minutos por lote
            });
            
            const data = response.data;
            
            allResults.associadosProcessados += data.associadosProcessados || 0;
            allResults.totalNotasGeradas += data.totalNotasGeradas || 0;
            allResults.valorTotalDebito += data.valorTotalDebito || 0;
            
            if (data.detalhes && data.detalhes.length > 0) {
              allResults.detalhes = [...allResults.detalhes, ...data.detalhes];
            }
            
            processed += batch.length;
            setMensagemLonga(`✅ Lote ${loteAtual}/${totalLotes} concluído (${processed}/${total} associados)`);
            
          } catch (batchError: any) {
            console.error(`❌ Erro no lote ${loteAtual}:`, batchError);
            showToast(`⚠️ Erro no lote ${loteAtual}: ${batchError.message}`, 'warning');
            // Continua com o próximo lote
          }
        }
        
        // 🔥 CRIAR RESUMO COM ITENS
        let detalhes = [];
        if (allResults.detalhes && allResults.detalhes.length > 0) {
          detalhes = allResults.detalhes.map((det: any) => ({
            associadoId: det.associadoId,
            associadoNome: det.associadoNome,
            valor: det.valorNota || 0,
            itens: det.itensFatura?.map((item: any) => ({
              codigoProduto: item.codigoProduto || item.codigoProduto,
              descricao: item.descricao || item.descricao,
              quantidade: item.quantidade || 1,
              valorUnitario: item.valorUnitario || 0,
              valorTotal: item.valorTotal || 0
            })) || []
          }));
        }
        
        setResumo({
          totalAssociados: allResults.associadosProcessados || total,
          totalFaturas: allResults.totalNotasGeradas || 0,
          valorTotal: allResults.valorTotalDebito || 0,
          detalhesPorAssociado: detalhes
        });
        
        setModalSelecaoAberta(false);
        setResultado(allResults);
        setModalResultadoAberta(true);
        
        const faturas = allResults.totalNotasGeradas || 0;
        if (faturas === 0) {
          showToast('⚠️ Simulação: Nenhuma fatura será gerada.', 'warning');
        } else {
          showToast(`📊 Simulação concluída! ${faturas} fatura(s) seriam geradas.`, 'info');
        }
        
        setProcessando(false);
        setProgressoLote({ atual: 0, total: 0 });
        return;
      }
      
      // 🔥 PROCESSAMENTO NORMAL PARA MENOS DE 500
      const payload = {
        associadosIds,
        mesReferencia: config.mesReferencia,
        anoReferencia: config.anoReferencia,
        gerarNotas: false,
        integrarRM: false,
        reguaId: config.reguaId,
        simular: true
      };
      
      console.log('📤 Payload simulação:', { ...payload, associadosIds: `${payload.associadosIds.length} IDs` });
      
      const response = await api.post('/faturamento/simular', payload, {
        timeout: 1200000 // 20 minutos
      });
      
      console.log('📥 Resposta simulação:', {
        associadosProcessados: response.data.associadosProcessados,
        totalNotasGeradas: response.data.totalNotasGeradas,
        valorTotalDebito: response.data.valorTotalDebito,
        quantidadeDetalhes: response.data.detalhes?.length || 0
      });
      
      // 🔥 CRIAR RESUMO COM ITENS
      let detalhes = [];
      if (response.data.detalhes && response.data.detalhes.length > 0) {
        detalhes = response.data.detalhes.map((det: any) => ({
          associadoId: det.associadoId,
          associadoNome: det.associadoNome,
          valor: det.valorNota || 0,
          itens: det.itensFatura?.map((item: any) => ({
            codigoProduto: item.codigoProduto || item.codigoProduto,
            descricao: item.descricao || item.descricao,
            quantidade: item.quantidade || 1,
            valorUnitario: item.valorUnitario || 0,
            valorTotal: item.valorTotal || 0
          })) || []
        }));
      }
      
      setResumo({
        totalAssociados: response.data.associadosProcessados || associadosIds.length,
        totalFaturas: response.data.totalNotasGeradas || 0,
        valorTotal: response.data.valorTotalDebito || 0,
        detalhesPorAssociado: detalhes
      });
      
      setModalSelecaoAberta(false);
      setResultado(response.data);
      setModalResultadoAberta(true);
      
      const faturas = response.data.totalNotasGeradas || 0;
      if (faturas === 0) {
        showToast('⚠️ Simulação: Nenhuma fatura será gerada.', 'warning');
      } else {
        showToast(`📊 Simulação concluída! ${faturas} fatura(s) seriam geradas.`, 'info');
      }
      
      setProcessando(false);
      
    } catch (error: any) {
      console.error('❌ Erro na simulação:', error);
      
      if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏰ A simulação está demorando muito. Tente com menos associados ou processe em lotes.', 'warning');
      } else {
        showToast(`❌ Erro ao simular: ${error.response?.data?.message || error.message}`, 'error');
      }
      
      setProcessando(false);
      setProgressoLote({ atual: 0, total: 0 });
    }
  }, [showToast]);

  // 🔥 PROCESSAR FATURAMENTO (SALVA) - ABRE MODAL DE CONFIRMAÇÃO
  const handleProcessar = useCallback(async (associadosIds: number[], config: ProcessamentoConfig) => {
    console.log('📌 PROCESSAR FATURAMENTO - Iniciando');
    console.log('  - Associados:', associadosIds.length);
    console.log('  - Config:', config);
    
    setAssociadosSelecionados(associadosIds);
    setConfigSelecionada(config);
    setModoExecucao('processar');
    
    // 🔥 ABRIR MODAL DE CONFIRMAÇÃO ANTES DE PROCESSAR
    setModalSelecaoAberta(false);
    setModalConfirmacaoAberta(true);
  }, []);

  // 🔥 CONFIRMAR PROCESSAMENTO (APÓS MODAL DE CONFIRMAÇÃO)
  const handleConfirmarProcessamento = useCallback(async (
    dataEmissao: string, 
    dataVencimento: string, 
    observacao: string
  ) => {
    // Fechar modal de confirmação
    setModalConfirmacaoAberta(false);
    
    // 🔥 USAR OS ASSOCIADOS SELECIONADOS
    if (associadosSelecionados.length === 0 || !configSelecionada) {
      showToast('⚠️ Nenhum associado selecionado.', 'warning');
      return;
    }
    
    // Atualizar dados de confirmação
    setDadosConfirmacao({ dataEmissao, dataVencimento, observacao });
    
    // 🔥 CHAMAR PROCESSAMENTO REAL
    await executarProcessamento(associadosSelecionados, configSelecionada, dataEmissao, dataVencimento, observacao);
  }, [associadosSelecionados, configSelecionada, showToast]);

  // 🔥 EXECUTAR PROCESSAMENTO REAL
  const executarProcessamento = useCallback(async (
    associadosIds: number[], 
    config: ProcessamentoConfig,
    dataEmissao: string,
    dataVencimento: string,
    observacao: string
  ) => {
    console.log('📌 EXECUTANDO PROCESSAMENTO REAL - Iniciando');
    console.log('  - Associados:', associadosIds.length);
    console.log('  - Config:', config);
    console.log('  - Data Emissão:', dataEmissao);
    console.log('  - Data Vencimento:', dataVencimento);
    
    setProcessando(true);
    setMensagemLonga('🔄 Iniciando processamento...');
    
    try {
      const payload = {
        associadosIds,
        mesReferencia: config.mesReferencia,
        anoReferencia: config.anoReferencia,
        gerarNotas: true,
        integrarRM: config.integrarRM || false,
        reguaId: config.reguaId,
        simular: false,
        dataEmissao,
        dataVencimento,
        observacao
      };
      
      console.log('📤 Payload processamento:', { ...payload, associadosIds: `${payload.associadosIds.length} IDs` });
      
      // 🔥 CHAMAR PROCESSAMENTO ASSÍNCRONO
      const response = await api.post('/faturamento/processar-assincrono', payload, {
        timeout: 300000 // 5 minutos para iniciar
      });
      
      if (!response.data.success) {
        showToast('❌ Erro ao iniciar processamento', 'error');
        setProcessando(false);
        return;
      }
      
      const taskId = response.data.taskId;
      const totalAssociados = response.data.totalAssociados || 0;
      
      setTaskId(taskId);
      setMensagemLonga(`Processamento iniciado! ${totalAssociados} associados em fila...`);
      setStatusProcessamento('PROCESSANDO');
      setPercentual(5);
      setProcessandoAssincrono(true);
      
      // 🔥 INICIAR POLLING
      let tentativas = 0;
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(async () => {
        tentativas++;
        setTentativasPolling(tentativas);
        
        try {
          const statusResponse = await api.get(`/faturamento/processamento-status/${taskId}`, {
            timeout: 30000 // 30 segundos para status
          });
          const status: ProcessamentoStatus = statusResponse.data;
          
          setPercentual(status.progresso);
          setMensagemLonga(`Processando... ${status.progresso}% - ${status.mensagem}`);
          setStatusProcessamento(status.status);
          
          if (status.progresso > 0 && status.dataInicio) {
            const inicio = new Date(status.dataInicio);
            const agora = new Date();
            const decorrido = Math.floor((agora.getTime() - inicio.getTime()) / 1000);
            const estimadoTotal = Math.floor(decorrido / (status.progresso / 100));
            const estimadoRestante = Math.max(0, estimadoTotal - decorrido);
            
            if (estimadoRestante > 0) {
              const mins = Math.floor(estimadoRestante / 60);
              const segs = estimadoRestante % 60;
              setTempoRestante(`${mins}m ${segs}s`);
            }
          }
          
          if (status.status === 'CONCLUIDO') {
            setMensagemLonga('✅ Processamento concluído!');
            setPercentual(100);
            setStatusProcessamento('CONCLUIDO');
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setResultado(status.resultado);
            setModalResultadoAberta(true);
            
            const processados = status.resultado?.associadosProcessados || 0;
            const faturas = status.resultado?.totalNotasGeradas || 0;
            const jaFaturados = status.resultado?.associadosJaFaturados || 0;
            const erros = status.resultado?.associadosComErro || 0;
            
            if (faturas > 0) {
              if (jaFaturados > 0) {
                showToast(`✅ Processamento concluído! ${processados} associados, ${faturas} faturas. ⚠️ ${jaFaturados} já faturados.`, 'warning');
              } else {
                showToast(`✅ Processamento concluído! ${processados} associados, ${faturas} faturas.`, 'success');
              }
            } else {
              showToast(`⚠️ Nenhuma fatura foi gerada.`, 'warning');
            }
            
            setProcessando(false);
            setProcessandoAssincrono(false);
            return;
            
          } else if (status.status === 'ERRO') {
            setMensagemLonga(`❌ ${status.mensagem}`);
            setStatusProcessamento('ERRO');
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            showToast(`❌ ${status.mensagem}`, 'error');
            setProcessando(false);
            setProcessandoAssincrono(false);
            return;
            
          } else if (status.status === 'CANCELADO') {
            setMensagemLonga('⏹️ Processamento cancelado');
            setStatusProcessamento('CANCELADO');
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setProcessando(false);
            setProcessandoAssincrono(false);
            return;
          }
          
        } catch (error) {
          console.error('❌ Erro ao verificar status:', error);
          
          if (tentativas >= MAX_TENTATIVAS_POLLING) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setMensagemLonga('⏰ Tempo limite excedido');
            setStatusProcessamento('TIMEOUT');
            showToast('⏰ O processamento está demorando muito. Verifique mais tarde.', 'warning');
            setProcessando(false);
            setProcessandoAssincrono(false);
          }
        }
      }, 5000);
      
    } catch (error: any) {
      console.error('❌ Erro no processamento:', error);
      setMensagemLonga('❌ Erro no processamento');
      setStatusProcessamento('ERRO');
      
      if (error.isTimeout || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏰ O processamento está demorando muito. Tente com menos associados.', 'warning');
      } else {
        showToast(`❌ Erro ao processar: ${error.response?.data?.message || error.message}`, 'error');
      }
      
      setProcessando(false);
      setProcessandoAssincrono(false);
    }
  }, [showToast]);

  // 🔥 VOLTAR PARA SELEÇÃO
  const handleVoltarSelecao = useCallback(() => {
    setModalResultadoAberta(false);
    setModalSelecaoAberta(true);
    setConfigSelecionada(null);
    setAssociadosSelecionados([]);
    setTaskId(null);
    setPercentual(0);
    setStatusProcessamento('');
    setTempoRestante('');
  }, []);

  // 🔥 SIMULAR MANUALMENTE (BOTÃO DO MODAL)
  const handleSimularManual = useCallback(async (associadosIds: number[], config: ProcessamentoConfig) => {
    await handleSimular(associadosIds, config);
  }, [handleSimular]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Processar Faturamento" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Processar Faturamento</h1>
          <p className="text-gray-600">
            Selecione uma régua de faturamento e os associados que deseja processar.
            O sistema aplicará as regras de franquia e faturamento mínimo.
          </p>
        </div>
        
        {/* Botão principal */}
        <div className="flex justify-center">
          <button
            onClick={() => setModalSelecaoAberta(true)}
            disabled={processando}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-3 text-lg disabled:bg-gray-400"
          >
            <span className="text-2xl">🚀</span>
            Iniciar Processamento de Faturamento
          </button>
        </div>
        
        {/* Informações adicionais */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">ℹ️ Sobre o Processamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <ul className="space-y-1 list-disc list-inside">
              <li>O processamento considera o faturamento mínimo configurado para cada associado</li>
              <li>A regra de franquia calcula o consumo vs franquia contratada</li>
              <li>Cancelamentos no período são automaticamente excluídos</li>
            </ul>
            <ul className="space-y-1 list-disc list-inside">
              <li>As notas de débito são geradas com base no valor excedente</li>
              <li>É possível simular o processo antes de efetivar</li>
              <li>As réguas definem o dia de emissão e vencimento das faturas</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <ModalSelecaoAssociados
        isOpen={modalSelecaoAberta}
        onClose={() => setModalSelecaoAberta(false)}
        onConfirm={handleProcessar}        // 🔥 PROCESSAR - Abre modal de confirmação
        onSimulate={handleSimularManual}   // 🔥 SIMULAR
      />
      
      <ModalConfirmacaoProcessamento
        isOpen={modalConfirmacaoAberta}
        onClose={() => setModalConfirmacaoAberta(false)}
        onConfirm={handleConfirmarProcessamento}
        resumo={resumo || { totalAssociados: associadosSelecionados.length || 0, totalFaturas: 0, valorTotal: 0 }}
        processando={processando}
      />
      
      <ModalResultadoProcessamento
        isOpen={modalResultadoAberta}
        onClose={() => setModalResultadoAberta(false)}
        onVoltarSelecao={handleVoltarSelecao}
        resultado={resultado}
      />
      
      {/* 🔥 LOADING GLOBAL */}
      {processando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-lg w-full">
            <Loading size="large" />
            <p className="mt-4 text-gray-600 font-semibold">
              {modoExecucao === 'simular' ? '🔍 Simulando faturamento...' : 
               processandoAssincrono ? '🔄 Processando faturamento em background...' : 
               '⏳ Aguarde...'}
            </p>
            
            {/* 🔥 PROGRESSO POR LOTE (SIMULAÇÃO) */}
            {modoExecucao === 'simular' && progressoLote.total > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Lote {progressoLote.atual} de {progressoLote.total}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="h-2.5 rounded-full bg-green-600 transition-all duration-500"
                    style={{ width: `${(progressoLote.atual / progressoLote.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* 🔥 PROGRESSO DO PROCESSAMENTO ASSÍNCRONO */}
            {processandoAssincrono && modoExecucao === 'processar' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      statusProcessamento === 'ERRO' ? 'bg-red-600' :
                      statusProcessamento === 'CANCELADO' ? 'bg-gray-600' :
                      statusProcessamento === 'CONCLUIDO' ? 'bg-green-600' :
                      'bg-blue-600'
                    }`}
                    style={{ width: `${percentual}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>{percentual}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">{mensagemLonga || 'Processando...'}</p>
            
            {processandoAssincrono && modoExecucao === 'processar' && tempoRestante && statusProcessamento === 'PROCESSANDO' && (
              <p className="text-xs text-blue-500 mt-1">⏱️ Tempo estimado restante: ~{tempoRestante}</p>
            )}
            
            {processandoAssincrono && modoExecucao === 'processar' && taskId && (statusProcessamento === 'PROCESSANDO' || statusProcessamento === 'INICIANDO') && (
              <button
                onClick={cancelarProcessamento}
                disabled={cancelando}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 text-sm transition-colors"
              >
                {cancelando ? 'Cancelando...' : '⏹️ Cancelar Processamento'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessarFaturamento;