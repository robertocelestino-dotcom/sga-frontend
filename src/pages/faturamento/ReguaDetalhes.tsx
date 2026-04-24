import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento } from '../../services/reguaFaturamentoService';
import { associadoService, AssociadoResumoDTO } from '../../services/associadoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';

interface AssociadoReguaDetalhe {
  id: number;
  associadoId: number;
  associadoNome: string;
  associadoCodigoSpc: string;
  associadoCnpjCpf: string;
  associadoStatus: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  motivoMigracao?: string;
  observacao?: string;
}

const ReguaDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [regua, setRegua] = useState<ReguaFaturamento | null>(null);
  const [associados, setAssociados] = useState<AssociadoReguaDetalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    carregarDados();
  }, [id]);
  
  const carregarDados = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados da régua
      const reguaData = await reguaFaturamentoService.buscarPorId(parseInt(id));
      setRegua(reguaData);
      
      // Carregar associados da régua
      try {
        const associadosData = await reguaFaturamentoService.listarAssociadosPorRegua(parseInt(id));
        setAssociados(associadosData);
      } catch (assocError) {
        console.log('Associados não disponíveis:', assocError);
        setAssociados([]);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar régua');
      console.error('Erro ao carregar régua:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoltar = () => {
    navigate('/faturamento/regua');
  };
  
  const handleEditarRegua = () => {
    navigate(`/faturamento/regua/editar/${id}`);
  };
  
  const handleVerAssociado = (associadoId: number) => {
    navigate(`/associados/${associadoId}`);
  };
  
  const handleRemoverAssociado = async (associadoId: number, nome: string) => {
    if (window.confirm(`Deseja remover o associado "${nome}" da régua?`)) {
      try {
        await reguaFaturamentoService.removerAssociadoDaRegua(associadoId);
        carregarDados();
      } catch (error) {
        console.error('Erro ao remover associado:', error);
        alert('Erro ao remover associado');
      }
    }
  };
  
  const handleAdicionarAssociados = () => {
    navigate(`/faturamento/regua/editar/${id}`, { 
      state: { 
        openModal: 'associados'
      } 
    });
  };
  
  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  const formatarCnpjCpf = (cnpjCpf: string) => {
    if (!cnpjCpf) return '-';
    const apenasNumeros = cnpjCpf.replace(/\D/g, '');
    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpjCpf;
  };
  
  const getPeriodoLabel = (periodo: string) => {
    const periodos: Record<string, string> = {
      'PRIMEIRO': 'Primeiro Período (Dias 1-2)',
      'SEGUNDO': 'Segundo Período (Dia 16)',
      'TERCEIRO': 'Terceiro Período (Dia 26)'
    };
    return periodos[periodo] || periodo;
  };
  
  const getTipoArquivoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'CONSOLIDACAO': 'Consolidação',
      'PREVIA_CORRENTE': 'Prévia Corrente',
      'PREVIA_ANTERIOR': 'Prévia Anterior'
    };
    return tipos[tipo] || tipo;
  };
  
  const getStatusColor = (status: string) => {
    return status === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  
  const getStatusText = (status: string) => {
    return status === 'A' ? 'Ativo' : 'Inativo';
  };
  
  const getCorBadge = (cor?: string) => {
    const cores: Record<string, string> = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'purple': 'bg-purple-100 text-purple-800',
      'orange': 'bg-orange-100 text-orange-800',
      'red': 'bg-red-100 text-red-800',
      'indigo': 'bg-indigo-100 text-indigo-800'
    };
    return cores[cor || 'blue'] || 'bg-gray-100 text-gray-800';
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (error || !regua) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <BreadCrumb 
          items={[
            { label: 'Faturamento', path: '/faturamento/regua' },
            { label: 'Detalhes da Régua' }
          ]}
        />
        
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <button
            onClick={handleVoltar}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors mb-6"
          >
            ← Voltar
          </button>
          
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Régua não encontrada'}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        items={[
          { label: 'Faturamento', path: '/faturamento/regua' },
          { label: `Régua: ${regua.nome}` }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Detalhes da Régua de Faturamento
              </h1>
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getCorBadge(regua.cor)}`}>
                {getPeriodoLabel(regua.periodo)}
              </span>
              {regua.ehPadrao && (
                <span className="inline-flex px-3 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                  Padrão
                </span>
              )}
              <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getStatusColor(regua.ativo ? 'A' : 'I')}`}>
                {getStatusText(regua.ativo ? 'A' : 'I')}
              </span>
            </div>
            <p className="text-gray-600">
              ID: {regua.id} • Criado em: {formatarData(regua.criadoEm?.split('T')[0])}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleVoltar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              ← Voltar
            </button>
            
            <button
              onClick={handleEditarRegua}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              ✏️ Editar Régua
            </button>
          </div>
        </div>
        
        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Informações da Régua */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Informações da Régua */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h2 className="text-lg font-semibold text-gray-800">Informações da Régua</h2>
                </div>
                <button
                  onClick={handleEditarRegua}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors text-sm"
                >
                  ✏️ Editar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nome da Régua</label>
                  <p className="text-gray-800 font-medium">{regua.nome}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Período</label>
                  <p className="text-gray-800">{getPeriodoLabel(regua.periodo)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Dia de Emissão</label>
                  <p className="text-gray-800">{regua.diaEmissao}º dia do mês</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Sequência</label>
                  <p className="text-gray-800">{regua.sequencia}º período</p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-800">{regua.descricao || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* Card Tipos de Arquivo */}
            {regua.tiposArquivo && regua.tiposArquivo.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-purple-600 rounded"></div>
                  <h2 className="text-lg font-semibold text-gray-800">Tipos de Arquivo</h2>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                    {regua.tiposArquivo.length}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Arquivo</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {regua.tiposArquivo
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((tipo) => (
                          <tr key={tipo.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {tipo.ordem}º
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {getTipoArquivoLabel(tipo.tipo)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          {/* Coluna 2: Estatísticas e Informações Adicionais */}
          <div className="space-y-6">
            {/* Card Estatísticas */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Estatísticas</h2>
              </div>
              
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{associados.length}</div>
                  <div className="text-sm text-gray-600">Associados na Régua</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{regua.tiposArquivo?.length || 0}</div>
                  <div className="text-sm text-gray-600">Tipos de Arquivo</div>
                </div>
              </div>
            </div>
            
            {/* Card Informações Adicionais */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-orange-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Informações Adicionais</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ícone</label>
                  <p className="text-2xl">{regua.icone || '📅'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cor do Badge</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-3 py-1 text-sm rounded-full ${getCorBadge(regua.cor)}`}>
                      {regua.cor || 'blue'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Régua Padrão</label>
                  <p className="text-gray-800">{regua.ehPadrao ? '✅ Sim' : '❌ Não'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Data de Criação</label>
                  <p className="text-gray-800">{formatarData(regua.criadoEm?.split('T')[0])}</p>
                </div>
                
                {regua.criadoPor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Criado por</label>
                    <p className="text-gray-800">{regua.criadoPor}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Associados da Régua */}
        <div className="mt-6 border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-teal-600 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">Associados na Régua</h2>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {associados.length} associado(s)
              </span>
            </div>
            <button
              onClick={handleAdicionarAssociados}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              ➕ Adicionar Associados
            </button>
          </div>
          
          {associados.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 text-5xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum associado nesta régua</h3>
              <p className="text-gray-600 mb-6">
                Adicione associados para que eles sejam considerados no faturamento deste período.
              </p>
              <button
                onClick={handleAdicionarAssociados}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ➕ Adicionar Associados
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código SPC
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Associado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ/CPF
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Início
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {associados.map((assoc) => (
                    <tr key={assoc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
                        {assoc.associadoCodigoSpc || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{assoc.associadoNome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarCnpjCpf(assoc.associadoCnpjCpf) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatarData(assoc.dataInicio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          assoc.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {assoc.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerAssociado(assoc.associadoId)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Ver associado"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleRemoverAssociado(assoc.associadoId, assoc.associadoNome)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Remover da régua"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ReguaDetalhes;