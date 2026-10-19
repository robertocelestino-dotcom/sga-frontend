// src/pages/faturamento/FaturasGeradas.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';
import faturamentoService, { Fatura } from '../../services/faturamentoService';
import ModalExportacaoRm from '../../components/faturamento/ModalExportacaoRm';
import ModalResultadoExportacaoRm from '../../components/faturamento/ModalResultadoExportacaoRm';
import ConfirmModal from '../../components/ui/ConfirmModal';
import ModalVisualizarXml from '../../components/faturamento/ModalVisualizarXml';
import api from '../../services/api';
import { rmApiService } from '../../services/rmApiService';
import { RmApiPreVisualizacaoItem } from '../../types/rmApi.types';
import { FaPlug, FaFileExport, FaCheckCircle, FaTimesCircle, FaEye } from 'react-icons/fa';
import { PermissionGuard } from '../../components/PermissionGuard';
import { useAuthStore } from '../../stores/authStore';

/* ============================================================
   HELPERS
   ============================================================ */
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

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const cleanDateStr = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
    const [year, month, day] = cleanDateStr.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
};

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const cleanDateStr = dateStr.replace(/[+-]\d{2}:\d{2}$/, '');
    const parts = cleanDateStr.split('T');
    const dateParts = parts[0].split('-').map(Number);
    const timeParts = parts[1]?.split(':').map(Number) || [0, 0];
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
};

const formatCurrency = (value: number) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDENTE': return 'bg-cdl-yellow-100 text-cdl-yellow-700';
    case 'PAGA': return 'bg-cdl-green-100 text-cdl-green-700';
    case 'CANCELADA': return 'bg-cdl-danger-50 text-cdl-danger-500';
    case 'SIMULADO': return 'bg-cdl-navy-100 text-cdl-navy-700';
    default: return 'bg-cdl-neutral-100 text-cdl-neutral-500';
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

const getReguaColor = (cor?: string): string => cor || '#9ca3af';

/* ============================================================
   COMPONENTE
   ============================================================ */
