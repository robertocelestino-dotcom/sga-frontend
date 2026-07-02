// src/components/faturamento/ModalSelecaoAssociados.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import api from '../../services/api';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';

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

const ModalSelecaoAssociados: React.FC<ModalSelecaoAssociadosProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSimulate
}) => {
  const { showToast } = useMessage();
  
  // Estados
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [reguaSelecionada, setReguaSelecionada] = useState<number | undefined>(undefined);
  const [associados, setAssociados] = useState<AssociadoResumo[]>([]);
  const [associadosFiltrados, setAssociadosFiltrados] = useState<AssociadoResumo[]>([]);
  const [associadosSelecionados, setAssociadosSelecionados] = useState<number[]>([]);
  const [carregandoReguas, setCarregandoReguas] = useState(false);
  const [carregandoAssociados, setCarregandoAssociados] = useState(false);
  
  // Configurações de processamento
  const [mesReferencia, setMesReferencia] = useState<number>(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState<number>(new Date().getFullYear());
  const [gerarNotas, setGerarNotas] = useState<boolean>(true);
  const [integrarRM, setIntegrarRM] = useState<boolean>(false);
  
  // Controles de seleção
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [selecionarTodosFiltrados, setSelecionarTodosFiltrados] = useState(false);
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);

  // Adicione este estado
  const [selecionarTodosAssociados, setSelecionarTodosAssociados] = useState(false);  
  
  // Carregar réguas de faturamento ao abrir modal
  useEffect(() => {
    if (isOpen) {
      carregarReguas();
      // Resetar seleção ao abrir
      setReguaSelecionada(undefined);
      setAssociados([]);
      setAssociadosSelecionados([]);
      setFiltroNome('');
      setFiltroStatus('');
      setPaginaAtual(1);
      setSelecionarTodos(false);
      setSelecionarTodosFiltrados(false);
    }
  }, [isOpen]);
  
  // Carregar associados quando régua for selecionada
  useEffect(() => {
    if (reguaSelecionada) {
      carregarAssociadosPorRegua();
    } else {
      setAssociados([]);
      setAssociadosSelecionados([]);
    }
  }, [reguaSelecionada]);
  
  // Aplicar filtros quando associados ou filtros mudarem
  useEffect(() => {
    aplicarFiltros();
  }, [associados, filtroNome, filtroStatus]);
  
  // Atualizar selecionarTodosFiltrados quando seleção mudar
  useEffect(() => {
    const idsFiltrados = associadosFiltrados.map(a => a.id);
    const todosFiltradosSelecionados = idsFiltrados.length > 0 && 
      idsFiltrados.every(id => associadosSelecionados.includes(id));
    setSelecionarTodosFiltrados(todosFiltradosSelecionados);
  }, [associadosSelecionados, associadosFiltrados]);
  
  // Adicione um efeito para recarregar quando mês/ano mudar
  useEffect(() => {
    if (reguaSelecionada) {
        carregarAssociadosPorRegua();
    }
  }, [mesReferencia, anoReferencia]);

  const carregarReguas = async () => {
    setCarregandoReguas(true);
    try {
      const response = await api.get('/regua-faturamento/ativas');
      setReguas(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas de faturamento', 'error');
    } finally {
      setCarregandoReguas(false);
    }
  };
  
  const carregarAssociadosPorRegua = async () => {
    if (!reguaSelecionada) return;
    
    setCarregandoAssociados(true);
    setAssociadosSelecionados([]);
    setSelecionarTodos(false);
    setSelecionarTodosFiltrados(false);
    setPaginaAtual(1);
    
    try {
        // 🔥 BUSCAR TODOS OS ASSOCIADOS DA RÉGUA (SEM FILTRO DE FATURA)
        const response = await api.get(
            `/regua-faturamento/${reguaSelecionada}/associados/paginado`,
            { params: { page: 0, size: 1000 } }
        );
        
        console.log('Associados da régua:', response.data);
        
        const associadosData = response.data.content || [];
        
        const associadosFormatados = associadosData.map((item: any) => ({
            id: item.id,
            codigoSpc: item.codigoSpc || '-',
            nomeRazao: item.nomeRazao || '-',
            cnpjCpf: item.cnpjCpf || '-',
            cidade: item.cidade || '',
            uf: item.uf || '',
            status: item.status === 'A' ? 'ATIVO' : (item.status || 'ATIVO')
        }));
        
        console.log('Associados formatados:', associadosFormatados);
        
        setAssociados(associadosFormatados);
        setAssociadosFiltrados(associadosFormatados);
        
    } catch (error: any) {
        console.error('Erro ao carregar associados:', error);
        showToast('Erro ao carregar associados da régua', 'error');
        setAssociados([]);
    } finally {
        setCarregandoAssociados(false);
    }
  };
  
  const aplicarFiltros = () => {
    let filtrados = [...associados];
    
    if (filtroNome.trim()) {
      const nomeLower = filtroNome.toLowerCase();
      filtrados = filtrados.filter(assoc => 
        assoc.nomeRazao.toLowerCase().includes(nomeLower)
      );
    }
    
    if (filtroStatus) {
      filtrados = filtrados.filter(assoc => assoc.status === filtroStatus);
    }
    
    setAssociadosFiltrados(filtrados);
  };
  
  // Paginação
  const totalPaginas = Math.ceil(associadosFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const associadosPaginados = associadosFiltrados.slice(inicio, fim);
  
  const toggleAssociado = (id: number) => {
    setAssociadosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(assocId => assocId !== id)
        : [...prev, id]
    );
  };
  
  // 🔥 SELECIONAR TODOS OS ASSOCIADOS (TODOS, NÃO APENAS DA PÁGINA)
  const handleSelecionarTodos = () => {
    if (selecionarTodosAssociados) {
        setAssociadosSelecionados([]);
        setSelecionarTodosAssociados(false);
    } else {
        const todosIds = associados.map(a => a.id);
        setAssociadosSelecionados(todosIds);
        setSelecionarTodosAssociados(true);
    }
};
  
  // 🔥 SELECIONAR APENAS OS ASSOCIADOS FILTRADOS
  const handleSelecionarTodosFiltrados = () => {
    if (selecionarTodosFiltrados) {
      const idsFiltrados = associadosFiltrados.map(a => a.id);
      const novosSelecionados = associadosSelecionados.filter(
        id => !idsFiltrados.includes(id)
      );
      setAssociadosSelecionados(novosSelecionados);
      setSelecionarTodosFiltrados(false);
    } else {
      const idsFiltrados = associadosFiltrados.map(a => a.id);
      const novosSelecionados = [...new Set([...associadosSelecionados, ...idsFiltrados])];
      setAssociadosSelecionados(novosSelecionados);
      setSelecionarTodosFiltrados(true);
    }
  };
  
  // 🔥 SELECIONAR TODOS DA PÁGINA ATUAL
  const handleSelecionarTodosPagina = () => {
    const idsPagina = associadosPaginados.map(a => a.id);
    const todosSelecionados = idsPagina.every(id => associadosSelecionados.includes(id));
    
    if (todosSelecionados) {
      const novosSelecionados = associadosSelecionados.filter(
        id => !idsPagina.includes(id)
      );
      setAssociadosSelecionados(novosSelecionados);
    } else {
      const novosSelecionados = [...new Set([...associadosSelecionados, ...idsPagina])];
      setAssociadosSelecionados(novosSelecionados);
    }
  };
  
  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroStatus('');
    setPaginaAtual(1);
  };
  
  const handleConfirm = () => {
    if (!reguaSelecionada) {
      showToast('Selecione uma régua de faturamento', 'warning');
      return;
    }
    
    if (associadosSelecionados.length === 0) {
      showToast('Selecione pelo menos um associado para processar', 'warning');
      return;
    }
    
    const config: ProcessamentoConfig = {
      reguaId: reguaSelecionada,
      mesReferencia,
      anoReferencia,
      gerarNotas,
      integrarRM
    };
    
    onConfirm(associadosSelecionados, config);
  };
  
  const handleSimulate = () => {
    if (!reguaSelecionada) {
      showToast('Selecione uma régua de faturamento', 'warning');
      return;
    }
    
    if (associadosSelecionados.length === 0) {
      showToast('Selecione pelo menos um associado para simular', 'warning');
      return;
    }
    
    if (onSimulate) {
      const config: ProcessamentoConfig = {
        reguaId: reguaSelecionada,
        mesReferencia,
        anoReferencia,
        gerarNotas: false,
        integrarRM: false
      };
      
      onSimulate(associadosSelecionados, config);
    }
  };
  
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
    { value: '', label: 'Todos' },
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'BLOQUEADO', label: 'Bloqueado' }
  ];
  
  if (!isOpen) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Processar Faturamento" size="xl">
      <div className="space-y-6">
        {/* Seção 1: Configurações Gerais */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚙️ Configurações do Processamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Régua de Faturamento *</label>
              <select
                value={reguaSelecionada || ''}
                onChange={(e) => setReguaSelecionada(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={carregandoReguas}
              >
                <option value="">Selecione uma régua...</option>
                {reguas.map(regua => (
                  <option key={regua.id} value={regua.id}>
                    {regua.nome} - Vencimento: dia {regua.diaVencimento}
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
                <input type="checkbox" checked={gerarNotas} onChange={(e) => setGerarNotas(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Gerar notas de débito</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={integrarRM} onChange={(e) => setIntegrarRM(e.target.checked)} className="rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Integrar com RM</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Seção 2: Seleção de Associados */}
        {reguaSelecionada && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Associados da Régua</h3>
              <div className="text-sm text-gray-500">
                {associadosSelecionados.length} de {associados.length} selecionados
              </div>
            </div>
            
            {/* Botões de seleção em massa */}
            <div className="flex flex-wrap gap-3 mb-4">

              <button
                onClick={handleSelecionarTodos}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {selecionarTodosAssociados  ? 'Desmarcar Todos' : '✓ Selecionar Todos'}
              </button>

              <button
                onClick={handleSelecionarTodosFiltrados}
                disabled={associadosFiltrados.length === 0}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {selecionarTodosFiltrados ? 'Desmarcar Filtrados' : `✓ Selecionar Filtrados (${associadosFiltrados.length})`}
              </button>
              <button
                onClick={handleSelecionarTodosPagina}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {associadosPaginados.every(id => associadosSelecionados.includes(id)) 
                  ? `Desmarcar Página (${associadosPaginados.length})` 
                  : `✓ Selecionar Página (${associadosPaginados.length})`}
              </button>
            </div>
            
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Filtrar por nome..."
                  value={filtroNome}
                  onChange={(e) => { setFiltroNome(e.target.value); setPaginaAtual(1); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500"
                />
                {filtroNome && (
                  <button onClick={() => setFiltroNome('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
                )}
              </div>
              
              <select
                value={filtroStatus}
                onChange={(e) => { setFiltroStatus(e.target.value); setPaginaAtual(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              
              {(filtroNome || filtroStatus) && (
                <button onClick={limparFiltros} className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">Limpar Filtros</button>
              )}
            </div>
            
            {filtroNome && (
              <div className="text-sm text-gray-500 mb-2">Encontrados {associadosFiltrados.length} resultado(s) para "{filtroNome}"</div>
            )}
            
            {/* Tabela de Associados */}
            {carregandoAssociados ? (
              <div className="text-center py-8"><Loading size="medium" /><p className="text-gray-500 mt-2">Carregando associados...</p></div>
            ) : associados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum associado vinculado a esta régua</p>
                <p className="text-sm text-gray-400 mt-1">Cadastre associados na régua de faturamento para processar</p>
              </div>
            ) : associadosFiltrados.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum associado encontrado com os filtros aplicados</p>
                <button onClick={limparFiltros} className="mt-2 text-blue-600 hover:text-blue-800">Limpar filtros</button>
              </div>
            ) : (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="w-12 px-4 py-3"></th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código SPC</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome/Razão Social</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade/UF</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Situação</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {associadosPaginados.map((associado) => (
                          <tr key={associado.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleAssociado(associado.id)}>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={associadosSelecionados.includes(associado.id)}
                                onChange={() => toggleAssociado(associado.id)}
                                className="rounded border-gray-300 text-blue-600"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{associado.codigoSpc || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{associado.nomeRazao}</td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-500">{associado.cnpjCpf || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{associado.cidade && associado.uf ? `${associado.cidade}/${associado.uf}` : '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                associado.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>{associado.status || 'ATIVO'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">Mostrando {inicio + 1} - {Math.min(fim, associadosFiltrados.length)} de {associadosFiltrados.length}</div>
                    <div className="flex gap-2">
                      <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">◀ Anterior</button>
                      <span className="px-3 py-1 text-gray-600">Página {paginaAtual} de {totalPaginas}</span>
                      <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="px-3 py-1 border rounded-lg disabled:opacity-50">Próxima ▶</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
          {onSimulate && associadosSelecionados.length > 0 && reguaSelecionada && (
            <button onClick={handleSimulate} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">🔍 Simular Apenas</button>
          )}
          <button onClick={handleConfirm} disabled={!reguaSelecionada || associadosSelecionados.length === 0} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">🚀 Processar Faturamento</button>
        </div>
        
        {reguaSelecionada && (
          <div className="text-xs text-gray-400 border-t pt-3 mt-2">
            ℹ️ Os associados exibidos são aqueles vinculados à régua de faturamento selecionada.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalSelecaoAssociados;