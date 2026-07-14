// src/pages/Notificacoes.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import ModalDetalheNotificacao from '../components/faturamento/ModalDetalheNotificacao';
import ConfirmModal from '../components/ui/ConfirmModal';
import notificacaoService from '../services/notificacaoService';
import api from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [desfazendo, setDesfazendo] = useState(false);
  const [notificacoesAgrupadas, setNotificacoesAgrupadas] = useState<any[]>([]);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  
  // 🔥 FILTROS: Data Inicial e Data Final
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  });
  
  const [filtroGrid, setFiltroGrid] = useState('');
  
  const [msSqlDisponivel, setMsSqlDisponivel] = useState<boolean | null>(null);
  const [erroConexao, setErroConexao] = useState<boolean>(false);
  const [temDados, setTemDados] = useState<boolean>(false);
  const [buscaRealizada, setBuscaRealizada] = useState<boolean>(false);
  const [sincronizacaoRealizada, setSincronizacaoRealizada] = useState<boolean>(false);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string>('');
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  
  // 🔥 DADOS DO MS-SQL (TEMPORÁRIOS - NÃO SALVOS)
  const [dadosMSSQL, setDadosMSSQL] = useState<any[]>([]);
  const [carregandoMSSQL, setCarregandoMSSQL] = useState(false);

  // 🔥 HISTÓRICO DE SINCRONIZAÇÕES
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [historico, setHistorico] = useState<Sincronizacao[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [historicoPagina, setHistoricoPagina] = useState(1);
  const [historicoTotal, setHistoricoTotal] = useState(0);
  const [historicoTotalPaginas, setHistoricoTotalPaginas] = useState(0);

  // 🔥 PAGINAÇÃO PRINCIPAL
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // 🔥 REF PARA CANCELAR BUSCA
  const abortControllerRef = useRef<AbortController | null>(null);

  // 🔥 CONFIRM MODAL
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
    type: 'warning'
  });

  // Modal de Detalhes
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<any>(null);

  // 🔥 FORMATAR DATA PARA DD/MM/YYYY
  const formatarData = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // 🔥 FORMATAR DATA E HORA (CORRIGIDO)
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
    } catch (e) {
      return data;
    }
  };

  // 🔥 FORMATAR DATA PARA EXIBIÇÃO
  const formatarDataExibicao = (data: string): string => {
    if (!data) return '-';
    const partes = data.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  // 🔥 CANCELAR BUSCA
  const cancelarBusca = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setCarregandoMSSQL(false);
      showToast('⏹️ Busca cancelada', 'info');
    }
  };

  // 🔥 CARREGAR DADOS DO MS-SQL (SEM SALVAR)
  const carregarGridMSSQL = async () => {
    if (!dataInicio || !dataFim) {
      showToast('⚠️ Selecione o período para buscar', 'warning');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
          codigoAssociado: filtroCodigo || undefined
        },
        signal: abortControllerRef.current.signal
      });
      
      if (abortControllerRef.current?.signal.aborted) {
        console.log('⏹️ Busca cancelada pelo usuário');
        return;
      }
      
      const data = response.data || [];
      setDadosMSSQL(data);
      setNotificacoesAgrupadas(data);
      setTemDados(data.length > 0);
      setBuscaRealizada(true);
      setTotalRegistros(data.length);
      setTotalPaginas(Math.ceil(data.length / itensPorPagina));
      setMsSqlDisponivel(true);
      
      if (data.length === 0) {
        showToast('ℹ️ Nenhuma notificação encontrada no MS-SQL', 'info');
      } else {
        showToast(`✅ ${data.length} registros encontrados no MS-SQL`, 'success');
      }
      
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.message === 'canceled') {
        console.log('⏹️ Busca cancelada pelo usuário');
        return;
      }
      
      console.error('❌ Erro ao carregar do MS-SQL:', error);
      setErroConexao(true);
      setMsSqlDisponivel(false);
      setDadosMSSQL([]);
      setNotificacoesAgrupadas([]);
      setTemDados(false);
      showToast('⚠️ Erro ao carregar dados do MS-SQL', 'error');
    } finally {
      setCarregandoMSSQL(false);
      abortControllerRef.current = null;
    }
  };

  // 🔥 CARREGAR DADOS DA TABELA LOCAL (APÓS SINCRONIZAR)
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
      
      console.log('📊 Dados locais carregados:', data.length);
      
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

  // 🔥 CARREGAR HISTÓRICO DE SINCRONIZAÇÕES
  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const response = await api.get('/sincronizacoes', {
        params: {
          page: historicoPagina - 1,
          size: itensPorPagina
        }
      });
      
      console.log('📊 Resposta do histórico:', response.data);
      
      const content = response.data.content || [];
      const totalElements = response.data.totalElements || 0;
      const totalPages = response.data.totalPages || 0;
      
      setHistorico(content);
      setHistoricoTotal(totalElements);
      setHistoricoTotalPaginas(totalPages);
      
      console.log(`📊 Histórico carregado: ${content.length} registros, total: ${totalElements}`);
      
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

  // 🔥 ABRIR CONFIRM MODAL PARA SINCRONIZAR
  const openConfirmSincronizar = () => {
    const dataInicioStr = formatarData(dataInicio);
    const dataFimStr = formatarData(dataFim);
    const codigo = filtroCodigo || 'Todos';
    
    setConfirmModal({
      isOpen: true,
      title: '⚠️ Confirmar Sincronização',
      message: `Deseja sincronizar os dados?\n\n` +
               `📅 Período: ${dataInicioStr} à ${dataFimStr}\n` +
               `👤 Código: ${codigo}\n\n` +
               `Esta ação irá salvar na base local.`,
      confirmText: '✅ Sim, Sincronizar',
      cancelText: '❌ Cancelar',
      type: 'warning',
      onConfirm: handleSincronizar
    });
  };

  // 🔥 ABRIR CONFIRM MODAL PARA DESFAZER
  const openConfirmDesfazer = (sincronizacao: Sincronizacao) => {
    setConfirmModal({
      isOpen: true,
      title: '⚠️ Confirmar Desfazer Sincronização',
      message: `Tem certeza que deseja desfazer a sincronização?\n\n` +
               `📅 Período: ${formatarDataExibicao(sincronizacao.dataInicio)} à ${formatarDataExibicao(sincronizacao.dataFim)}\n` +
               `👤 Código: ${sincronizacao.codigoAssociado || 'Todos'}\n` +
               `📊 Associados: ${sincronizacao.totalAssociados}\n` +
               `📝 Registros: ${sincronizacao.totalRegistros}\n\n` +
               `⚠️ Esta ação removerá todos os dados sincronizados.`,
      confirmText: '🗑️ Sim, Desfazer',
      cancelText: '❌ Cancelar',
      type: 'danger',
      onConfirm: () => handleDesfazerSincronizacao(sincronizacao)
    });
  };

  // 🔥 SINCRONIZAR (SALVAR NA TABELA LOCAL)
  const handleSincronizar = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    
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
      
      console.log('📊 Resposta da sincronização:', response);
      
      if (response && response.success) {
        const processados = response.associadosProcessados || 0;
        const totalRegistrosResponse = response.totalRegistros || 0;
        
        console.log(`✅ Processados: ${processados}, Total registros: ${totalRegistrosResponse}`);
        
        if (processados > 0 || totalRegistrosResponse > 0) {
          showToast(`✅ ${processados} associados sincronizados com sucesso!`, 'success');
          setSincronizacaoRealizada(true);
          
          // 🔥 FORMATAR DATA CORRETAMENTE (FUSO LOCAL)
          const agora = new Date();
          const dia = String(agora.getDate()).padStart(2, '0');
          const mes = String(agora.getMonth() + 1).padStart(2, '0');
          const ano = agora.getFullYear();
          const horas = String(agora.getHours()).padStart(2, '0');
          const minutos = String(agora.getMinutes()).padStart(2, '0');
          setUltimaSincronizacao(`${dia}/${mes}/${ano} ${horas}:${minutos}`);
          
          // 🔥 ATUALIZAR TOTAL DE REGISTROS
          setTotalRegistros(totalRegistrosResponse);
          
          // 🔥 RECARREGAR HISTÓRICO
          await carregarHistorico();
          
          // 🔥 RECARREGAR DADOS LOCAIS
          await carregarDadosLocal();
          
          setTemDados(true);
          setBuscaRealizada(true);
          
        } else {
          showToast('ℹ️ Nenhum dado novo encontrado para sincronizar', 'info');
        }
        
        setMsSqlDisponivel(true);
        setErroConexao(false);
        
      } else {
        showToast('⚠️ Erro na sincronização com o servidor de notificação', 'warning');
        setErroConexao(true);
        setMsSqlDisponivel(false);
      }
      
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      setErroConexao(true);
      setMsSqlDisponivel(false);
      
      if (error.code === 'ECONNABORTED') {
        showToast('⏰ A sincronização está demorando. Verifique mais tarde.', 'warning');
      } else {
        showToast('⚠️ Erro ao sincronizar com o servidor de notificação', 'error');
      }
    } finally {
      setSincronizando(false);
    }
  };

  // 🔥 DESFAZER SINCRONIZAÇÃO
  const handleDesfazerSincronizacao = async (sincronizacao: Sincronizacao) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    
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

  // 🔥 APLICAR FILTRO NA GRID
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
    const dadosFiltrados = dados.filter(item => {
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

  // 🔥 LIMPAR FILTRO DA GRID
  const limparFiltroGrid = () => {
    setFiltroGrid('');
    const dados = dadosMSSQL.length > 0 ? dadosMSSQL : notificacoesAgrupadas;
    setNotificacoesAgrupadas(dados);
    setTotalRegistros(dados.length);
    setTotalPaginas(Math.ceil(dados.length / itensPorPagina));
    setPaginaAtual(1);
  };

  // 🔥 LIMPAR FILTROS
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

  // 🔥 ABRIR MODAL DE DETALHES
  const handleAbrirDetalhes = (notificacao: any) => {
    setNotificacaoSelecionada(notificacao);
    setModalDetalheAberto(true);
  };

  // 🔥 AGRUPAR NOTIFICAÇÕES POR CÓDIGO DO ASSOCIADO
  const notificacoesAgrupadasPorCodigo = () => {
    const mapa = new Map<number, any>();
    
    notificacoesAgrupadas.forEach(item => {
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
          detalhes: []
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

  // 🔥 CALCULAR PAGINAÇÃO
  const indexUltimoItem = paginaAtual * itensPorPagina;
  const indexPrimeiroItem = indexUltimoItem - itensPorPagina;
  const itensPaginaAtual = dadosAgrupados.slice(indexPrimeiroItem, indexUltimoItem);

  // Calcular totais gerais
  const totais = dadosAgrupados.reduce((acc, n) => ({
    totalRegistros: acc.totalRegistros + n.totalRegistros,
    sms: acc.sms + n.totalSms,
    emails: acc.emails + n.totalEmail,
    cartas: acc.cartas + n.cartasEnviadas,
    naoEnviadas: acc.naoEnviadas + n.naoEnviada
  }), { totalRegistros: 0, sms: 0, emails: 0, cartas: 0, naoEnviadas: 0 });

  // 🔥 CARREGAR HISTÓRICO AO MONTAR
  useEffect(() => {
    carregarHistorico();
  }, []);

  // 🔥 RECARREGAR HISTÓRICO AO MUDAR PÁGINA
  useEffect(() => {
    if (historicoAberto) {
      carregarHistorico();
    }
  }, [historicoPagina]);

  // 🔥 VERIFICAR SE BOTÃO SINCRONIZAR DEVE ESTAR DESABILITADO
  const sincronizarDesabilitado = sincronizando || loading || carregandoMSSQL;

  // 🔥 PAGINAÇÃO DO HISTÓRICO
  const historicoIndexUltimo = historicoPagina * itensPorPagina;
  const historicoIndexPrimeiro = historicoIndexUltimo - itensPorPagina;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Notificações" />

      {/* 🔥 CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">📬 Notificações</h1>
            <p className="text-gray-600">
              Visualize as notificações enviadas (SMS/E-mails/Cartas) por associado
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openConfirmSincronizar}
              disabled={sincronizarDesabilitado}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                sincronizarDesabilitado 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="Salvar dados na tabela local"
            >
              {sincronizando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Sincronizar
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setHistoricoAberto(!historicoAberto);
                if (!historicoAberto) {
                  carregarHistorico();
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span>📋</span>
              {historicoAberto ? 'Ocultar Histórico' : 'Histórico'}
            </button>
          </div>
        </div>

        {/* 🔥 HISTÓRICO DE SINCRONIZAÇÕES */}
        {historicoAberto && (
          <div className="mb-6 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-700">📋 Histórico de Sincronizações</h2>
              <span className="text-xs text-gray-500">{historicoTotal} registros</span>
            </div>
            
            {carregandoHistorico ? (
              <div className="flex justify-center py-8">
                <Loading size="medium" />
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Nenhuma sincronização realizada
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Assoc.</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Reg.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Sinc.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {historico.map((sinc) => (
                        <tr key={sinc.id} className="hover:bg-gray-50 transition-colors text-sm">
                          <td className="px-3 py-2 font-mono text-gray-600">{sinc.id}</td>
                          <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                            {formatarDataExibicao(sinc.dataInicio)} à {formatarDataExibicao(sinc.dataFim)}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-600">
                            {sinc.codigoAssociado || 'Todos'}
                          </td>
                          <td className="px-3 py-2 text-center font-medium">{sinc.totalAssociados}</td>
                          <td className="px-3 py-2 text-center">{sinc.totalRegistros}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">
                            {formatarDataHora(sinc.dataSincronizacao)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              sinc.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
                              sinc.status === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {sinc.status || 'CONCLUIDO'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {sinc.status !== 'CANCELADO' && (
                              <button
                                onClick={() => openConfirmDesfazer(sinc)}
                                disabled={desfazendo}
                                className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-colors text-xs flex items-center gap-1 mx-auto"
                              >
                                {desfazendo ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                  </>
                                ) : (
                                  '🗑️ Desfazer'
                                )}
                              </button>
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
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t bg-gray-50">
                    <div className="text-xs text-gray-500">
                      Mostrando {historicoIndexPrimeiro + 1} - {Math.min(historicoIndexUltimo, historicoTotal)} de {historicoTotal}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        onClick={() => setHistoricoPagina(1)}
                        disabled={historicoPagina === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-xs"
                      >
                        ⏮️
                      </button>
                      <button
                        onClick={() => setHistoricoPagina(p => Math.max(1, p - 1))}
                        disabled={historicoPagina === 1}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-xs"
                      >
                        ◀
                      </button>
                      <span className="px-2 py-1 text-xs text-gray-600">
                        {historicoPagina} / {historicoTotalPaginas}
                      </span>
                      <button
                        onClick={() => setHistoricoPagina(p => Math.min(historicoTotalPaginas, p + 1))}
                        disabled={historicoPagina === historicoTotalPaginas}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-xs"
                      >
                        ▶
                      </button>
                      <button
                        onClick={() => setHistoricoPagina(historicoTotalPaginas)}
                        disabled={historicoPagina === historicoTotalPaginas}
                        className="px-2 py-1 border rounded disabled:opacity-50 hover:bg-gray-100 text-xs"
                      >
                        ⏭️
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 🔥 STATUS DE SINCRONIZAÇÃO */}
        {sincronizacaoRealizada && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-medium text-green-800">
                  Dados sincronizados com sucesso!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {ultimaSincronizacao && `Última sincronização: ${ultimaSincronizacao}`}
                  <span className="ml-2">Total de registros: {totalRegistros}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {buscaRealizada && temDados && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <span className="text-blue-600">📊</span>
            <span className="text-sm text-blue-700">
              {dadosAgrupados.length} associados encontrados.
              {dadosMSSQL.length > 0 && !sincronizacaoRealizada && ` (Dados do MS-SQL - não salvos)`}
            </span>
          </div>
        )}

        {buscaRealizada && !temDados && !erroConexao && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <span className="text-yellow-600">📭</span>
            <span className="text-sm text-yellow-700">
              Nenhuma notificação encontrada para o período.
            </span>
          </div>
        )}

        {erroConexao && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Servidor de Notificação indisponível
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Não foi possível conectar ao servidor MS-SQL. Verifique a conexão.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 FILTROS */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Código Associado</label>
              <input
                type="text"
                placeholder="Código do Associado"
                value={filtroCodigo}
                onChange={(e) => setFiltroCodigo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={dataInicio.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const [ano, mes, dia] = e.target.value.split('-').map(Number);
                    setDataInicio(new Date(ano, mes - 1, dia));
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={dataFim.toISOString().split('T')[0]}
                onChange={(e) => {
                  if (e.target.value) {
                    const [ano, mes, dia] = e.target.value.split('-').map(Number);
                    setDataFim(new Date(ano, mes - 1, dia));
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <span className="text-xs text-gray-500">
                Período: {formatarData(dataInicio)} à {formatarData(dataFim)}
              </span>
            </div>
            
            <div className="flex items-end gap-2 col-span-2">
              <button
                onClick={carregarGridMSSQL}
                disabled={carregandoMSSQL || sincronizando}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 flex-1 justify-center"
                title="Buscar dados no MS-SQL (sem salvar)"
              >
                {carregandoMSSQL ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando...
                  </>
                ) : (
                  '🔄 Buscar'
                )}
              </button>
              
              {carregandoMSSQL && (
                <button
                  onClick={cancelarBusca}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 flex-1 justify-center"
                >
                  <span>⏹️</span>
                  Cancelar
                </button>
              )}
              
              <button
                onClick={limparFiltros}
                disabled={carregandoMSSQL || sincronizando || loading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center gap-2 flex-1 justify-center"
                title="Limpar filtros"
              >
                <span>🧹</span>
                Limpar
              </button>
            </div>
          </div>
          
          {/* 🔥 FILTRO DE BUSCA NA GRID */}
          {buscaRealizada && temDados && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3">
              <span className="text-xs font-medium text-gray-500">🔍 Filtrar Grid:</span>
              <input
                type="text"
                placeholder="Filtrar por código do associado..."
                value={filtroGrid}
                onChange={(e) => setFiltroGrid(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    aplicarFiltroGrid();
                  }
                }}
              />
              <button
                onClick={aplicarFiltroGrid}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                🔍 Filtrar
              </button>
              <button
                onClick={limparFiltroGrid}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                ✕ Limpar
              </button>
              <span className="text-xs text-gray-400">
                {totalRegistros} registros
              </span>
            </div>
          )}
          
          {/* 🔥 INDICADORES DE STATUS */}
          {carregandoMSSQL && (
            <div className="mt-3 flex items-center gap-2 text-sm text-purple-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span>Buscando dados no MS-SQL... Aguarde</span>
            </div>
          )}
          
          {sincronizando && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Salvando dados na tabela local... Aguarde</span>
            </div>
          )}
        </div>

        {/* Resumo */}
        {buscaRealizada && dadosAgrupados.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{totais.totalRegistros}</div>
              <div className="text-xs text-gray-600">Total Registros</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{totais.sms}</div>
              <div className="text-xs text-gray-600">SMS</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{totais.emails}</div>
              <div className="text-xs text-gray-600">E-mails</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{totais.cartas}</div>
              <div className="text-xs text-gray-600">Cartas</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{totais.naoEnviadas}</div>
              <div className="text-xs text-gray-600">Não Enviadas</div>
            </div>
          </div>
        )}

        {/* Tabela Agrupada por Associado */}
        {carregandoMSSQL ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
            <p className="text-gray-500 mt-4">Carregando dados do MS-SQL...</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
            <p className="text-gray-500 mt-4">Carregando dados da base local...</p>
          </div>
        ) : !buscaRealizada ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-500">Clique em "Carregar Grid" para buscar dados do MS-SQL</p>
            <p className="text-sm text-gray-400 mt-1">Os dados serão exibidos sem serem salvos</p>
          </div>
        ) : dadosAgrupados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">Nenhuma notificação encontrada para o período</p>
            {erroConexao && (
              <p className="text-xs text-red-600 mt-2">❌ Servidor de Notificação indisponível</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SMS</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">E-mail</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cartas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Não Env.</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Períodos</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {itensPaginaAtual.map((grupo, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{grupo.codigoAssociado}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={grupo.nomeAssociado}>
                        {grupo.nomeAssociado || '-'}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{grupo.totalRegistros}</td>
                      <td className="px-4 py-3 text-center text-purple-600">{grupo.totalSms}</td>
                      <td className="px-4 py-3 text-center text-green-600">{grupo.totalEmail}</td>
                      <td className="px-4 py-3 text-center text-yellow-600">{grupo.cartasEnviadas}</td>
                      <td className="px-4 py-3 text-center text-red-600">{grupo.naoEnviada}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {grupo.detalhes.length} período(s)
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleAbrirDetalhes({
                            ...grupo,
                            detalhes: grupo.detalhes,
                            dataInicio: dataInicio,
                            dataFim: dataFim
                          })}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
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

            {/* 🔥 PAGINAÇÃO */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {indexPrimeiroItem + 1} - {Math.min(indexUltimoItem, dadosAgrupados.length)} de {dadosAgrupados.length} registros
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    title="Primeira página"
                  >
                    ⏮️
                  </button>
                  
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ◀ Anterior
                  </button>
                  
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    Próxima ▶
                  </button>
                  
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    title="Última página"
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Rodapé com informações */}
        <div className="mt-4 text-xs text-gray-400 border-t pt-3 flex justify-between items-center flex-wrap gap-2">
          <span>
            {dadosMSSQL.length > 0 && !sincronizacaoRealizada && '🔄 Dados do MS-SQL (não salvos)'}
            {sincronizacaoRealizada && '✅ Dados sincronizados com o servidor'}
            {buscaRealizada && erroConexao && '❌ Servidor indisponível'}
            {!buscaRealizada && '📊 Aguardando busca...'}
          </span>
          <span>
            {buscaRealizada && `${dadosAgrupados.length} associados | ${notificacoesAgrupadas.length} registros`}
            {!buscaRealizada && '-'}
          </span>
        </div>
      </div>

      {/* 🔥 MODAL DE DETALHES */}
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