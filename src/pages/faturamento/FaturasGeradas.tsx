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
import ModalVisualizarXml from '../../components/faturamento/ModalVisualizarXml';
import api from '../../services/api';
import { rmApiService } from '../../services/rmApiService';
import { RmApiPreVisualizacaoItem } from '../../types/rmApi.types';
import { FaPlug, FaFileExport, FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

const gerarNomeArquivoRm = (): string => {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10);
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '-');
  return `exportacao_rm_faturas_${data}_${hora}.txt`;
};

interface IntegracaoApiResultado {
  sucesso: boolean;
  mensagem: string;
  totalProcessados: number;
  totalSucessos: number;
  totalErros: number;
  itens: Array<{
    notaId: number;
    faturaId: number;
    sucesso: boolean;
    idMov?: number;
    mensagem: string;
  }>;
}

const temNotaDebito = (fatura: Fatura): boolean => {
  if (!fatura) return false;
  const notaId = (fatura as any).notaDebitoId;
  return notaId !== null && notaId !== undefined && notaId > 0;
};

const getNotaDebitoId = (fatura: Fatura): number | null => {
  if (!fatura) return null;
  const notaId = (fatura as any).notaDebitoId;
  return (notaId !== null && notaId !== undefined && notaId > 0) ? notaId : null;
};

// ============================================================
// 🔥 FUNÇÕES AUXILIARES DE DATA (CORRIGIDAS)
// ============================================================