const FaturasGeradas: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  const { hasPermission, user } = useAuthStore();

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(false);

  const [faturasSelecionadas, setFaturasSelecionadas] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [totalFaturas, setTotalFaturas] = useState(0);
  const [dadosFaturasSelecionadas, setDadosFaturasSelecionadas] = useState<Fatura[]>([]);

  const [modalExportacaoRmAberta, setModalExportacaoRmAberta] = useState(false);
  const [modalResultadoExportacaoAberta, setModalResultadoExportacaoAberta] = useState(false);
  const [resultadoExportacao, setResultadoExportacao] = useState<any>(null);
  const [exportandoRm, setExportandoRm] = useState(false);
  const [blobArquivoRm, setBlobArquivoRm] = useState<Blob | null>(null);

  const [integrandoApi, setIntegrandoApi] = useState(false);
  const [modalResultadoApiAberta, setModalResultadoApiAberta] = useState(false);
  const [resultadoApi, setResultadoApi] = useState<IntegracaoApiResultado | null>(null);

  const [modalVisualizarXmlAberto, setModalVisualizarXmlAberto] = useState(false);
  const [carregandoPreVisualizacao, setCarregandoPreVisualizacao] = useState(false);
  const [preVisualizacao, setPreVisualizacao] = useState<{
    total: number;
    detalhes: RmApiPreVisualizacaoItem[];
  }>({ total: 0, detalhes: [] });

  const [modalConfirmacaoApiAberta, setModalConfirmacaoApiAberta] = useState(false);
  const [modalConfirmacaoAberta, setModalConfirmacaoAberta] = useState(false);
  const [faturaParaExcluir, setFaturaParaExcluir] = useState<{ id: number; status: string; numeroFatura: string } | null>(null);
  const [modalConfirmacaoMassaAberta, setModalConfirmacaoMassaAberta] = useState(false);
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);

  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroAssociado, setFiltroAssociado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroRegua, setFiltroRegua] = useState<number | undefined>(undefined);
  const [reguas, setReguas] = useState<any[]>([]);

  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const pageSize = 10;

  const podeVisualizar = hasPermission('FATURA_VIEW') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  /* ============================================================
     CARREGAR
     ============================================================ */
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
        reguaId: filtroRegua,
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

  /* ============================================================
     UTILS
     ============================================================ */
  const valorTotalSelecionadas = useMemo(() => {
    if (dadosFaturasSelecionadas.length > 0) {
      return dadosFaturasSelecionadas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
    }
    return Array.from(faturasSelecionadas).reduce((acc, id) => {
      const fatura = faturas.find((f) => f.id === id);
      return acc + (fatura?.valorTotal || 0);
    }, 0);
  }, [faturasSelecionadas, faturas, dadosFaturasSelecionadas]);

  const totalFaturasComNota = useMemo(() => faturas.filter((f) => temNotaDebito(f)).length, [faturas]);

  const toggleSelecionarFatura = (id: number) => {
    const novosSelecionados = new Set(faturasSelecionadas);
    if (novosSelecionados.has(id)) novosSelecionados.delete(id);
    else novosSelecionados.add(id);
    setFaturasSelecionadas(novosSelecionados);
    if (dadosFaturasSelecionadas.length > 0) setDadosFaturasSelecionadas([]);
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
        reguaId: filtroRegua,
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
      const todosIds = todasFaturas.map((f) => f.id);
      setFaturasSelecionadas(new Set(todosIds));
      setDadosFaturasSelecionadas(todasFaturas);
      setSelecionarTodos(true);
      const total = todasFaturas.reduce((acc, f) => acc + (f.valorTotal || 0), 0);
      showToast(`${todosIds.length} fatura(s) selecionada(s) - Total: ${formatCurrency(total)}`, 'info');
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

  /* ============================================================
     PRÉ-VISUALIZAR XML
     ============================================================ */
  const handlePreVisualizarXml = async () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Selecione pelo menos uma fatura para pré-visualizar', 'warning');
      return;
    }
    setCarregandoPreVisualizacao(true);
    try {
      const faturasSelecionadasList = faturas.filter((f) => faturasSelecionadas.has(f.id));
      const notaIds = faturasSelecionadasList
        .map((f) => getNotaDebitoId(f))
        .filter((id): id is number => id !== null);
      if (notaIds.length === 0) {
        showToast('Nenhuma fatura selecionada possui nota de débito', 'warning');
        return;
      }
      const response = await rmApiService.preVisualizarXml({ notaIds });
      if (response.sucesso) {
        setPreVisualizacao({ total: response.total, detalhes: response.detalhes });
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

  /* ============================================================
     API
     ============================================================ */
  const handleIntegrarApi = () => {
    if (faturasSelecionadas.size === 0) {
      showToast('Selecione pelo menos uma fatura para integrar', 'warning');
      return;
    }
    const faturasSelecionadasList = faturas.filter((f) => faturasSelecionadas.has(f.id));
    const faturasComNota = faturasSelecionadasList.filter((f) => temNotaDebito(f));
    const faturasSemNota = faturasSelecionadasList.filter((f) => !temNotaDebito(f));
    if (faturasComNota.length === 0) {
      showToast('Nenhuma fatura selecionada possui nota de débito', 'error');
      return;
    }
    if (faturasSemNota.length > 0) {
      const idsSemNota = faturasSemNota.map((f) => f.id).join(', ');
      showToast(`⚠️ ${faturasSemNota.length} fatura(s) ignoradas (sem nota): ${idsSemNota}`, 'warning');
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
        : faturas.filter((f) => faturasSelecionadas.has(f.id) && temNotaDebito(f));
      const notaIds = faturasParaIntegrar
        .map((f) => getNotaDebitoId(f))
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

  /* ============================================================
     EXPORTAR RM
     ============================================================ */
  const handleExportarRm = async (ultimoNumeroRps: number, observacao: string) => {
    setExportandoRm(true);
    try {
      const faturaIds = Array.from(faturasSelecionadas);
      let reguaId = filtroRegua;
      if (!reguaId && faturaIds.length > 0) {
        const primeiraFatura = faturas.find((f) => f.id === faturaIds[0]);
        if (primeiraFatura && (primeiraFatura as any).reguaId) {
          reguaId = (primeiraFatura as any).reguaId;
        }
      }
      const mesReferencia = `${filtroAno}-${String(filtroMes).padStart(2, '0')}`;
      const { blob, metadados } = await faturamentoService.exportarRmMultiplasFaturasComMetadados(
        faturaIds, ultimoNumeroRps, reguaId, mesReferencia
      );
      const nomeArquivo = gerarNomeArquivoRm();
      setBlobArquivoRm(blob);
      setResultadoExportacao({ ...metadados, nomeArquivo });
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

  /* ============================================================
     EXCLUSÕES
     ============================================================ */
  const podeExcluir = (status: string): boolean => status === 'PENDENTE' || status === 'SIMULADO';

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
    try {
      for (const id of ids) {
        try {
          await faturamentoService.excluirFatura(id);
          sucessos++;
        } catch {
          erros++;
        }
      }
      if (sucessos > 0 && erros === 0) showToast(`✅ ${sucessos} fatura(s) excluída(s) com sucesso!`, 'success');
      else if (sucessos > 0 && erros > 0) showToast(`⚠️ ${sucessos} sucessos, ${erros} erros`, 'warning');
      else showToast(`❌ Nenhuma fatura excluída. ${erros} erro(s)`, 'error');

      setFaturasSelecionadas(new Set());
      setDadosFaturasSelecionadas([]);
      setSelecionarTodos(false);
      setModalConfirmacaoMassaAberta(false);
      await carregarFaturas();
    } finally {
      setExcluindoEmMassa(false);
    }
  };

  const cancelarExclusaoMassa = () => setModalConfirmacaoMassaAberta(false);

  const handleVerDetalhes = (id: number) => navigate(`/faturamento/faturas/${id}`);

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

  /* ============================================================
     RENDER
     ============================================================ */
  if (!podeVisualizar) {
    return (
      <div className="p-6">
        <BreadCrumb atual="Faturas Geradas" />
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-cdl-navy-700 mb-2">Acesso Negado</h2>
            <p className="text-gray-500">Você não tem permissão para visualizar as faturas geradas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <BreadCrumb atual="Faturas Geradas" />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Faturas Geradas</h1>
          <p className="text-gray-600">
            Consulte as faturas geradas a partir do processamento de faturamento
            {totalFaturasComNota > 0 && (
              <span className="ml-2 text-cdl-green-700 font-medium">
                ({totalFaturasComNota} com nota de débito)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Botões de ação em massa */}
        {faturasSelecionadas.size > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-cdl-navy-700 font-medium">
                <strong>{faturasSelecionadas.size}</strong> fatura(s) selecionada(s)
              </span>
              <span className="text-sm font-semibold text-cdl-green-700 bg-white px-2.5 py-1 rounded-full border border-cdl-green-200">
                Total: {formatCurrency(valorTotalSelecionadas)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                <button
                  onClick={handlePreVisualizarXml}
                  disabled={carregandoPreVisualizacao}
                  className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center
                             gap-2 text-sm font-medium transition-all active:scale-[.98]"
                >
                  {carregandoPreVisualizacao ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : <FaEye className="text-sm" />}
                  Pré-visualizar XML
                </button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['FATURA_EXPORT_RM']}>
                <button
                  onClick={handleIntegrarApi}
                  disabled={integrandoApi}
                  className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center
                             gap-2 text-sm font-medium transition-all active:scale-[.98]"
                >
                  {integrandoApi ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : <FaPlug className="text-sm" />}
                  Integrar API
                </button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['FATURA_EXPORT_RM']}>
                <button
                  onClick={() => setModalExportacaoRmAberta(true)}
                  disabled={exportandoRm}
                  className="px-4 py-2 bg-cdl-green-500 text-white rounded-lg hover:bg-cdl-green-600
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center
                             gap-2 text-sm font-medium transition-all active:scale-[.98]"
                >
                  {exportandoRm ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : <FaFileExport className="text-sm" />}
                  Exportar Arquivo
                </button>
              </PermissionGuard>

              <PermissionGuard requiredPermissions={['FATURA_DELETE']}>
                <button
                  onClick={handleConfirmarExclusaoMassa}
                  disabled={excluindoEmMassa}
                  className="px-4 py-2 bg-cdl-danger-500 text-white rounded-lg hover:bg-cdl-danger-600
                             disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center
                             gap-2 text-sm font-medium transition-all active:scale-[.98]"
                >
                  {excluindoEmMassa ? (
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : '🗑️'}
                  Excluir
                </button>
              </PermissionGuard>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="px-6 py-4 border-b border-gray-200 bg-cdl-neutral-50">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input
              type="text"
              placeholder="Nº Fatura"
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            />
            <input
              type="text"
              placeholder="Associado"
              value={filtroAssociado}
              onChange={(e) => setFiltroAssociado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
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
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            >
              <option value="">Todas réguas</option>
              {reguas.map((regua) => <option key={regua.id} value={regua.id}>{regua.nome}</option>)}
            </select>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            >
              {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((mes, idx) => (
                <option key={idx} value={idx + 1}>{mes}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Ano"
              value={filtroAno}
              onChange={(e) => setFiltroAno(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
              min={2020}
              max={2030}
            />
            <div className="flex gap-2 col-span-7 md:col-span-1">
              <button
                onClick={aplicarFiltros}
                className="flex-1 px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           font-medium transition-all active:scale-[.98]"
              >🔍 Buscar</button>
              <button
                onClick={limparFiltros}
                className="flex-1 px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                           rounded-lg hover:bg-cdl-navy-50 transition-colors"
              >🗑️ Limpar</button>
            </div>
          </div>
        </div>

        {/* Resumo */}
        {!loading && faturas.length > 0 && (
          <div className="px-6 pt-4 text-sm text-gray-500">
            Mostrando <strong className="text-cdl-navy-700">{faturas.length}</strong> de{" "}
            <strong className="text-cdl-navy-700">{totalItens}</strong> fatura(s) |{" "}
            <strong className="text-cdl-navy-700">{faturasSelecionadas.size}</strong> de{" "}
            <strong className="text-cdl-navy-700">{totalFaturas}</strong> selecionada(s)
            {totalFaturasComNota > 0 && (
              <span className="ml-2 text-cdl-green-700">| ✅ {totalFaturasComNota} com nota de débito</span>
            )}
          </div>
        )}

        {/* Tabela */}
        {loading ? (
          <div className="flex justify-center py-12"><Loading /></div>
        ) : faturas.length === 0 ? (
          <EmptyState
            icon="📭"
            title="Nenhuma fatura encontrada"
            description="Não há faturas para os filtros selecionados. Tente ajustar os filtros."
            compact
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    <th className="px-6 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selecionarTodos && totalFaturas > 0}
                        onChange={toggleSelecionarTodos}
                        className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600 cursor-pointer"
                        disabled={loading}
                      />
                    </th>
                    {['Id Fatura','Associado','CNPJ/CPF','Régua','Emissão','Vencimento','Valor','Status','Nota','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          ['Emissão','Vencimento','Status','Nota','Ações'].includes(h) ? 'text-center'
                          : h === 'Valor' ? 'text-right'
                          : 'text-left'
                        }`}
                        style={h === 'Ações' ? { minWidth: '140px' } : undefined}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faturas.map((fatura) => {
                    const possuiNota = temNotaDebito(fatura);
                    const notaId = getNotaDebitoId(fatura);
                    return (
                      <tr key={fatura.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={faturasSelecionadas.has(fatura.id)}
                            onChange={() => toggleSelecionarFatura(fatura.id)}
                            className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600 cursor-pointer
                                       disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={!possuiNota}
                            title={possuiNota ? '' : 'Fatura sem nota de débito'}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-cdl-navy-700">{fatura.id}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{fatura.associadoNome}</div>
                          <div className="text-xs text-gray-500">Código: <span className="font-mono">{fatura.associadoId}</span></div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{fatura.cnpjCpf || '-'}</td>
                        <td className="px-6 py-4">
                          {(fatura as any).reguaNome ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: getReguaColor((fatura as any).reguaCor) + '20',
                                color: getReguaColor((fatura as any).reguaCor),
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: getReguaColor((fatura as any).reguaCor) }}
                              />
                              {(fatura as any).reguaNome}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{formatDate(fatura.dataEmissao)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 text-center">{formatDate(fatura.dataVencimento)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-right text-cdl-navy-700">
                          {formatCurrency(fatura.valorTotal)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(fatura.status)}`}>
                            <span>{getStatusIcon(fatura.status)}</span>
                            <span>{fatura.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {possuiNota ? (
                            <span className="text-cdl-green-600" title={`Nota ID: ${notaId}`}>
                              <FaCheckCircle className="inline-block" />
                            </span>
                          ) : (
                            <span className="text-cdl-danger-500" title="Sem nota de débito">
                              <FaTimesCircle className="inline-block" />
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                            <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                              <button
                                onClick={() => handleVerDetalhes(fatura.id)}
                                className="p-1 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                                title="Ver detalhes"
                              >👁️</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                              <button
                                onClick={() => handleExportarPdf(fatura.id, fatura.numeroFatura)}
                                className="p-1 text-cdl-green-600 hover:text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                                title="Exportar PDF"
                              >📄</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['FATURA_VIEW']}>
                              <button
                                onClick={() => navigate(`/faturamento/faturas/${fatura.id}`)}
                                className="p-1 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                                title="Ver Logs"
                              >📝</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['FATURA_DELETE']}>
                              {podeExcluir(fatura.status) ? (
                                <button
                                  onClick={() => handleConfirmarExclusao(fatura.id, fatura.status, fatura.numeroFatura)}
                                  className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                                  title="Excluir fatura"
                                >🗑️</button>
                              ) : (
                                <button
                                  className="p-1 text-gray-400 cursor-not-allowed"
                                  title={`Não é possível excluir fatura com status: ${fatura.status}`}
                                  disabled
                                >🚫</button>
                              )}
                            </PermissionGuard>
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
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <strong>{pagina * pageSize + 1}</strong> -{" "}
                    <strong>{Math.min((pagina + 1) * pageSize, totalItens)}</strong>{" "}
                    de <strong>{totalItens}</strong> registros
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagina(0)}
                      disabled={pagina === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >⏮️</button>
                    <button
                      onClick={() => setPagina((p) => Math.max(0, p - 1))}
                      disabled={pagina === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >← Anterior</button>
                    <span className="text-sm text-gray-700">
                      Página <strong>{pagina + 1}</strong> de <strong>{totalPaginas}</strong>
                    </span>
                    <button
                      onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                      disabled={pagina === totalPaginas - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >Próxima →</button>
                    <button
                      onClick={() => setPagina(totalPaginas - 1)}
                      disabled={pagina === totalPaginas - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >⏭️</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Modais ===== */}
      <ModalVisualizarXml
        isOpen={modalVisualizarXmlAberto}
        onClose={() => setModalVisualizarXmlAberto(false)}
        onConfirm={() => { setModalVisualizarXmlAberto(false); handleIntegrarApi(); }}
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

      {/* Modal resultado API */}
      {modalResultadoApiAberta && resultadoApi && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-cdl-navy-900/60 backdrop-blur-sm" onClick={() => setModalResultadoApiAberta(false)} />
          <div className="relative w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-lg
                          shadow-cdl overflow-hidden max-h-[95vh] sm:max-h-[85vh] flex flex-col
                          border-t-4 border-cdl-navy-700">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
                  <span>📊</span> Resultado da Integração API
                </h3>
                <p className={`text-xs mt-0.5 font-medium ${resultadoApi.sucesso ? 'text-cdl-green-700' : 'text-cdl-yellow-700'}`}>
                  {resultadoApi.sucesso ? '✅ Integração concluída' : '⚠️ Integração com erros'}
                </p>
              </div>
              <button
                onClick={() => setModalResultadoApiAberta(false)}
                aria-label="Fechar"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cdl-navy-700">{resultadoApi.totalProcessados}</div>
                  <div className="text-xs text-cdl-navy-600 mt-0.5 font-medium">Processados</div>
                </div>
                <div className="bg-cdl-green-50 border border-cdl-green-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cdl-green-700">{resultadoApi.totalSucessos}</div>
                  <div className="text-xs text-cdl-green-600 mt-0.5 font-medium">Sucessos</div>
                </div>
                <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cdl-danger-500">{resultadoApi.totalErros}</div>
                  <div className="text-xs text-cdl-danger-500 mt-0.5 font-medium">Erros</div>
                </div>
              </div>

              {resultadoApi.itens && resultadoApi.itens.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-cdl-navy-50">
                      <tr>
                        {['Fatura','Status','ID Mov','Mensagem'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resultadoApi.itens.map((item, idx) => (
                        <tr key={idx} className={item.sucesso ? 'hover:bg-cdl-green-50/40' : 'hover:bg-cdl-danger-50/40'}>
                          <td className="px-3 py-2 text-sm font-mono text-cdl-navy-700">{item.faturaId || '-'}</td>
                          <td className="px-3 py-2 text-sm">
                            {item.sucesso ? (
                              <span className="text-cdl-green-700 font-medium">✅ Sucesso</span>
                            ) : (
                              <span className="text-cdl-danger-500 font-medium">❌ Erro</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 font-mono">{item.idMov || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={item.mensagem}>
                            {item.mensagem}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex justify-end bg-cdl-neutral-50 shrink-0">
              <button
                onClick={() => setModalResultadoApiAberta(false)}
                className="px-5 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                           transition-all active:scale-[.98] font-medium"
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