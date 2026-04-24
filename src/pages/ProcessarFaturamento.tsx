// src/pages/ProcessarFaturamento.tsx

import React, { useState } from 'react';
import api from '../services/api';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import ModalSelecaoAssociados from '../components/faturamento/ModalSelecaoAssociados';
import ModalResultadoProcessamento from '../components/faturamento/ModalResultadoProcessamento';
import Loading from '../components/Loading';

interface ProcessamentoConfig {
  reguaId?: number;
  mesReferencia: number;
  anoReferencia: number;
  gerarNotas: boolean;
  integrarRM: boolean;
}

const ProcessarFaturamento: React.FC = () => {
  const { showToast } = useMessage();
  
  const [modalSelecaoAberta, setModalSelecaoAberta] = useState(false);
  const [modalResultadoAberta, setModalResultadoAberta] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  
  const handleSelecionarAssociados = async (associadosIds: number[], config: ProcessamentoConfig) => {
    setModalSelecaoAberta(false);
    setProcessando(true);
    
    try {
      const payload = {
        associadosIds,
        mesReferencia: config.mesReferencia,
        anoReferencia: config.anoReferencia,
        gerarNotas: config.gerarNotas,
        integrarRM: config.integrarRM,
        reguaId: config.reguaId
      };
      
      // 🔥 Endpoint correto para processamento
      //const response = await api.post('/faturamento/processar', payload);
      const response = await api.post('/faturamento/processar-por-regua', payload);
      setResultado(response.data);
      setModalResultadoAberta(true);
      
      const msg = `Processamento concluído! ${response.data.associadosProcessados || 0} associados processados, ${response.data.totalNotasGeradas || 0} notas geradas.`;
      showToast(msg, 'success');
      
    } catch (error: any) {
      console.error('Erro no processamento:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erro ao processar faturamento';
      showToast(errorMsg, 'error');
    } finally {
      setProcessando(false);
    }
  };
  
  const handleSimularManual = async (associadosIds: number[], config: ProcessamentoConfig) => {
    setModalSelecaoAberta(false);
    setProcessando(true);
    
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
      
      // 🔥 Endpoint correto para simulação
      const response = await api.post('/faturamento/simular', payload);
      setResultado(response.data);
      setModalResultadoAberta(true);
      
      showToast('Simulação concluída com sucesso!', 'info');
      
    } catch (error: any) {
      console.error('Erro na simulação:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Erro ao simular faturamento';
      showToast(errorMsg, 'error');
    } finally {
      setProcessando(false);
    }
  };
  
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
      
      <ModalResultadoProcessamento
        isOpen={modalResultadoAberta}
        onClose={() => setModalResultadoAberta(false)}
        resultado={resultado}
      />
      
      {/* Loading Global */}
      {processando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <Loading size="large" />
            <p className="mt-4 text-gray-600">Processando faturamento...</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessarFaturamento;