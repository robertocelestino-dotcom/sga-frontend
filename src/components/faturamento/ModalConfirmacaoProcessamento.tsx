// src/components/faturamento/ModalConfirmacaoProcessamento.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

interface ModalConfirmacaoProcessamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dataEmissao: string, dataVencimento: string, observacao: string) => void;
  resumo: ResumoFaturamento;
  processando?: boolean;
}

const formatCurrency = (value: number): string => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const ModalConfirmacaoProcessamento: React.FC<ModalConfirmacaoProcessamentoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  resumo,
  processando = false,
}) => {
  const [dataEmissao, setDataEmissao] = useState(formatDate(new Date()));
  const [dataVencimento, setDataVencimento] = useState(() => {
    const data = new Date();
    data.setDate(data.getDate() + 10);
    return formatDate(data);
  });
  const [observacao, setObservacao] = useState('');
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Resetar quando abre
  useEffect(() => {
    if (isOpen) {
      setDataEmissao(formatDate(new Date()));
      const data = new Date();
      data.setDate(data.getDate() + 10);
      setDataVencimento(formatDate(data));
      setObservacao('');
      setMostrarDetalhes(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!dataEmissao || !dataVencimento) return;
    onConfirm(dataEmissao, dataVencimento, observacao);
  };

  const temFaturas = (resumo.totalFaturas || 0) > 0;
  const nenhumaFatura = (resumo.totalAssociados || 0) > 0 && (resumo.totalFaturas || 0) === 0;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !processando && onClose()}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                   max-h-[95vh] sm:max-h-[90vh] flex flex-col
                   border-t-4 border-cdl-yellow-500"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-cdl-navy-700 truncate pr-2">
            Confirmar Processamento de Faturamento
          </h2>
          <button
            onClick={onClose}
            disabled={processando}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700
                       transition-colors shrink-0 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 space-y-6">
          {/* Alerta */}
          <div
            className={`border-l-4 p-4 rounded-lg flex items-start gap-3 ${
              temFaturas
                ? 'bg-cdl-yellow-50 border-cdl-yellow-500'
                : 'bg-cdl-danger-50 border-cdl-danger-500'
            }`}
          >
            <span className="text-lg">{temFaturas ? '⚠️' : '⚠️⚠️'}</span>
            <p className={`text-sm font-medium ${
              temFaturas ? 'text-cdl-yellow-700' : 'text-cdl-danger-600'
            }`}>
              {temFaturas
                ? 'Esta ação irá gerar as faturas definitivas. Este processo não poderá ser desfeito.'
                : nenhumaFatura
                  ? 'ATENÇÃO: Nenhuma fatura será gerada para os associados selecionados. Verifique se eles possuem notas no período.'
                  : 'Confirme os dados abaixo para prosseguir com o processamento.'}
            </p>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                Data de Emissão *
              </label>
              <input
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                value={dataVencimento}
                min={dataEmissao}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                A data de vencimento deve ser após a data de emissão
              </p>
            </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors resize-none"
              placeholder="Informe alguma observação sobre este processamento..."
            />
          </div>

          {/* Resumo */}
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg">
            <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>📊</span> Resumo do Processamento
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white border border-cdl-navy-100 rounded-lg p-3">
                <div className="text-2xl font-bold text-cdl-navy-700">
                  {resumo.totalAssociados || 0}
                </div>
                <div className="text-xs text-cdl-navy-600 mt-0.5">Associados</div>
              </div>
              <div className={`bg-white border rounded-lg p-3 ${
                temFaturas ? 'border-cdl-green-100' : 'border-cdl-neutral-100'
              }`}>
                <div className={`text-2xl font-bold ${
                  temFaturas ? 'text-cdl-green-700' : 'text-gray-400'
                }`}>
                  {resumo.totalFaturas || 0}
                </div>
                <div className="text-xs text-cdl-navy-600 mt-0.5">Faturas</div>
              </div>
              <div className={`bg-white border rounded-lg p-3 ${
                temFaturas ? 'border-cdl-yellow-100' : 'border-cdl-neutral-100'
              }`}>
                <div className={`text-2xl font-bold ${
                  temFaturas ? 'text-cdl-yellow-700' : 'text-gray-400'
                }`}>
                  {formatCurrency(resumo.valorTotal || 0)}
                </div>
                <div className="text-xs text-cdl-navy-600 mt-0.5">Valor Total</div>
              </div>
            </div>

            {/* Aviso quando nenhuma fatura */}
            {nenhumaFatura && (
              <div className="mt-3 p-3 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg text-sm text-cdl-danger-600 text-center font-medium">
                ⚠️ Nenhuma fatura será gerada. Verifique se os associados têm notas no período selecionado.
              </div>
            )}

            {/* Botão mostrar detalhes */}
            {resumo.detalhesPorAssociado && resumo.detalhesPorAssociado.length > 0 && (
              <button
                onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                className="mt-3 text-sm text-cdl-navy-700 hover:text-cdl-navy-800 flex items-center gap-1 font-medium transition-colors"
              >
                {mostrarDetalhes ? '▼' : '▶'}{' '}
                {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} detalhes por associado
              </button>
            )}

            {/* Tabela de detalhes */}
            {mostrarDetalhes && resumo.detalhesPorAssociado && (
              <div className="mt-3 max-h-48 overflow-y-auto border border-cdl-navy-100 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-cdl-navy-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase">
                        Associado
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-cdl-navy-700 uppercase">
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {resumo.detalhesPorAssociado.map((det) => (
                      <tr key={det.associadoId} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-3 py-2 text-gray-900">{det.associadoNome}</td>
                        <td className="px-3 py-2 text-right font-medium text-cdl-navy-700">
                          {formatCurrency(det.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-cdl-navy-50">
                    <tr>
                      <td className="px-3 py-2 font-bold text-cdl-navy-700">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-cdl-navy-700">
                        {formatCurrency(resumo.valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50 shrink-0">
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
            disabled={processando || !dataEmissao || !dataVencimento}
            className={`px-6 py-2.5 rounded-lg transition-all font-medium
                        flex items-center justify-center gap-2
                        disabled:cursor-not-allowed active:scale-[.98] ${
              temFaturas
                ? 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
                : 'bg-gray-400 text-white'
            }`}
          >
            {processando ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processando...
              </>
            ) : temFaturas ? (
              '✅ Confirmar e Processar'
            ) : (
              '⚠️ Nenhuma Fatura a Gerar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacaoProcessamento;