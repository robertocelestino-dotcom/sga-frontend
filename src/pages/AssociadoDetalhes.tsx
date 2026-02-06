// src/pages/AssociadoDetalhes.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { associadoService, associadoOpcoes } from '../services/associadoService';
import { AssociadoDTO } from '../types/associado';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';

const AssociadoDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [associado, setAssociado] = useState<AssociadoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    carregarAssociado();
  }, [id]);
  
  const carregarAssociado = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await associadoService.buscarPorId(parseInt(id));
      setAssociado(data);
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
        abaAtiva: 'enderecos',
        subAbaEnderecos: tipoEndereco || 'COMERCIAL'
      } 
    });
  };
  
  const handleEditarTelefones = (tipoTelefone?: string) => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'telefones',
        subAbaTelefones: tipoTelefone || 'COMERCIAL'
      } 
    });
  };
  
  const handleEditarEmails = (tipoEmail?: string) => {
    navigate(`/associados/editar/${id}`, { 
      state: { 
        abaAtiva: 'emails',
        subAbaEmails: tipoEmail || 'COMERCIAL'
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
                      status === 'I' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
    
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
          links={[
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
        links={[
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
                
                {/* NOVO: Data de Filiação */}
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
                
                {/* Vendedores - ATUALIZADO */}
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
                    
                    {/* NOVO: Vendedor Externo */}
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
                
                {/* Plano e Categoria */}
                {associado.planoId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Plano</label>
                    <p className="text-gray-800">ID: {associado.planoId}</p>
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
      </div>
    </div>
  );
};

export default AssociadoDetalhes;