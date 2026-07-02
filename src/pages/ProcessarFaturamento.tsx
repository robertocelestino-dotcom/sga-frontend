// src/pages/ProcessarFaturamento.tsx

import React, { useState, useRef, useCallback } from 'react';
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

interface ResumoFaturamento {
  totalAssociados: number;
  totalFaturas: number;
  valorTotal: number;
  detalhesPorAssociado?: Array<{
    associadoId: number;
    associadoNome: string;
    valor: number;
  }>;
}

// Limite para mostrar detalhes individuais
const LIMITE_DETALHES = 100;

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
  
  // Referência para timeout de mensagem longa
  const timeoutLongaRef = useRef<NodeJS.Timeout | null>(null);
  
  // Buscar resumo da simulação antes de confirmar
  const handleSelecionarAssociados = useCallback(async (associadosIds: number[], config: ProcessamentoConfig) => {
    console.log('📌 handleSelecionarAssociados - Iniciando');
    console.log('  - Associados:', associadosIds.length);
    console.log('  - Config:', config);
    
    setAssociadosSelecionados(associadosIds);
    setConfigSelecionada(config);
    
    setProcessando(true);
    setMensagemLonga(null);
    
    // Configurar timeout para mostrar mensagem de processamento longo
    timeoutLongaRef.current = setTimeout(() => {
      if (processando) {
        setMensagemLonga('⏳ O processamento está demorando mais que o esperado. Aguarde...');
      }
    }, 10000);
    
    try {
      const payload = {
        associadosIds,
        mesReferencia: config.mesReferencia,
        anoReferencia: config.anoReferencia,
        gerarNotas: false,
        integrarRM: false,
        reguaId: config.reguaId,
        simular: true
      };
      
      console.log('📤 Payload simulação:', { ...payload, associadosIds: `${associadosIds.length} IDs` });
      
      // 🔥 AUMENTAR TIMEOUT PARA 3 MINUTOS
      const response = await api.post('/faturamento/simular', payload, {
        timeout: 180000 // 3 minutos
      });
      
      console.log('📥 Resposta simulação:', {
        associadosProcessados: response.data.associadosProcessados,
        totalNotasGeradas: response.data.totalNotasGeradas,
        valorTotalDebito: response.data.valorTotalDebito,
        quantidadeDetalhes: response.data.detalhes?.length || 0
      });
      
      // 🔥 LIMITAR DETALHES QUANDO MUITOS ASSOCIADOS
      const muitosAssociados = associadosIds.length > LIMITE_DETALHES;
      let detalhes = [];
      
      if (!muitosAssociados && response.data.detalhes) {
        detalhes = response.data.detalhes.map((det: any) => ({
          associadoId: det.associadoId,
          associadoNome: det.associadoNome,
          valor: det.valorNota || 0
        }));
      } else if (response.data.detalhes && response.data.detalhes.length > 0) {
        // Mostrar apenas os primeiros 100 detalhes
        detalhes = response.data.detalhes.slice(0, LIMITE_DETALHES).map((det: any) => ({
          associadoId: det.associadoId,
          associadoNome: det.associadoNome,
          valor: det.valorNota || 0
        }));
        console.log(`📊 Detalhes limitados: exibindo ${detalhes.length} de ${response.data.detalhes.length} associados`);
      }
      
      setResumo({
        totalAssociados: response.data.associadosProcessados || associadosIds.length,
        totalFaturas: response.data.totalNotasGeradas || 0,
        valorTotal: response.data.valorTotalDebito || 0,
        detalhesPorAssociado: detalhes
      });
      
      setModalSelecaoAberta(false);
      setModalConfirmacaoAberta(true);
      console.log('✅ Modal de confirmação aberto');
      
    } catch (error: any) {
      console.error('❌ Erro ao obter resumo:', error);
      
      // 🔥 TRATAR TIMEOUT ESPECIFICAMENTE
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏰ O processamento está demorando muito. Tente com menos associados ou contate o suporte.', 'error');
      } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'error');
      } else {
        showToast('Erro ao obter resumo do faturamento. Tente novamente.', 'error');
      }
    } finally {
      if (timeoutLongaRef.current) {
        clearTimeout(timeoutLongaRef.current);
        timeoutLongaRef.current = null;
      }
      setProcessando(false);
      setMensagemLonga(null);
    }
  }, [processando, showToast]);
  
  // Confirmar e processar faturamento
  const handleConfirmarProcessamento = useCallback(async (dataEmissao: string, dataVencimento: string, observacao: string) => {
    console.log('📌 handleConfirmarProcessamento - Iniciando');
    console.log('  - dataEmissao:', dataEmissao);
    console.log('  - dataVencimento:', dataVencimento);
    console.log('  - observacao:', observacao);
    console.log('  - associadosSelecionados:', associadosSelecionados.length);
    
    setModalConfirmacaoAberta(false);
    setProcessando(true);
    setMensagemLonga(null);
    
    // Configurar timeout para mensagem de processamento longo
    timeoutLongaRef.current = setTimeout(() => {
      if (processando) {
        setMensagemLonga('⏳ Gerando faturas... Isso pode levar alguns minutos.');
      }
    }, 15000);
    
    try {
      const payload = {
        associadosIds: associadosSelecionados,
        mesReferencia: configSelecionada?.mesReferencia,
        anoReferencia: configSelecionada?.anoReferencia,
        gerarNotas: true,
        integrarRM: configSelecionada?.integrarRM || false,
        reguaId: configSelecionada?.reguaId,
        dataEmissao,
        dataVencimento,
        observacao,
        simular: false
      };
      
      console.log('📤 Payload do processamento:', { 
        ...payload, 
        associadosIds: `${payload.associadosIds.length} IDs` 
      });
      
      // 🔥 AUMENTAR TIMEOUT PARA 5 MINUTOS
      const response = await api.post('/faturamento/processar', payload, {
        timeout: 300000 // 5 minutos
      });
      
      console.log('📥 Resposta do processamento:', response.data);
      
      setResultado(response.data);
      setAssociadosSelecionados([]);
      
      const processados = response.data.associadosProcessados || 0;
      const faturas = response.data.totalNotasGeradas || 0;
      const jaFaturados = response.data.associadosJaFaturados || 0;
      const erros = response.data.associadosComErro || 0;
      
      // Mostrar toast com resultado
      if (faturas > 0) {
        if (jaFaturados > 0) {
          showToast(`✅ Processamento concluído! ${processados} associado(s) processados, ${faturas} fatura(s) geradas. ⚠️ ${jaFaturados} associado(s) já estavam faturados.${erros > 0 ? ` ❌ ${erros} erro(s).` : ''}`, 'warning');
        } else {
          showToast(`✅ Processamento concluído! ${processados} associado(s) processados, ${faturas} fatura(s) geradas.${erros > 0 ? ` ⚠️ ${erros} erro(s).` : ''}`, 'success');
        }
      } else if (processados === 0 && faturas === 0) {
        showToast(`⚠️ Nenhuma fatura foi gerada. Verifique se os associados têm notas no período.`, 'warning');
      } else {
        showToast(`✅ Processamento finalizado! ${processados} associados processados.`, 'info');
      }
      
      setModalResultadoAberta(true);
      
    } catch (error: any) {
      console.error('❌ Erro no processamento:', error);
      
      // 🔥 TRATAR TIMEOUT ESPECIFICAMENTE
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏰ O processamento está demorando muito. Tente com menos associados ou contate o suporte.', 'error');
      } else {
        const errorMsg = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Erro ao processar faturamento';
        showToast(errorMsg, 'error');
      }
      
      // Se houve erro, voltar para seleção
      setModalSelecaoAberta(true);
    } finally {
      if (timeoutLongaRef.current) {
        clearTimeout(timeoutLongaRef.current);
        timeoutLongaRef.current = null;
      }
      setProcessando(false);
      setMensagemLonga(null);
    }
  }, [associadosSelecionados, configSelecionada, processando, showToast]);
  
  // Função para voltar à seleção de associados
  const handleVoltarSelecao = useCallback(() => {
    setModalResultadoAberta(false);
    setModalSelecaoAberta(true);
    setConfigSelecionada(null);
    setAssociadosSelecionados([]);
  }, []);
  
  // Simular manualmente (apenas visualização)
  const handleSimularManual = useCallback(async (associadosIds: number[], config: ProcessamentoConfig) => {
    console.log('📌 handleSimularManual - Iniciando');
    console.log('  - Associados:', associadosIds.length);
    
    setModalSelecaoAberta(false);
    setProcessando(true);
    setMensagemLonga(null);
    
    timeoutLongaRef.current = setTimeout(() => {
      if (processando) {
        setMensagemLonga('⏳ Simulando... Aguarde.');
      }
    }, 10000);
    
    try {
      const payload = {
        associadosIds,
        mesReferencia: config.mesReferencia,
        anoReferencia: config.anoReferencia,
        gerarNotas: false,
        integrarRM: false,
        reguaId: config.reguaId,
        simular: true
      };
      
      console.log('📤 Payload simulação manual:', { ...payload, associadosIds: `${payload.associadosIds.length} IDs` });
      
      const response = await api.post('/faturamento/simular', payload, {
        timeout: 180000
      });
      
      console.log('📥 Resposta simulação manual:', response.data);
      
      setResultado(response.data);
      setModalResultadoAberta(true);
      
      const faturas = response.data.totalNotasGeradas || 0;
      if (faturas === 0) {
        showToast('⚠️ Simulação concluída: Nenhuma fatura será gerada para os associados selecionados.', 'warning');
      } else {
        showToast(`📊 Simulação concluída! ${faturas} fatura(s) seriam geradas no valor total de R$ ${(response.data.valorTotalDebito || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`, 'info');
      }
      
    } catch (error: any) {
      console.error('❌ Erro na simulação:', error);
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showToast('⏰ A simulação está demorando muito. Tente com menos associados.', 'error');
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erro ao simular faturamento';
        showToast(errorMsg, 'error');
      }
    } finally {
      if (timeoutLongaRef.current) {
        clearTimeout(timeoutLongaRef.current);
        timeoutLongaRef.current = null;
      }
      setProcessando(false);
      setMensagemLonga(null);
    }
  }, [processando, showToast]);
  
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-colors flex items-center gap-3 text-lg"
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
        onConfirm={handleSelecionarAssociados}
        onSimulate={handleSimularManual}
      />
      
      <ModalConfirmacaoProcessamento
        isOpen={modalConfirmacaoAberta}
        onClose={() => setModalConfirmacaoAberta(false)}
        onConfirm={handleConfirmarProcessamento}
        resumo={resumo || { totalAssociados: 0, totalFaturas: 0, valorTotal: 0 }}
        processando={processando}
      />
      
      <ModalResultadoProcessamento
        isOpen={modalResultadoAberta}
        onClose={() => setModalResultadoAberta(false)}
        onVoltarSelecao={handleVoltarSelecao}
        resultado={resultado}
      />
      
      {/* Loading Global */}
      {processando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center max-w-md">
            <Loading size="large" />
            <p className="mt-4 text-gray-600 font-semibold">Processando faturamento...</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos</p>
            {mensagemLonga && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-700">{mensagemLonga}</p>
                <p className="text-xs text-yellow-500 mt-1">Não feche esta janela</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessarFaturamento;