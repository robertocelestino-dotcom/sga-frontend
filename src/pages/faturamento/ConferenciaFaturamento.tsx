// src/pages/faturamento/ConferenciaFaturamento.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { conferenciaFaturamentoService } from '../../services/conferenciaFaturamentoService';
import { reguaFaturamentoService } from '../../services/reguaFaturamentoService';
import { ConferenciaFaturamentoDTO, ConferenciaResumoDTO } from '../../types/conferenciaFaturamento';

const ConferenciaFaturamento: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();

  const [loading, setLoading] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  const [reguaId, setReguaId] = useState<number | undefined>(undefined);
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  });
  const [codigoSpc, setCodigoSpc] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  const [reguas, setReguas] = useState<any[]>([]);
  const [dados, setDados] = useState<ConferenciaFaturamentoDTO[]>([]);
  const [resumo, setResumo] = useState<ConferenciaResumoDTO | null>(null);

  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalElementos, setTotalElementos] = useState(0);
  const [itensPorPagina] = useState(20);

  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [faturaSelecionada, setFaturaSelecionada] = useState<ConferenciaFaturamentoDTO | null>(null);
  const [detalhesFatura, setDetalhesFatura] = useState<any>(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);

  const formatarData = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${ano}-${mes}-${dia}`;
  };

  const formatarMoeda = (valor: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const carregarReguas = async () => {
    try {
      const response = await reguaFaturamentoService.listarReguas(0, 100);
      setReguas(response.content || []);
    } catch (error) {
      console.error('❌ Erro ao carregar réguas:', error);
    }
  };

  const buscarDados = async () => {
    setLoading(true);
    try {
      const response = await conferenciaFaturamentoService.listarConferencia({
        reguaId,
        dataInicio: formatarData(dataInicio),
        dataFim: formatarData(dataFim),
        codigoSpc: codigoSpc || undefined,
        status: statusFiltro || undefined,
        page: pagina,
        size: itensPorPagina,
        sort: 'dataEmissao',
        direction: 'desc',
      });

      setDados(response.content);
      setTotalPaginas(response.totalPages);
      setTotalElementos(response.totalElements);

      if (response.content.length === 0) {
        showToast('ℹ️ Nenhuma fatura encontrada para o período', 'info');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      showToast('⚠️ Erro ao carregar dados da conferência', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarResumo = async () => {
    setCarregandoResumo(true);
    try {
      const response = await conferenciaFaturamentoService.resumoConferencia(
        reguaId,
        formatarData(dataInicio),
        formatarData(dataFim),
        codigoSpc || undefined,
        statusFiltro || undefined
      );
      setResumo(response);
    } catch (error) {
      console.error('❌ Erro ao carregar resumo:', error);
    } finally {
      setCarregandoResumo(false);
    }
  };

  useEffect(() => { carregarReguas(); }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      buscarDados();
      carregarResumo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reguaId, dataInicio, dataFim, pagina, statusFiltro]);

  useEffect(() => {
    setSelecionadas(new Set());
    setSelecionarTodos(false);
  }, [dados]);

  const handleBuscar = () => {
    setPagina(0);
    buscarDados();
    carregarResumo();
  };

  const handleLimpar = () => {
    const hoje = new Date();
    setReguaId(undefined);
    setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
    setDataFim(new Date(hoje.getFullYear(), hoje.getMonth(), 0));
    setCodigoSpc('');
    setStatusFiltro('');
    setPagina(0);
  };

  const toggleSelecionarFatura = (faturaId: number) => {
    const novas = new Set(selecionadas);
    if (novas.has(faturaId)) novas.delete(faturaId);
    else novas.add(faturaId);
    setSelecionadas(novas);
    setSelecionarTodos(dados.length > 0 && dados.every((d) => novas.has(d.faturaId)));
  };

  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      const novas = new Set(selecionadas);
      dados.forEach((d) => novas.delete(d.faturaId));
      setSelecionadas(novas);
      setSelecionarTodos(false);
    } else {
      const novas = new Set(selecionadas);
      dados.forEach((d) => novas.add(d.faturaId));
      setSelecionadas(novas);
      setSelecionarTodos(true);
    }
  };

  const limparSelecao = () => {
    setSelecionadas(new Set());
    setSelecionarTodos(false);
  };

  const handleExportarCSV = async () => {
    try {
      const blob = await conferenciaFaturamentoService.exportarCSV(
        reguaId,
        formatarData(dataInicio),
        formatarData(dataFim),
        codigoSpc || undefined,
        statusFiltro || undefined
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conferencia_faturamento_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('✅ CSV exportado com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      showToast('⚠️ Erro ao exportar CSV', 'error');
    }
  };

  const handleExportarSelecionados = async () => {
    if (selecionadas.size === 0) {
      showToast('⚠️ Selecione pelo menos uma fatura para exportar', 'warning');
      return;
    }
    try {
      const ids = Array.from(selecionadas);
      const blob = await conferenciaFaturamentoService.exportarCSVSelecionados(ids);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conferencia_selecionadas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`✅ ${ids.length} fatura(s) exportada(s) com sucesso!`, 'success');
    } catch (error) {
      console.error('❌ Erro ao exportar selecionadas:', error);
      showToast('⚠️ Erro ao exportar faturas selecionadas', 'error');
    }
  };

  const handleVerDetalhes = async (fatura: ConferenciaFaturamentoDTO) => {
    setFaturaSelecionada(fatura);
    setModalDetalheAberto(true);
    setCarregandoDetalhes(true);
    setDetalhesFatura(null);
    try {
      const detalhes = await conferenciaFaturamentoService.detalharConferencia(fatura.faturaId);
      setDetalhesFatura(detalhes);
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      showToast('⚠️ Erro ao carregar detalhes da fatura', 'error');
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { cls: string; label: string }> = {
      OK: { cls: 'bg-cdl-green-100 text-cdl-green-700', label: '✅ OK' },
      DIFERENCA: { cls: 'bg-cdl-yellow-100 text-cdl-yellow-700', label: '⚠️ Diferença' },
    };
    const config = configs[status] || configs['DIFERENCA'];
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.cls}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Conferência de Faturamento" />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700 mb-2 flex items-center gap-2">
              <span>📊</span> Conferência de Faturamento
            </h1>
            <p className="text-gray-600">
              Compare faturas geradas com as notas de débito originais para validar o processo
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportarCSV}
              disabled={loading || dados.length === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-[.98] font-medium ${
                loading || dados.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cdl-green-500 text-white hover:bg-cdl-green-600'
              }`}
            >
              <span>📥</span> Exportar Todos
            </button>

            <button
              onClick={handleExportarSelecionados}
              disabled={loading || selecionadas.size === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-[.98] font-medium ${
                loading || selecionadas.size === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
              }`}
            >
              <span>📤</span> Exportar Selecionados ({selecionadas.size})
            </button>

            {selecionadas.size > 0 && (
              <button
                onClick={limparSelecao}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-cdl-neutral-100 text-cdl-navy-700
                           hover:bg-cdl-neutral-200 transition-colors font-medium"
              >
                <span>🧹</span> Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Régua</label>
              <select
                value={reguaId || ''}
                onChange={(e) => setReguaId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todas</option>
                {reguas.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const [ano, mes, dia] = e.target.value.split('-').map(Number);
                    setDataInicio(new Date(ano, mes - 1, dia));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const [ano, mes, dia] = e.target.value.split('-').map(Number);
                    setDataFim(new Date(ano, mes - 1, dia));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Código SPC</label>
              <input
                type="text"
                placeholder="Código do associado"
                value={codigoSpc}
                onChange={(e) => setCodigoSpc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Status</label>
              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todos</option>
                <option value="OK">✅ OK</option>
                <option value="DIFERENCA">⚠️ Diferença</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={handleBuscar}
              disabled={loading}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         disabled:bg-gray-400 transition-all active:scale-[.98] flex items-center
                         gap-2 font-medium"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Buscando...
                </>
              ) : '🔍 Buscar'}
            </button>
            <button
              onClick={handleLimpar}
              className="px-4 py-2 bg-cdl-neutral-100 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-200 transition-colors font-medium"
            >
              🧹 Limpar
            </button>
            <span className="text-xs text-gray-500 flex items-center ml-2">
              <strong className="text-cdl-navy-700">{totalElementos}</strong>&nbsp;registros encontrados
            </span>
          </div>
        </div>

        {/* Resumo */}
        {resumo && !carregandoResumo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">{resumo.totalFaturas}</div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Total Faturas</div>
            </div>
            <div className="bg-cdl-green-50 border border-cdl-green-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-green-700">{resumo.totalSemDiferenca}</div>
              <div className="text-xs text-cdl-green-600 mt-0.5 font-medium">✅ OK</div>
            </div>
            <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-yellow-700">{resumo.totalComDiferenca}</div>
              <div className="text-xs text-cdl-yellow-600 mt-0.5 font-medium">⚠️ Diferença</div>
            </div>
            <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-danger-500">
                {formatarMoeda(resumo.somaDiferencas)}
              </div>
              <div className="text-xs text-cdl-danger-500 mt-0.5 font-medium">Soma Diferenças</div>
            </div>
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : dados.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nenhuma fatura encontrada"
            description="Não há faturas no período selecionado. Ajuste os filtros e tente novamente."
            compact
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selecionarTodos}
                        onChange={toggleSelecionarTodos}
                        className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600 cursor-pointer"
                        disabled={dados.length === 0}
                        title="Selecionar todos da página"
                      />
                    </th>
                    {['Associado','Código SPC','Nota Débito','Fatura','Diferença','Itens','Status','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                          i === 7 ? 'text-center' : ['Associado','Código SPC'].includes(h) ? 'text-left' : 'text-center'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {dados.map((item) => (
                    <tr
                      key={item.faturaId}
                      className={`transition-colors ${
                        selecionadas.has(item.faturaId)
                          ? 'bg-cdl-navy-50/60'
                          : 'hover:bg-cdl-navy-50/40'
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selecionadas.has(item.faturaId)}
                          onChange={() => toggleSelecionarFatura(item.faturaId)}
                          className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate" title={item.nomeRazao}>
                        {item.nomeRazao}
                      </td>
                      <td className="px-3 py-2 text-sm font-mono text-cdl-navy-700">{item.codigoSpc}</td>
                      <td className="px-3 py-2 text-sm text-center font-medium">
                        <div className="text-gray-900">{formatarMoeda(item.valorNota)}</div>
                        <span className="block text-xs text-gray-400 font-mono">{item.numeroNotaDebito}</span>
                      </td>
                      <td className="px-3 py-2 text-sm text-center font-medium">
                        <div className="text-gray-900">{formatarMoeda(item.valorFatura)}</div>
                        <span className="block text-xs text-gray-400 font-mono">{item.numeroFatura}</span>
                      </td>
                      <td className={`px-3 py-2 text-sm text-center font-medium ${
                        item.diferencaValor < 0 ? 'text-cdl-green-700'
                        : item.diferencaValor > 0 ? 'text-cdl-danger-500'
                        : 'text-gray-600'
                      }`}>
                        {formatarMoeda(item.diferencaValor)}
                      </td>
                      <td className="px-3 py-2 text-sm text-center">
                        <span className="text-xs text-gray-600 font-mono">
                          {item.qtdItensNota} → {item.qtdItensFatura}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {getStatusBadge(item.statusConferencia)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleVerDetalhes(item)}
                          className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900
                                     hover:bg-cdl-navy-50 rounded transition-colors"
                          title="Ver detalhes"
                        >👁️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando <strong className="text-cdl-navy-700">{pagina * itensPorPagina + 1}</strong> -{" "}
                  <strong className="text-cdl-navy-700">
                    {Math.min((pagina + 1) * itensPorPagina, totalElementos)}
                  </strong>{" "}
                  de <strong className="text-cdl-navy-700">{totalElementos}</strong>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPagina(0)}
                    disabled={pagina === 0}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >⏮️</button>
                  <button
                    onClick={() => setPagina((p) => Math.max(0, p - 1))}
                    disabled={pagina === 0}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >◀</button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página <strong className="text-cdl-navy-700">{pagina + 1}</strong> de{" "}
                    <strong className="text-cdl-navy-700">{totalPaginas}</strong>
                  </span>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                    disabled={pagina === totalPaginas - 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >▶</button>
                  <button
                    onClick={() => setPagina(totalPaginas - 1)}
                    disabled={pagina === totalPaginas - 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >⏭️</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de detalhes */}
      {modalDetalheAberto && faturaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => {
              setModalDetalheAberto(false);
              setFaturaSelecionada(null);
              setDetalhesFatura(null);
            }}
          />
          <div className="relative w-full sm:max-w-5xl bg-white rounded-t-2xl sm:rounded-2xl
                          shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                          max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
              <h2 className="text-base sm:text-lg font-semibold text-cdl-navy-700">
                Detalhes da Conferência — Fatura {faturaSelecionada.numeroFatura}
              </h2>
              <button
                onClick={() => {
                  setModalDetalheAberto(false);
                  setFaturaSelecionada(null);
                  setDetalhesFatura(null);
                }}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors"
              >✕</button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {carregandoDetalhes ? (
                <div className="flex justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                  <span className="ml-3 text-cdl-navy-700 font-medium">Carregando detalhes...</span>
                </div>
              ) : detalhesFatura ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                    <div>
                      <span className="text-xs text-cdl-navy-600 font-medium">Código SPC</span>
                      <p className="font-mono font-semibold text-cdl-navy-700">{detalhesFatura.codigoSpc}</p>
                    </div>
                    <div>
                      <span className="text-xs text-cdl-navy-600 font-medium">Associado</span>
                      <p className="font-medium text-gray-900">{detalhesFatura.nomeRazao}</p>
                    </div>
                    <div>
                      <span className="text-xs text-cdl-navy-600 font-medium">Valor Nota</span>
                      <p className="font-semibold text-cdl-navy-700">
                        {formatarMoeda(detalhesFatura.valorNota)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-cdl-navy-600 font-medium">Valor Fatura</span>
                      <p className="font-semibold text-cdl-green-700">
                        {formatarMoeda(detalhesFatura.valorFatura)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Itens Nota */}
                    <div>
                      <h3 className="text-sm font-semibold text-cdl-navy-700 mb-2 flex items-center gap-2">
                        <span>📋</span> Itens da Nota Débito
                      </h3>
                      {detalhesFatura.itensNota && detalhesFatura.itensNota.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-cdl-navy-50 sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-cdl-navy-700">Qtde</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-cdl-navy-700">Descrição</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-cdl-navy-700">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {detalhesFatura.itensNota.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-cdl-navy-50/40">
                                  <td className="px-2 py-1.5 text-center text-gray-900">{item.quantidade}</td>
                                  <td className="px-2 py-1.5 text-gray-900">{item.descricao}</td>
                                  <td className="px-2 py-1.5 text-right text-gray-900 font-medium">
                                    {formatarMoeda(item.valorTotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 bg-cdl-neutral-50 p-3 rounded-lg text-center">
                          Nenhum item na nota
                        </p>
                      )}
                    </div>

                    {/* Itens Fatura */}
                    <div>
                      <h3 className="text-sm font-semibold text-cdl-navy-700 mb-2 flex items-center gap-2">
                        <span>📄</span> Itens da Fatura
                      </h3>
                      {detalhesFatura.itensFatura && detalhesFatura.itensFatura.length > 0 ? (
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-cdl-navy-50 sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-cdl-navy-700">Qtde</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-cdl-navy-700">Descrição</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-cdl-navy-700">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {detalhesFatura.itensFatura.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-cdl-navy-50/40">
                                  <td className="px-2 py-1.5 text-center text-gray-900">{item.quantidade}</td>
                                  <td className="px-2 py-1.5 text-gray-900">{item.descricao}</td>
                                  <td className="px-2 py-1.5 text-right text-gray-900 font-medium">
                                    {formatarMoeda(item.valorTotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 bg-cdl-neutral-50 p-3 rounded-lg text-center">
                          Nenhum item na fatura
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg">
                    <p className="text-sm text-cdl-navy-700 flex flex-wrap items-center gap-3">
                      <span><span className="font-semibold">Status:</span> {getStatusBadge(detalhesFatura.statusConferencia)}</span>
                      <span><span className="font-semibold">Observação:</span> {detalhesFatura.observacao || '-'}</span>
                    </p>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon="📭"
                  title="Nenhum detalhe disponível"
                  description="Não foi possível carregar os detalhes desta fatura."
                  compact
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenciaFaturamento;