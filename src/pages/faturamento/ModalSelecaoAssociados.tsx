// src/components/faturamento/ModalSelecaoAssociados.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import api from '../../services/api';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';

// Hook useDebounce (criar se não existir)
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
  const [associadosSelecionados, setAssociadosSelecionados] = useState<number[]>([]);
  const [carregandoReguas, setCarregandoReguas] = useState(false);
  const [carregandoAssociados, setCarregandoAssociados] = useState(false);
  
  // Configurações de processamento
  const [mesReferencia, setMesReferencia] = useState<number>(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState<number>(new Date().getFullYear());
  const [gerarNotas, setGerarNotas] = useState<boolean>(true);
  const [integrarRM, setIntegrarRM] = useState<boolean>(false);
  
  // 🔥 FILTROS
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCnpj, setFiltroCnpj] = useState('');
  
  // Debounce para os filtros (evita chamadas excessivas à API)
  const nomeDebounced = useDebounce(filtroNome, 500);
  const cnpjDebounced = useDebounce(filtroCnpj, 500);
  
  // Controles de seleção
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [totalAssociados, setTotalAssociados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  
  // Carregar réguas de faturamento ao abrir modal
  useEffect(() => {
    if (isOpen) {
      carregarReguas();
      // Resetar seleção ao abrir
      setReguaSelecionada(undefined);
      setAssociados([]);
      setAssociadosSelecionados([]);
      setFiltroNome('');
      setFiltroCnpj('');
      setPaginaAtual(1);
      setSelecionarTodos(false);
      setTotalAssociados(0);
      setTotalPaginas(0);
    }
  }, [isOpen]);
  
  // 🔥 CARREGAR ASSOCIADOS COM FILTROS - USANDO ENDPOINT CORRETO
  const carregarAssociadosPorRegua = useCallback(async () => {
    if (!reguaSelecionada) return;
    
    setCarregandoAssociados(true);
    
    try {
      // Construir parâmetros de filtro
      const params: any = {
        page: paginaAtual - 1,
        size: itensPorPagina
      };
      
      // 🔥 Adicionar filtros se preenchidos
      if (nomeDebounced.trim()) {
        params.nome = nomeDebounced.trim();
      }
      
      if (cnpjDebounced.trim()) {
        params.cnpjCpf = cnpjDebounced.trim();
      }
      
      console.log('🔍 Buscando associados com filtros:', {
        reguaId: reguaSelecionada,
        params
      });
      
      // 🔥 USANDO O ENDPOINT QUE ACEITA FILTROS
      const response = await api.get(
        `/regua-faturamento/${reguaSelecionada}/associados-consolidado/paginado`,
        { params }
      );
      
      console.log('📊 Resultado da busca:', response.data);
      
      const content = response.data.content || [];
      const totalElements = response.data.totalElements || 0;
      const totalPages = response.data.totalPages || 0;
      
      const associadosFormatados = content.map((item: any) => ({
        id: item.id,
        codigoSpc: item.codigoSpc || '-',
        nomeRazao: item.nomeRazao || '-',
        cnpjCpf: item.cnpjCpf || '-',
        cidade: item.cidade || '',
        uf: item.uf || '',
        status: item.status === 'A' ? 'ATIVO' : (item.status || 'ATIVO')
      }));
      
      setAssociados(associadosFormatados);
      setTotalAssociados(totalElements);
      setTotalPaginas(totalPages);
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar associados:', error);
      showToast('Erro ao carregar associados da régua', 'error');
      setAssociados([]);
      setTotalAssociados(0);
      setTotalPaginas(0);
    } finally {
      setCarregandoAssociados(false);
    }
  }, [reguaSelecionada, paginaAtual, itensPorPagina, nomeDebounced, cnpjDebounced, showToast]);
  
  // 🔥 EFEITO PARA RECARREGAR QUANDO FILTROS MUDAREM
  useEffect(() => {
    if (reguaSelecionada) {
      // Resetar para primeira página quando filtros mudarem
      if (paginaAtual !== 1) {
        setPaginaAtual(1);
      } else {
        carregarAssociadosPorRegua();
      }
    }
  }, [reguaSelecionada, nomeDebounced, cnpjDebounced]);
  
  // 🔥 EFEITO PARA QUANDO PÁGINA MUDAR
  useEffect(() => {
    if (reguaSelecionada && paginaAtual > 0) {
      carregarAssociadosPorRegua();
    }
  }, [paginaAtual]);
  
  // 🔥 EFEITO PARA RECARREGAR QUANDO MÊS/ANO MUDAR
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
  
  // 🔥 ATUALIZAR SELEÇÃO QUANDO ASSOCIADOS MUDAREM
  useEffect(() => {
    // Garantir que seleções sejam válidas
    const idsValidos = new Set(associados.map(a => a.id));
    setAssociadosSelecionados(prev => 
      prev.filter(id => idsValidos.has(id))
    );
  }, [associados]);
  
  const toggleAssociado = (id: number) => {
    setAssociadosSelecionados(prev => 
      prev.includes(id) 
        ? prev.filter(assocId => assocId !== id)
        : [...prev, id]
    );
  };
  
  const handleSelecionarTodos = () => {
    if (selecionarTodos) {
      setAssociadosSelecionados([]);
      setSelecionarTodos(false);
    } else {
      const todosIds = associados.map(a => a.id);
      setAssociadosSelecionados(todosIds);
      setSelecionarTodos(true);
    }
  };
  
  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroCnpj('');
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
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setReguaSelecionada(value);
                  setPaginaAtual(1);
                  setAssociados([]);
                  setAssociadosSelecionados([]);
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
        
        {/* Seção 2: Seleção de Associados */}
        {reguaSelecionada && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">📋 Associados da Régua</h3>
              <div className="text-sm text-gray-500">
                {associadosSelecionados.length} de {totalAssociados} selecionados
              </div>
            </div>
            
            {/* Botões de seleção em massa */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleSelecionarTodos}
                disabled={associados.length === 0}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {selecionarTodos ? 'Desmarcar Todos' : '✓ Selecionar Todos da Página'}
              </button>
              
              <button
                onClick={() => {
                  const todosIds = associados.map(a => a.id);
                  const todosSelecionados = todosIds.every(id => associadosSelecionados.includes(id));
                  if (todosSelecionados) {
                    setAssociadosSelecionados([]);
                  } else {
                    setAssociadosSelecionados(todosIds);
                  }
                }}
                disabled={associados.length === 0}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {associados.length > 0 && associados.every(a => associadosSelecionados.includes(a.id))
                  ? `Desmarcar Página (${associados.length})`
                  : `✓ Selecionar Página (${associados.length})`}
              </button>
            </div>
            
            {/* 🔥 FILTROS - NOME E CNPJ/CPF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
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
                    // Permitir apenas números e caracteres especiais
                    const value = e.target.value.replace(/[^0-9./-]/g, '');
                    setFiltroCnpj(value);
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
              
              {(filtroNome || filtroCnpj) && (
                <button 
                  onClick={limparFiltros} 
                  className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
            
            {/* Contador de resultados */}
            {(filtroNome || filtroCnpj) && totalAssociados > 0 && (
              <div className="text-sm text-gray-500 mb-2">
                Encontrados {totalAssociados} resultado(s) para 
                {filtroNome && ` "${filtroNome}"`}
                {filtroNome && filtroCnpj && ' e '}
                {filtroCnpj && ` CNPJ/CPF "${filtroCnpj}"`}
              </div>
            )}
            
            {/* Tabela de Associados */}
            {carregandoAssociados ? (
              <div className="text-center py-8">
                <Loading size="medium" />
                <p className="text-gray-500 mt-2">Carregando associados...</p>
              </div>
            ) : totalAssociados === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nenhum associado encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  {reguaSelecionada && (filtroNome || filtroCnpj) 
                    ? 'Nenhum associado encontrado com os filtros aplicados' 
                    : 'Nenhum associado vinculado a esta régua'}
                </p>
                {(filtroNome || filtroCnpj) && (
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
                              checked={associados.length > 0 && associados.every(a => associadosSelecionados.includes(a.id))}
                              onChange={() => {
                                const todosIds = associados.map(a => a.id);
                                const todosSelecionados = todosIds.every(id => associadosSelecionados.includes(id));
                                if (todosSelecionados) {
                                  setAssociadosSelecionados([]);
                                } else {
                                  setAssociadosSelecionados(todosIds);
                                }
                              }}
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
                        {associados.map((associado) => (
                          <tr 
                            key={associado.id} 
                            className="hover:bg-gray-50 cursor-pointer transition-colors" 
                            onClick={() => toggleAssociado(associado.id)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={associadosSelecionados.includes(associado.id)}
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
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {associado.status || 'ATIVO'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {associados.length > 0 ? ((paginaAtual - 1) * itensPorPagina) + 1 : 0} - {Math.min(paginaAtual * itensPorPagina, totalAssociados)} de {totalAssociados}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} 
                        disabled={paginaAtual === 1} 
                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      >
                        ◀ Anterior
                      </button>
                      <span className="px-3 py-1 text-gray-600">
                        Página {paginaAtual} de {totalPaginas}
                      </span>
                      <button 
                        onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} 
                        disabled={paginaAtual === totalPaginas} 
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
        
        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button 
            onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          {onSimulate && associadosSelecionados.length > 0 && reguaSelecionada && (
            <button 
              onClick={handleSimulate} 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔍 Simular Apenas
            </button>
          )}
          <button 
            onClick={handleConfirm} 
            disabled={!reguaSelecionada || associadosSelecionados.length === 0} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            🚀 Processar Faturamento
          </button>
        </div>
        
        {/* Rodapé informativo */}
        {reguaSelecionada && (
          <div className="text-xs text-gray-400 border-t pt-3 mt-2">
            ℹ️ Os associados exibidos são aqueles vinculados à régua de faturamento selecionada.
            Use os filtros para refinar a busca por nome ou documento.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalSelecaoAssociados;