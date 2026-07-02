// src/components/faturamento/ModalConfirmacaoProcessamento.tsx

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

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
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const ModalConfirmacaoProcessamento: React.FC<ModalConfirmacaoProcessamentoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  resumo,
  processando = false
}) => {
  const [dataEmissao, setDataEmissao] = useState(formatDate(new Date()));
  const [dataVencimento, setDataVencimento] = useState(() => {
    const data = new Date();
    data.setDate(data.getDate() + 10);
    return formatDate(data);
  });
  const [observacao, setObservacao] = useState('');
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Resetar datas quando o modal abrir
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
    if (!dataEmissao || !dataVencimento) {
      return;
    }
    console.log('📌 Confirmando processamento com datas:', { dataEmissao, dataVencimento, observacao });
    onConfirm(dataEmissao, dataVencimento, observacao);
  };

  // Verificar se tem faturas a serem geradas
  const temFaturas = (resumo.totalFaturas || 0) > 0;
  const nenhumaFatura = (resumo.totalAssociados || 0) > 0 && (resumo.totalFaturas || 0) === 0;

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Processamento de Faturamento" size="lg">
      <div className="space-y-6">
        {/* Alerta de confirmação */}
        <div className={`border-l-4 p-4 rounded ${temFaturas ? 'bg-yellow-50 border-yellow-400' : 'bg-orange-50 border-orange-400'}`}>
          <div className="flex items-center">
            <span className={`text-lg mr-2 ${temFaturas ? 'text-yellow-800' : 'text-orange-800'}`}>
              {temFaturas ? '⚠️' : '⚠️⚠️'}
            </span>
            <p className={temFaturas ? 'text-yellow-800' : 'text-orange-800'}>
              {temFaturas 
                ? 'Esta ação irá gerar as faturas definitivas. Este processo não poderá ser desfeito.'
                : nenhumaFatura 
                  ? 'ATENÇÃO: Nenhuma fatura será gerada para os associados selecionados. Verifique se eles possuem notas no período.'
                  : 'Confirme os dados abaixo para prosseguir com o processamento.'}
            </p>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Emissão *
            </label>
            <input
              type="date"
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento *
            </label>
            <input
              type="date"
              value={dataVencimento}
              min={dataEmissao}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              A data de vencimento deve ser após a data de emissão
            </p>
          </div>
        </div>

        {/* Observação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observação (opcional)
          </label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Informe alguma observação sobre este processamento..."
          />
        </div>

        {/* Resumo do Processamento */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">📊 Resumo do Processamento</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{resumo.totalAssociados || 0}</div>
              <div className="text-xs text-gray-500">Associados</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${temFaturas ? 'text-green-600' : 'text-gray-400'}`}>
                {resumo.totalFaturas || 0}
              </div>
              <div className="text-xs text-gray-500">Faturas</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${temFaturas ? 'text-purple-600' : 'text-gray-400'}`}>
                {formatCurrency(resumo.valorTotal || 0)}
              </div>
              <div className="text-xs text-gray-500">Valor Total</div>
            </div>
          </div>

          {/* Aviso se não houver faturas */}
          {nenhumaFatura && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              ⚠️ Nenhuma fatura será gerada. Verifique se os associados têm notas no período selecionado.
            </div>
          )}

          {/* Botão mostrar detalhes */}
          {resumo.detalhesPorAssociado && resumo.detalhesPorAssociado.length > 0 && (
            <button
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {mostrarDetalhes ? '▼' : '▶'} 
              {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} detalhes por associado
            </button>
          )}

          {/* Tabela de detalhes */}
          {mostrarDetalhes && resumo.detalhesPorAssociado && (
            <div className="mt-3 max-h-48 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Associado</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resumo.detalhesPorAssociado.map((det) => (
                    <tr key={det.associadoId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{det.associadoNome}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency(det.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 font-bold">Total</td>
                    <td className="px-3 py-2 text-right font-bold">{formatCurrency(resumo.valorTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={processando}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={processando || !dataEmissao || !dataVencimento}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              temFaturas 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-white cursor-not-allowed'
            }`}
          >
            {processando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processando...
              </>
            ) : (
              temFaturas ? '✅ Confirmar e Processar' : '⚠️ Nenhuma Fatura a Gerar'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalConfirmacaoProcessamento;