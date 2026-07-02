// src/pages/faturamento/FaturaDetalhes.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import faturamentoService from '../../services/faturamentoService';
import { produtoService } from '../../services/produtoService';
import ConfirmModal from '../../components/ui/ConfirmModal';

interface FaturaItem {
  id: number;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface Produto {
  id: number;
  codigo: string;
  codigoRm: string;
  descricao: string;
  valor: number;
  nome: string;
  nomeCompleto: string;
  valorUnitario: number;
}

interface Fatura {
  id: number;
  numeroFatura: string;
  numeroNotaDebito?: string;
  valorTotal: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
  processadoRm: boolean;
  mesReferencia?: number;
  anoReferencia?: number;
  criadoEm: string;
  observacao?: string;
  associadoId: number;
  associadoNome: string;
  cnpjCpf?: string;
  codigoSpc?: string;
  numeroRps?: number;
  itens?: FaturaItem[];
}

const FaturaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  // Estado para edição inline
  const [itensEditando, setItensEditando] = useState<{ [key: number]: boolean }>({});
  
  // Estado para novo item
  const [novoItem, setNovoItem] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: 1,
    valorUnitario: 0
  });

  // Estado para busca de produtos
  const [buscaProdutos, setBuscaProdutos] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [mostrarDropdownProdutos, setMostrarDropdownProdutos] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

  // Estado para o modal de confirmação
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'success' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    confirmVariant: 'danger'
  });

  useEffect(() => {
    if (id) {
      carregarFatura();
    }
  }, [id]);

  // Funções do Confirm Modal
  const openConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar',
    confirmVariant: 'danger' | 'success' | 'warning' | 'info' = 'danger'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
      confirmVariant
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Buscar produtos
  const buscarProdutos = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setProdutosFiltrados([]);
      return;
    }

    setCarregandoProdutos(true);
    try {
      const response = await produtoService.listarSimples({
        termo: termo,
        page: 0,
        size: 20,
        ativo: true
      });
      
      const produtos = response.content.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        codigoRm: p.codigoRm || p.codigo,
        descricao: p.descricao || p.nome || p.nomeCompleto,
        nome: p.nome,
        nomeCompleto: p.nomeCompleto,
        valor: p.valorUnitario || 0,
        valorUnitario: p.valorUnitario || 0
      }));
      
      console.log('📦 Produtos encontrados:', produtos.map(p => ({ 
        id: p.id, 
        codigo: p.codigo, 
        codigoRm: p.codigoRm 
      })));
      
      setProdutosFiltrados(produtos);
      setMostrarDropdownProdutos(true);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setCarregandoProdutos(false);
    }
  }, []);

  // Selecionar produto do dropdown
  const selecionarProduto = (produto: Produto) => {
    console.log('📌 Produto selecionado:', {
      id: produto.id,
      codigo: produto.codigo,
      codigoRm: produto.codigoRm
    });
    
    setNovoItem({
      codigoProduto: produto.codigoRm,
      descricao: produto.descricao || produto.nome || '',
      quantidade: 1,
      valorUnitario: produto.valor || produto.valorUnitario || 0
    });
    setBuscaProdutos(produto.descricao || produto.nome || '');
    setMostrarDropdownProdutos(false);
  };

  // Debounce para busca de produtos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaProdutos) {
        buscarProdutos(buscaProdutos);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaProdutos, buscarProdutos]);

  // Validação do ID do item
  const isValidItemId = (itemId: any): boolean => {
    if (itemId === undefined || itemId === null || itemId === 0) {
      return false;
    }
    const num = Number(itemId);
    return !isNaN(num) && num > 0;
  };

  // Obter ID do item de forma segura
  const getItemId = (item: any): number | null => {
    if (!item) return null;
    
    const id = item.id || item.itemId || item.faturaItemId;
    
    if (isValidItemId(id)) {
      return Number(id);
    }
    
    console.warn('⚠️ Não foi possível obter ID válido do item:', item);
    return null;
  };

  const carregarFatura = async () => {
    try {
      setLoading(true);
      const data = await faturamentoService.buscarFatura(parseInt(id!));
      console.log('📥 Fatura carregada:', data);
      console.log('📋 Itens:', data.itens);
      
      if (data.itens && data.itens.length > 0) {
        data.itens.forEach((item: any, index: number) => {
          const itemId = getItemId(item);
          console.log(`📋 Item ${index}:`, {
            id: item.id,
            itemId: item.itemId,
            faturaItemId: item.faturaItemId,
            idEncontrado: itemId,
            isValid: isValidItemId(itemId),
            codigoProduto: item.codigoProduto,
            descricao: item.descricao
          });
        });
      }
      
      setFatura(data);
      setItensEditando({});
      setNovoItem({ codigoProduto: '', descricao: '', quantidade: 1, valorUnitario: 0 });
      setBuscaProdutos('');
    } catch (error: any) {
      console.error('Erro ao carregar fatura:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar detalhes da fatura', 'error');
      navigate('/faturamento/faturas');
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dateStr.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dateStr;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'PAGA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'PAGA': return 'Paga';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return '⏳';
      case 'PAGA': return '✅';
      case 'CANCELADA': return '❌';
      default: return '📄';
    }
  };

  // ========== FUNÇÕES DE EDIÇÃO INLINE ==========

  const iniciarEdicaoItem = (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) {
      showToast('ID do item inválido', 'error');
      console.warn('⚠️ Tentativa de editar item com ID inválido:', item);
      return;
    }
    setItensEditando(prev => ({ ...prev, [itemId!]: true }));
  };

  const cancelarEdicaoItem = (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) {
      console.warn('⚠️ Tentativa de cancelar edição com ID inválido:', item);
      return;
    }
    setItensEditando(prev => ({ ...prev, [itemId!]: false }));
    carregarFatura();
  };

  const alterarItemEditando = (item: FaturaItem, campo: string, valor: any) => {
    const itemId = getItemId(item);
    if (!fatura || !isValidItemId(itemId)) return;
    
    const novosItens = fatura.itens?.map(i => {
      const currentId = getItemId(i);
      if (currentId === itemId) {
        const updated = { ...i, [campo]: valor };
        if (campo === 'quantidade' || campo === 'valorUnitario') {
          updated.valorTotal = updated.quantidade * updated.valorUnitario;
        }
        return updated;
      }
      return i;
    });
    
    setFatura({ ...fatura, itens: novosItens });
  };

  // Salvar edição de item (com confirm modal)
  const salvarEdicaoItem = async (item: FaturaItem) => {
    const itemId = getItemId(item);
    
    if (!isValidItemId(itemId)) {
      showToast('ID do item inválido para salvar', 'error');
      console.error('❌ itemId inválido:', item);
      return;
    }

    if (!fatura) {
      showToast('Fatura não carregada', 'error');
      return;
    }

    if (!item.codigoProduto || !item.descricao) {
      showToast('Código e descrição do item são obrigatórios', 'warning');
      return;
    }

    if (item.quantidade <= 0 || item.valorUnitario <= 0) {
      showToast('Quantidade e valor unitário devem ser maiores que zero', 'warning');
      return;
    }

    openConfirmModal(
      'Salvar Alterações',
      `Deseja salvar as alterações do item "${item.descricao}"?`,
      async () => {
        closeConfirmModal();
        setSalvando(true);
        try {
          console.log('📤 Atualizando item:', {
            faturaId: fatura.id,
            itemId: itemId,
            item: {
              codigoProduto: item.codigoProduto,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnitario: item.valorUnitario,
              tipoLancamento: item.tipoLancamento || 'D'
            }
          });

          await faturamentoService.atualizarItemFatura(fatura.id, itemId!, {
            codigoProduto: item.codigoProduto,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            tipoLancamento: item.tipoLancamento || 'D'
          });
          
          showToast('Item atualizado com sucesso!', 'success');
          setItensEditando(prev => {
            const newState = { ...prev };
            delete newState[itemId!];
            return newState;
          });
          await carregarFatura();
        } catch (error: any) {
          console.error('❌ Erro ao atualizar item:', error);
          const errorMsg = error.response?.data?.message || error.message || 'Erro ao atualizar item';
          showToast(errorMsg, 'error');
        } finally {
          setSalvando(false);
        }
      },
      'Sim, salvar',
      'Cancelar',
      'success'
    );
  };

  // Remover item (com confirm modal)
  const removerItem = async (item: FaturaItem) => {
    const itemId = getItemId(item);
    
    if (!isValidItemId(itemId)) {
      showToast('ID do item inválido', 'error');
      return;
    }

    openConfirmModal(
      'Remover Item da Fatura',
      `Tem certeza que deseja remover o item "${item.descricao || 'sem descrição'}" da fatura? Esta ação não poderá ser desfeita.`,
      async () => {
        closeConfirmModal();
        setSalvando(true);
        try {
          await faturamentoService.removerItemFatura(fatura!.id, itemId!);
          showToast('Item removido com sucesso!', 'success');
          await carregarFatura();
        } catch (error: any) {
          console.error('❌ Erro ao remover item:', error);
          showToast(error.response?.data?.message || 'Erro ao remover item', 'error');
        } finally {
          setSalvando(false);
        }
      },
      'Sim, remover',
      'Cancelar',
      'danger'
    );
  };

  // Adicionar item
  const adicionarItem = async () => {
    if (!novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0) {
      showToast('Preencha todos os campos do item', 'warning');
      return;
    }

    setSalvando(true);
    try {
      console.log('📤 Adicionando item:', {
        faturaId: fatura!.id,
        item: novoItem
      });

      await faturamentoService.adicionarItemFatura(fatura!.id, {
        codigoProduto: novoItem.codigoProduto,
        descricao: novoItem.descricao,
        quantidade: novoItem.quantidade,
        valorUnitario: novoItem.valorUnitario
      });
      
      showToast('Item adicionado com sucesso!', 'success');
      setNovoItem({ codigoProduto: '', descricao: '', quantidade: 1, valorUnitario: 0 });
      setBuscaProdutos('');
      await carregarFatura();
    } catch (error: any) {
      console.error('❌ Erro ao adicionar item:', error);
      showToast(error.response?.data?.message || 'Erro ao adicionar item', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // 🔥 FUNÇÃO SALVAR E FECHAR - Salva, fecha e vai para listagem
  const handleSalvarEFechar = async () => {
    // Verificar se há itens em edição
    const hasEditando = Object.keys(itensEditando).length > 0;
    
    if (hasEditando) {
      // Se há itens em edição, perguntar se deseja salvar antes de sair
      openConfirmModal(
        'Salvar Alterações',
        'Existem itens em edição. Deseja salvar as alterações antes de sair?',
        async () => {
          setSalvando(true);
          try {
            // Salvar todos os itens em edição
            for (const itemId of Object.keys(itensEditando)) {
              const item = fatura?.itens?.find(i => i.id === Number(itemId));
              if (item) {
                await faturamentoService.atualizarItemFatura(fatura!.id, Number(itemId), {
                  codigoProduto: item.codigoProduto,
                  descricao: item.descricao,
                  quantidade: item.quantidade,
                  valorUnitario: item.valorUnitario,
                  tipoLancamento: item.tipoLancamento || 'D'
                });
              }
            }
            showToast('Alterações salvas com sucesso!', 'success');
            navigate('/faturamento/faturas');
          } catch (error: any) {
            console.error('❌ Erro ao salvar alterações:', error);
            showToast(error.response?.data?.message || 'Erro ao salvar alterações', 'error');
          } finally {
            setSalvando(false);
          }
        },
        'Sim, salvar',
        'Cancelar',
        'success'
      );
    } else {
      // Se não há itens em edição, ir direto para faturas
      navigate('/faturamento/faturas');
    }
  };

  const podeEditar = fatura?.status === 'PENDENTE' || fatura?.status === 'SIMULADO';
  
  if (loading) {
    return <Loading />;
  }
  
  if (!fatura) {
    return (
      <div className="p-6">
        <BreadCrumb atual="Detalhes da Fatura" />
        <div className="text-center py-12">
          <p className="text-gray-500">Fatura não encontrada</p>
          <button onClick={() => navigate('/faturamento/faturas')} className="mt-4 text-blue-600 hover:text-blue-800">
            Voltar para listagem
          </button>
        </div>
      </div>
    );
  }

  const totalFatura = fatura.itens?.reduce((acc, item) => acc + (item.valorTotal || 0), 0) || 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        items={[
          { label: 'Faturamento', path: '/faturamento/faturas' },
          { label: 'Faturas Geradas', path: '/faturamento/faturas' },
          { label: `Fatura ${fatura.numeroFatura}` }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Fatura {fatura.numeroFatura}</h1>
            <p className="text-gray-500 mt-1">ID: {fatura.id}</p>
            {fatura.numeroRps && (
              <p className="text-gray-500 mt-1">Nº RPS: {fatura.numeroRps}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${getStatusColor(fatura.status)}`}>
              {getStatusIcon(fatura.status)} {getStatusText(fatura.status)}
            </span>
          </div>
        </div>
        
        {/* Informações do Associado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-4 border-b">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Associado</h3>
            <p className="text-lg font-semibold text-gray-900">{fatura.associadoNome}</p>
            <p className="text-sm text-gray-600">{fatura.cnpjCpf}</p>
            {fatura.codigoSpc && (
              <p className="text-sm text-gray-500 mt-1">Código SPC: {fatura.codigoSpc}</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Datas</h3>
            <p><span className="text-gray-500">Emissão:</span> {formatDate(fatura.dataEmissao)}</p>
            <p><span className="text-gray-500">Vencimento:</span> {formatDate(fatura.dataVencimento)}</p>
            {fatura.mesReferencia && fatura.anoReferencia && (
              <p className="text-gray-500 mt-1">Competência: {fatura.mesReferencia}/{fatura.anoReferencia}</p>
            )}
          </div>
        </div>
        
        {/* Itens da Fatura com Edição Inline */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📋 Itens da Fatura</h3>
          {podeEditar && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              ✏️ Modo Edição
            </span>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                {podeEditar && (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {fatura.itens && fatura.itens.length > 0 ? (
                fatura.itens.map((item) => {
                  const itemId = getItemId(item);
                  const isValid = isValidItemId(itemId);
                  
                  return (
                    <tr key={itemId || Math.random()} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {itensEditando[itemId!] ? (
                          <input
                            type="text"
                            value={item.codigoProduto}
                            onChange={(e) => alterarItemEditando(item, 'codigoProduto', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm font-mono">{item.codigoProduto || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {itensEditando[itemId!] ? (
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => alterarItemEditando(item, 'descricao', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm">{item.descricao}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {itensEditando[itemId!] ? (
                          <input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => alterarItemEditando(item, 'quantidade', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right border rounded px-2 py-1 text-sm"
                            min="0"
                            step="0.01"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm">{item.quantidade}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {itensEditando[itemId!] ? (
                          <input
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => alterarItemEditando(item, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right border rounded px-2 py-1 text-sm"
                            min="0"
                            step="0.01"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm">{formatCurrency(item.valorUnitario)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(item.valorTotal)}
                      </td>
                      {podeEditar && (
                        <td className="px-4 py-3 text-center">
                          {isValid ? (
                            itensEditando[itemId!] ? (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => salvarEdicaoItem(item)}
                                  disabled={salvando}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Salvar"
                                >
                                  💾
                                </button>
                                <button
                                  onClick={() => cancelarEdicaoItem(item)}
                                  disabled={salvando}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Cancelar"
                                >
                                  ❌
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => iniciarEdicaoItem(item)}
                                  disabled={salvando}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => removerItem(item)}
                                  disabled={salvando}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Remover"
                                >
                                  🗑️
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">ID inválido</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={podeEditar ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                    Nenhum item encontrado nesta fatura
                  </td>
                </tr>
              )}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={podeEditar ? 4 : 4} className="px-4 py-3 text-right">
                  Total da Fatura:
                </td>
                <td className="px-4 py-3 text-right text-blue-600 text-lg">
                  {formatCurrency(totalFatura)}
                </td>
                {podeEditar && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Adicionar Novo Item COM BUSCA DE PRODUTOS */}
        {podeEditar && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">➕ Adicionar Novo Item</h4>
            
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="relative col-span-2">
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={buscaProdutos}
                    onChange={(e) => setBuscaProdutos(e.target.value)}
                    onFocus={() => {
                      if (buscaProdutos.length >= 2) {
                        setMostrarDropdownProdutos(true);
                      }
                    }}
                    className="w-full p-2 border rounded-lg"
                    disabled={salvando}
                  />
                  {carregandoProdutos && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {mostrarDropdownProdutos && produtosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {produtosFiltrados.map((produto) => (
                        <button
                          key={produto.id}
                          onClick={() => selecionarProduto(produto)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b last:border-b-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm">{produto.descricao || produto.nome}</div>
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Código RM:</span>{' '}
                              <span className="font-mono text-blue-600 font-semibold">{produto.codigoRm}</span>
                              {produto.codigo && produto.codigo !== produto.codigoRm && (
                                <span className="ml-2 text-gray-400">(interno: {produto.codigo})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(produto.valor || produto.valorUnitario || 0)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {mostrarDropdownProdutos && buscaProdutos.length >= 2 && produtosFiltrados.length === 0 && !carregandoProdutos && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                      Nenhum produto encontrado para "{buscaProdutos}"
                    </div>
                  )}
                </div>
                
                <input
                  type="text"
                  placeholder="Código RM"
                  value={novoItem.codigoProduto}
                  onChange={(e) => setNovoItem({ ...novoItem, codigoProduto: e.target.value })}
                  className="p-2 border rounded-lg font-mono bg-gray-50"
                  disabled={salvando}
                  title="Código RM do produto"
                />
                
                <input
                  type="text"
                  placeholder="Descrição"
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  className="p-2 border rounded-lg"
                  disabled={salvando}
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseFloat(e.target.value) || 0 })}
                  className="p-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  disabled={salvando}
                />
                <input
                  type="number"
                  placeholder="Valor Unit."
                  value={novoItem.valorUnitario}
                  onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: parseFloat(e.target.value) || 0 })}
                  className="p-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  disabled={salvando}
                />
                <button
                  onClick={adicionarItem}
                  disabled={salvando || !novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-1"
                >
                  {salvando ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    '➕ Adicionar'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Observação */}
        {fatura.observacao && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observação:</span> {fatura.observacao}
            </p>
          </div>
        )}
        
        {/* 🔥 Botões: Salvar e Fechar MODIFICADO */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() => navigate('/faturamento/faturas')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ❌ Fechar
          </button>
          
          {podeEditar && (
            <button
              onClick={handleSalvarEFechar}
              disabled={salvando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              {salvando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '💾 Salvar e Fechar'
              )}
            </button>
          )}
          
          <button
            onClick={async () => {
              try {
                showToast('Gerando PDF, aguarde...', 'info');
                const blob = await faturamentoService.exportarPdf(fatura.id);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `fatura_${fatura.numeroFatura}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                showToast('PDF exportado com sucesso!', 'success');
              } catch (error: any) {
                console.error('Erro ao exportar PDF:', error);
                showToast(error.response?.data?.message || 'Erro ao exportar PDF', 'error');
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        confirmVariant={confirmModal.confirmVariant || 'danger'}
      />
    </div>
  );
};

export default FaturaDetalhes;