// src/components/faturamento/ModalEdicaoFatura.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useMessage } from '../../providers/MessageProvider';
import { formatCurrency } from '../../utils/formatUtils';
import faturamentoService from '../../services/faturamentoService';

interface FaturaItem {
  id: number;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface ModalEdicaoFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  faturaId: number;
  faturaNumero: string;
  itens: FaturaItem[];
  onUpdate: () => void;
}

const ModalEdicaoFatura: React.FC<ModalEdicaoFaturaProps> = ({
  isOpen,
  onClose,
  faturaId,
  faturaNumero,
  itens: itensIniciais,
  onUpdate,
}) => {
  const { showToast } = useMessage();
  const [itens, setItens] = useState<FaturaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);

  const [novoItem, setNovoItem] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setItens(itensIniciais);
      setEditandoItemId(null);
      setNovoItem({ codigoProduto: '', descricao: '', quantidade: 1, valorUnitario: 0 });
    }
  }, [isOpen, itensIniciais]);

  const totalFatura = itens.reduce((acc, item) => acc + (item.valorTotal || 0), 0);

  const handleAdicionarItem = async () => {
    if (!novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0) {
      showToast('Preencha todos os campos do item', 'warning');
      return;
    }
    setLoading(true);
    try {
      await faturamentoService.adicionarItemFatura(faturaId, {
        codigoProduto: novoItem.codigoProduto,
        descricao: novoItem.descricao,
        quantidade: novoItem.quantidade,
        valorUnitario: novoItem.valorUnitario,
      });
      showToast('Item adicionado com sucesso!', 'success');
      setNovoItem({ codigoProduto: '', descricao: '', quantidade: 1, valorUnitario: 0 });
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao adicionar item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverItem = async (itemId: number) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    setLoading(true);
    try {
      await faturamentoService.removerItemFatura(faturaId, itemId);
      showToast('Item removido com sucesso!', 'success');
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao remover item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEdicaoItem = async (itemId: number) => {
    const item = itens.find((i) => i.id === itemId);
    if (!item) return;
    setLoading(true);
    try {
      await faturamentoService.atualizarItemFatura(faturaId, itemId, {
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
      });
      showToast('Item atualizado com sucesso!', 'success');
      setEditandoItemId(null);
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao atualizar item', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEdicao = (itemId: number) => setEditandoItemId(itemId);

  const handleCancelarEdicao = () => {
    setEditandoItemId(null);
    onUpdate();
  };

  const handleAlterarItemEditando = (itemId: number, campo: string, valor: any) => {
    setItens((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [campo]: valor };
          if (campo === 'quantidade' || campo === 'valorUnitario') {
            updated.valorTotal = updated.quantidade * updated.valorUnitario;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleFechar = () => {
    if (editandoItemId !== null) {
      if (!window.confirm('Há uma edição em andamento. Deseja cancelar?')) return;
    }
    onClose();
    onUpdate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleFechar} aria-hidden="true" />

      <div className="relative w-full sm:max-w-5xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 flex items-center gap-2">
            <span>✏️</span> Editar Fatura {faturaNumero}
          </h2>
          <button
            onClick={handleFechar}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Info modo edição */}
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-sm text-cdl-navy-700 flex items-start gap-2">
            <span>ℹ️</span>
            <span>
              <strong>Modo de Edição:</strong> Clique em <strong>✏️</strong> para editar um item.
              As alterações só serão aplicadas ao clicar em <strong>💾 Salvar</strong>.
            </span>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-semibold text-cdl-navy-700 mb-3">Itens da Fatura</h3>
            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Código','Descrição','Qtd','Vl. Unit.','Vl. Total','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                          i >= 2 && i <= 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {itens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-cdl-navy-600 text-sm">
                        Nenhum item na fatura
                      </td>
                    </tr>
                  ) : (
                    itens.map((item) => (
                      <tr key={item.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-3 py-2 text-gray-900">
                          {editandoItemId === item.id ? (
                            <input
                              type="text"
                              value={item.codigoProduto}
                              onChange={(e) => handleAlterarItemEditando(item.id, 'codigoProduto', e.target.value)}
                              className="w-full border border-cdl-navy-300 rounded px-2 py-1 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            />
                          ) : (
                            <span className="font-mono text-xs">{item.codigoProduto}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          {editandoItemId === item.id ? (
                            <input
                              type="text"
                              value={item.descricao}
                              onChange={(e) => handleAlterarItemEditando(item.id, 'descricao', e.target.value)}
                              className="w-full border border-cdl-navy-300 rounded px-2 py-1 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            />
                          ) : (
                            item.descricao
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          {editandoItemId === item.id ? (
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => handleAlterarItemEditando(item.id, 'quantidade', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right border border-cdl-navy-300 rounded px-2 py-1 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            item.quantidade
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900">
                          {editandoItemId === item.id ? (
                            <input
                              type="number"
                              value={item.valorUnitario}
                              onChange={(e) => handleAlterarItemEditando(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                              className="w-28 text-right border border-cdl-navy-300 rounded px-2 py-1 text-sm
                                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            formatCurrency(item.valorUnitario)
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-cdl-navy-700">
                          {formatCurrency(item.valorTotal)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {editandoItemId === item.id ? (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleSalvarEdicaoItem(item.id)}
                                className="p-1.5 text-cdl-green-600 hover:text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                                disabled={loading}
                                title="Salvar alterações"
                              >💾</button>
                              <button
                                onClick={handleCancelarEdicao}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-cdl-neutral-50 rounded transition-colors"
                                disabled={loading}
                                title="Cancelar edição"
                              >❌</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleIniciarEdicao(item.id)}
                                className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                                disabled={loading}
                                title="Editar item"
                              >✏️</button>
                              <button
                                onClick={() => handleRemoverItem(item.id)}
                                className="p-1.5 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                                disabled={loading}
                                title="Remover item"
                              >🗑️</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-cdl-yellow-50 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-right text-cdl-navy-700">Total da Fatura</td>
                    <td className="px-3 py-2 text-right text-cdl-navy-700">{formatCurrency(totalFatura)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Novo item */}
          <div className="border-t border-gray-200 pt-5">
            <h4 className="font-medium text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>➕</span> Adicionar Novo Item
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Código do Produto"
                value={novoItem.codigoProduto}
                onChange={(e) => setNovoItem({ ...novoItem, codigoProduto: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Descrição"
                value={novoItem.descricao}
                onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                disabled={loading}
              />
              <input
                type="number"
                placeholder="Quantidade"
                value={novoItem.quantidade}
                onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <input
                type="number"
                placeholder="Valor Unitário"
                value={novoItem.valorUnitario}
                onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <button
                onClick={handleAdicionarItem}
                disabled={loading || !novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0}
                className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center
                           gap-2 font-medium transition-all active:scale-[.98]"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : '➕ Adicionar'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex justify-end bg-cdl-neutral-50 shrink-0">
          <button
            onClick={handleFechar}
            disabled={loading}
            className="px-6 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-all active:scale-[.98]
                       font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Salvando...
              </>
            ) : '✅ Fechar e Atualizar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEdicaoFatura;