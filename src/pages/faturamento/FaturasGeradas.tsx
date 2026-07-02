// src/pages/faturamento/FaturasGeradas.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import faturamentoService, { Fatura } from '../../services/faturamentoService';
import ModalExportacaoRm from '../../components/faturamento/ModalExportacaoRm';
import ModalResultadoExportacaoRm from '../../components/faturamento/ModalResultadoExportacaoRm';
import ConfirmModal from '../../components/ui/ConfirmModal';
import api from '../../services/api';

// 🔥 FUNÇÃO PARA GERAR NOME DE ARQUIVO PADRONIZADO
const gerarNomeArquivoRm = (): string => {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10);
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `exportacao_rm_faturas_${data}_${hora}.txt`;
};

const FaturasGeradas: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Seleção
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [todasFaturasIds, setTodasFaturasIds] = useState<number[]>([]);
  const [totalFaturas, setTotalFaturas] = useState(0);
  
  // Dados completos das faturas selecionadas
  const [dadosFaturasSelecionadas, setDadosFaturasSelecionadas] = useState<Fatura[]>([]);
  
  // Exportação RM
  const [modalExportacaoRmAberta, setModalExportacaoRmAberta] = useState(false);
  const [modalResultadoExportacaoAberta, setModalResultadoExportacaoAberta] = useState(false);
  const [resultadoExportacao, setResultadoExportacao] = useState<any>(null);
  const [exportandoRm, setExportandoRm] = useState(false);
  const [blobArquivoRm, setBlobArquivoRm] = useState<Blob | null>(null);
  
  // 🔥 MODAL DE CONFIRMAÇÃO PARA EXCLUSÃO INDIVIDUAL
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false);
  const [faturaParaExcluir, setFaturaParaExcluir] = useState<{ id: number } | null>(null);
  
  // 🔥 MODAL DE CONFIRMAÇÃO PARA EXCLUSÃO EM MASSA
  const [modalConfirmacaoMassaAberta, setModalConfirmacaoMassaAberta] = useState(false);
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);
  
  // Filtros
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroAssociado, setFiltroAssociado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  
  // 🔥 NOVO: Filtro por régua
  const [filtroRegua, setFiltroRegua] = useState<number | undefined>(undefined);
  const [reguas, setReguas] = useState<any[]>([]);
  
  // Paginação
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const pageSize = 15;
  
  // 🔥 CARREGAR RÉGUAS
  useEffect(() => {
    const carregarReguas = async () => {
      try {
        const response = await api.get('/regua-faturamento/ativas');
        setReguas(response.data);
      } catch (error) {
        console.error('Erro ao carregar réguas:', error);
      }
    };
    carregarReguas();
  }, []);
  
  const carregarFaturas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await faturamentoService.listarFaturas(pagina, pageSize, {
        numeroFatura: filtroNumero || undefined,
        associadoNome: filtroAssociado || undefined,
        status: filtroStatus || undefined,
        mes: filtroMes,
        ano: filtroAno,
        reguaId: filtroRegua
      });
      
      setFaturas(response.content);
      setTotalPaginas(response.totalPages);
      setTotalItens(response.totalElements);
      setTotalFaturas(response.totalElements);
      
      setTodasFaturasIds(response.content.map((f: any) => f.id));
      
    } catch (error: any) {
      console.error('Erro ao carregar faturas:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar faturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagina, filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, showToast]);
  
  useEffect(() => {
    carregarFaturas();
    setFaturasSelecionadas(new Set());
    setDadosFaturasSelecionadas([]);
    setSelecionarTodos(false);
  }, [pagina, filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, carregarFaturas]);
  
  // Calcular valor total corretamente
  const valorTotalSelecionadas = useMemo(() => {
    if (dadosFaturasSelecionadas.length > 0) {
      const total = dadosFaturasSelecionadas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
      return total;
    }
    
    const total = Array.from(faturasSelecionadas).reduce((acc, id) => {
      const fatura = faturas.find(f => f.id === id);
      return acc + (fatura?.valorTotal || 0);
    }, 0);
    
    return total;
  }, [faturasSelecionadas, faturas, dadosFaturasSelecionadas]);
  
  // Selecionar/Deselecionar fatura
  const toggleSelecionarFatura = (id: number) => {
    const novosSelecionados = new Set(faturasSelecionadas);
    if (novosSelecionados.has(id)) {
      novosSelecionados.delete(id);
    } else {
      novosSelecionados.add(id);
    }
    setFaturasSelecionadas(novosSelecionados);
    if (dadosFaturasSelecionadas.length > 0) {
      setDadosFaturasSelecionadas([]);
    }
    setSelecionarTodos(novosSelecionados.size === totalFaturas && totalFaturas > 0);
  };
  
  // Selecionar TODAS as faturas
  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
    } else {
      carregarTodasFaturasIds();
    }
  };
  
  // Carregar todos os IDs e dados das faturas
  const carregarTodasFaturasIds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await faturamentoService.listarFaturas(0, 1000, {
        numeroFatura: filtroNumero || undefined,
        associadoNome: filtroAssociado || undefined,
        status: filtroStatus || undefined,
        mes: filtroMes,
        ano: filtroAno,
        reguaId: filtroRegua
      });
      
      const todasFaturas = response.content.map((f: any) => ({
        id: f.id,
        numeroFatura: f.numeroFatura,
        valorTotal: f.valorTotal || 0,
        associadoNome: f.associadoNome,
        dataEmissao: f.dataEmissao,
        dataVencimento: f.dataVencimento,
        status: f.status,
        cnpjCpf: f.cnpjCpf,
        associadoId: f.associadoId,
        reguaNome: f.reguaNome,
        reguaId: f.reguaId,
        mesReferencia: f.mesReferencia,
        anoReferencia: f.anoReferencia,
        criadoEm: f.criadoEm,
        processadoRm: f.processadoRm,
        observacao: f.observacao
      }));
      
      const todosIds = todasFaturas.map(f => f.id);
      
      setFaturasSelecionadas(new Set(todosIds));
      setDadosFaturasSelecionadas(todasFaturas);
      setSelecionarTodos(true);
      
      const total = todasFaturas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
      showToast(`${todosIds.length} fatura(s) selecionada(s) - Total: R$ ${total.toFixed(2)}`, 'info');
      
    } catch (error: any) {
      console.error('Erro ao carregar todas as faturas:', error);
      showToast(error.response?.data?.message || 'Erro ao selecionar todas as faturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, showToast]);
  
  // ========== EXPORTAÇÃO RM ==========
  
  // Exportar RM
  const handleExportarRm = async (ultimoNumeroRps: number, observacao: string) => {
    setExportandoRm(true);
    try {
      const faturaIds = Array.from(faturasSelecionadas);
      
      console.log('📤 Iniciando exportação RM com metadados para:', faturaIds.length);
      console.log('📤 Último número RPS:', ultimoNumeroRps);
      console.log('📤 Régua ID:', filtroRegua);
      
      const mesReferencia = `${filtroAno}-${String(filtroMes).padStart(2, '0')}`;
      
      console.log('📤 mesReferencia enviado:', mesReferencia);
  
      const { blob, metadados } = await faturamentoService.exportarRmMultiplasFaturasComMetadados(
        faturaIds,
        ultimoNumeroRps,
        filtroRegua,
        mesReferencia
      );
      
      console.log('📥 Blob recebido, tamanho:', blob.size);
      console.log('📥 Metadados recebidos:', metadados);
      
      if (!blob || blob.size === 0) {
        throw new Error('Arquivo gerado vazio');
      }
      
      const nomeArquivo = gerarNomeArquivoRm();
      
      setBlobArquivoRm(blob);
      
      setResultadoExportacao({
        loteId: metadados.loteId || Date.now(),
        totalFaturas: metadados.totalFaturas || faturaIds.length,
        faturasProcessadas: metadados.faturasProcessadas || faturaIds.length,
        faturasComErro: metadados.faturasComErro || 0,
        faturasIgnoradas: metadados.faturasIgnoradas || 0,
        faturasIgnoradasIds: metadados.faturasIgnoradasIds || [],
        valorTotalIgnorado: metadados.valorTotalIgnorado || 0,
        ultimoNumeroRps: metadados.ultimoNumeroRps || (ultimoNumeroRps + faturaIds.length),
        primeiroNumeroRps: metadados.primeiroNumeroRps || (ultimoNumeroRps + 1),
        dataProcessamento: metadados.dataProcessamento || new Date().toISOString(),
        mesReferencia: String(filtroMes).padStart(2, '0'),
        anoReferencia: String(filtroAno),
        valorTotal: metadados.valorTotal || 0,
        detalhes: metadados.detalhes || [],
        nomeArquivo: nomeArquivo
      });
  
      setModalExportacaoRmAberta(false);
      setModalResultadoExportacaoAberta(true);
      
      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
  
      await carregarFaturas();
      
    } catch (error: any) {
      console.error('❌ Erro ao exportar RM:', error);
      showToast(error.message || 'Erro ao exportar arquivo RM', 'error');
    } finally {
      setExportandoRm(false);
    }
  };

  // Baixar arquivo RM
  const handleBaixarArquivoRm = useCallback(() => {
    if (!blobArquivoRm) {
      showToast('Arquivo não disponível para download', 'error');
      return;
    }
    
    try {
      const nomeArquivo = gerarNomeArquivoRm();
      const url = window.URL.createObjectURL(blobArquivoRm);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeArquivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`📥 Download do arquivo ${nomeArquivo} iniciado!`, 'success');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      showToast('Erro ao baixar arquivo RM', 'error');
    }
  }, [blobArquivoRm, showToast]);
  
  // ========== EXCLUSÃO INDIVIDUAL ==========
  
  const handleVerDetalhes = (id: number) => {
    navigate(`/faturamento/faturas/${id}`);
  };
  
  // 🔥 FUNÇÃO: Abrir modal de confirmação para excluir individual
  const handleConfirmarExclusao = (id: number) => {
    setFaturaParaExcluir({ id });
    setModalConfirmacaoAberta(true);
  };
  
  // 🔥 FUNÇÃO: Executar exclusão individual após confirmação
  const executarExclusao = async () => {
    if (!faturaParaExcluir) return;
    
    try {
      await faturamentoService.excluirFatura(faturaParaExcluir.id);
      showToast(`Fatura ID ${faturaParaExcluir.id} excluída com sucesso!`, 'success');
      setModalConfirmacaoAberta(false);
      setFaturaParaExcluir(null);
      carregarFaturas();
    } catch (error: any) {
      console.error('Erro ao excluir fatura:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir fatura', 'error');
    }
  };
  
  // 🔥 FUNÇÃO: Cancelar exclusão individual
  const cancelarExclusao = () => {
    setModalConfirmacaoAberta(false);
    setFaturaParaExcluir(null);
  };
  
  // ========== EXCLUSÃO EM MASSA ==========
  
  // 🔥 FUNÇÃO: Abrir modal de confirmação para excluir em massa
  const handleConfirmarExclusaoMassa = () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Nenhuma fatura selecionada para excluir', 'warning');
      return;
    }
    setModalConfirmacaoMassaAberta(true);
  };
  
  // 🔥 FUNÇÃO: Executar exclusão em massa após confirmação
  const executarExclusaoMassa = async () => {
    if (faturasSelecionadas.size === 0) return;
    
    setExcluindoEmMassa(true);
    const ids = Array.from(faturasSelecionadas);
    let sucessos = 0;
    let erros = 0;
    const idsComErro: number[] = [];
    
    try {
      showToast(`🗑️ Excluindo ${ids.length} faturas...`, 'info');
      
      // Excluir uma por uma com tratamento de erro individual
      for (const id of ids) {
        try {
          await faturamentoService.excluirFatura(id);
          sucessos++;
        } catch (error: any) {
          erros++;
          idsComErro.push(id);
          console.error(`❌ Erro ao excluir fatura ${id}:`, error);
        }
      }
      
      // Mostrar resultado
      if (sucessos > 0 && erros === 0) {
        showToast(`✅ ${sucessos} fatura(s) excluída(s) com sucesso!`, 'success');
      } else if (sucessos > 0 && erros > 0) {
        showToast(`⚠️ ${sucessos} fatura(s) excluída(s), ${erros} erro(s). IDs com erro: ${idsComErro.join(', ')}`, 'warning');
      } else {
        showToast(`❌ Nenhuma fatura foi excluída. ${erros} erro(s).`, 'error');
      }
      
      // Limpar seleção
      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
      setModalConfirmacaoMassaAberta(false);
      
      // Recarregar lista
      await carregarFaturas();
      
    } catch (error: any) {
      console.error('Erro ao excluir faturas em massa:', error);
      showToast(error.response?.data?.message || 'Erro ao excluir faturas em massa', 'error');
    } finally {
      setExcluindoEmMassa(false);
    }
  };
  
  // 🔥 FUNÇÃO: Cancelar exclusão em massa
  const cancelarExclusaoMassa = () => {
    setModalConfirmacaoMassaAberta(false);
  };
  
  // ========== EXPORTAÇÃO PDF ==========
  
  const handleExportarPdf = async (id: number, numeroFatura: string) => {
    try {
      showToast('Gerando PDF, aguarde...', 'info');
      const blob = await faturamentoService.exportarPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${numeroFatura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF exportado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      showToast(error.response?.data?.message || 'Erro ao exportar PDF', 'error');
    }
  };
  
  // ========== UTILITÁRIOS ==========
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'PAGA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      case 'SIMULADO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      const dia = date.getUTCDate().toString().padStart(2, '0');
      const mes = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const ano = date.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dateStr;
    }
  };
  
  // 🔥 FUNÇÃO PARA COR DA RÉGUA
  const getReguaColor = (cor?: string): string => {
    if (!cor) return '#9ca3af';
    return cor;
  };
  
  const aplicarFiltros = () => {
    setPagina(0);
    setFaturasSelecionadas(new Set());
    setDadosFaturasSelecionadas([]);
    setSelecionarTodos(false);
    carregarFaturas();
  };
  
  const limparFiltros = () => {
    setFiltroNumero('');
    setFiltroAssociado('');
    setFiltroStatus('');
    setFiltroMes(new Date().getMonth() + 1);
    setFiltroAno(new Date().getFullYear());
    setFiltroRegua(undefined);
    setPagina(0);
    setFaturasSelecionadas(new Set());
    setDadosFaturasSelecionadas([]);
    setSelecionarTodos(false);
    carregarFaturas();
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Faturas Geradas" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📄 Faturas Geradas</h1>
          <p className="text-gray-600">
            Consulte as faturas geradas a partir do processamento de faturamento
          </p>
        </div>
        
        {/* 🔥 Botões de Ação em Massa */}
        {faturasSelecionadas.size > 0 && (
          <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="text-sm text-gray-700">
                {faturasSelecionadas.size} fatura(s) selecionada(s)
              </span>
              <span className="ml-3 text-sm font-semibold text-green-700">
                Total: {formatCurrency(valorTotalSelecionadas)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setModalExportacaoRmAberta(true)}
                disabled={exportandoRm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
              >
                {exportandoRm ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '📤'
                )}
                Exportar RM
              </button>
              
              {/* 🔥 BOTÃO EXCLUIR SELECIONADOS */}
              <button
                onClick={handleConfirmarExclusaoMassa}
                disabled={excluindoEmMassa}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
              >
                {excluindoEmMassa ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '🗑️'
                )}
                Excluir Selecionados
              </button>
            </div>
          </div>
        )}
        
        {/* 🔥 FILTROS COM RÉGUA */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input
              type="text"
              placeholder="Nº Fatura"
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              className="p-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Associado"
              value={filtroAssociado}
              onChange={(e) => setFiltroAssociado(e.target.value)}
              className="p-2 border rounded-lg"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todos status</option>
              <option value="PENDENTE">⏳ Pendente</option>
              <option value="PAGA">✅ Paga</option>
              <option value="CANCELADA">❌ Cancelada</option>
              <option value="SIMULADO">🔍 Simulado</option>
            </select>
            
            {/* 🔥 FILTRO POR RÉGUA */}
            <select
              value={filtroRegua || ''}
              onChange={(e) => setFiltroRegua(e.target.value ? parseInt(e.target.value) : undefined)}
              className="p-2 border rounded-lg"
            >
              <option value="">Todas réguas</option>
              {reguas.map((regua) => (
                <option key={regua.id} value={regua.id}>
                  {regua.nome}
                </option>
              ))}
            </select>
            
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
            >
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => (
                <option key={idx} value={idx + 1}>{mes}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Ano"
              value={filtroAno}
              onChange={(e) => setFiltroAno(parseInt(e.target.value))}
              className="p-2 border rounded-lg"
              min={2020}
              max={2030}
            />
            <button onClick={aplicarFiltros} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              🔍 Buscar
            </button>
            <button onClick={limparFiltros} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              🗑️ Limpar
            </button>
          </div>
        </div>
        
        {/* Resumo */}
        {!loading && faturas.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Mostrando {faturas.length} de {totalItens} fatura(s) | {faturasSelecionadas.size} de {totalFaturas} selecionada(s)
          </div>
        )}
        
        {/* Tabela de Faturas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : faturas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">Nenhuma fatura encontrada</p>
            <p className="text-sm text-gray-400 mt-2">Tente ajustar os filtros ou aguarde o processamento de faturamento</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selecionarTodos && totalFaturas > 0}
                          onChange={toggleSelecionarTodos}
                          className="rounded"
                          disabled={loading}
                          title="Selecionar todos"
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Id Fatura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Régua</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Emissão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '140px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {faturas.map((fatura) => (
                    <tr key={fatura.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={faturasSelecionadas.has(fatura.id)}
                          onChange={() => toggleSelecionarFatura(fatura.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{fatura.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{fatura.associadoNome}</div>
                        <div className="text-xs text-gray-500">Código: {fatura.associadoId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fatura.cnpjCpf || '-'}</td>
                      <td className="px-4 py-3">
                        {(fatura as any).reguaNome ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: getReguaColor((fatura as any).reguaCor) + '20',
                              color: getReguaColor((fatura as any).reguaCor)
                            }}
                          >
                            <span 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getReguaColor((fatura as any).reguaCor) }}
                            ></span>
                            {(fatura as any).reguaNome}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{formatDate(fatura.dataEmissao)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">{formatDate(fatura.dataVencimento)}</td>
                      <td className="px-4 py-3 text-sm font-bold text-right">{formatCurrency(fatura.valorTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(fatura.status)}`}>
                          <span>{getStatusIcon(fatura.status)}</span>
                          <span>{fatura.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                          <button
                            onClick={() => handleVerDetalhes(fatura.id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleExportarPdf(fatura.id, fatura.numeroFatura)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Exportar PDF"
                          >
                            📄
                          </button>
                          {(fatura.status === 'PENDENTE' || fatura.status === 'SIMULADO') && (
                            <button
                              onClick={() => handleConfirmarExclusao(fatura.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Excluir fatura"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  ◀ Anterior
                </button>
                <span className="px-4 py-2 text-gray-600">Página {pagina + 1} de {totalPaginas}</span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina === totalPaginas - 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Próxima ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 🔥 MODAL DE CONFIRMAÇÃO PARA EXCLUSÃO INDIVIDUAL */}
      <ConfirmModal
        isOpen={modalConfirmacaoAberta}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a fatura ID ${faturaParaExcluir?.id}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        onConfirm={executarExclusao}
        onCancel={cancelarExclusao}
      />
      
      {/* 🔥 MODAL DE CONFIRMAÇÃO PARA EXCLUSÃO EM MASSA */}
      <ConfirmModal
        isOpen={modalConfirmacaoMassaAberta}
        title="Confirmar Exclusão em Massa"
        message={`Tem certeza que deseja excluir ${faturasSelecionadas.size} fatura(s)? Esta ação não pode ser desfeita.`}
        confirmText={`Excluir ${faturasSelecionadas.size} fatura(s)`}
        cancelText="Cancelar"
        type="danger"
        onConfirm={executarExclusaoMassa}
        onCancel={cancelarExclusaoMassa}
      />
      
      {/* Modais de Exportação RM */}
      <ModalExportacaoRm
        isOpen={modalExportacaoRmAberta}
        onClose={() => setModalExportacaoRmAberta(false)}
        onConfirm={handleExportarRm}
        totalFaturas={faturasSelecionadas.size}
        valorTotal={valorTotalSelecionadas}
        processando={exportandoRm}
      />
      
      <ModalResultadoExportacaoRm
        isOpen={modalResultadoExportacaoAberta}
        onClose={() => setModalResultadoExportacaoAberta(false)}
        resultado={resultadoExportacao}
        onBaixarArquivo={handleBaixarArquivoRm}
      />
    </div>
  );
};

export default FaturasGeradas;