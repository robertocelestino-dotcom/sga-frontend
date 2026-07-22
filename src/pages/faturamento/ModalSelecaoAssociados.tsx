// src/components/faturamento/ModalSelecaoAssociados.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../ui/Modal';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';
import { reguaFaturamentoService } from '../../services/reguaFaturamentoService';

// 🔥 HOOK useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ReguaFaturamento {
  id: number;
  nome: string;
  descricao: string;
  diaEmissao: number;
  diaVencimento: number;
  ativo: boolean;
}

interface AssociadoResumo {
  id: number;
  nomeRazao: string;
  cnpjCpf?: string;
  cidade?: string;
  uf?: string;
  status?: string;
  codigoSpc?: string;
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
}

// 🔥 CONSTANTES
const ITENS_POR_PAGINA = 20;
const MAX_SELECAO = 5000;

const ModalSelecaoAssociados: React.FC<ModalSelecaoAssociadosProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSimulate
}) => {
  const { showToast } = useMessage();
  
  // ============================================
  // ESTADOS PRINCIPAIS
  // ============================================
  
  // Réguas
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [reguaSelecionada, setReguaSelecionada] = useState<number | undefined>(undefined);
  const [carregandoReguas, setCarregandoReguas] = useState(false);
  
  // Associados
  const [associados, setAssociados] = useState<AssociadoResumo[]>([]);
  const [associadosSelecionados, setAssociadosSelecionados] = useState<Set<number>>(new Set());
  const [carregandoAssociados, setCarregandoAssociados] = useState(false);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalAssociados, setTotalAssociados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  
  // 🔥 FILTROS
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCnpj, setFiltroCnpj] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('A');
  
  // 🔥 Debounce para filtros
  const nomeDebounced = useDebounce(filtroNome, 500);
  const cnpjDebounced = useDebounce(filtroCnpj, 500);
  
  // Configurações de processamento
  const [mesReferencia, setMesReferencia] = useState<number>(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState<number>(new Date().getFullYear());
  const [gerarNotas, setGerarNotas] = useState<boolean>(true);
  const [integrarRM, setIntegrarRM] = useState<boolean>(false);
  
  // Estados de UI
  const [modoSimulacao, setModoSimulacao] = useState(false);
  const [processando, setProcessando] = useState(false);

  // ============================================
  // MEMO: Mês Anterior
  // ============================================
  
  const mesAnterior = useMemo(() => {
    const data = new Date();
    data.setMonth(data.getMonth() - 1);
    return { mes: data.getMonth() + 1, ano: data.getFullYear() };
  }, []);

  // ============================================
  // CARREGAR RÉGUAS
  // ============================================
  
  const carregarReguas = useCallback(async () => {
    setCarregandoReguas(true);
    try {
      const response = await reguaFaturamentoService.listarAtivos();
      setReguas(response || []);
      console.log(`📋 ${response?.length || 0} réguas carregadas`);
    } catch (error: any) {
      console.error('❌ Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas de faturamento', 'error');
    } finally {
      setCarregandoReguas(false);
    }
  }, [showToast]);

  // ============================================
  // 🔥 CARREGAR ASSOCIADOS - USANDO O SERVICE
  // ============================================
  
  const carregarAssociadosPorRegua = useCallback(async () => {
    if (!reguaSelecionada) {
      console.log('⚠️ Nenhuma régua selecionada');
      return;
    }

    console.log(`🔍 Buscando associados CONSOLIDADOS (com nota) - Régua: ${reguaSelecionada}, Página: ${paginaAtual}`);
    console.log(`   Filtros: Nome="${nomeDebounced}", CNPJ="${cnpjDebounced}", Status="${filtroStatus}"`);
    
    setCarregandoAssociados(true);
    
    try {
      // 🔥 USANDO O SERVICE - NUNCA CHAMA /todos-ids
      const response = await reguaFaturamentoService.listarAssociadosPorRegua(reguaSelecionada, {
        page: paginaAtual - 1,
        size: ITENS_POR_PAGINA,
        nome: nomeDebounced.trim() || undefined,
        cnpjCpf: cnpjDebounced.trim().replace(/[^0-9]/g, '') || undefined,
        status: filtroStatus !== 'TODOS' ? filtroStatus : undefined
      });
      
      console.log('📥 RESPOSTA DO SERVICE:', {
        contentLength: response.content?.length || 0,
        totalElements: response.totalElements,
        totalPages: response.totalPages,
        page: response.number,
        size: response.size
      });
      
      const content = response.content || [];
      const totalElements = response.totalElements || 0;
      const totalPages = response.totalPages || 0;
      
      // 🔥 ATUALIZAR TOTAL COM O VALOR CORRETO
      console.log(`✅ Atualizando totalAssociados de ${totalAssociados} para ${totalElements}`);
      setTotalAssociados(totalElements);
      setTotalPaginas(totalPages);
      
      const associadosFormatados = content.map((item: any) => ({
        id: item.id,
        codigoSpc: item.codigoSpc || '-',
        nomeRazao: item.nomeRazao || '-',
        cnpjCpf: item.cnpjCpf || '-',
        cidade: item.cidade || '',
        uf: item.uf || '',
        status: item.status === 'A' ? 'ATIVO' : 
                item.status === 'I' ? 'INATIVO' :
                item.status === 'S' ? 'SUSPENSO' : 'ATIVO'
      }));
      
      setAssociados(associadosFormatados);
      
      // 🔥 ATUALIZAR SELEÇÃO - Remover IDs que não estão mais na lista
      const idsAtuais = new Set(associadosFormatados.map(a => a.id));
      setAssociadosSelecionados(prev => {
        const novosSelecionados = new Set(prev);
        for (const id of novosSelecionados) {
          if (!idsAtuais.has(id)) {
            novosSelecionados.delete(id);
          }
        }
        return novosSelecionados;
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar associados:', error);
      showToast('Erro ao carregar associados da régua', 'error');
      setAssociados([]);
      setTotalAssociados(0);
      setTotalPaginas(0);
    } finally {
      setCarregandoAssociados(false);
    }
  }, [reguaSelecionada, paginaAtual, nomeDebounced, cnpjDebounced, filtroStatus, totalAssociados, showToast]);

  // ============================================
  // 🔥 SELECIONAR TODOS - USANDO O MÉTODO CORRETO
  // ============================================
  
  const handleSelecionarTodos = useCallback(async () => {
    if (!reguaSelecionada) {
      showToast('⚠️ Selecione uma régua primeiro', 'warning');
      return;
    }

    console.log(`📊 totalAssociados atual: ${totalAssociados}`);
    
    if (totalAssociados === 0) {
      showToast('⚠️ Nenhum associado com nota de débito encontrado', 'warning');
      return;
    }

    if (totalAssociados > MAX_SELECAO) {
      showToast(`⚠️ Muitos associados (${totalAssociados}). Máximo de ${MAX_SELECAO} por vez.`, 'warning');
      return;
    }

    setCarregandoAssociados(true);
    
    try {
      console.log(`📥 Buscando TODOS os IDs CONSOLIDADOS (com nota) da régua ${reguaSelecionada}...`);
      
      // 🔥 USAR O MÉTODO CORRETO - listarTodosIdsConsolidados
      // AGORA RETORNA APENAS 2443 IDs (não 3071)
      const allIds = await reguaFaturamentoService.listarTodosIdsConsolidados(reguaSelecionada);
      
      console.log(`✅ Total de IDs carregados: ${allIds.length} (esperado: ${totalAssociados})`);
      
      // 🔥 Verificar se todos já estão selecionados
      const todosJaSelecionados = allIds.every(id => associadosSelecionados.has(id));
      
      if (todosJaSelecionados) {
        setAssociadosSelecionados(new Set());
        showToast(`✅ ${allIds.length} associados desmarcados`, 'info');
      } else {
        setAssociadosSelecionados(new Set(allIds));
        showToast(`✅ ${allIds.length} associados selecionados`, 'success');
      }
      
    } catch (error) {
      console.error('❌ Erro ao selecionar todos:', error);
      showToast('❌ Erro ao carregar todos os associados', 'error');
    } finally {
      setCarregandoAssociados(false);
    }
  }, [reguaSelecionada, totalAssociados, associadosSelecionados, showToast]);

  // ============================================
  // EFEITOS
  // ============================================
  
  // 🔥 Abrir modal
  useEffect(() => {
    if (isOpen) {
      console.log('📂 Modal aberto');
      carregarReguas();
      
      // Resetar estados
      setReguaSelecionada(undefined);
      setAssociados([]);
      setAssociadosSelecionados(new Set());
      setFiltroNome('');
      setFiltroCnpj('');
      setFiltroStatus('A');
      setPaginaAtual(1);
      setTotalAssociados(0);
      setTotalPaginas(0);
      setMesReferencia(mesAnterior.mes);
      setAnoReferencia(mesAnterior.ano);
      setGerarNotas(true);
      setIntegrarRM(false);
    }
  }, [isOpen, carregarReguas, mesAnterior]);

  // 🔥 Carregar quando régua mudar
  useEffect(() => {
    if (reguaSelecionada) {
      setPaginaAtual(1);
      carregarAssociadosPorRegua();
    }
  }, [reguaSelecionada]);

  // 🔥 Recarregar quando filtros mudarem (com debounce)
  useEffect(() => {
    if (reguaSelecionada) {
      if (paginaAtual !== 1) {
        setPaginaAtual(1);
      } else {
        carregarAssociadosPorRegua();
      }
    }
  }, [nomeDebounced, cnpjDebounced, filtroStatus]);

  // 🔥 Recarregar quando página mudar
  useEffect(() => {
    if (reguaSelecionada && paginaAtual > 0) {
      carregarAssociadosPorRegua();
    }
  }, [paginaAtual]);

  // ============================================
  // HANDLERS DE SELEÇÃO
  // ============================================
  
  const toggleAssociado = useCallback((id: number) => {
    setAssociadosSelecionados(prev => {
      const novos = new Set(prev);
      if (novos.has(id)) {
        novos.delete(id);
      } else {
        novos.add(id);
      }
      return novos;
    });
  }, []);

  const handleSelecionarPagina = useCallback(() => {
    const idsPagina = associados.map(a => a.id);
    const todosSelecionados = idsPagina.every(id => associadosSelecionados.has(id));
    
    setAssociadosSelecionados(prev => {
      const novos = new Set(prev);
      if (todosSelecionados) {
        idsPagina.forEach(id => novos.delete(id));
      } else {
        idsPagina.forEach(id => novos.add(id));
      }
      return novos;
    });
  }, [associados, associadosSelecionados]);

  const handleLimparSelecao = useCallback(() => {
    setAssociadosSelecionados(new Set());
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltroNome('');
    setFiltroCnpj('');
    setFiltroStatus('A');
    setPaginaAtual(1);
  }, []);

  // ============================================
  // HANDLERS DE EXECUÇÃO
  // ============================================
  
  const handleExecutar = useCallback(async (simular: boolean) => {
    const ids = Array.from(associadosSelecionados);
    
    if (!reguaSelecionada) {
      showToast('⚠️ Selecione uma régua de faturamento', 'warning');
      return;
    }
    
    if (ids.length === 0) {
      showToast('⚠️ Selecione pelo menos um associado', 'warning');
      return;
    }

    if (ids.length > MAX_SELECAO) {
      showToast(`⚠️ Máximo de ${MAX_SELECAO} associados por vez.`, 'warning');
      return;
    }

    setProcessando(true);
    setModoSimulacao(simular);

    try {
      const config: ProcessamentoConfig = {
        reguaId: reguaSelecionada,
        mesReferencia,
        anoReferencia,
        gerarNotas: !simular ? gerarNotas : false,
        integrarRM: !simular ? integrarRM : false
      };

      console.log(`📤 ${simular ? '🔍 Simulando' : '🚀 Processando'} ${ids.length} associados...`);

      if (simular && onSimulate) {
        await onSimulate(ids, config);
      } else {
        await onConfirm(ids, config);
      }
      
      onClose();
      
    } catch (error) {
      console.error('❌ Erro ao executar:', error);
      showToast(`❌ Erro ao ${simular ? 'simular' : 'processar'} faturamento`, 'error');
    } finally {
      setProcessando(false);
    }
  }, [associadosSelecionados, reguaSelecionada, mesReferencia, anoReferencia, gerarNotas, integrarRM, onConfirm, onSimulate, showToast, onClose]);

  // ============================================
  // RENDER
  // ============================================
  
  const meses = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];
  
  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  
  const statusOptions = [
    { value: 'A', label: 'Ativos' },
    { value: 'I', label: 'Inativos' },
    { value: 'S', label: 'Suspensos' },
    { value: 'TODOS', label: 'Todos' }
  ];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Processar Faturamento" size="xl">
      <div className="space-y-6">
        {/* ========================================== */}
        {/* SEÇÃO 1: CONFIGURAÇÕES GERAIS */}
        {/* ========================================== */}
        
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Configurações do Processamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Régua de Faturamento *</label>
              <select
                value={reguaSelecionada || ''}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  console.log(`📌 Régua selecionada: ${value}`);
                  setReguaSelecionada(value);
                  setPaginaAtual(1);
                  setAssociados([]);
                  setAssociadosSelecionados(new Set());
                  setTotalAssociados(0);
                  setTotalPaginas(0);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={carregandoReguas}
              >
                <option value="">Selecione uma régua...</option>
                {reguas.map(regua => (
                  <option key={regua.id} value={regua.id}>
                    {regua.nome} - Vencimento: dia {regua.diaVencimento}
                    {!regua.ativo && ' (Inativa)'}
                  </option>
                ))}
              </select>
              {carregandoReguas && <Loading size="small" />}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mês de Referência *</label>
              <select
                value={mesReferencia}
                onChange={(e) => setMesReferencia(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {meses.map(mes => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ano de Referência *</label>
              <select
                value={anoReferencia}
                onChange={(e) => setAnoReferencia(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {anos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Opções</label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={gerarNotas} 
                  onChange={(e) => setGerarNotas(e.target.checked)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Gerar notas de débito</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={integrarRM} 
                  onChange={(e) => setIntegrarRM(e.target.checked)} 
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Integrar com RM</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* ========================================== */}
        {/* SEÇÃO 2: SELEÇÃO DE ASSOCIADOS */}
        {/* ========================================== */}
        
        {reguaSelecionada && (
          <div>
            {/* 🔥 RESUMO DA SELEÇÃO - TOTAL CORRETO */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-700">
                  ✅ {associadosSelecionados.size} de {totalAssociados} associado(s) selecionado(s)
                </span>
                {associadosSelecionados.size > 0 && (
                  <button
                    onClick={handleLimparSelecao}
                    className="text-xs text-red-600 hover:text-red-800 hover:underline"
                  >
                    Limpar seleção
                  </button>
                )}
                <span className="text-xs text-gray-400">
                  (Total com nota: {totalAssociados})
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSelecionarPagina}
                  disabled={associados.length === 0 || carregandoAssociados}
                  className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {associados.length > 0 && associados.some(a => !associadosSelecionados.has(a.id))
                    ? `✓ Selecionar Página (${associados.length})`
                    : `✕ Desmarcar Página (${associados.length})`}
                </button>
                
                <button
                  onClick={handleSelecionarTodos}
                  disabled={carregandoAssociados || totalAssociados === 0}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {carregandoAssociados ? 'Carregando...' : `📌 Selecionar Todos (${totalAssociados})`}
                </button>
              </div>
            </div>
            
            {/* 🔥 FILTROS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Nome/Razão Social..."
                  value={filtroNome}
                  onChange={(e) => { 
                    setFiltroNome(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filtroNome && (
                  <button 
                    onClick={() => setFiltroNome('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 CNPJ/CPF..."
                  value={filtroCnpj}
                  onChange={(e) => {
                    setFiltroCnpj(e.target.value.replace(/[^0-9./-]/g, ''));
                    setPaginaAtual(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filtroCnpj && (
                  <button 
                    onClick={() => setFiltroCnpj('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div>
                <select
                  value={filtroStatus}
                  onChange={(e) => {
                    setFiltroStatus(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {(filtroNome || filtroCnpj || filtroStatus !== 'A') && (
                <button 
                  onClick={limparFiltros} 
                  className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  🗑️ Limpar Filtros
                </button>
              )}
            </div>
            
            {/* 🔥 TABELA DE ASSOCIADOS */}
            {carregandoAssociados ? (
              <div className="text-center py-8">
                <Loading size="medium" />
                <p className="text-gray-500 mt-2">Carregando associados...</p>
              </div>
            ) : totalAssociados === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum associado com nota de débito encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  {reguaSelecionada && (filtroNome || filtroCnpj || filtroStatus !== 'A')
                    ? 'Nenhum associado encontrado com os filtros aplicados' 
                    : 'Nenhum associado com nota de débito vinculado a esta régua'}
                </p>
                {(filtroNome || filtroCnpj || filtroStatus !== 'A') && (
                  <button onClick={limparFiltros} className="mt-2 text-blue-600 hover:text-blue-800">
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="w-12 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={associados.length > 0 && associados.every(a => associadosSelecionados.has(a.id))}
                              onChange={handleSelecionarPagina}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código SPC</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome/Razão Social</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ/CPF</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {associados.map((associado) => {
                          const isSelected = associadosSelecionados.has(associado.id);
                          return (
                            <tr 
                              key={associado.id} 
                              className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                              onClick={() => toggleAssociado(associado.id)}
                            >
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAssociado(associado.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">
                                {associado.codigoSpc || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {associado.nomeRazao}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-500">
                                {associado.cnpjCpf || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {associado.cidade && associado.uf ? `${associado.cidade}/${associado.uf}` : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  associado.status === 'ATIVO' 
                                    ? 'bg-green-100 text-green-800' 
                                    : associado.status === 'INATIVO'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {associado.status || 'ATIVO'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* 🔥 PAGINAÇÃO */}
                {totalPaginas > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {associados.length > 0 ? ((paginaAtual - 1) * ITENS_POR_PAGINA) + 1 : 0} - {Math.min(paginaAtual * ITENS_POR_PAGINA, totalAssociados)} de {totalAssociados} associados
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                        disabled={paginaAtual === 1 || carregandoAssociados} 
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        ◀ Anterior
                      </button>
                      <span className="px-3 py-1 text-gray-600 text-sm">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <button 
                        onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                        disabled={paginaAtual === totalPaginas || carregandoAssociados} 
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        Próxima ▶
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* ========================================== */}
        {/* BOTÕES DE AÇÃO */}
        {/* ========================================== */}
        
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          
          {onSimulate && associadosSelecionados.size > 0 && reguaSelecionada && (
            <button 
              onClick={() => handleExecutar(true)} 
              disabled={processando}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processando && modoSimulacao ? 'Simulando...' : '🔍 Simular'}
            </button>
          )}
          
          <button 
            onClick={() => handleExecutar(false)} 
            disabled={!reguaSelecionada || associadosSelecionados.size === 0 || processando} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {processando && !modoSimulacao ? 'Processando...' : '🚀 Processar Faturamento'}
          </button>
        </div>
        
        {/* ========================================== */}
        {/* RODAPÉ INFORMATIVO */}
        {/* ========================================== */}
        
        {reguaSelecionada && (
          <div className="text-xs text-gray-400 border-t pt-3 mt-2">
            ℹ️ Exibindo apenas associados com nota de débito para o período selecionado.
            {associadosSelecionados.size > 0 && ` • ${associadosSelecionados.size} selecionados de ${totalAssociados}.`}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalSelecaoAssociados;