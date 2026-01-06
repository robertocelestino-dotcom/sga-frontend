// src/pages/Vendedores.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  vendedorService,
  vendedorOpcoes,
  VendedorResumoDTO,
  VendedorFiltros
} from '../services/vendedorService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

// Hook de debounce personalizado
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const VendedoresPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  
  const [vendedores, setVendedores] = useState<VendedorResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inputValues, setInputValues] = useState({
    codigo: '',
    nomeRazao: '',
    cpfCnpj: '',
    status: ''
  });
  
  const [filtrosAtivos, setFiltrosAtivos] = useState<VendedorFiltros>({
    page: 0,
    size: 10,
    sort: 'nomeRazao',
    direction: 'asc'
  });
  
  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0
  });
  
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Debounce
  const debouncedNomeRazao = useDebounce(inputValues.nomeRazao, 500);
  const debouncedCodigo = useDebounce(inputValues.codigo, 500);

  useEffect(() => {
    const novosFiltros: VendedorFiltros = {
      ...filtrosAtivos,
      page: 0,
      codigo: debouncedCodigo || undefined,
      nomeRazao: debouncedNomeRazao || undefined,
      cpfCnpj: inputValues.cpfCnpj || undefined,
      status: inputValues.status || undefined
    };

    Object.keys(novosFiltros).forEach(key => {
      if (novosFiltros[key as keyof VendedorFiltros] === undefined) {
        delete novosFiltros[key as keyof VendedorFiltros];
      }
    });

    setFiltrosAtivos(novosFiltros);
  }, [debouncedNomeRazao, debouncedCodigo, inputValues.cpfCnpj, inputValues.status]);

  const carregarVendedores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendedorService.listar(filtrosAtivos);
      
      if (response && response.content && Array.isArray(response.content)) {
        setVendedores(response.content);
        setPaginaInfo({
          totalElements: response.totalElements,
          totalPages: response.totalPages,
          size: response.size,
          number: response.number
        });
      } else {
        setVendedores([]);
        showToast('Nenhum vendedor encontrado', 'info');
      }
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      showToast('Erro ao carregar vendedores. Tente novamente.', 'error');
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  }, [filtrosAtivos, showToast]);

  useEffect(() => {
    carregarVendedores();
  }, [carregarVendedores]);

  const handleInputChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({ ...prev, [campo]: valor }));
  };

  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({ ...prev, [campo]: valor }));
    setFiltrosAtivos(prev => ({ ...prev, [campo]: valor || undefined, page: 0 }));
  };

  const limparFiltros = () => {
    setInputValues({ codigo: '', nomeRazao: '', cpfCnpj: '', status: '' });
    setFiltrosAtivos({ page: 0, size: 10, sort: 'nomeRazao', direction: 'asc' });
    showToast('Filtros limpos', 'info');
  };

  const handleNovoVendedor = () => navigate('/vendedores/novo');
  const handleEditarVendedor = (id: number) => navigate(`/vendedores/editar/${id}`);
  const handleVerDetalhes = (id: number) => navigate(`/vendedores/${id}`);

  const handleExcluirVendedor = async (id: number, nome: string) => {
    const confirmado = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o vendedor "${nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmado) return;

    try {
      await vendedorService.excluir(id);
      showToast('Vendedor excluído com sucesso!', 'success');
      carregarVendedores();
    } catch (error: any) {
      console.error('Erro ao excluir vendedor:', error);
      const mensagem = error.response?.data?.mensagem || 'Erro ao excluir vendedor. Verifique se não está em uso.';
      showToast(mensagem, 'error');
    }
  };

  const handlePaginaChange = (novaPagina: number) => {
    setFiltrosAtivos(prev => ({ ...prev, page: novaPagina }));
  };

  const formatarCpfCnpj = (cpfCnpj: string) => {
    if (!cpfCnpj) return '-';
    const apenasNumeros = cpfCnpj.replace(/\D/g, '');
    if (apenasNumeros.length === 11) {
      return cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return cpfCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cpfCnpj;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-100 text-green-800';
      case 'INATIVO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const opcao = vendedorOpcoes.status.find(s => s.value === status);
    return opcao ? opcao.label : status;
  };

  const formatarData = (dataString: string) => {
    try {
      return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  const isFiltrando = debouncedNomeRazao !== inputValues.nomeRazao || 
                      debouncedCodigo !== inputValues.codigo;

  if (loading && vendedores.length === 0) {
    return <Loading />;
  }

  return (
    <div className="p-6">
      <BreadCrumb atual="Vendedores" />
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão de Vendedores</h1>
          <p className="text-gray-600">
            Total: {paginaInfo.totalElements} vendedor(es) | Exibindo: {vendedores.length}
            {isFiltrando && <span className="ml-2 text-blue-600">(buscando...)</span>}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          <button
            onClick={carregarVendedores}
            disabled={loading}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>
          
          <button
            onClick={handleNovoVendedor}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            ➕ Novo Vendedor
          </button>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={limparFiltros}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
                {inputValues.codigo && debouncedCodigo !== inputValues.codigo && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                type="text"
                value={inputValues.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Código do vendedor"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome/Razão
                {inputValues.nomeRazao && debouncedNomeRazao !== inputValues.nomeRazao && (
                  <span className="ml-2 text-xs text-blue-500">digitando...</span>
                )}
              </label>
              <input
                type="text"
                value={inputValues.nomeRazao}
                onChange={(e) => handleInputChange('nomeRazao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Digite para buscar..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
              <input
                type="text"
                value={inputValues.cpfCnpj}
                onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Digite CPF ou CNPJ"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={inputValues.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os Status</option>
                {vendedorOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Vendedores */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && vendedores.length > 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Atualizando lista...</p>
          </div>
        ) : vendedores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum vendedor encontrado</h3>
            <p className="text-gray-600 mb-6">
              {Object.values(inputValues).some(v => v) 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece criando seu primeiro vendedor.'}
            </p>
            <button
              onClick={handleNovoVendedor}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ➕ Criar Primeiro Vendedor
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome/Razão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF/CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendedores.map((vendedor) => (
                    <tr key={vendedor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {vendedor.codigo || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{vendedor.nomeRazao}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {vendedor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatarCpfCnpj(vendedor.cpfCnpj)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vendedor.telefone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendedor.status)}`}>
                          {getStatusText(vendedor.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarData(vendedor.dataCadastro)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerDetalhes(vendedor.id)}
                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditarVendedor(vendedor.id)}
                            className="p-1 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleExcluirVendedor(vendedor.id, vendedor.nomeRazao)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{vendedores.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> vendedores
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                      <span className="font-medium">{paginaInfo.totalPages}</span>
                    </span>
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Próxima →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VendedoresPage;