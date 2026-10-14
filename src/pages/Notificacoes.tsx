// src/pages/Notificacoes.tsx - VERSÃO CDL
import React, { useState, useEffect, useRef } from 'react';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import EmptyState from '../components/ui/EmptyState';
import ModalDetalheNotificacao from '../components/faturamento/ModalDetalheNotificacao';
import ConfirmModal from '../components/ui/ConfirmModal';
import notificacaoService from '../services/notificacaoService';
import api from '../services/api';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuthStore } from '../stores/authStore';

interface Sincronizacao {
  id: number;
  dataInicio: string;
  dataFim: string;
  codigoAssociado: string;
  totalAssociados: number;
  totalRegistros: number;
  status: string;
  usuario: string;
  dataSincronizacao: string;
  observacao: string;
}

const Notificacoes: React.FC = () => {
  const { showToast } = useMessage();
  const { hasPermission, user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);
  const [notificacoesAgrupadas, setNotificacoesAgrupadas] = useState<any[]>([]);
  const [filtroCodigo, setFiltroCodigo] = useState('');

  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  });

  const [filtroGrid, setFiltroGrid] = useState('');
  const [erroConexao, setErroConexao] = useState<boolean>(false);
  const [temDados, setTemDados] = useState<boolean>(false);
  const [buscaRealizada, setBuscaRealizada] = useState<boolean>(false);
  const [sincronizacaoRealizada, setSincronizacaoRealizada] = useState<boolean>(false);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string>('');
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  const [dadosMSSQL, setDadosMSSQL] = useState<any[]>([]);
  const [carregandoMSSQL, setCarregandoMSSQL] = useState(false);

  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [historico, setHistorico] = useState<Sincronizacao[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [historicoPagina, setHistoricoPagina] = useState(1);
  const [historicoTotal, setHistoricoTotal] = useState(0);
  const [historicoTotalPaginas, setHistoricoTotalPaginas] = useState(0);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
  });

  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<any>(null);

  const podeSincronizar =
    hasPermission('NOTIFICACAO_CREATE') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ROLE_ADMIN' ||
    user?.role === 'ROLE_SUPER_ADMIN';

  /* ============================================================
     FORMATADORES
     ============================================================ */
  const formatarData = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const formatarDataHora = (data: string): string => {
    if (!data) return '-';
    try {
      const date = new Date(data);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const horas = String(date.getHours()).padStart(2, '0');
      const minutos = String(date.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
    } catch {
      return data;
    }
  };

  const formatarDataExibicao = (data: string): string => {
    if (!data) return '-';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  /* ============================================================
     AÇÕES
     ============================================================ */
  const cancelarBusca = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setCarregandoMSSQL(false);
      showToast('⏹️ Busca cancelada', 'info');
    }
  };

  const carregarGridMSSQL = async () => {
    if (!dataInicio || !dataFim) {
      showToast('⚠️ Selecione o período para buscar', 'warning');
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setCarregandoMSSQL(true);
    setErroConexao(false);
    setBuscaRealizada(false);
    setPaginaAtual(1);

    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);

      const response = await api.post('/notificacoes/buscar-ms-sql', null, {
        params: {
          dataInicio: dataInicioStr,
          dataFim: dataFimStr,
          codigoAssociado: filtroCodigo || undefined,
        },
        signal: abortControllerRef.current.signal,
      });

      if (abortControllerRef.current?.signal.aborted) return;

      const data = response.data || [];
      setDadosMSSQL(data);
      setNotificacoesAgrupadas(data);
      setTemDados(data.length > 0);
      setBuscaRealizada(true);
      setTotalRegistros(data.length);
      setTotalPaginas(Math.ceil(data.length / itensPorPagina));

      if (data.length === 0) {
        showToast('ℹ️ Nenhuma notificação encontrada no MS-SQL', 'info');
      } else {
        showToast(`✅ ${data.length} registros encontrados no MS-SQL`, 'success');
      }
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return;
      console.error('❌ Erro ao carregar do MS-SQL:', error);
      setErroConexao(true);
      setDadosMSSQL([]);
      setNotificacoesAgrupadas([]);
      setTemDados(false);
      showToast('⚠️ Erro ao carregar dados do MS-SQL', 'error');
    } finally {
      setCarregandoMSSQL(false);
      abortControllerRef.current = null;
    }
  };

  const carregarDadosLocal = async () => {
    if (!dataInicio || !dataFim) {
      showToast('⚠️ Selecione o período para buscar', 'warning');
      return;
    }
    setLoading(true);
    setErroConexao(false);
    setPaginaAtual(1);

    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);

      const data = await notificacaoService.buscarAgrupadasPorPeriodo(
        dataInicioStr,
        dataFimStr,
        filtroCodigo || undefined
      );

      setNotificacoesAgrupadas(data);
      setDadosMSSQL(data);
      setTemDados(data.length > 0);
      setBuscaRealizada(true);
      setTotalRegistros(data.length);
      setTotalPaginas(Math.ceil(data.length / itensPorPagina));

      if (data.length === 0) {
        showToast('ℹ️ Nenhuma notificação encontrada na base local', 'info');
      } else {
        showToast(`✅ ${data.length} registros carregados da base local`, 'success');
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados locais:', error);
      setErroConexao(true);
      setNotificacoesAgrupadas([]);
      setTemDados(false);
      showToast('⚠️ Erro ao carregar dados locais', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const response = await api.get('/sincronizacoes', {
        params: { page: historicoPagina - 1, size: itensPorPagina },
      });

      const content = response.data.content || [];
      const totalElements = response.data.totalElements || 0;
      const totalPages = response.data.totalPages || 0;

      setHistorico(content);
      setHistoricoTotal(totalElements);
      setHistoricoTotalPaginas(totalPages);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
      showToast('⚠️ Erro ao carregar histórico', 'error');
      setHistorico([]);
      setHistoricoTotal(0);
      setHistoricoTotalPaginas(0);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const openConfirmSincronizar = () => {
    const dataInicioStr = formatarData(dataInicio);
    const dataFimStr = formatarData(dataFim);
    const codigo = filtroCodigo || 'Todos';

    setConfirmModal({
      isOpen: true,
      title: '⚠️ Confirmar Sincronização',
      message:
        `Deseja sincronizar os dados?\n\n` +
        `📅 Período: ${dataInicioStr} à ${dataFimStr}\n` +
        `👤 Código: ${codigo}\n\n` +
        `Esta ação irá salvar na base local.`,
      confirmText: '✅ Sim, Sincronizar',
      cancelText: '❌ Cancelar',
      type: 'warning',
      onConfirm: handleSincronizar,
    });
  };

  const openConfirmDesfazer = (sincronizacao: Sincronizacao) => {
    setConfirmModal({
      isOpen: true,
      title: '⚠️ Confirmar Desfazer Sincronização',
      message:
        `Tem certeza que deseja desfazer a sincronização?\n\n` +
        `📅 Período: ${formatarDataExibicao(sincronizacao.dataInicio)} à ${formatarDataExibicao(sincronizacao.dataFim)}\n` +
        `👤 Código: ${sincronizacao.codigoAssociado || 'Todos'}\n` +
        `📊 Associados: ${sincronizacao.totalAssociados}\n` +
        `📝 Registros: ${sincronizacao.totalRegistros}\n\n` +
        `⚠️ Esta ação removerá todos os dados sincronizados.`,
      confirmText: '🗑️ Sim, Desfazer',
      cancelText: '❌ Cancelar',
      type: 'danger',
      onConfirm: () => handleDesfazerSincronizacao(sincronizacao),
    });
  };

  const handleSincronizar = async () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    if (!dataInicio || !dataFim) {
      showToast('⚠️ Selecione o período para sincronizar', 'warning');
      return;
    }

    setSincronizando(true);
    setErroConexao(false);
    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);

      const response = await notificacaoService.sincronizarPorPeriodo(
        dataInicioStr,
        dataFimStr,
        filtroCodigo || undefined
      );

      if (response && response.success) {
        const processados = response.associadosProcessados || 0;
        const totalRegistrosResponse = response.totalRegistros || 0;

        if (processados > 0 || totalRegistrosResponse > 0) {
          showToast(`✅ ${processados} associados sincronizados com sucesso!`, 'success');
          setSincronizacaoRealizada(true);

          const agora = new Date();
          const dia = String(agora.getDate()).padStart(2, '0');
          const mes = String(agora.getMonth() + 1).padStart(2, '0');
          const ano = agora.getFullYear();
          const horas = String(agora.getHours()).padStart(2, '0');
          const minutos = String(agora.getMinutes()).padStart(2, '0');
          setUltimaSincronizacao(`${dia}/${mes}/${ano} ${horas}:${minutos}`);

          setTotalRegistros(totalRegistrosResponse);
          await carregarHistorico();
          await carregarDadosLocal();

          setTemDados(true);
          setBuscaRealizada(true);
        } else {
          showToast('ℹ️ Nenhum dado novo encontrado para sincronizar', 'info');
        }

        setErroConexao(false);
      } else {
        showToast('⚠️ Erro na sincronização com o servidor de notificação', 'warning');
        setErroConexao(true);
      }
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      setErroConexao(true);
      if (error.code === 'ECONNABORTED') {
        showToast('⏰ A sincronização está demorando. Verifique mais tarde.', 'warning');
      } else {
        showToast('⚠️ Erro ao sincronizar com o servidor de notificação', 'error');
      }
    } finally {
      setSincronizando(false);
    }
  };

  const handleDesfazerSincronizacao = async (sincronizacao: Sincronizacao) => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      setDesfazendo(true);
      const response = await api.delete(`/sincronizacoes/${sincronizacao.id}`);
      if (response.data.success) {
        showToast(`✅ ${response.data.message}`, 'success');
        setSincronizacaoRealizada(false);
        setTemDados(false);
        setBuscaRealizada(false);
        setNotificacoesAgrupadas([]);
        setDadosMSSQL([]);
        setPaginaAtual(1);
        setTotalPaginas(0);
        setTotalRegistros(0);
        setUltimaSincronizacao('');
        await carregarHistorico();
      } else {
        showToast(`⚠️ ${response.data.message}`, 'warning');
      }
    } catch (error) {
      console.error('❌ Erro ao desfazer sincronização:', error);
      showToast('⚠️ Erro ao desfazer sincronização', 'error');
    } finally {
      setDesfazendo(false);
    }
  };

  const aplicarFiltroGrid = () => {
    const filtro = filtroGrid.toLowerCase().trim();
    if (!filtro) {
      const dados = dadosMSSQL.length > 0 ? dadosMSSQL : notificacoesAgrupadas;
      setNotificacoesAgrupadas(dados);
      setTotalRegistros(dados.length);
      setTotalPaginas(Math.ceil(dados.length / itensPorPagina));
      setPaginaAtual(1);
      return;
    }
    const dados = dadosMSSQL.length > 0 ? dadosMSSQL : notificacoesAgrupadas;
    const dadosFiltrados = dados.filter((item) => {
      const codigo = String(item.codigoAssociado || '');
      return codigo.includes(filtro);
    });
    setNotificacoesAgrupadas(dadosFiltrados);
    setTotalRegistros(dadosFiltrados.length);
    setTotalPaginas(Math.ceil(dadosFiltrados.length / itensPorPagina));
    setPaginaAtual(1);

    if (dadosFiltrados.length === 0) {
      showToast('🔍 Nenhum registro encontrado para o filtro', 'info');
    } else {
      showToast(`🔍 ${dadosFiltrados.length} registros encontrados`, 'info');
    }
  };

  const limparFiltroGrid = () => {
    setFiltroGrid('');
    const dados = dadosMSSQL.length > 0 ? dadosMSSQL : notificacoesAgrupadas;
    setNotificacoesAgrupadas(dados);
    setTotalRegistros(dados.length);
    setTotalPaginas(Math.ceil(dados.length / itensPorPagina));
    setPaginaAtual(1);
  };

  const limparFiltros = () => {
    setFiltroCodigo('');
    setFiltroGrid('');
    const hoje = new Date();
    setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
    setDataFim(new Date(hoje.getFullYear(), hoje.getMonth(), 0));
    setNotificacoesAgrupadas([]);
    setDadosMSSQL([]);
    setTemDados(false);
    setBuscaRealizada(false);
    setSincronizacaoRealizada(false);
    setPaginaAtual(1);
    setTotalPaginas(0);
    setTotalRegistros(0);
    setUltimaSincronizacao('');
    showToast('🧹 Filtros limpos', 'info');
  };

  const handleAbrirDetalhes = (notificacao: any) => {
    setNotificacaoSelecionada(notificacao);
    setModalDetalheAberto(true);
  };

  const notificacoesAgrupadasPorCodigo = () => {
    const mapa = new Map<number, any>();
    notificacoesAgrupadas.forEach((item) => {
      const codigo = item.codigoAssociado;
      if (!mapa.has(codigo)) {
        mapa.set(codigo, {
          codigoAssociado: codigo,
          nomeAssociado: item.nomeAssociado,
          totalRegistros: 0,
          totalSms: 0,
          totalEmail: 0,
          cartasEnviadas: 0,
          naoEnviada: 0,
          detalhes: [],
        });
      }
      const grupo = mapa.get(codigo);
      grupo.totalRegistros += item.totalRegistrosDigital || 0;
      grupo.totalSms += item.totalSms || 0;
      grupo.totalEmail += item.totalEmail || 0;
      grupo.cartasEnviadas += item.cartasEnviadas || 0;
      grupo.naoEnviada += item.naoEnviada || 0;
      grupo.detalhes.push(item);
    });
    return Array.from(mapa.values());
  };

  const dadosAgrupados = notificacoesAgrupadasPorCodigo();

  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensPaginaAtual = dadosAgrupados.slice(indexPrimeiroItem, indexUltimoItem);

  const totais = dadosAgrupados.reduce(
    (acc, n) => ({
      totalRegistros: acc.totalRegistros + n.totalRegistros,
      sms: acc.sms + n.totalSms,
      emails: acc.emails + n.totalEmail,
      cartas: acc.cartas + n.cartasEnviadas,
      naoEnviadas: acc.naoEnviadas + n.naoEnviada,
    }),
    { totalRegistros: 0, sms: 0, emails: 0, cartas: 0, naoEnviadas: 0 }
  );

  useEffect(() => { carregarHistorico(); }, []);
  useEffect(() => { if (historicoAberto) carregarHistorico(); }, [historicoPagina]);

  const sincronizarDesabilitado = sincronizando || loading || carregandoMSSQL || !podeSincronizar;
  const historicoIndexUltimo = historicoPagina * itensPorPagina;
  const historicoIndexPrimeiro = historicoIndexUltimo - itensPorPagina;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Notificações" />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* ==================== HEADER ==================== */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700 mb-2 flex items-center gap-2">
              <span>📬</span> Notificações
            </h1>
            <p className="text-gray-600">
              Visualize as notificações enviadas (SMS/E-mails/Cartas) por associado
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openConfirmSincronizar}
              disabled={sincronizarDesabilitado}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium
                          transition-all active:scale-[.98] ${
                sincronizarDesabilitado
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
              }`}
              title={podeSincronizar ? 'Salvar dados na tabela local' : 'Sem permissão para sincronizar'}
            >
              {sincronizando ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <span>💾</span> Sincronizar
                </>
              )}
            </button>

            <button
              onClick={() => {
                setHistoricoAberto(!historicoAberto);
                if (!historicoAberto) carregarHistorico();
              }}
              className="px-4 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         transition-all active:scale-[.98] flex items-center gap-2 font-medium"
            >
              <span>📋</span>
              {historicoAberto ? 'Ocultar Histórico' : 'Histórico'}
            </button>
          </div>
        </div>

        {/* ==================== HISTÓRICO ==================== */}
        {historicoAberto && (
          <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-cdl-navy-50 px-4 py-3 border-b border-cdl-navy-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-cdl-navy-700 flex items-center gap-2">
                <span>📋</span> Histórico de Sincronizações
              </h2>
              <span className="text-xs text-cdl-navy-600 bg-white px-2 py-0.5 rounded-full font-medium">
                {historicoTotal} registro(s)
              </span>
            </div>

            {carregandoHistorico ? (
              <div className="flex justify-center py-8">
                <Loading />
              </div>
            ) : historico.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon="📋"
                  title="Nenhuma sincronização realizada"
                  description="Sincronize os dados para ver o histórico aqui."
                  compact
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-cdl-navy-50">
                      <tr>
                        {[
                          { label: 'ID', align: 'left' },
                          { label: 'Período', align: 'left' },
                          { label: 'Código', align: 'left' },
                          { label: 'Assoc.', align: 'center' },
                          { label: 'Reg.', align: 'center' },
                          { label: 'Data Sinc.', align: 'left' },
                          { label: 'Status', align: 'left' },
                          { label: 'Ações', align: 'center' },
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={`px-3 py-2 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                              h.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {historico.map((sinc) => (
                        <tr key={sinc.id} className="hover:bg-cdl-navy-50/40 transition-colors text-sm">
                          <td className="px-3 py-2 font-mono text-cdl-navy-700">{sinc.id}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {formatarDataExibicao(sinc.dataInicio)} à {formatarDataExibicao(sinc.dataFim)}
                          </td>
                          <td className="px-3 py-2 font-mono text-cdl-navy-700">
                            {sinc.codigoAssociado || 'Todos'}
                          </td>
                          <td className="px-3 py-2 text-center font-medium text-cdl-navy-700">
                            {sinc.totalAssociados}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-700">{sinc.totalRegistros}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                            {formatarDataHora(sinc.dataSincronizacao)}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                sinc.status === 'CONCLUIDO'
                                  ? 'bg-cdl-green-100 text-cdl-green-700'
                                  : sinc.status === 'CANCELADO'
                                    ? 'bg-cdl-danger-50 text-cdl-danger-500'
                                    : 'bg-cdl-yellow-100 text-cdl-yellow-700'
                              }`}
                            >
                              {sinc.status || 'CONCLUIDO'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {sinc.status !== 'CANCELADO' && (
                              <PermissionGuard requiredPermissions={['NOTIFICACAO_CREATE']}>
                                <button
                                  onClick={() => openConfirmDesfazer(sinc)}
                                  disabled={desfazendo}
                                  className="px-2 py-1 bg-cdl-danger-50 text-cdl-danger-500 rounded
                                             hover:bg-cdl-danger-100 disabled:opacity-50
                                             transition-colors text-xs flex items-center gap-1 mx-auto font-medium"
                                >
                                  {desfazendo ? (
                                    <span className="inline-block w-3 h-3 rounded-full border-2 border-cdl-danger-500 border-t-transparent animate-spin" />
                                  ) : (
                                    <>🗑️ Desfazer</>
                                  )}
                                </button>
                              </PermissionGuard>
                            )}
                            {sinc.status === 'CANCELADO' && (
                              <span className="text-xs text-gray-400">Cancelado</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {historicoTotalPaginas > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-gray-200 bg-cdl-neutral-50">
                    <div className="text-xs text-gray-500">
                      Mostrando <strong className="text-cdl-navy-700">{historicoIndexPrimeiro + 1}</strong> -{" "}
                      <strong className="text-cdl-navy-700">
                        {Math.min(historicoIndexUltimo, historicoTotal)}
                      </strong>{" "}
                      de <strong className="text-cdl-navy-700">{historicoTotal}</strong>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        onClick={() => setHistoricoPagina(1)}
                        disabled={historicoPagina === 1}
                        className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50
                                   hover:bg-cdl-navy-50 transition-colors text-xs"
                      >⏮️</button>
                      <button
                        onClick={() => setHistoricoPagina((p) => Math.max(1, p - 1))}
                        disabled={historicoPagina === 1}
                        className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50
                                   hover:bg-cdl-navy-50 transition-colors text-xs"
                      >◀</button>
                      <span className="px-2 py-1 text-xs text-gray-600 font-medium">
                        {historicoPagina} / {historicoTotalPaginas}
                      </span>
                      <button
                        onClick={() => setHistoricoPagina((p) => Math.min(historicoTotalPaginas, p + 1))}
                        disabled={historicoPagina === historicoTotalPaginas}
                        className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50
                                   hover:bg-cdl-navy-50 transition-colors text-xs"
                      >▶</button>
                      <button
                        onClick={() => setHistoricoPagina(historicoTotalPaginas)}
                        disabled={historicoPagina === historicoTotalPaginas}
                        className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50
                                   hover:bg-cdl-navy-50 transition-colors text-xs"
                      >⏭️</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== BANNERS DE STATUS ==================== */}
        {sincronizacaoRealizada && (
          <div className="mb-4 p-4 bg-cdl-green-50 border border-cdl-green-100 rounded-lg flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium text-cdl-green-700">
                Dados sincronizados com sucesso!
              </p>
              <p className="text-xs text-cdl-green-600 mt-1">
                {ultimaSincronizacao && `Última sincronização: ${ultimaSincronizacao}`}
                <span className="ml-2">
                  Total de registros: <strong>{totalRegistros}</strong>
                </span>
              </p>
            </div>
          </div>
        )}

        {buscaRealizada && temDados && (
          <div className="mb-4 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg flex items-center gap-2">
            <span className="text-cdl-navy-700">📊</span>
            <span className="text-sm text-cdl-navy-700">
              <strong>{dadosAgrupados.length}</strong> associados encontrados.
              {dadosMSSQL.length > 0 && !sincronizacaoRealizada && (
                <span className="ml-1 text-cdl-yellow-700"></span>
              )}
            </span>
          </div>
        )}

        {buscaRealizada && !temDados && !erroConexao && (
          <div className="mb-4 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg flex items-center gap-2">
            <span className="text-cdl-yellow-700">📭</span>
            <span className="text-sm text-cdl-yellow-700 font-medium">
              Nenhuma notificação encontrada para o período.
            </span>
          </div>
        )}

        {erroConexao && (
          <div className="mb-4 p-4 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-sm font-medium text-cdl-danger-600">
                Servidor de Notificação indisponível
              </p>
              <p className="text-xs text-cdl-danger-500 mt-1">
                Não foi possível conectar ao servidor MS-SQL. Verifique a conexão.
              </p>
            </div>
          </div>
        )}

        {/* ==================== FILTROS ==================== */}
        <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-cdl-navy-700 mb-1">Código Associado</label>
              <input
                type="text"
                placeholder="Código do Associado"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors"
              />
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

            <div className="flex items-end">
              <span className="text-xs text-cdl-navy-600 font-medium">
                Período: {formatarData(dataInicio)} à {formatarData(dataFim)}
              </span>
            </div>

            <div className="flex items-end gap-2 col-span-2">
              <button
                onClick={carregarGridMSSQL}
                disabled={carregandoMSSQL || sincronizando}
                className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           disabled:bg-gray-400 disabled:cursor-not-allowed transition-all
                           active:scale-[.98] flex items-center gap-2 flex-1 justify-center font-medium"
                title="Buscar dados no MS-SQL (sem salvar)"
              >
                {carregandoMSSQL ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Buscando...
                  </>
                ) : '🔄 Buscar'}
              </button>

              {carregandoMSSQL && (
                <button
                  onClick={cancelarBusca}
                  className="px-4 py-2 bg-cdl-danger-500 text-white rounded-lg hover:bg-cdl-danger-600
                             transition-all active:scale-[.98] flex items-center gap-2
                             flex-1 justify-center font-medium"
                >
                  <span>⏹️</span> Cancelar
                </button>
              )}

              <button
                onClick={limparFiltros}
                disabled={carregandoMSSQL || sincronizando || loading}
                className="px-4 py-2 bg-cdl-neutral-100 text-cdl-navy-700 rounded-lg
                           hover:bg-cdl-neutral-200 disabled:opacity-50 transition-colors
                           flex items-center gap-2 flex-1 justify-center font-medium"
                title="Limpar filtros"
              >
                <span>🧹</span> Limpar
              </button>
            </div>
          </div>

          {/* Filtro da grid */}
          {buscaRealizada && temDados && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cdl-navy-100 pt-3">
              <span className="text-xs font-medium text-cdl-navy-600">🔍 Filtrar Grid:</span>
              <input
                type="text"
                placeholder="Filtrar por código do associado..."
                value={filtroGrid}
                onChange={(e) => setFiltroGrid(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg bg-white
                           focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                           focus:border-cdl-navy-600 transition-colors text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') aplicarFiltroGrid();
                }}
              />
              <button
                onClick={aplicarFiltroGrid}
                className="px-3 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           transition-all active:scale-[.98] text-sm font-medium"
              >
                🔍 Filtrar
              </button>
              <button
                onClick={limparFiltroGrid}
                className="px-3 py-2 bg-cdl-neutral-100 text-cdl-navy-700 rounded-lg
                           hover:bg-cdl-neutral-200 transition-colors text-sm font-medium"
              >
                ✕ Limpar
              </button>
              <span className="text-xs text-cdl-navy-600">
                {totalRegistros} registros
              </span>
            </div>
          )}
        </div>

        {/* ==================== RESUMO ==================== */}
        {buscaRealizada && dadosAgrupados.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">{totais.totalRegistros}</div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Total Registros</div>
            </div>
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-navy-700">{totais.sms}</div>
              <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">SMS</div>
            </div>
            <div className="bg-cdl-green-50 border border-cdl-green-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-green-700">{totais.emails}</div>
              <div className="text-xs text-cdl-green-600 mt-0.5 font-medium">E-mails</div>
            </div>
            <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-yellow-700">{totais.cartas}</div>
              <div className="text-xs text-cdl-yellow-600 mt-0.5 font-medium">Cartas</div>
            </div>
            <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-cdl-danger-500">{totais.naoEnviadas}</div>
              <div className="text-xs text-cdl-danger-500 mt-0.5 font-medium">Não Enviadas</div>
            </div>
          </div>
        )}

        {/* ==================== TABELA ==================== */}
        {carregandoMSSQL ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : !buscaRealizada ? (
          <EmptyState
            icon="📊"
            title="Aguardando busca"
            description='Clique em "Buscar" para carregar os dados. Os dados serão exibidos sem serem salvos.'
            compact
          />
        ) : dadosAgrupados.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nenhuma notificação encontrada"
            description={`Não há registros para o período ${formatarData(dataInicio)} à ${formatarData(dataFim)}.`}
            compact
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Código','Associado','Total','SMS','E-mail','Cartas','Não Env.','Períodos','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          i === 1 ? 'text-left' : i === 0 ? 'text-left' : 'text-center'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {itensPaginaAtual.map((grupo, index) => (
                    <tr key={index} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-cdl-navy-700">
                        {grupo.codigoAssociado}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={grupo.nomeAssociado}>
                        {grupo.nomeAssociado || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-cdl-navy-700">
                        {grupo.totalRegistros}
                      </td>
                      <td className="px-4 py-3 text-center text-cdl-navy-600 font-medium">{grupo.totalSms}</td>
                      <td className="px-4 py-3 text-center text-cdl-green-700 font-medium">{grupo.totalEmail}</td>
                      <td className="px-4 py-3 text-center text-cdl-yellow-700 font-medium">
                        {grupo.cartasEnviadas}
                      </td>
                      <td className="px-4 py-3 text-center text-cdl-danger-500 font-medium">
                        {grupo.naoEnviada}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500 font-medium">
                        {grupo.detalhes.length} período(s)
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAbrirDetalhes({
                            ...grupo,
                            detalhes: grupo.detalhes,
                            dataInicio: dataInicio,
                            dataFim: dataFim,
                          })}
                          className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50
                                     rounded transition-colors"
                          title="Ver detalhes"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Mostrando <strong className="text-cdl-navy-700">{indexPrimeiroItem + 1}</strong> -{" "}
                  <strong className="text-cdl-navy-700">
                    {Math.min(indexUltimoItem, dadosAgrupados.length)}
                  </strong>{" "}
                  de <strong className="text-cdl-navy-700">{dadosAgrupados.length}</strong> registros
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                    title="Primeira página"
                  >⏮️</button>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >◀ Anterior</button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página <strong className="text-cdl-navy-700">{paginaAtual}</strong> de{" "}
                    <strong className="text-cdl-navy-700">{totalPaginas}</strong>
                  </span>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                  >Próxima ▶</button>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-50
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors text-sm"
                    title="Última página"
                  >⏭️</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================== RODAPÉ ==================== */}
        <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-3 flex justify-between items-center flex-wrap gap-2">
          <span>
            {dadosMSSQL.length > 0 && !sincronizacaoRealizada && '🔄 Notificações não sincronizadas' }
            {sincronizacaoRealizada && '✅ Dados sincronizados com o servidor'}
            {buscaRealizada && erroConexao && '❌ Servidor indisponível'}
            {!buscaRealizada && '📊 Aguardando busca...'}
          </span>
          <span>
            {buscaRealizada
              ? `${dadosAgrupados.length} associados | ${notificacoesAgrupadas.length} registros`
              : '-'}
          </span>
        </div>
      </div>

      {/* ==================== MODAL DETALHE ==================== */}
      <ModalDetalheNotificacao
        isOpen={modalDetalheAberto}
        onClose={() => {
          setModalDetalheAberto(false);
          setNotificacaoSelecionada(null);
        }}
        notificacao={notificacaoSelecionada}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </div>
  );
};

export default Notificacoes;