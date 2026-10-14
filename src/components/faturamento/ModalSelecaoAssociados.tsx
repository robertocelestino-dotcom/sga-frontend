// src/components/faturamento/ModalSelecaoAssociados.tsx - VERSÃO CDL
// 🚨 VERSÃO 2.0 — Filtro de associados com nota no período
import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { useMessage } from '../../providers/MessageProvider';
import EmptyState from '../ui/EmptyState';

interface AssociadoResumo {
  id: number;
  nomeRazao: string;
  cnpjCpf: string;
  codigoSpc?: string;
  status: string;
  planoId?: number;
  planoTitulo?: string;
  vendedorNome?: string;
}

interface ReguaFaturamento {
  id: number;
  nome: string;
  descricao: string;
  ativa: boolean;
  diaEmissao: number;
}

interface ProcessamentoConfig {
  reguaId?: number;
  mesReferencia: number;
  anoReferencia: number;
  gerarNotas: boolean;
  integrarRM: boolean;
}

interface ModalSelecaoAssociadosProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (associadosIds: number[], config: ProcessamentoConfig) => void;
  onSimulate?: (associadosIds: number[], config: ProcessamentoConfig) => void;
  titulo?: string;
}

const PAGE_SIZE = 15;
const REGUA_CONSOLIDADO_NOME = 'Faturamento Consolidado';

const ModalSelecaoAssociados: React.FC<ModalSelecaoAssociadosProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSimulate,
  titulo = 'Selecionar Associados para Faturamento',
}) => {
  const { showToast } = useMessage();

  /* ============================================================
     ESTADOS
     ============================================================ */
  const [associados, setAssociados] = useState<AssociadoResumo[]>([]);
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoAssociados, setCarregandoAssociados] = useState(false);

  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCnpjCpf, setFiltroCnpjCpf] = useState('');
  const [reguaSelecionadaId, setReguaSelecionadaId] = useState<number | undefined>(undefined);
  const [reguaSelecionadaNome, setReguaSelecionadaNome] = useState<string>('');

  const [associadosSelecionados, setAssociadosSelecionados] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [todosIdsAssociados, setTodosIdsAssociados] = useState<number[]>([]);

  const [configProcessamento, setConfigProcessamento] = useState<ProcessamentoConfig>({
    mesReferencia: new Date().getMonth() + 1,
    anoReferencia: new Date().getFullYear(),
    gerarNotas: true,
    integrarRM: false,
    reguaId: undefined,
  });

  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const [totalSemNota, setTotalSemNota] = useState(0);

  const isReguaConsolidado = useCallback(
    () => reguaSelecionadaNome === REGUA_CONSOLIDADO_NOME,
    [reguaSelecionadaNome]
  );

  /* ============================================================
     CARREGAR RÉGUAS
     ============================================================ */
  const carregarReguas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/regua-faturamento/ativas');
      setReguas(response.data);

      if (response.data.length > 0 && !reguaSelecionadaId) {
        setReguaSelecionadaId(response.data[0].id);
        setReguaSelecionadaNome(response.data[0].nome);
        setConfigProcessamento(prev => ({ ...prev, reguaId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas de faturamento', 'error');
    } finally {
      setLoading(false);
    }
  }, [reguaSelecionadaId, showToast]);

  /* ============================================================
     CARREGAR ASSOCIADOS
     ============================================================ */
  const carregarAssociados = useCallback(async () => {
    if (!reguaSelecionadaId) {
      setAssociados([]);
      setTotalItens(0);
      setTotalPaginas(0);
      setTodosIdsAssociados([]);
      setTotalSemNota(0);
      return;
    }

    setCarregandoAssociados(true);
    try {
      const isConsolidado = reguaSelecionadaNome === REGUA_CONSOLIDADO_NOME;

      let response: any;
      let idsResponse: any;

      if (isConsolidado) {
        // Régua CONSOLIDADO
        response = await api.get(`/regua-faturamento/${reguaSelecionadaId}/associados-consolidado/paginado`, {
          params: {
            page: pagina,
            size: PAGE_SIZE,
            nome: filtroNome || undefined,
            cnpjCpf: filtroCnpjCpf || undefined,
          },
        });
        idsResponse = await api.get(`/regua-faturamento/${reguaSelecionadaId}/associados-consolidado/todos-ids`);
        setTotalSemNota(0);
      } else {
        // Régua NORMAL — filtro por nota
        const { mesReferencia, anoReferencia } = configProcessamento;
        const dataInicio = `${anoReferencia}-${String(mesReferencia).padStart(2, '0')}-01`;
        const ultimoDia = new Date(anoReferencia, mesReferencia, 0).getDate();
        const dataFim = `${anoReferencia}-${String(mesReferencia).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

        const responseFiltro = await api.get('/faturamento/associados-da-regua', {
          params: {
            reguaId: reguaSelecionadaId,
            dataInicio,
            dataFim,
            somenteComNota: true,
          },
        });

        let listaCompleta = responseFiltro.data.associados || [];
        const totalSemNotaCalculado = responseFiltro.data.totalSemNota || 0;

        if (filtroNome) {
          const nomeLower = filtroNome.toLowerCase();
          listaCompleta = listaCompleta.filter((a: any) => a.nomeRazao?.toLowerCase().includes(nomeLower));
        }
        if (filtroCnpjCpf) {
          listaCompleta = listaCompleta.filter((a: any) => a.cnpjCpf?.includes(filtroCnpjCpf));
        }

        const todosIds = listaCompleta.map((a: any) => a.id);
        const totalElements = listaCompleta.length;
        const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
        const inicio = pagina * PAGE_SIZE;
        const paginaAtual = listaCompleta.slice(inicio, inicio + PAGE_SIZE);

        response = { data: { content: paginaAtual, totalPages, totalElements } };
        idsResponse = { data: todosIds };
        setTotalSemNota(totalSemNotaCalculado);
      }

      setAssociados(response.data.content);
      setTotalPaginas(response.data.totalPages);
      setTotalItens(response.data.totalElements);
      setTodosIdsAssociados(idsResponse.data || []);
    } catch (error) {
      console.error('❌ [CARREGAR] Erro:', error);
      showToast('Erro ao carregar lista de associados', 'error');
      setAssociados([]);
      setTotalPaginas(0);
      setTotalItens(0);
      setTodosIdsAssociados([]);
      setTotalSemNota(0);
    } finally {
      setCarregandoAssociados(false);
    }
  }, [pagina, filtroNome, filtroCnpjCpf, reguaSelecionadaId, reguaSelecionadaNome, showToast, configProcessamento]);

  /* ============================================================
     EFEITOS
     ============================================================ */
  useEffect(() => {
    if (isOpen) carregarReguas();
  }, [isOpen, carregarReguas]);

  useEffect(() => {
    if (isOpen && reguaSelecionadaId) setPagina(0);
  }, [isOpen, reguaSelecionadaId, configProcessamento.mesReferencia, configProcessamento.anoReferencia]);

  useEffect(() => {
    if (isOpen && reguaSelecionadaId) carregarAssociados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reguaSelecionadaId, pagina, configProcessamento.mesReferencia, configProcessamento.anoReferencia]);

  useEffect(() => {
    setAssociadosSelecionados(new Set());
    setSelecionarTodos(false);
  }, [reguaSelecionadaId]);

  /* ============================================================
     AÇÕES
     ============================================================ */
  const toggleSelecionarAssociado = (id: number) => {
    const novosSelecionados = new Set(associadosSelecionados);
    if (novosSelecionados.has(id)) novosSelecionados.delete(id);
    else novosSelecionados.add(id);
    setAssociadosSelecionados(novosSelecionados);
    setSelecionarTodos(associados.length > 0 && associados.every(a => novosSelecionados.has(a.id)));
  };

  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setAssociadosSelecionados(new Set());
      setSelecionarTodos(false);
    } else {
      setAssociadosSelecionados(new Set(todosIdsAssociados));
      setSelecionarTodos(true);
    }
  };

  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroCnpjCpf('');
    setPagina(0);
  };

  const aplicarFiltros = () => {
    setPagina(0);
    carregarAssociados();
  };

  const handleConfirm = () => {
    if (associadosSelecionados.size === 0) {
      showToast('Selecione pelo menos um associado para processar', 'warning');
      return;
    }
    onConfirm(Array.from(associadosSelecionados), configProcessamento);
  };

  const handleSimulate = () => {
    if (associadosSelecionados.size === 0) {
      showToast('Selecione pelo menos um associado para simular', 'warning');
      return;
    }
    if (onSimulate) onSimulate(Array.from(associadosSelecionados), configProcessamento);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A': return 'bg-cdl-green-100 text-cdl-green-700';
      case 'I': return 'bg-cdl-danger-50 text-cdl-danger-500';
      case 'S': return 'bg-cdl-yellow-100 text-cdl-yellow-700';
      default:  return 'bg-cdl-neutral-100 text-cdl-neutral-500';
    }
  };

  const getStatusTexto = (status: string) => {
    switch (status) {
      case 'A': return 'Ativo';
      case 'I': return 'Inativo';
      case 'S': return 'Suspenso';
      default:  return status;
    }
  };

  if (!isOpen) return null;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end sm:items-center justify-center min-h-screen sm:px-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-cdl-lg
                        w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden
                        border-t-4 border-cdl-navy-700 flex flex-col">
          {/* ============ Header ============ */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
            <h2 className="text-base sm:text-xl font-semibold text-cdl-navy-700 truncate pr-2">
              {titulo}
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700
                         transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* ============ Body ============ */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            {/* Configurações do Processamento */}
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                <span>⚙️</span> Configurações do Processamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                    Mês Referência
                  </label>
                  <select
                    value={configProcessamento.mesReferencia}
                    onChange={(e) =>
                      setConfigProcessamento({ ...configProcessamento, mesReferencia: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                  >
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((mes, idx) => (
                      <option key={idx} value={idx + 1}>{mes}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                    Ano Referência
                  </label>
                  <input
                    type="number"
                    value={configProcessamento.anoReferencia}
                    onChange={(e) =>
                      setConfigProcessamento({ ...configProcessamento, anoReferencia: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                    min={2020}
                    max={2030}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">
                    Régua de Faturamento
                  </label>
                  <select
                    value={reguaSelecionadaId || ''}
                    onChange={(e) => {
                      const novaReguaId = e.target.value ? parseInt(e.target.value) : undefined;
                      const novaRegua = reguas.find(r => r.id === novaReguaId);
                      setReguaSelecionadaId(novaReguaId);
                      setReguaSelecionadaNome(novaRegua?.nome || '');
                      setConfigProcessamento({ ...configProcessamento, reguaId: novaReguaId });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    <option value="">Selecione uma régua</option>
                    {reguas.map(regua => (
                      <option key={regua.id} value={regua.id}>
                        {regua.nome} (Dia {regua.diaEmissao}) {!regua.ativa && '(Inativa)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aviso régua consolidada */}
              {isReguaConsolidado() && (
                <div className="mt-3 p-3 bg-cdl-navy-100 border border-cdl-navy-200 rounded-lg text-sm text-cdl-navy-700 flex items-start gap-2">
                  <span>📋</span>
                  <span>
                    <strong>Faturamento Consolidado</strong> — Serão exibidos apenas associados que possuem notas no último arquivo consolidado importado (busca automática).
                  </span>
                </div>
              )}

              {/* Aviso associados sem nota */}
              {!isReguaConsolidado() && reguaSelecionadaId && totalSemNota > 0 && (
                <div className="mt-3 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg text-sm text-cdl-yellow-700 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>{totalSemNota}</strong> associado(s) da régua foram excluídos por não possuírem nota de débito no período selecionado.
                  </span>
                </div>
              )}
            </div>

            {/* Filtros */}
            {reguaSelecionadaId && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                  <span>🔍</span> Filtros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Nome/Razão Social"
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="CNPJ/CPF"
                    value={filtroCnpjCpf}
                    onChange={(e) => setFiltroCnpjCpf(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                  />
                  <button
                    onClick={aplicarFiltros}
                    className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                               hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={limparFiltros}
                    className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                               hover:bg-cdl-neutral-50 transition-colors"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}

            {/* Sem régua selecionada */}
            {!reguaSelecionadaId && (
              <EmptyState
                icon="📏"
                title="Selecione uma régua de faturamento"
                description="Escolha uma régua acima para carregar os associados disponíveis."
                compact
              />
            )}

            {/* Tabela de Associados */}
            {reguaSelecionadaId && (
              <>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-cdl-navy-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selecionarTodos && todosIdsAssociados.length > 0}
                              onChange={toggleSelecionarTodos}
                              className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                              disabled={carregandoAssociados}
                            />
                            <span className="text-xs text-cdl-navy-600 font-medium">
                              {todosIdsAssociados.length > 0 &&
                                `(${associadosSelecionados.size} de ${todosIdsAssociados.length})`}
                            </span>
                          </div>
                        </th>
                        {['Código','Nome/Razão','CNPJ/CPF','Plano','Status','Vendedor'].map(h => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {carregandoAssociados ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                            <p className="mt-2 text-cdl-navy-700 text-sm font-medium">
                              Carregando associados...
                            </p>
                          </td>
                        </tr>
                      ) : associados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12">
                            <EmptyState
                              icon="👥"
                              title={
                                isReguaConsolidado()
                                  ? 'Nenhum associado no último consolidado'
                                  : 'Nenhum associado com nota no período'
                              }
                              description={
                                isReguaConsolidado()
                                  ? 'Importe um arquivo consolidado para que os associados apareçam aqui.'
                                  : 'Ajuste o período ou a régua para encontrar associados com notas.'
                              }
                              compact
                            />
                          </td>
                        </tr>
                      ) : (
                        associados.map((associado) => (
                          <tr key={associado.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={associadosSelecionados.has(associado.id)}
                                onChange={() => toggleSelecionarAssociado(associado.id)}
                                className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-cdl-navy-700 font-medium">
                              {associado.codigoSpc || associado.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              {associado.nomeRazao}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{associado.cnpjCpf}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {associado.planoTitulo || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(associado.status)}`}
                              >
                                {getStatusTexto(associado.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {associado.vendedorNome || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-4">
                    <button
                      onClick={() => setPagina(p => Math.max(0, p - 1))}
                      disabled={pagina === 0 || carregandoAssociados}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                                 text-cdl-navy-700 hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página <strong className="text-cdl-navy-700">{pagina + 1}</strong> de{' '}
                      <strong className="text-cdl-navy-700">{totalPaginas}</strong>{' '}
                      ({totalItens} associados)
                    </span>
                    <button
                      onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                      disabled={pagina === totalPaginas - 1 || carregandoAssociados}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium
                                 text-cdl-navy-700 hover:bg-cdl-navy-50 hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ============ Footer ============ */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-cdl-neutral-50 shrink-0">
            <div className="text-sm text-gray-600">
              <strong className="text-cdl-navy-700">{associadosSelecionados.size}</strong> de{' '}
              <strong className="text-cdl-navy-700">{todosIdsAssociados.length}</strong> associado(s) selecionado(s)
              {!isReguaConsolidado() && totalSemNota > 0 && (
                <span className="ml-2 text-cdl-yellow-700">
                  ({totalSemNota} sem nota excluído{totalSemNota > 1 ? 's' : ''})
                </span>
              )}
              {isReguaConsolidado() && todosIdsAssociados.length === 0 && (
                <span className="ml-2 text-cdl-yellow-700">
                  (Nenhum associado com notas no último consolidado)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {onSimulate && (
                <button
                  onClick={handleSimulate}
                  disabled={associadosSelecionados.size === 0 || !reguaSelecionadaId}
                  className="px-4 py-2 border border-cdl-navy-300 text-cdl-navy-700 bg-white rounded-lg
                             hover:bg-cdl-navy-50 disabled:opacity-50 disabled:cursor-not-allowed
                             font-medium transition-colors"
                >
                  Simular
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                           hover:bg-cdl-neutral-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={associadosSelecionados.size === 0 || !reguaSelecionadaId}
                className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                           hover:bg-cdl-navy-800 disabled:opacity-50 disabled:cursor-not-allowed
                           font-medium transition-all active:scale-[.98]"
              >
                Processar Faturamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoAssociados;