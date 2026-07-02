// src/components/faturamento/ModalEdicaoFatura.tsx

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
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
  onUpdate
}) => {
  const { showToast } = useMessage();
  const [itens, setItens] = useState<FaturaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editandoItemId, setEditandoItemId] = useState<number | null>(null);
  
  // Novo item
  const [novoItem, setNovoItem] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: 1,
    valorUnitario: 0
  });

  // 🔥 INICIALIZAR ITENS QUANDO O MODAL ABRIR - SEMPRE EM MODO VISUALIZAÇÃO
  useEffect(() => {
    if (isOpen) {
      setItens(itensIniciais);
      setEditandoItemId(null); // 🔥 GARANTIR QUE NENHUM ITEM ESTÁ EM EDIÇÃO
      setNovoItem({ codigoProduto: '', descricao: '', quantidade: 1, valorUnitario: 0 });
    }
  }, [isOpen, itensIniciais]);

  // CALCULAR TOTAL DA FATURA
  const totalFatura = itens.reduce((acc, item) => acc + (item.valorTotal || 0), 0);

  // ADICIONAR ITEM
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
        valorUnitario: novoItem.valorUnitario
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

  // REMOVER ITEM
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

  // SALVAR EDIÇÃO DE ITEM
  const handleSalvarEdicaoItem = async (itemId: number) => {
    const item = itens.find(i => i.id === itemId);
    if (!item) return;

    setLoading(true);
    try {
      await faturamentoService.atualizarItemFatura(faturaId, itemId, {
        codigoProduto: item.codigoProduto,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario
      });
      
      showToast('Item atualizado com sucesso!', 'success');
      setEditandoItemId(null); // 🔥 SAIR DO MODO DE EDIÇÃO
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao atualizar item', 'error');
    } finally {
      setLoading(false);
    }
  };

  // INICIAR EDIÇÃO DE UM ITEM
  const handleIniciarEdicao = (itemId: number) => {
    setEditandoItemId(itemId);
  };

  // CANCELAR EDIÇÃO
  const handleCancelarEdicao = () => {
    setEditandoItemId(null);
    onUpdate();
  };

  // ALTERAR CAMPO DO ITEM EM EDIÇÃO
  const handleAlterarItemEditando = (itemId: number, campo: string, valor: any) => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, [campo]: valor };
        if (campo === 'quantidade' || campo === 'valorUnitario') {
          updated.valorTotal = updated.quantidade * updated.valorUnitario;
        }
        return updated;
      }
      return item;
    }));
  };

  // FECHAR MODAL
  const handleFechar = () => {
    if (editandoItemId !== null) {
      if (!window.confirm('Há uma edição em andamento. Deseja cancelar?')) {
        return;
      }
    }
    onClose();
    onUpdate();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleFechar} title={`✏️ Editar Fatura ${faturaNumero}`} size="xl">
      <div className="space-y-6">
        {/* Informação de status */}
        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <span>ℹ️</span>
          <span>
            <strong>Modo de Edição:</strong> Clique em <strong>✏️</strong> para editar um item. 
            As alterações só serão aplicadas ao clicar em <strong>💾 Salvar</strong>.
          </span>
        </div>

        {/* Lista de Itens Atuais */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Itens da Fatura</h3>
          <div className="border rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Código</th>
                  <th className="px-3 py-2 text-left">Descrição</th>
                  <th className="px-3 py-2 text-right">Qtd</th>
                  <th className="px-3 py-2 text-right">Vl. Unit.</th>
                  <th className="px-3 py-2 text-right">Vl. Total</th>
                  <th className="px-3 py-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                      Nenhum item na fatura
                    </td>
                  </tr>
                ) : (
                  itens.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        {editandoItemId === item.id ? (
                          <input
                            type="text"
                            value={item.codigoProduto}
                            onChange={(e) => handleAlterarItemEditando(item.id, 'codigoProduto', e.target.value)}
                            className="w-full border rounded px-1 py-0.5"
                          />
                        ) : (
                          item.codigoProduto
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {editandoItemId === item.id ? (
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => handleAlterarItemEditando(item.id, 'descricao', e.target.value)}
                            className="w-full border rounded px-1 py-0.5"
                          />
                        ) : (
                          item.descricao
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editandoItemId === item.id ? (
                          <input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => handleAlterarItemEditando(item.id, 'quantidade', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right border rounded px-1 py-0.5"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          item.quantidade
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {editandoItemId === item.id ? (
                          <input
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => handleAlterarItemEditando(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className="w-24 text-right border rounded px-1 py-0.5"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          formatCurrency(item.valorUnitario)
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.valorTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {editandoItemId === item.id ? (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleSalvarEdicaoItem(item.id)}
                              className="text-green-600 hover:text-green-800"
                              disabled={loading}
                              title="Salvar alterações"
                            >
                              💾
                            </button>
                            <button
                              onClick={handleCancelarEdicao}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={loading}
                              title="Cancelar edição"
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => handleIniciarEdicao(item.id)}
                              className="text-blue-600 hover:text-blue-800"
                              disabled={loading}
                              title="Editar item"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleRemoverItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={loading}
                              title="Remover item"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="px-3 py-2 text-right">Total da Fatura</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(totalFatura)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Adicionar Novo Item */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-700 mb-3">➕ Adicionar Novo Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Código do Produto"
              value={novoItem.codigoProduto}
              onChange={(e) => setNovoItem({ ...novoItem, codigoProduto: e.target.value })}
              className="p-2 border rounded-lg"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Descrição"
              value={novoItem.descricao}
              onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
              className="p-2 border rounded-lg"
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Quantidade"
              value={novoItem.quantidade}
              onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseFloat(e.target.value) || 0 })}
              className="p-2 border rounded-lg"
              min="0"
              step="0.01"
              disabled={loading}
            />
            <input
              type="number"
              placeholder="Valor Unitário"
              value={novoItem.valorUnitario}
              onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: parseFloat(e.target.value) || 0 })}
              className="p-2 border rounded-lg"
              min="0"
              step="0.01"
              disabled={loading}
            />
            <button
              onClick={handleAdicionarItem}
              disabled={loading || !novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '➕ Adicionar'
              )}
            </button>
          </div>
        </div>

        {/* 🔥 BOTÃO FECHAR E ATUALIZAR - APENAS UM BOTÃO */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleFechar}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '✅ Fechar e Atualizar'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalEdicaoFatura;