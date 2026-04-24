// src/components/faturamento/ModalSelecaoAssociados.tsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useMessage } from '../../providers/MessageProvider';
import Loading from '../Loading';

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

interface ModalSelecaoAssociadosProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (associadosIds: number[], config: ProcessamentoConfig) => void;
  onSimulate?: (associadosIds: number[], config: ProcessamentoConfig) => void;
  titulo?: string;
}

interface ProcessamentoConfig {
  reguaId?: number;
  mesReferencia: number;
  anoReferencia: number;
  gerarNotas: boolean;
  integrarRM: boolean;
}

const PAGE_SIZE = 15; // 🔥 15 associados por página

const ModalSelecaoAssociados: React.FC<ModalSelecaoAssociadosProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSimulate,
  titulo = 'Selecionar Associados para Faturamento'
}) => {
  const { showToast } = useMessage();
  
  // Estados
  const [associados, setAssociados] = useState<AssociadoResumo[]>([]);
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoAssociados, setCarregandoAssociados] = useState(false);
  
  // Filtros
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroCnpjCpf, setFiltroCnpjCpf] = useState('');
  const [reguaSelecionadaId, setReguaSelecionadaId] = useState<number | undefined>(undefined);
  
  // Seleção
  const [associadosSelecionados, setAssociadosSelecionados] = useState<Set<number>>(new Set());
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  
  // Configuração do processamento
  const [configProcessamento, setConfigProcessamento] = useState<ProcessamentoConfig>({
    mesReferencia: new Date().getMonth() + 1,
    anoReferencia: new Date().getFullYear(),
    gerarNotas: true,
    integrarRM: false,
    reguaId: undefined
  });
  
  // Paginação
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  
  // 🔥 Carregar réguas ativas
  const carregarReguas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/regua-faturamento/ativas');
      setReguas(response.data);
      
      // Selecionar primeira régua por padrão
      if (response.data.length > 0 && !reguaSelecionadaId) {
        setReguaSelecionadaId(response.data[0].id);
        setConfigProcessamento(prev => ({ ...prev, reguaId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas de faturamento', 'error');
    } finally {
      setLoading(false);
    }
  }, [reguaSelecionadaId, showToast]);
  
  // 🔥 Carregar associados APÓS selecionar a régua
  const carregarAssociados = useCallback(async () => {
    if (!reguaSelecionadaId) {
      setAssociados([]);
      setTotalItens(0);
      setTotalPaginas(0);
      return;
    }
    
    setCarregandoAssociados(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagina.toString());
      params.append('size', PAGE_SIZE.toString());
      if (filtroNome) params.append('nome', filtroNome);
      if (filtroCnpjCpf) params.append('cnpjCpf', filtroCnpjCpf);
      params.append('reguaId', reguaSelecionadaId.toString());
      
      // 🔥 Endpoint para buscar associados da régua selecionada
      const response = await api.get(`/regua-faturamento/${reguaSelecionadaId}/associados/paginado?${params}`);
      
      setAssociados(response.data.content);
      setTotalPaginas(response.data.totalPages);
      setTotalItens(response.data.totalElements);
      
    } catch (error) {
      console.error('Erro ao carregar associados:', error);
      // Se o endpoint específico não existir, tenta o alternativo
      try {
        const params = new URLSearchParams();
        params.append('page', pagina.toString());
        params.append('size', PAGE_SIZE.toString());
        if (filtroNome) params.append('nome', filtroNome);
        if (filtroCnpjCpf) params.append('cnpjCpf', filtroCnpjCpf);
        
        const response = await api.get(`/regua-faturamento/associados/disponiveis?${params}`);
        setAssociados(response.data.content);
        setTotalPaginas(response.data.totalPages);
        setTotalItens(response.data.totalElements);
      } catch (err) {
        showToast('Erro ao carregar lista de associados', 'error');
      }
    } finally {
      setCarregandoAssociados(false);
    }
  }, [pagina, filtroNome, filtroCnpjCpf, reguaSelecionadaId, showToast]);
  
  // Efeitos
  useEffect(() => {
    if (isOpen) {
      carregarReguas();
    }
  }, [isOpen, carregarReguas]);
  
  // 🔥 Carregar associados quando a régua mudar ou página mudar
  useEffect(() => {
    if (isOpen && reguaSelecionadaId) {
      carregarAssociados();
    }
  }, [isOpen, reguaSelecionadaId, pagina, carregarAssociados]);
  
  // 🔥 Resetar página quando mudar a régua
  useEffect(() => {
    setPagina(0);
    setAssociadosSelecionados(new Set());
  }, [reguaSelecionadaId]);
  
  // Selecionar/Deselecionar associado
  const toggleSelecionarAssociado = (id: number) => {
    const novosSelecionados = new Set(associadosSelecionados);
    if (novosSelecionados.has(id)) {
      novosSelecionados.delete(id);
    } else {
      novosSelecionados.add(id);
    }
    setAssociadosSelecionados(novosSelecionados);
    setSelecionarTodos(novosSelecionados.size === associados.length && associados.length > 0);
  };
  
  // Selecionar/Deselecionar todos
  const toggleSelecionarTodos = () => {
    if (selecionarTodos) {
      setAssociadosSelecionados(new Set());
    } else {
      const novosSelecionados = new Set<number>();
      associados.forEach(a => novosSelecionados.add(a.id));
      setAssociadosSelecionados(novosSelecionados);
    }
    setSelecionarTodos(!selecionarTodos);
  };
  
  // Limpar filtros
  const limparFiltros = () => {
    setFiltroNome('');
    setFiltroCnpjCpf('');
    setPagina(0);
  };
  
  // Aplicar filtros
  const aplicarFiltros = () => {
    setPagina(0);
    carregarAssociados();
  };
  
  // Confirmar seleção
  const handleConfirm = () => {
    if (associadosSelecionados.size === 0) {
      showToast('Selecione pelo menos um associado para processar', 'warning');
      return;
    }
    onConfirm(Array.from(associadosSelecionados), configProcessamento);
  };
  
  // Simular
  const handleSimulate = () => {
    if (associadosSelecionados.size === 0) {
      showToast('Selecione pelo menos um associado para simular', 'warning');
      return;
    }
    if (onSimulate) {
      onSimulate(Array.from(associadosSelecionados), configProcessamento);
    }
  };
  
  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'I': return 'bg-red-100 text-red-800';
      case 'S': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusTexto = (status: string) => {
    switch (status) {
      case 'A': return 'Ativo';
      case 'I': return 'Inativo';
      case 'S': return 'Suspenso';
      default: return status;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">{titulo}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          
          {/* Body */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Configurações do Processamento */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-700 mb-3">⚙️ Configurações do Processamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês Referência</label>
                  <select
                    value={configProcessamento.mesReferencia}
                    onChange={(e) => setConfigProcessamento({
                      ...configProcessamento,
                      mesReferencia: parseInt(e.target.value)
                    })}
                    className="w-full p-2 border rounded-lg"
                  >
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => (
                      <option key={idx} value={idx + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano Referência</label>
                  <input
                    type="number"
                    value={configProcessamento.anoReferencia}
                    onChange={(e) => setConfigProcessamento({
                      ...configProcessamento,
                      anoReferencia: parseInt(e.target.value)
                    })}
                    className="w-full p-2 border rounded-lg"
                    min={2020}
                    max={2030}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Régua de Faturamento</label>
                  {loading ? (
                    <Loading size="small" />
                  ) : (
                    <select
                      value={reguaSelecionadaId || ''}
                      onChange={(e) => {
                        const novaReguaId = e.target.value ? parseInt(e.target.value) : undefined;
                        setReguaSelecionadaId(novaReguaId);
                        setConfigProcessamento({ ...configProcessamento, reguaId: novaReguaId });
                      }}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Selecione uma régua</option>
                      {reguas.map(regua => (
                        <option key={regua.id} value={regua.id}>
                          {regua.nome} (Dia {regua.diaEmissao}) {!regua.ativa && '(Inativa)'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configProcessamento.gerarNotas}
                      onChange={(e) => setConfigProcessamento({
                        ...configProcessamento,
                        gerarNotas: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Gerar Notas</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={configProcessamento.integrarRM}
                      onChange={(e) => setConfigProcessamento({
                        ...configProcessamento,
                        integrarRM: e.target.checked
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Integrar RM</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Filtros - só aparece se tiver régua selecionada */}
            {reguaSelecionadaId && (
              <div className="bg-white p-4 rounded-lg border mb-6">
                <h3 className="font-semibold text-gray-700 mb-3">🔍 Filtros</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="Nome/Razão Social"
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="CNPJ/CPF"
                    value={filtroCnpjCpf}
                    onChange={(e) => setFiltroCnpjCpf(e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                  <button
                    onClick={aplicarFiltros}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={limparFiltros}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}
            
            {/* Mensagem quando não há régua selecionada */}
            {!reguaSelecionadaId && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-5xl mb-4">📏</div>
                <p>Selecione uma régua de faturamento para carregar os associados</p>
              </div>
            )}
            
            {/* Tabela de Associados - só mostra se tiver régua selecionada */}
            {reguaSelecionadaId && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selecionarTodos && associados.length > 0}
                            onChange={toggleSelecionarTodos}
                            className="rounded"
                            disabled={carregandoAssociados}
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome/Razão</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {carregandoAssociados ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center">
                            <Loading size="small" />
                            <span className="ml-2 text-gray-500">Carregando associados...</span>
                          </td>
                        </tr>
                      ) : associados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Nenhum associado encontrado para esta régua
                          </td>
                        </tr>
                      ) : (
                        associados.map((associado) => (
                          <tr key={associado.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={associadosSelecionados.has(associado.id)}
                                onChange={() => toggleSelecionarAssociado(associado.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{associado.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{associado.nomeRazao}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{associado.cnpjCpf}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{associado.planoTitulo || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(associado.status)}`}>
                                {getStatusTexto(associado.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{associado.vendedorNome || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => setPagina(p => Math.max(0, p - 1))}
                      disabled={pagina === 0 || carregandoAssociados}
                      className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-gray-600">
                      Página {pagina + 1} de {totalPaginas} ({totalItens} associados)
                    </span>
                    <button
                      onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                      disabled={pagina === totalPaginas - 1 || carregandoAssociados}
                      className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="text-sm text-gray-500">
              {associadosSelecionados.size} associado(s) selecionado(s)
            </div>
            <div className="flex gap-3">
              {onSimulate && (
                <button
                  onClick={handleSimulate}
                  disabled={associadosSelecionados.size === 0 || !reguaSelecionadaId}
                  className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                >
                  Simular
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={associadosSelecionados.size === 0 || !reguaSelecionadaId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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