// src/components/faturamento/ModalResultadoProcessamento.tsx - VERSÃO CDL
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface FaturaItemDTO {
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tipoLancamento: string;
}

interface AssociadoProcessamento {
  associadoId: number;
  associadoNome: string;
  cnpjCpf: string;
  valorFranquia: number;
  consumoFranquia: number;
  saldoFranquia: number;
  valorDebito: number;
  valorNota: number;
  processado: boolean;
  gerouNota?: boolean;
  mensagemErro?: string;
  itensFatura?: FaturaItemDTO[];
}

interface ResultadoProcessamento {
  totalAssociados: number;
  associadosProcessados: number;
  associadosComErro: number;
  associadosJaFaturados?: number;
  totalNotasGeradas: number;
  valorTotalFaturamento: number;
  valorTotalFranquia: number;
  valorTotalConsumo: number;
  valorTotalDebito: number;
  dataProcessamento: string;
  detalhes: AssociadoProcessamento[];
  erros: string[];
}

interface ModalResultadoProcessamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onVoltarSelecao?: () => void;
  resultado: ResultadoProcessamento | null;
  titulo?: string;
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

const ModalResultadoProcessamento: React.FC<ModalResultadoProcessamentoProps> = ({
  isOpen,
  onClose,
  onVoltarSelecao,
  resultado,
  titulo = 'Resultado do Processamento',
}) => {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [associadoExpandido, setAssociadoExpandido] = useState<number | null>(null);

  if (!isOpen || !resultado) return null;

  const toggleExpandirAssociado = (associadoId: number) => {
    setAssociadoExpandido(associadoExpandido === associadoId ? null : associadoId);
  };

  const handleVoltar = () => {
    onClose();
    if (onVoltarSelecao) onVoltarSelecao();
  };

  const isSimulacao = resultado.totalNotasGeradas === 0 && resultado.associadosProcessados > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className={`relative w-full sm:max-w-7xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col
                      border-t-4 ${isSimulacao ? 'border-cdl-yellow-500' : 'border-cdl-green-500'}`}>
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700">{titulo}</h2>
            {isSimulacao && (
              <span className="px-2 py-0.5 text-xs bg-cdl-yellow-100 text-cdl-yellow-700 rounded-full font-semibold">
                SIMULAÇÃO
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-cdl-green-50 border border-cdl-green-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-green-700">{resultado.associadosProcessados || 0}</div>
              <div className="text-xs text-cdl-green-600 mt-0.5 font-medium">Processados</div>
            </div>
            <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-danger-500">{resultado.associadosComErro || 0}</div>
              <div className="text-xs text-cdl-danger-500 mt-0.5 font-medium">Com Erro</div>
            </div>
            <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-yellow-700">{resultado.associadosJaFaturados || 0}</div>
              <div className="text-xs text-cdl-yellow-600 mt-0.5 font-medium">Já Faturados</div>
            </div>
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">{resultado.totalNotasGeradas || 0}</div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Faturas Geradas</div>
            </div>
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">
                {formatCurrency(resultado.valorTotalDebito || 0)}
              </div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Valor Total</div>
            </div>
          </div>

          <button
            onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
            className="flex items-center gap-2 text-cdl-navy-700 hover:text-cdl-navy-800 mb-4 font-medium transition-colors"
          >
            {mostrarDetalhes ? '▼' : '▶'}{' '}
            {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes por Associado ({resultado.detalhes?.length || 0})
          </button>

          {mostrarDetalhes && resultado.detalhes && resultado.detalhes.length > 0 && (
            <div className="space-y-3">
              {resultado.detalhes.map((det, idx) => (
                <div key={det.associadoId || idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className={`px-4 py-3 flex justify-between items-center cursor-pointer transition-colors ${
                      det.processado
                        ? 'bg-cdl-green-50 hover:bg-cdl-green-100/60'
                        : 'bg-cdl-danger-50 hover:bg-cdl-danger-100/40'
                    }`}
                    onClick={() => toggleExpandirAssociado(det.associadoId)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">{det.associadoNome || '-'}</span>
                        {det.mensagemErro && det.mensagemErro.includes('já possui fatura') && (
                          <span className="px-2 py-0.5 text-xs bg-cdl-yellow-100 text-cdl-yellow-700 rounded-full font-medium">
                            Já Faturado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{det.cnpjCpf || '-'}</div>
                      {det.mensagemErro && (
                        <div className={`text-xs mt-1 ${
                          det.mensagemErro.includes('já possui') ? 'text-cdl-yellow-700' : 'text-cdl-danger-500'
                        }`}>
                          {det.mensagemErro}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6 ml-2">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-500">Valor</div>
                        <div className="font-semibold text-cdl-navy-700">
                          {formatCurrency(det.valorNota || 0)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 hidden sm:block">Status</div>
                        {det.processado ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-cdl-green-100 text-cdl-green-700">
                            ✓ {det.gerouNota ? 'Fatura Gerada' : 'Processado'}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-cdl-danger-50 text-cdl-danger-500">
                            ✗ {det.mensagemErro?.includes('já possui') ? 'Já Faturado' : 'Erro'}
                          </span>
                        )}
                      </div>
                      <div className="text-cdl-navy-600 text-lg">
                        {associadoExpandido === det.associadoId ? '▲' : '▼'}
                      </div>
                    </div>
                  </div>

                  {associadoExpandido === det.associadoId && det.itensFatura && det.itensFatura.length > 0 && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                        <span>📋</span> Itens da {isSimulacao ? 'Simulação' : 'Fatura'}
                      </h4>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-cdl-navy-50">
                            <tr>
                              {['Código','Descrição','Quantidade','Valor Unit.','Valor Total'].map((h, i) => (
                                <th
                                  key={h}
                                  className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                                    i >= 2 ? 'text-right' : 'text-left'
                                  }`}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {det.itensFatura.map((item, itemIdx) => (
                              <tr key={itemIdx} className="hover:bg-cdl-navy-50/40 transition-colors">
                                <td className="px-3 py-2 font-mono text-xs text-cdl-navy-700">
                                  {item.codigoProduto || '-'}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.descricao || '-'}</td>
                                <td className="px-3 py-2 text-right text-gray-700">{item.quantidade || 0}</td>
                                <td className="px-3 py-2 text-right text-gray-700">
                                  {formatCurrency(item.valorUnitario || 0)}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-cdl-navy-700">
                                  {formatCurrency(item.valorTotal || 0)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-cdl-navy-50">
                            <tr>
                              <td colSpan={4} className="px-3 py-2 text-right font-semibold text-cdl-navy-700">
                                Total da {isSimulacao ? 'Simulação' : 'Fatura'}:
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-cdl-navy-700">
                                {formatCurrency(det.valorNota || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {associadoExpandido === det.associadoId &&
                    (!det.itensFatura || det.itensFatura.length === 0) &&
                    det.processado && (
                    <div className="p-4 bg-white border-t border-gray-200 text-center text-gray-500 text-sm">
                      {det.gerouNota
                        ? 'Nenhum item encontrado para esta fatura'
                        : 'Nenhum item gerado na simulação'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {mostrarDetalhes && (!resultado.detalhes || resultado.detalhes.length === 0) && (
            <div className="text-center py-8 bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg">
              <p className="text-cdl-navy-600 text-sm">Nenhum detalhe disponível</p>
            </div>
          )}

          {resultado.erros && resultado.erros.length > 0 && (
            <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-4 rounded-lg mt-6">
              <h3 className="font-semibold text-cdl-danger-600 mb-2 flex items-center gap-2">
                <span>❌</span> Erros Gerais
              </h3>
              <ul className="list-disc list-inside text-sm text-cdl-danger-500 space-y-1">
                {resultado.erros.map((erro, idx) => (
                  <li key={idx}>{erro}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 bg-cdl-neutral-50 shrink-0">
          {onVoltarSelecao && (
            <button
              onClick={handleVoltar}
              className="px-4 py-2.5 border border-cdl-navy-200 text-cdl-navy-700 bg-white
                         rounded-lg hover:bg-cdl-navy-50 transition-colors font-medium"
            >
              ← Voltar para Seleção
            </button>
          )}
          {isSimulacao && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-cdl-yellow-gradient text-cdl-navy-900 rounded-lg
                         hover:brightness-105 transition-all font-medium active:scale-[.98]"
            >
              ✅ Prosseguir para Faturamento
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg
                       hover:bg-cdl-navy-800 transition-all font-medium active:scale-[.98]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalResultadoProcessamento;