// src/components/faturamento/ModalExportacaoRm.tsx

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Loading from '../Loading';

interface ModalExportacaoRmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ultimoNumeroRps: number, observacao: string) => void;
  totalFaturas: number;
  valorTotal: number;
  processando?: boolean;
}

const ModalExportacaoRm: React.FC<ModalExportacaoRmProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalFaturas,
  valorTotal,
  processando = false
}) => {
  const [ultimoNumeroRps, setUltimoNumeroRps] = useState<number>(0);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleConfirm = () => {
    if (ultimoNumeroRps <= 0) {
      setErro('Informe o último número da RPS gerada no RM');
      return;
    }
    setErro('');
    onConfirm(ultimoNumeroRps, observacao);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar para RM" size="lg">
      <div className="space-y-6">
        {/* Alerta */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800 text-sm">
            ℹ️ Esta ação irá gerar o arquivo RM para integração com o TOTVS RM.
            As faturas serão marcadas como "PAGA" após a exportação.
          </p>
        </div>

        {/* Resumo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">📊 Resumo da Exportação</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Total de Faturas:</span>
              <p className="text-2xl font-bold text-blue-600">{totalFaturas}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Valor Total:</span>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(valorTotal)}</p>
            </div>
          </div>
        </div>

        {/* Campo: Último Número RPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Último Número da RPS gerada no RM *
          </label>
          <input
            type="number"
            value={ultimoNumeroRps}
            onChange={(e) => setUltimoNumeroRps(parseInt(e.target.value) || 0)}
            min={1}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${erro ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ex: 1000"
          />
          {erro && <p className="text-red-500 text-xs mt-1">{erro}</p>}
          <p className="text-xs text-gray-500 mt-1">
            O sistema irá incrementar este número automaticamente para cada fatura
          </p>
        </div>

        {/* Campo: Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação (opcional)
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Informe alguma observação sobre esta exportação..."
          />
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processando || ultimoNumeroRps <= 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {processando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Gerando...
              </>
            ) : (
              '📤 Gerar Arquivo RM'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalExportacaoRm;