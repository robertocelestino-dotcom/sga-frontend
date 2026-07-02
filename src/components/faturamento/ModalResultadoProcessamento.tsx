// src/components/faturamento/ModalResultadoProcessamento.tsx

import React, { useState } from 'react';

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

const ModalResultadoProcessamento: React.FC<ModalResultadoProcessamentoProps> = ({
  isOpen,
  onClose,
  onVoltarSelecao,
  resultado,
  titulo = 'Resultado do Processamento'
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 sticky top-0">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{titulo}</h2>
              {isSimulacao && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  SIMULAÇÃO
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          {/* Body */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{resultado.associadosProcessados || 0}</div>
                <div className="text-sm text-gray-600">Associados Processados</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{resultado.associadosComErro || 0}</div>
                <div className="text-sm text-gray-600">Com Erro</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{resultado.associadosJaFaturados || 0}</div>
                <div className="text-sm text-gray-600">Já Faturados</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{resultado.totalNotasGeradas || 0}</div>
                <div className="text-sm text-gray-600">Faturas Geradas</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(resultado.valorTotalDebito || 0)}</div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
            
            {/* Botão Mostrar Detalhes */}
            <button
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
            >
              {mostrarDetalhes ? '▼' : '▶'} 
              {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes por Associado ({resultado.detalhes?.length || 0})
            </button>
            
            {/* Detalhes por Associado */}
            {mostrarDetalhes && resultado.detalhes && resultado.detalhes.length > 0 && (
              <div className="space-y-4">
                {resultado.detalhes.map((det, idx) => (
                  <div key={det.associadoId || idx} className="border rounded-lg overflow-hidden">
                    {/* Cabeçalho do Associado */}
                    <div 
                      className={`px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 ${
                        det.processado ? 'bg-green-50' : 'bg-red-50'
                      }`}
                      onClick={() => toggleExpandirAssociado(det.associadoId)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{det.associadoNome || '-'}</span>
                          {det.mensagemErro && det.mensagemErro.includes('já possui fatura') && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                              Já Faturado
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{det.cnpjCpf || '-'}</div>
                        {det.mensagemErro && (
                          <div className={`text-xs mt-1 ${det.mensagemErro.includes('já possui') ? 'text-yellow-600' : 'text-red-500'}`}>
                            {det.mensagemErro}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Valor</div>
                          <div className="font-semibold text-gray-900">{formatCurrency(det.valorNota || 0)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Status</div>
                          {det.processado ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              ✓ {det.gerouNota ? 'Fatura Gerada' : 'Processado'}
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              ✗ {det.mensagemErro?.includes('já possui') ? 'Já Faturado' : 'Erro'}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xl">
                          {associadoExpandido === det.associadoId ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Itens da Fatura */}
                    {associadoExpandido === det.associadoId && det.itensFatura && det.itensFatura.length > 0 && (
                      <div className="p-4 bg-white border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          📋 Itens da {isSimulacao ? 'Simulação' : 'Fatura'}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {det.itensFatura.map((item, itemIdx) => (
                                <tr key={itemIdx} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-mono text-xs">{item.codigoProduto || '-'}</td>
                                  <td className="px-3 py-2 text-sm">{item.descricao || '-'}</td>
                                  <td className="px-3 py-2 text-right">{item.quantidade || 0}</td>
                                  <td className="px-3 py-2 text-right">{formatCurrency(item.valorUnitario || 0)}</td>
                                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.valorTotal || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan={4} className="px-3 py-2 text-right font-medium text-gray-700">
                                  Total da {isSimulacao ? 'Simulação' : 'Fatura'}:
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-blue-600">
                                  {formatCurrency(det.valorNota || 0)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    {/* Mensagem quando não há itens */}
                    {associadoExpandido === det.associadoId && (!det.itensFatura || det.itensFatura.length === 0) && det.processado && (
                      <div className="p-4 bg-white border-t text-center text-gray-500 text-sm">
                        {det.gerouNota ? 'Nenhum item encontrado para esta fatura' : 'Nenhum item gerado na simulação'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Mensagem quando não há detalhes */}
            {mostrarDetalhes && (!resultado.detalhes || resultado.detalhes.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                Nenhum detalhe disponível
              </div>
            )}
            
            {/* Erros Gerais */}
            {resultado.erros && resultado.erros.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-6">
                <h3 className="font-semibold text-red-800 mb-2">❌ Erros Gerais</h3>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {resultado.erros.map((erro, idx) => (
                    <li key={idx}>{erro}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 sticky bottom-0">
            {onVoltarSelecao && (
              <button
                onClick={handleVoltar}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Voltar para Seleção
              </button>
            )}
            {isSimulacao && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Prosseguir para Faturamento
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalResultadoProcessamento;