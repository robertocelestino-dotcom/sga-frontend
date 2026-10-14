// src/pages/faturamento/FaturaDetalhes.tsx - VERSÃO CDL
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';
import faturamentoService from '../../services/faturamentoService';
import { produtoService } from '../../services/produtoService';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { PermissionGuard } from '../../components/PermissionGuard';
import { useAuthStore } from '../../stores/authStore';
import ModalLogFatura from '../../components/faturamento/ModalLogFatura';
import { formatDateWithoutTimezone } from '../../utils/formatUtils';

interface FaturaItem {
  id: number;
  codigoProduto: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  tipoLancamento?: string;
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
  const { hasPermission, user } = useAuthStore();

  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [itensEditando, setItensEditando] = useState<{ [key: number]: boolean }>({});

  const [novoItem, setNovoItem] = useState({
    codigoProduto: '',
    descricao: '',
    quantidade: 1,
    valorUnitario: 0,
  });

  const [buscaProdutos, setBuscaProdutos] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [mostrarDropdownProdutos, setMostrarDropdownProdutos] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

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
    confirmVariant: 'danger',
  });

  const [modalLogsAberta, setModalLogsAberta] = useState(false);

  const podeVisualizar = hasPermission('FATURA_VIEW') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const podeEditarFatura = hasPermission('FATURA_EDIT') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const podeExportarPdf = hasPermission('FATURA_VIEW') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const podeVerLogs = hasPermission('FATURA_VIEW') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const podeRemoverItem = hasPermission('FATURA_DELETE') || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (id) carregarFatura();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openConfirmModal = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar',
    confirmVariant: 'danger' | 'success' | 'warning' | 'info' = 'danger'
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText, cancelText, confirmVariant });
  };

  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const buscarProdutos = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setProdutosFiltrados([]);
      return;
    }
    setCarregandoProdutos(true);
    try {
      const response = await produtoService.listarSimples({
        termo, page: 0, size: 20, ativo: true,
      });
      const produtos = response.content.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        codigoRm: p.codigoRm || p.codigo,
        descricao: p.descricao || p.nome || p.nomeCompleto,
        nome: p.nome,
        nomeCompleto: p.nomeCompleto,
        valor: p.valorUnitario || 0,
        valorUnitario: p.valorUnitario || 0,
      }));
      setProdutosFiltrados(produtos);
      setMostrarDropdownProdutos(true);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setCarregandoProdutos(false);
    }
  }, []);

  const selecionarProduto = (produto: Produto) => {
    setNovoItem({
      codigoProduto: produto.codigoRm,
      descricao: produto.descricao || produto.nome || '',
      quantidade: 1,
      valorUnitario: produto.valor || produto.valorUnitario || 0,
    });
    setBuscaProdutos(produto.descricao || produto.nome || '');
    setMostrarDropdownProdutos(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaProdutos) buscarProdutos(buscaProdutos);
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaProdutos, buscarProdutos]);

  const isValidItemId = (itemId: any): boolean => {
    if (itemId === undefined || itemId === null || itemId === 0) return false;
    const num = Number(itemId);
    return !isNaN(num) && num > 0;
  };

  const getItemId = (item: any): number | null => {
    if (!item) return null;
    const id = item.id || item.itemId || item.faturaItemId;
    if (isValidItemId(id)) return Number(id);
    return null;
  };

  const carregarFatura = async () => {
    try {
      setLoading(true);
      const data = await faturamentoService.buscarFatura(parseInt(id!));
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
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => formatDateWithoutTimezone(dateStr);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-cdl-yellow-100 text-cdl-yellow-700';
      case 'PAGA': return 'bg-cdl-green-100 text-cdl-green-700';
      case 'CANCELADA': return 'bg-cdl-danger-50 text-cdl-danger-500';
      case 'SIMULADO': return 'bg-cdl-navy-100 text-cdl-navy-700';
      default: return 'bg-cdl-neutral-100 text-cdl-neutral-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'PAGA': return 'Paga';
      case 'CANCELADA': return 'Cancelada';
      case 'SIMULADO': return 'Simulado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return '⏳';
      case 'PAGA': return '✅';
      case 'CANCELADA': return '❌';
      case 'SIMULADO': return '🔍';
      default: return '📄';
    }
  };

  const iniciarEdicaoItem = (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) {
      showToast('ID do item inválido', 'error');
      return;
    }
    setItensEditando((prev) => ({ ...prev, [itemId!]: true }));
  };

  const cancelarEdicaoItem = (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) return;
    setItensEditando((prev) => ({ ...prev, [itemId!]: false }));
    carregarFatura();
  };

  const alterarItemEditando = (item: FaturaItem, campo: string, valor: any) => {
    const itemId = getItemId(item);
    if (!fatura || !isValidItemId(itemId)) return;
    const novosItens = fatura.itens?.map((i) => {
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

  const salvarEdicaoItem = async (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) { showToast('ID do item inválido para salvar', 'error'); return; }
    if (!fatura) { showToast('Fatura não carregada', 'error'); return; }
    if (!item.codigoProduto || !item.descricao) { showToast('Código e descrição do item são obrigatórios', 'warning'); return; }
    if (item.quantidade <= 0 || item.valorUnitario <= 0) { showToast('Quantidade e valor unitário devem ser maiores que zero', 'warning'); return; }

    openConfirmModal(
      'Salvar Alterações',
      `Deseja salvar as alterações do item "${item.descricao}"?`,
      async () => {
        closeConfirmModal();
        setSalvando(true);
        try {
          await faturamentoService.atualizarItemFatura(fatura.id, itemId!, {
            codigoProduto: item.codigoProduto,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            tipoLancamento: item.tipoLancamento || 'D',
          });
          showToast('Item atualizado com sucesso!', 'success');
          setItensEditando((prev) => {
            const s = { ...prev }; delete s[itemId!]; return s;
          });
          await carregarFatura();
        } catch (error: any) {
          console.error('❌ Erro ao atualizar item:', error);
          showToast(error.response?.data?.message || 'Erro ao atualizar item', 'error');
        } finally {
          setSalvando(false);
        }
      },
      'Sim, salvar', 'Cancelar', 'success'
    );
  };

  const removerItem = async (item: FaturaItem) => {
    const itemId = getItemId(item);
    if (!isValidItemId(itemId)) { showToast('ID do item inválido', 'error'); return; }

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
      'Sim, remover', 'Cancelar', 'danger'
    );
  };

  const adicionarItem = async () => {
    if (!novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0) {
      showToast('Preencha todos os campos do item', 'warning');
      return;
    }
    setSalvando(true);
    try {
      await faturamentoService.adicionarItemFatura(fatura!.id, {
        codigoProduto: novoItem.codigoProduto,
        descricao: novoItem.descricao,
        quantidade: novoItem.quantidade,
        valorUnitario: novoItem.valorUnitario,
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

  const handleSalvarEFechar = async () => {
    const hasEditando = Object.keys(itensEditando).length > 0;
    if (hasEditando) {
      openConfirmModal(
        'Salvar Alterações',
        'Existem itens em edição. Deseja salvar as alterações antes de sair?',
        async () => {
          setSalvando(true);
          try {
            for (const itemId of Object.keys(itensEditando)) {
              const item = fatura?.itens?.find((i) => i.id === Number(itemId));
              if (item) {
                await faturamentoService.atualizarItemFatura(fatura!.id, Number(itemId), {
                  codigoProduto: item.codigoProduto,
                  descricao: item.descricao,
                  quantidade: item.quantidade,
                  valorUnitario: item.valorUnitario,
                  tipoLancamento: item.tipoLancamento || 'D',
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
        'Sim, salvar', 'Cancelar', 'success'
      );
    } else {
      navigate('/faturamento/faturas');
    }
  };

  const podeEditar = (fatura?.status === 'PENDENTE' || fatura?.status === 'SIMULADO') && podeEditarFatura;

  if (loading) return <Loading />;

  if (!fatura) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <BreadCrumb atual="Detalhes da Fatura" />
        <div className="bg-white rounded-xl shadow-cdl p-12 mt-6">
          <EmptyState
            icon="📄"
            title="Fatura não encontrada"
            description="Não foi possível localizar esta fatura."
            action={
              <button
                onClick={() => navigate('/faturamento/faturas')}
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ← Voltar para listagem
              </button>
            }
          />
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
          { label: `Fatura ${fatura.numeroFatura}` },
        ]}
      />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700">Fatura {fatura.numeroFatura}</h1>
            <p className="text-gray-500 mt-1">ID: <span className="font-mono text-cdl-navy-700">{fatura.id}</span></p>
            {fatura.numeroRps && (
              <p className="text-gray-500 mt-1">Nº RPS: <span className="font-mono text-cdl-navy-700">{fatura.numeroRps}</span></p>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(fatura.status)}`}>
            <span>{getStatusIcon(fatura.status)}</span>
            <span>{getStatusText(fatura.status)}</span>
          </span>
        </div>

        {/* Associado + Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-medium text-cdl-navy-600 mb-2">Associado</h3>
            <p className="text-lg font-semibold text-gray-900">{fatura.associadoNome}</p>
            <p className="text-sm text-gray-600">{fatura.cnpjCpf}</p>
            {fatura.codigoSpc && (
              <p className="text-sm text-gray-500 mt-1">
                Código SPC: <span className="font-mono text-cdl-navy-700">{fatura.codigoSpc}</span>
              </p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-cdl-navy-600 mb-2">Datas</h3>
            <p><span className="text-gray-500">Emissão:</span> <span className="font-medium text-gray-900">{formatDate(fatura.dataEmissao)}</span></p>
            <p><span className="text-gray-500">Vencimento:</span> <span className="font-medium text-gray-900">{formatDate(fatura.dataVencimento)}</span></p>
            {fatura.mesReferencia && fatura.anoReferencia && (
              <p className="text-gray-500 mt-1">
                Competência: <span className="font-medium text-cdl-navy-700">{fatura.mesReferencia}/{fatura.anoReferencia}</span>
              </p>
            )}
          </div>
        </div>

        {/* Itens */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
            <span>📋</span> Itens da Fatura
          </h3>
          {podeEditar && (
            <span className="text-xs bg-cdl-yellow-100 text-cdl-yellow-700 px-2.5 py-1 rounded-full font-medium">
              ✏️ Modo Edição
            </span>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-cdl-navy-50">
              <tr>
                {['Código','Descrição','Quantidade','Valor Unit.','Valor Total'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase ${
                    i >= 2 ? 'text-right' : 'text-left'
                  }`}>{h}</th>
                ))}
                {podeEditar && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-cdl-navy-700 uppercase">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {fatura.itens && fatura.itens.length > 0 ? (
                fatura.itens.map((item) => {
                  const itemId = getItemId(item);
                  const isValid = isValidItemId(itemId);
                  return (
                    <tr key={itemId || Math.random()} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3">
                        {itensEditando[itemId!] ? (
                          <input
                            type="text"
                            value={item.codigoProduto}
                            onChange={(e) => alterarItemEditando(item, 'codigoProduto', e.target.value)}
                            className="w-full px-2 py-1 border border-cdl-navy-300 rounded text-sm
                                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm font-mono text-cdl-navy-700">{item.codigoProduto || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {itensEditando[itemId!] ? (
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => alterarItemEditando(item, 'descricao', e.target.value)}
                            className="w-full px-2 py-1 border border-cdl-navy-300 rounded text-sm
                                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.descricao}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {itensEditando[itemId!] ? (
                          <input
                            type="number"
                            value={item.quantidade}
                            onChange={(e) => alterarItemEditando(item, 'quantidade', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right px-2 py-1 border border-cdl-navy-300 rounded text-sm
                                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            min="0"
                            step="0.01"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.quantidade}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {itensEditando[itemId!] ? (
                          <input
                            type="number"
                            value={item.valorUnitario}
                            onChange={(e) => alterarItemEditando(item, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className="w-28 text-right px-2 py-1 border border-cdl-navy-300 rounded text-sm
                                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                            min="0"
                            step="0.01"
                            disabled={salvando}
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{formatCurrency(item.valorUnitario)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-cdl-navy-700">
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
                                  className="p-1.5 text-cdl-green-600 hover:text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                                  title="Salvar"
                                >💾</button>
                                <button
                                  onClick={() => cancelarEdicaoItem(item)}
                                  disabled={salvando}
                                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-cdl-neutral-50 rounded transition-colors"
                                  title="Cancelar"
                                >❌</button>
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => iniciarEdicaoItem(item)}
                                  disabled={salvando}
                                  className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                                  title="Editar"
                                >✏️</button>
                                {podeRemoverItem && (
                                  <button
                                    onClick={() => removerItem(item)}
                                    disabled={salvando}
                                    className="p-1.5 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                                    title="Remover"
                                  >🗑️</button>
                                )}
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
                  <td colSpan={podeEditar ? 6 : 5} className="px-4 py-8 text-center">
                    <EmptyState
                      icon="📋"
                      title="Nenhum item na fatura"
                      description="Adicione itens para compor o valor desta fatura."
                      compact
                    />
                  </td>
                </tr>
              )}
              <tr className="bg-cdl-yellow-50 font-bold">
                <td colSpan={4} className="px-4 py-3 text-right text-cdl-navy-700">Total da Fatura:</td>
                <td className="px-4 py-3 text-right text-cdl-navy-700 text-lg">{formatCurrency(totalFatura)}</td>
                {podeEditar && <td />}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Adicionar item */}
        {podeEditar && (
          <div className="mt-6 pt-5 border-t border-gray-200">
            <h4 className="font-medium text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>➕</span> Adicionar Novo Item
            </h4>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="relative col-span-2">
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={buscaProdutos}
                    onChange={(e) => setBuscaProdutos(e.target.value)}
                    onFocus={() => { if (buscaProdutos.length >= 2) setMostrarDropdownProdutos(true); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                    disabled={salvando}
                  />
                  {carregandoProdutos && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                    </div>
                  )}

                  {mostrarDropdownProdutos && produtosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg
                                    shadow-cdl-lg max-h-48 overflow-y-auto">
                      {produtosFiltrados.map((produto) => (
                        <button
                          key={produto.id}
                          onClick={() => selecionarProduto(produto)}
                          className="w-full text-left px-4 py-2 hover:bg-cdl-navy-50
                                     border-b border-gray-100 last:border-b-0 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-900">{produto.descricao || produto.nome}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              <span className="font-medium">Código RM:</span>{' '}
                              <span className="font-mono text-cdl-navy-700 font-semibold">{produto.codigoRm}</span>
                              {produto.codigo && produto.codigo !== produto.codigoRm && (
                                <span className="ml-2 text-gray-400">(interno: {produto.codigo})</span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-cdl-green-700">
                            {formatCurrency(produto.valor || produto.valorUnitario || 0)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {mostrarDropdownProdutos && buscaProdutos.length >= 2 && produtosFiltrados.length === 0 && !carregandoProdutos && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg
                                    shadow-cdl-lg p-4 text-center text-gray-500 text-sm">
                      Nenhum produto encontrado para "{buscaProdutos}"
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Código RM"
                  value={novoItem.codigoProduto}
                  onChange={(e) => setNovoItem({ ...novoItem, codigoProduto: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg font-mono bg-cdl-neutral-50
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                  disabled={salvando}
                  title="Código RM do produto"
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                  disabled={salvando}
                />
                <input
                  type="number"
                  placeholder="Qtd"
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                  min="0"
                  step="0.01"
                  disabled={salvando}
                />
                <input
                  type="number"
                  placeholder="Valor Unit."
                  value={novoItem.valorUnitario}
                  onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                  min="0"
                  step="0.01"
                  disabled={salvando}
                />
                <button
                  onClick={adicionarItem}
                  disabled={salvando || !novoItem.codigoProduto || !novoItem.descricao || novoItem.valorUnitario <= 0}
                  className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center
                             gap-2 font-medium transition-all active:scale-[.98]"
                >
                  {salvando ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : '➕ Adicionar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Observação */}
        {fatura.observacao && (
          <div className="mt-4 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
            <p className="text-sm text-cdl-navy-700">
              <span className="font-medium">Observação:</span> {fatura.observacao}
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-wrap justify-end gap-3 mt-6 pt-5 border-t border-gray-200">
          <button
            onClick={() => navigate('/faturamento/faturas')}
            className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 rounded-lg
                       hover:bg-cdl-neutral-50 transition-colors font-medium"
          >
            ❌ Fechar
          </button>

          {podeVerLogs && (
            <button
              onClick={() => setModalLogsAberta(true)}
              className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         transition-all active:scale-[.98] flex items-center gap-2 font-medium"
            >
              <span>📝</span> Ver Logs
            </button>
          )}

          {podeEditar && (
            <button
              onClick={handleSalvarEFechar}
              disabled={salvando}
              className="px-4 py-2.5 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                         disabled:bg-gray-400 disabled:cursor-not-allowed transition-all
                         active:scale-[.98] flex items-center gap-2 font-medium"
            >
              {salvando ? (
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : '💾 Salvar e Fechar'}
            </button>
          )}

          {podeExportarPdf && (
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
              className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         transition-all active:scale-[.98] flex items-center gap-2 font-medium"
            >
              📄 Exportar PDF
            </button>
          )}
        </div>
      </div>

      <ModalLogFatura
        isOpen={modalLogsAberta}
        onClose={() => setModalLogsAberta(false)}
        faturaId={fatura.id}
        faturaNumero={fatura.numeroFatura}
      />

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