/**
 * 🔥 Formata uma data sem considerar timezone
 * Evita problemas com datas que vêm do backend
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    // 🔥 Remove o timezone da string para evitar problemas
    const cleanDateStr = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
    const [year, month, day] = cleanDateStr.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * 🔥 Formata data e hora sem timezone
 */
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const cleanDateStr = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
    const parts = cleanDateStr.split('T');
    const dateParts = parts[0].split('-').map(Number);
    const timeParts = parts[1]?.split(':').map(Number) || [0, 0];
    
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
    
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const FaturasGeradas: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Seleção
  const [faturasSelecionadas, setFaturasSelecionadas] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [totalFaturas, setTotalFaturas] = useState(0);
  
  // Dados completos das faturas selecionadas
  const [dadosFaturasSelecionadas, setDadosFaturasSelecionadas] = useState<Fatura[]>([]);
  
  // Exportação RM (Arquivo)
  const [modalExportacaoRmAberta, setModalExportacaoRmAberta] = useState(false);
  const [modalResultadoExportacaoAberta, setModalResultadoExportacaoAberta] = useState(false);
  const [resultadoExportacao, setResultadoExportacao] = useState<any>(null);
  const [exportandoRm, setExportandoRm] = useState(false);
  const [blobArquivoRm, setBlobArquivoRm] = useState<Blob | null>(null);
  
  // Integração API
  const [integrandoApi, setIntegrandoApi] = useState(false);
  const [modalResultadoApiAberta, setModalResultadoApiAberta] = useState(false);
  const [resultadoApi, setResultadoApi] = useState<IntegracaoApiResultado | null>(null);
  
  // Pré-visualização XML
  const [modalVisualizarXmlAberto, setModalVisualizarXmlAberto] = useState(false);
  const [carregandoPreVisualizacao, setCarregandoPreVisualizacao] = useState(false);
  const [preVisualizacao, setPreVisualizacao] = useState<{
    total: number;
    detalhes: RmApiPreVisualizacaoItem[];
  }>({ total: 0, detalhes: [] });
  
  // Modais de confirmação
  const [modalConfirmacaoApiAberta, setModalConfirmacaoApiAberta] = useState(false);
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false);
  const [faturaParaExcluir, setFaturaParaExcluir] = useState<{ id: number; status: string; numeroFatura: string } | null>(null);
  const [modalConfirmacaoMassaAberta, setModalConfirmacaoMassaAberta] = useState(false);
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);
  
  // Filtros
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroAssociado, setFiltroAssociado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroRegua, setFiltroRegua] = useState<number | undefined>(undefined);
  const [reguas, setReguas] = useState<any[]>([]);
  
  // Paginação
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const pageSize = 10;

  // ============================================================
  // CARREGAR DADOS
  // ============================================================

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
      
    } catch (error: any) {
      console.error('Erro ao carregar faturas:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar faturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagina, pageSize, filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, showToast]);

  useEffect(() => {
    carregarFaturas();
    setFaturasSelecionadas(new Set());
    setDadosFaturasSelecionadas([]);
    setSelecionarTodos(false);
  }, [pagina, filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, carregarFaturas]);

  // ============================================================
  // UTILITÁRIOS
  // ============================================================

  const valorTotalSelecionadas = useMemo(() => {
    if (dadosFaturasSelecionadas.length > 0) {
      return dadosFaturasSelecionadas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
    }
    return Array.from(faturasSelecionadas).reduce((acc, id) => {
      const fatura = faturas.find(f => f.id === id);
      return acc + (fatura?.valorTotal || 0);
    }, 0);
  }, [faturasSelecionadas, faturas, dadosFaturasSelecionadas]);

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

  const carregarTodasFaturasIds = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        numeroFatura: filtroNumero || undefined,
        associadoNome: filtroAssociado || undefined,
        status: filtroStatus || undefined,
        mes: filtroMes,
        ano: filtroAno,
        reguaId: filtroRegua
      };
      
      const primeiraPagina = await faturamentoService.listarFaturas(0, pageSize, params);
      const totalElements = primeiraPagina.totalElements || 0;
      
      if (totalElements === 0) {
        showToast('Nenhuma fatura encontrada', 'info');
        setLoading(false);
        return;
      }
      
      const totalPaginasParaCarregar = Math.ceil(totalElements / pageSize);
      const todasFaturas: Fatura[] = [];
      
      for (let page = 0; page < totalPaginasParaCarregar; page++) {
        const response = await faturamentoService.listarFaturas(page, pageSize, params);
        todasFaturas.push(...response.content);
      }
      
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
  }, [filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, filtroRegua, pageSize, showToast]);

  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
    } else {
      carregarTodasFaturasIds();
    }
  };

  // ============================================================
  // PRÉ-VISUALIZAR XML
  // ============================================================

  const handlePreVisualizarXml = async () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Selecione pelo menos uma fatura para pré-visualizar', 'warning');
      return;
    }

    setCarregandoPreVisualizacao(true);
    try {
      const faturasSelecionadasList = faturas.filter(f => faturasSelecionadas.has(f.id));
      const notaIds = faturasSelecionadasList
        .map(f => getNotaDebitoId(f))
        .filter((id): id is number => id !== null);

      if (notaIds.length === 0) {
        showToast('Nenhuma fatura selecionada possui nota de débito', 'warning');
        return;
      }

      const response = await rmApiService.preVisualizarXml({
        notaIds: notaIds
      });

      if (response.sucesso) {
        setPreVisualizacao({
          total: response.total,
          detalhes: response.detalhes
        });
        setModalVisualizarXmlAberto(true);
      } else {
        showToast(response.mensagem || 'Erro ao gerar pré-visualização', 'error');
      }
    } catch (error) {
      console.error('Erro ao gerar pré-visualização:', error);
      showToast('Erro ao gerar pré-visualização', 'error');
    } finally {
      setCarregandoPreVisualizacao(false);
    }
  };

  // ============================================================
  // INTEGRAÇÃO API
  // ============================================================

  const handleIntegrarApi = () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Selecione pelo menos uma fatura para integrar', 'warning');
      return;
    }

    const faturasSelecionadasList = faturas.filter(f => faturasSelecionadas.has(f.id));
    const faturasComNota = faturasSelecionadasList.filter(f => temNotaDebito(f));
    const faturasSemNota = faturasSelecionadasList.filter(f => !temNotaDebito(f));

    if (faturasComNota.length === 0) {
      showToast('Nenhuma fatura selecionada possui nota de débito', 'error');
      return;
    }

    if (faturasSemNota.length > 0) {
      const idsSemNota = faturasSemNota.map(f => f.id).join(', ');
      showToast(
        `⚠️ ${faturasSemNota.length} fatura(s) ignoradas (sem nota): ${idsSemNota}`,
        'warning'
      );
    }

    setDadosFaturasSelecionadas(faturasComNota);
    setModalConfirmacaoApiAberta(true);
  };

  const executarIntegracaoApi = async () => {
    setModalConfirmacaoApiAberta(false);
    setIntegrandoApi(true);

    try {
      const faturasParaIntegrar = dadosFaturasSelecionadas.length > 0 
        ? dadosFaturasSelecionadas 
        : faturas.filter(f => faturasSelecionadas.has(f.id) && temNotaDebito(f));

      const notaIds = faturasParaIntegrar
        .map(f => getNotaDebitoId(f))
        .filter((id): id is number => id !== null);

      if (notaIds.length === 0) {
        showToast('Nenhuma nota de débito encontrada para integração', 'error');
        setIntegrandoApi(false);
        return;
      }

      const response = await rmApiService.integrar({ notaIds });

      setResultadoApi(response);
      setModalResultadoApiAberta(true);

      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);

      await carregarFaturas();

      if (response.sucesso) {
        showToast(`✅ Integração concluída: ${response.totalSucessos} sucessos, ${response.totalErros} erros`, 'success');
      } else {
        showToast(`⚠️ Integração com erros: ${response.mensagem}`, 'warning');
      }

    } catch (error) {
      console.error('Erro ao integrar faturas:', error);
      showToast('Erro ao integrar faturas via API', 'error');
    } finally {
      setIntegrandoApi(false);
    }
  };

  // ============================================================
  // EXPORTAÇÃO RM (ARQUIVO)
  // ============================================================

  const handleExportarRm = async (ultimoNumeroRps: number, observacao: string) => {
    setExportandoRm(true);
    try {
      const faturaIds = Array.from(faturasSelecionadas);
      
      let reguaId = filtroRegua;
      
      if (!reguaId && faturaIds.length > 0) {
        const primeiraFatura = faturas.find(f => f.id === faturaIds[0]);
        if (primeiraFatura && (primeiraFatura as any).reguaId) {
          reguaId = (primeiraFatura as any).reguaId;
        }
      }
      
      const mesReferencia = `${filtroAno}-${String(filtroMes).padStart(2, '0')}`;
  
      const { blob, metadados } = await faturamentoService.exportarRmMultiplasFaturasComMetadados(
        faturaIds,
        ultimoNumeroRps,
        reguaId,
        mesReferencia
      );
      
      const nomeArquivo = gerarNomeArquivoRm();
      
      setBlobArquivoRm(blob);
      
      setResultadoExportacao({
        ...metadados,
        nomeArquivo
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

  // ============================================================
  // EXCLUSÕES
  // ============================================================

  const podeExcluir = (status: string): boolean => {
    return status === 'PENDENTE' || status === 'SIMULADO';
  };

  const handleConfirmarExclusao = (id: number, status: string, numeroFatura: string) => {
    if (!podeExcluir(status)) {
      showToast(`❌ Não é possível excluir a fatura ${numeroFatura} (status: ${status})`, 'error');
      return;
    }
    setFaturaParaExcluir({ id, status, numeroFatura });
    setModalConfirmacaoAberta(true);
  };

  const executarExclusao = async () => {
    if (!faturaParaExcluir) return;
    try {
      await faturamentoService.excluirFatura(faturaParaExcluir.id);
      showToast(`✅ Fatura ${faturaParaExcluir.numeroFatura} excluída com sucesso!`, 'success');
      setModalConfirmacaoAberta(false);
      setFaturaParaExcluir(null);
      carregarFaturas();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao excluir fatura', 'error');
    }
  };

  const cancelarExclusao = () => {
    setModalConfirmacaoAberta(false);
    setFaturaParaExcluir(null);
  };

  const handleConfirmarExclusaoMassa = () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Nenhuma fatura selecionada para excluir', 'warning');
      return;
    }
    setModalConfirmacaoMassaAberta(true);
  };

  const executarExclusaoMassa = async () => {
    if (faturasSelecionadas.size === 0) return;
    
    setExcluindoEmMassa(true);
    const ids = Array.from(faturasSelecionadas);
    let sucessos = 0;
    let erros = 0;
    const motivosErro: string[] = [];
    
    try {
      for (const id of ids) {
        try {
          await faturamentoService.excluirFatura(id);
          sucessos++;
        } catch (error: any) {
          erros++;
          motivosErro.push(`Fatura ${id}: ${error.response?.data?.message || error.message}`);
        }
      }
      
      if (sucessos > 0 && erros === 0) {
        showToast(`✅ ${sucessos} fatura(s) excluída(s) com sucesso!`, 'success');
      } else if (sucessos > 0 && erros > 0) {
        showToast(`⚠️ ${sucessos} sucessos, ${erros} erros`, 'warning');
      } else {
        showToast(`❌ Nenhuma fatura excluída. ${erros} erro(s)`, 'error');
      }
      
      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
      setModalConfirmacaoMassaAberta(false);
      await carregarFaturas();
    } finally {
      setExcluindoEmMassa(false);
    }
  };

  const cancelarExclusaoMassa = () => {
    setModalConfirmacaoMassaAberta(false);
  };

  // ============================================================
  // OUTRAS AÇÕES
  // ============================================================

  const handleVerDetalhes = (id: number) => {
    navigate(`/faturamento/faturas/${id}`);
  };

  const handleExportarPdf = async (id: number, numeroFatura: string) => {
    try {
      showToast('Gerando PDF...', 'info');
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
      showToast(error.response?.data?.message || 'Erro ao exportar PDF', 'error');
    }
  };

  // ============================================================
  // UTILITÁRIOS DE RENDER
  // ============================================================

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

  const totalFaturasComNota = useMemo(() => {
    return faturas.filter(f => temNotaDebito(f)).length;
  }, [faturas]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Faturas Geradas" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📄 Faturas Geradas</h1>
          <p className="text-gray-600">
            Consulte as faturas geradas a partir do processamento de faturamento
            {totalFaturasComNota > 0 && (
              <span className="ml-2 text-green-600">
                ({totalFaturasComNota} com nota de débito)
              </span>
            )}
          </p>
        </div>
        
        {/* Botões de Ação em Massa */}
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
                onClick={handlePreVisualizarXml}
                disabled={carregandoPreVisualizacao}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
              >
                {carregandoPreVisualizacao ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaEye className="text-sm" />
                )}
                Pré-visualizar XML
              </button>

              <button
                onClick={handleIntegrarApi}
                disabled={integrandoApi}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
              >
                {integrandoApi ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaPlug className="text-sm" />
                )}
                Integrar API
              </button>
              
              <button
                onClick={() => setModalExportacaoRmAberta(true)}
                disabled={exportandoRm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 text-sm"
              >
                {exportandoRm ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FaFileExport className="text-sm" />
                )}
                Exportar Arquivo
              </button>
              
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
                Excluir
              </button>
            </div>
          </div>
        )}
        
        {/* Filtros */}
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
            <div className="flex gap-2 col-span-7 md:col-span-1">
              <button onClick={aplicarFiltros} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                🔍 Buscar
              </button>
              <button onClick={limparFiltros} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                🗑️ Limpar
              </button>
            </div>
          </div>
        </div>
        
        {/* Resumo */}
        {!loading && faturas.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Mostrando {faturas.length} de {totalItens} fatura(s) | {faturasSelecionadas.size} de {totalFaturas} selecionada(s)
            {totalFaturasComNota > 0 && (
              <span className="ml-2 text-green-600">| ✅ {totalFaturasComNota} com nota de débito</span>
            )}
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
            <p className="text-sm text-gray-400 mt-2">Tente ajustar os filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selecionarTodos && totalFaturas > 0}
                        onChange={toggleSelecionarTodos}
                        className="rounded"
                        disabled={loading}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Id Fatura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Régua</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Emissão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nota</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase" style={{ minWidth: '140px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {faturas.map((fatura) => {
                    const possuiNota = temNotaDebito(fatura);
                    const notaId = getNotaDebitoId(fatura);
                    return (
                      <tr key={fatura.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={faturasSelecionadas.has(fatura.id)}
                            onChange={() => toggleSelecionarFatura(fatura.id)}
                            className="rounded"
                            disabled={!possuiNota}
                            title={possuiNota ? '' : 'Fatura sem nota de débito'}
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
                          {possuiNota ? (
                            <span className="text-green-600" title={`Nota ID: ${notaId}`}>
                              <FaCheckCircle className="inline-block" />
                            </span>
                          ) : (
                            <span className="text-red-500" title="Sem nota de débito">
                              <FaTimesCircle className="inline-block" />
                            </span>
                          )}
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
                            
                            <button
                              onClick={() => navigate(`/faturamento/faturas/${fatura.id}`)}
                              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded transition-colors"
                              title="Ver Logs"
                            >
                              📝
                            </button>
                            
                            {podeExcluir(fatura.status) ? (
                              <button
                                onClick={() => handleConfirmarExclusao(fatura.id, fatura.status, fatura.numeroFatura)}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Excluir fatura"
                              >
                                🗑️
                              </button>
                            ) : (
                              <button
                                className="p-1.5 text-gray-400 cursor-not-allowed"
                                title={`Não é possível excluir fatura com status: ${fatura.status}`}
                                disabled
                              >
                                🚫
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Mostrando {pagina * pageSize + 1} - {Math.min((pagina + 1) * pageSize, totalItens)} de {totalItens} registros
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setPagina(0)}
                    disabled={pagina === 0}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => setPagina(p => Math.max(0, p - 1))}
                    disabled={pagina === 0}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ◀ Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                    Página {pagina + 1} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                    disabled={pagina === totalPaginas - 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    Próxima ▶
                  </button>
                  <button
                    onClick={() => setPagina(totalPaginas - 1)}
                    disabled={pagina === totalPaginas - 1}
                    className="px-3 py-1.5 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                  >
                    ⏭️
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* ============================================================
        MODAIS
      ============================================================ */}
      
      <ModalVisualizarXml
        isOpen={modalVisualizarXmlAberto}
        onClose={() => setModalVisualizarXmlAberto(false)}
        onConfirm={() => {
          setModalVisualizarXmlAberto(false);
          handleIntegrarApi();
        }}
        detalhes={preVisualizacao.detalhes}
        total={preVisualizacao.total}
        processando={integrandoApi}
      />
      
      <ConfirmModal
        isOpen={modalConfirmacaoApiAberta}
        title="🔌 Integrar via API"
        message={`Deseja integrar ${dadosFaturasSelecionadas.length} fatura(s) via API (TBC)?\n\nEsta ação enviará os dados diretamente para o TOTVS RM via WebService.`}
        confirmText="Sim, Integrar"
        cancelText="Cancelar"
        type="info"
        onConfirm={executarIntegracaoApi}
        onCancel={() => setModalConfirmacaoApiAberta(false)}
      />
      
      <ConfirmModal
        isOpen={modalConfirmacaoAberta}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a fatura ${faturaParaExcluir?.numeroFatura} (ID: ${faturaParaExcluir?.id})?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        onConfirm={executarExclusao}
        onCancel={cancelarExclusao}
      />
      
      <ConfirmModal
        isOpen={modalConfirmacaoMassaAberta}
        title="Confirmar Exclusão em Massa"
        message={`Tem certeza que deseja excluir ${faturasSelecionadas.size} fatura(s)?`}
        confirmText={`Excluir ${faturasSelecionadas.size} fatura(s)`}
        cancelText="Cancelar"
        type="danger"
        onConfirm={executarExclusaoMassa}
        onCancel={cancelarExclusaoMassa}
      />
      
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

      {/* MODAL RESULTADO INTEGRAÇÃO API */}
      {modalResultadoApiAberta && resultadoApi && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">📊 Resultado da Integração API</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {resultadoApi.sucesso ? '✅ Integração concluída' : '⚠️ Integração com erros'}
                  </p>
                </div>
                <button
                  onClick={() => setModalResultadoApiAberta(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-800">{resultadoApi.totalProcessados}</div>
                  <div className="text-sm text-gray-500">Processados</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{resultadoApi.totalSucessos}</div>
                  <div className="text-sm text-green-500">Sucessos</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{resultadoApi.totalErros}</div>
                  <div className="text-sm text-red-500">Erros</div>
                </div>
              </div>

              {resultadoApi.itens && resultadoApi.itens.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fatura</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ID Mov</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Mensagem</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultadoApi.itens.map((item, idx) => (
                        <tr key={idx} className={item.sucesso ? 'hover:bg-green-50' : 'hover:bg-red-50'}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.faturaId || '-'}</td>
                          <td className="px-3 py-2">
                            {item.sucesso ? (
                              <span className="text-green-600">✅ Sucesso</span>
                            ) : (
                              <span className="text-red-600">❌ Erro</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600">{item.idMov || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate">{item.mensagem}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalResultadoApiAberta(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaturasGeradas;