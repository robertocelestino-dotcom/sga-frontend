// src/pages/AssociadoDetalhes.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { associadoService, associadoOpcoes } from '../services/associadoService';
import { associadoProdutoService } from '../services/associadoProdutoService';
import { associadoDefFaturamentoService } from '../services/associadoDefFaturamentoService';
import { AssociadoDTO } from '../types/associado';
import { AssociadoProdutoResumo } from '../types/associadoProduto.types';
import { AssociadoDefFaturamentoResumo } from '../types/associadoDefFaturamento.types';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';

const AssociadoDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [associado, setAssociado] = useState<AssociadoDTO | null>(null);
  const [produtosHabilitados, setProdutosHabilitados] = useState<AssociadoProdutoResumo[]>([]);
  const [configuracoesFaturamento, setConfiguracoesFaturamento] = useState<AssociadoDefFaturamentoResumo[]>([]);
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
      
      // Carregar dados do associado
      const associadoData = await associadoService.buscarPorId(parseInt(id));
      setAssociado(associadoData);
      
      // Carregar produtos habilitados
      try {
        const produtosData = await associadoProdutoService.listarPorAssociado(parseInt(id));
        setProdutosHabilitados(produtosData);
      } catch (prodError) {
        console.log('Produtos habilitados não disponíveis:', prodError);
      }
      
      // Carregar configurações de faturamento
      try {
        const faturamentoData = await associadoDefFaturamentoService.listarPorAssociado(parseInt(id));
        setConfiguracoesFaturamento(faturamentoData);
      } catch (fatError) {
        console.log('Configurações de faturamento não disponíveis:', fatError);
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar associado');
      console.error('Erro ao carregar associado:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoltar = () => {
    navigate('/associados');
  };
  
  const handleEditarAssociado = () => {
    navigate(`/associados/editar/${id}`);
  };
  
  const handleEditarEndereco = (tipoEndereco?: string) => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'enderecos-contatos',
        subAbaEnderecos: tipoEndereco || 'COMERCIAL'
      } 
    });
  };
  
  const handleEditarTelefones = (tipoTelefone?: string) => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'enderecos-contatos',
        subAbaTelefones: tipoTelefone || 'COMERCIAL'
      } 
    });
  };
  
  const handleEditarEmails = (tipoEmail?: string) => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'enderecos-contatos',
        subAbaEmails: tipoEmail || 'COMERCIAL'
      } 
    });
  };
  
  const handleEditarFaturamento = () => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'parametro-faturamento'
      } 
    });
  };
  
  const handleEditarProdutos = () => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'produtos-habilitados'
      } 
    });
  };
  
  // Funções de formatação
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
  
  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  const formatarValor = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  const getStatusInfo = (status: string) => {
    const opcao = associadoOpcoes.status.find(s => s.value === status);
    if (!opcao) return { label: 'Desconhecido', color: 'bg-gray-100 text-gray-800' };
    
    const colorClass = status === 'A' ? 'bg-green-100 text-green-800' : 
                      status === 'I' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
    
    return { label: opcao.label, colorClass };
  };
  
  const getTipoPessoaInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoPessoa.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoEnderecoInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoEndereco.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoTelefoneInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoTelefone.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoEmailInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoEmail.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoContatoIcon = (tipo: string) => {
    switch (tipo) {
      case 'COMERCIAL': return '🏢';
      case 'CELULAR': return '📱';
      case 'RESIDENCIAL': return '🏠';
      case 'WHATSAPP': return '💬';
      case 'PESSOAL': return '👤';
      case 'FINANCEIRO': return '💰';
      case 'OUTRO': return '📧';
      case 'FAX': return '📠';
      default: return '📞';
    }
  };
  
  if (loading) {
    return <Loading />;
  }
  
  if (error || !associado) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <BreadCrumb 
          items={[
            { label: 'Associados', path: '/associados' },
            { label: 'Detalhes do Associado' }
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
            {error || 'Associado não encontrado'}
          </div>
        </div>
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(associado.status);
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        items={[
          { label: 'Associados', path: '/associados' },
          { label: `Associado: ${associado.nomeRazao}` }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Detalhes do Associado
              </h1>
              <span className={`px-3 py-1 text-sm rounded-full ${statusInfo.colorClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-600">
              ID: {associado.id} • Cadastrado em {formatarData(associado.dataCadastro)}
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
              onClick={handleEditarAssociado}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              ✏️ Editar Associado
            </button>
          </div>
        </div>
        
        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna 1: Informações Básicas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Informações Básicas */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  <h2 className="text-lg font-semibold text-gray-800">Informações Básicas</h2>
                </div>
                <button
                  onClick={handleEditarAssociado}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors text-sm"
                >
                  ✏️ Editar
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nome/Razão Social</label>
                  <p className="text-gray-800 font-medium">{associado.nomeRazao}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nome Fantasia</label>
                  <p className="text-gray-800">{associado.nomeFantasia || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">CNPJ/CPF</label>
                  <p className="text-gray-800">{formatarCnpjCpf(associado.cnpjCpf)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {getTipoPessoaInfo(associado.tipoPessoa)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Data de Cadastro</label>
                  <p className="text-gray-800">{formatarData(associado.dataCadastro)}</p>
                </div>
                
                {/* Data de Filiação */}
                {associado.dataFiliacao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Data de Filiação</label>
                    <p className="text-gray-800">{formatarData(associado.dataFiliacao)}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Código SPC</label>
                  <p className="text-gray-800">{associado.codigoSpc || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Código RM</label>
                  <p className="text-gray-800">{associado.codigoRm || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Faturamento Mínimo</label>
                  <p className="text-gray-800">{formatarValor(associado.faturamentoMinimo)}</p>
                </div>
                
                {/* Vendedores */}
                <div className="md:col-span-2 border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Vendedores Responsáveis</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vendedor Interno</label>
                      <p className="text-gray-800">
                        {associado.vendedorNome || '-'}
                        {associado.vendedorId && (
                          <span className="text-xs text-gray-500 ml-2">ID: {associado.vendedorId}</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Vendedor Externo */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vendedor Externo</label>
                      <p className="text-gray-800">
                        {associado.vendedorExternoNome || '-'}
                        {associado.vendedorExternoId && (
                          <span className="text-xs text-gray-500 ml-2">ID: {associado.vendedorExternoId}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Plano e Categoria - NOVO */}
                {(associado.planoId || associado.planoNome) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Plano</label>
                    <p className="text-gray-800 font-medium">
                      {associado.planoNome || `ID: ${associado.planoId}`}
                    </p>
                    {associado.planoValor && (
                      <p className="text-sm text-gray-600">
                        Valor: {formatarValor(associado.planoValor)}
                      </p>
                    )}
                  </div>
                )}
                
                {associado.categoriaId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Categoria</label>
                    <p className="text-gray-800">ID: {associado.categoriaId}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Card Endereços */}
            {associado.enderecos && associado.enderecos.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-green-600 rounded"></div>
                    <h2 className="text-lg font-semibold text-gray-800">Endereços</h2>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {associado.enderecos.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditarEndereco()}
                    className="px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1 transition-colors text-sm"
                  >
                    ✏️ Editar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {associado.enderecos.map((endereco, index) => (
                    <div key={endereco.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {endereco.tipoEndereco === 'COMERCIAL' && '🏢'}
                            {endereco.tipoEndereco === 'COBRANCA' && '💰'}
                            {endereco.tipoEndereco === 'ENTREGA' && '🚚'}
                            {endereco.tipoEndereco === 'RESIDENCIAL' && '🏠'}
                          </span>
                          <span className="font-medium text-gray-800">
                            {getTipoEnderecoInfo(endereco.tipoEndereco)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditarEndereco(endereco.tipoEndereco)}
                          className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-800">
                          {endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ''}
                          {endereco.complemento && (
                            <span className="text-gray-600"> - {endereco.complemento}</span>
                          )}
                        </p>
                        
                        <p className="text-gray-800">
                          {endereco.bairro}
                          {endereco.cidade && ` - ${endereco.cidade}`}
                          {endereco.estado && `/${endereco.estado}`}
                        </p>
                        
                        {endereco.cep && (
                          <p className="text-gray-600 text-sm">
                            CEP: {endereco.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Coluna 2: Contatos e Outras Informações */}
          <div className="space-y-6">
            {/* Card Telefones */}
            {associado.telefones && associado.telefones.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-600 rounded"></div>
                    <h2 className="text-lg font-semibold text-gray-800">Telefones</h2>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {associado.telefones.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditarTelefones()}
                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors text-sm"
                  >
                    ✏️ Editar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {associado.telefones.map((telefone, index) => (
                    <div key={telefone.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTipoContatoIcon(telefone.tipoTelefone)}</span>
                          <span className="font-medium text-gray-800">
                            {getTipoTelefoneInfo(telefone.tipoTelefone)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditarTelefones(telefone.tipoTelefone)}
                          className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                      
                      <p className="text-gray-800 text-lg font-medium mb-1">
                        ({telefone.ddd}) {telefone.numero}
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        {telefone.whatsapp && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            WhatsApp
                          </span>
                        )}
                        {telefone.ativo === false && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Card Emails */}
            {associado.emails && associado.emails.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-orange-600 rounded"></div>
                    <h2 className="text-lg font-semibold text-gray-800">Emails</h2>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                      {associado.emails.length}
                    </span>
                  </div>
                  <button
                    onClick={() => handleEditarEmails()}
                    className="px-3 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 flex items-center gap-1 transition-colors text-sm"
                  >
                    ✏️ Editar
                  </button>
                </div>
                
                <div className="space-y-4">
                  {associado.emails.map((email, index) => (
                    <div key={email.id || index} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTipoContatoIcon(email.tipoEmail)}</span>
                          <span className="font-medium text-gray-800">
                            {getTipoEmailInfo(email.tipoEmail)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleEditarEmails(email.tipoEmail)}
                          className="px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                      
                      <p className="text-gray-800 break-all">{email.email}</p>
                      
                      {email.ativo === false && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Inativo
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Configurações de Faturamento - NOVO */}
        {configuracoesFaturamento.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Configurações de Faturamento</h2>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  {configuracoesFaturamento.length}
                </span>
              </div>
              <button
                onClick={handleEditarFaturamento}
                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition-colors text-sm"
              >
                ✏️ Editar
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dia Emissão
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dia Vencimento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Definido
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configuracoesFaturamento.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {config.diaEmissao}º dia
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.diaVencimento}º dia
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.planoNome || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {config.valorDef ? formatarValor(config.valorDef) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {config.observacao || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Card Produtos Habilitados - NOVO */}
        {produtosHabilitados.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-teal-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Produtos Habilitados</h2>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  {produtosHabilitados.length}
                </span>
              </div>
              <button
                onClick={handleEditarProdutos}
                className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 flex items-center gap-1 transition-colors text-sm"
              >
                ✏️ Editar
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Efetivo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Envio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produtosHabilitados.map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produto.produtoCodigo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.produtoNome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {produto.tipoProduto || 'Geral'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.valorDefinido ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-blue-600">
                              {formatarValor(produto.valorEfetivo)}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                              customizado
                            </span>
                          </div>
                        ) : (
                          formatarValor(produto.valorEfetivo)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.tipoEnvioDescricao || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociadoDetalhes;