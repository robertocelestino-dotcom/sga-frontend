// src/components/faturamento/ModalExportacaoRm.tsx - VERSÃO CDL
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

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
  processando = false,
}) => {
  const [ultimoNumeroRps, setUltimoNumeroRps] = useState<number>(0);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !processando && onClose()}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-green-500">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
            <span>📤</span> Exportar para RM
          </h2>
          <button
            onClick={onClose}
            disabled={processando}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 space-y-5">
          {/* Alerta */}
          <div className="bg-cdl-navy-50 border-l-4 border-cdl-navy-700 p-4 rounded-lg flex items-start gap-3">
            <span>ℹ️</span>
            <p className="text-sm text-cdl-navy-700">
              Esta ação irá gerar o arquivo RM para integração com o TOTVS RM.
              As faturas serão marcadas como <strong>"PAGA"</strong> após a exportação.
            </p>
          </div>

          {/* Resumo */}
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg">
            <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>📊</span> Resumo da Exportação
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-cdl-navy-100 rounded-lg p-3 text-center">
                <span className="text-xs text-cdl-navy-600 font-medium">Total de Faturas</span>
                <p className="text-2xl font-bold text-cdl-navy-700 mt-1">{totalFaturas}</p>
              </div>
              <div className="bg-white border border-cdl-green-100 rounded-lg p-3 text-center">
                <span className="text-xs text-cdl-green-600 font-medium">Valor Total</span>
                <p className="text-2xl font-bold text-cdl-green-700 mt-1">{formatCurrency(valorTotal)}</p>
              </div>
            </div>
          </div>

          {/* Campo RPS */}
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
              Último Número da RPS gerada no RM *
            </label>
            <input
              type="number"
              value={ultimoNumeroRps}
              onChange={(e) => setUltimoNumeroRps(parseInt(e.target.value) || 0)}
              min={1}
              className={`w-full px-3 py-2 border rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors ${
                erro ? 'border-cdl-danger-500' : 'border-gray-300'
              }`}
              placeholder="Ex: 1000"
            />
            {erro && <p className="text-cdl-danger-500 text-xs mt-1 font-medium">{erro}</p>}
            <p className="text-xs text-gray-500 mt-1">
              O sistema irá incrementar este número automaticamente para cada fatura
            </p>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
              Observação <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors resize-none"
              placeholder="Informe alguma observação sobre esta exportação..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-cdl-neutral-50 shrink-0">
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 rounded-lg
                       hover:bg-cdl-neutral-50 transition-colors font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processando || ultimoNumeroRps <= 0}
            className="px-6 py-2.5 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                       disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center
                       gap-2 font-medium transition-all active:scale-[.98]"
          >
            {processando ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Upload size={16} />
                Gerar Arquivo RM
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalExportacaoRm;