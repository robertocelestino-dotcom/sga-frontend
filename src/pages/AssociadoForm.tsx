import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  associadoService, 
  AssociadoDTO, 
  EnderecoDTO, 
  EmailDTO, 
  TelefoneDTO,
  VendedorResumoDTO,
  CategoriaResumoDTO,
  PlanoResumoDTO
} from '../services/associadoService';
import { useCEP } from '../hooks/useCEP';

// Tipos TypeScript baseados no serviço
interface Vendedor {
  id?: number;
  nomeRazao?: string;
}

interface Plano {
  id?: number;
  nome?: string;
}

interface Categoria {
  id?: number;
  descricao?: string;
}

interface Endereco {
  id?: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipoEndereco: 'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA';
  ativo?: boolean;
  principal?: boolean;
}

interface Email {
  id?: number;
  email: string;
  tipoEmail: 'PESSOAL' | 'COMERCIAL' | 'COBRANCA';
  ativo: boolean;
  principal?: boolean;
}

interface Telefone {
  id?: number;
  ddd: string;
  numero: string;
  tipoTelefone: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX';
  whatsapp: boolean;
  ativo: boolean;
  principal?: boolean;
}

interface ProdutoHabilitado {
  id: number;
  tipo: string;
  produto: string;
  valor: number;
}

interface ProdutoDisponivel {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  tipo: string;
  valor: number;
  ativo: boolean;
}

interface ParametroFaturamento {
  diaEmissao: number;
  diaVencimento: number;
  observacao: string;
}

interface AssociadoFormData {
  id?: number;
  vendedorId?: number;
  vendedorExternoId?: number;
  dataFiliacao?: string;
  dataInativacao?: string;
  dataInicioSuspensao?: string;
  dataFimSuspensao?: string;
  motivoInativacao?: string;
  motivoSuspensao?: string;
  planoId?: number;
  categoriaId?: number;
  codigoSpc?: string;
  codigoRm?: string;
  tipoPessoa: 'F' | 'J';
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  status: 'A' | 'I' | 'S';
  faturamentoMinimo?: number;
  dataCadastro?: string;
  enderecos: Endereco[];
  emails: Email[];
  telefones: Telefone[];
  parametroFaturamento?: ParametroFaturamento;
  produtosHabilitados?: ProdutoHabilitado[];
}

const AssociadoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Estado para abas ativas
  const [abaAtiva, setAbaAtiva] = useState('dados-cadastrais');
  const [subAbaEnderecos, setSubAbaEnderecos] = useState<'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA'>('RESIDENCIAL');
  const [subAbaTelefones, setSubAbaTelefones] = useState<'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX'>('CELULAR');
  const [subAbaEmails, setSubAbaEmails] = useState<'PESSOAL' | 'COMERCIAL' | 'COBRANCA'>('PESSOAL');
  
  // Estado para modal de produtos
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [produtosPesquisa, setProdutosPesquisa] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  
  // Dados dinâmicos da API
  const [vendedoresDisponiveis, setVendedoresDisponiveis] = useState<VendedorResumoDTO[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<PlanoResumoDTO[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<CategoriaResumoDTO[]>([]);
  
  // Hook para busca de CEP
  const { buscarCEP, buscando: buscandoCEP, erro: erroCEP } = useCEP();
  
  // Dados mockados para produtos habilitados
  const [produtosHabilitados, setProdutosHabilitados] = useState<ProdutoHabilitado[]>([
    { id: 1, tipo: 'Notificação', produto: 'NOTIFICAÇÃO SPC CARTA', valor: 4.55 },
    { id: 2, tipo: 'Notificação', produto: 'NOTIFICAÇÃO SPC SMS', valor: 1.79 },
    { id: 3, tipo: 'Notificação', produto: 'NOTIFICAÇÃO SPC E-MAIL', valor: 1.79 },
  ]);
  
  // Dados mockados para produtos disponíveis
  const [produtosDisponiveis] = useState<ProdutoDisponivel[]>([
    { id: 1, codigo: 'PROD001', nome: 'NOTIFICAÇÃO SPC CARTA', descricao: 'Notificação via correio', tipo: 'Notificação', valor: 4.55, ativo: true },
    { id: 2, codigo: 'PROD002', nome: 'NOTIFICAÇÃO SPC SMS', descricao: 'Notificação via SMS', tipo: 'Notificação', valor: 1.79, ativo: true },
    { id: 3, codigo: 'PROD003', nome: 'NOTIFICAÇÃO SPC E-MAIL', descricao: 'Notificação via e-mail', tipo: 'Notificação', valor: 1.79, ativo: true },
    { id: 4, codigo: 'PROD004', nome: 'CONSULTA SPC', descricao: 'Consulta cadastral', tipo: 'Consulta', valor: 2.50, ativo: true },
    { id: 5, codigo: 'PROD005', nome: 'RELATÓRIO GERENCIAL', descricao: 'Relatório mensal', tipo: 'Relatório', valor: 15.90, ativo: true },
    { id: 6, codigo: 'PROD006', nome: 'CERTIDÃO NEGATIVA', descricao: 'Certidão de débitos', tipo: 'Certidão', valor: 8.75, ativo: true },
  ]);
  
  // Dados para parâmetro de faturamento
  const [parametroFaturamento, setParametroFaturamento] = useState<ParametroFaturamento>({
    diaEmissao: 26,
    diaVencimento: 10,
    observacao: ''
  });
  
  const [formData, setFormData] = useState<AssociadoFormData>({
    tipoPessoa: 'F',
    cnpjCpf: '',
    nomeRazao: '',
    status: 'A',
    enderecos: [],
    emails: [],
    telefones: [],
    parametroFaturamento: parametroFaturamento,
    produtosHabilitados: produtosHabilitados
  });

  // Função para exibir mensagens
  const showMessage = (texto: string, tipo: 'success' | 'error') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 5000);
  };

  // Obter cor baseada no status
  const getStatusColor = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'S': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'I': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obter texto do status
  const getStatusText = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'Ativo';
      case 'S': return 'Suspenso';
      case 'I': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  // Componente de Loading
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Carregando...</p>
      </div>
    </div>
  );

  // Componente de BreadCrumb simplificado
  const BreadCrumb = () => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <button
            onClick={() => navigate('/associados')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
            </svg>
            Associados
          </button>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <svg className="w-3 h-3 mx-1 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              {isEditMode ? 'Editar Associado' : 'Novo Associado'}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );

  // Componente de Modal para Seleção de Produtos
  const ModalProdutos = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Adicionar Produtos</h3>
              <p className="text-sm text-gray-600 mt-1">Selecione os produtos para habilitar para este associado</p>
            </div>
            <button
              onClick={() => setModalProdutosAberto(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <input
              type="text"
              value={produtosPesquisa}
              onChange={(e) => setProdutosPesquisa(e.target.value)}
              placeholder="Pesquisar produtos por nome, código ou tipo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Lista de produtos disponíveis */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selecionar
                  </th>
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
                    Valor R$
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosDisponiveis
                  .filter(produto => 
                    produto.nome.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.codigo.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.tipo.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.descricao.toLowerCase().includes(produtosPesquisa.toLowerCase())
                  )
                  .map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={produtosSelecionados.includes(produto.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProdutosSelecionados([...produtosSelecionados, produto.id]);
                            } else {
                              setProdutosSelecionados(produtosSelecionados.filter(id => id !== produto.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-gray-500">{produto.descricao}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {produto.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Contador e ações */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {produtosSelecionados.length} produto(s) selecionado(s)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setModalProdutosAberto(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarProdutosSelecionados}
                disabled={produtosSelecionados.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar Produtos Selecionados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Carregar dados iniciais e combos
  useEffect(() => {
    const carregarCombos = async () => {
      try {
        // Carregar vendedores
        const vendedores = await associadoService.listarVendedores();
        setVendedoresDisponiveis(vendedores);
        
        // Carregar categorias
        const categorias = await associadoService.listarCategorias();
        setCategoriasDisponiveis(categorias);
        
        // Carregar planos
        const planos = await associadoService.listarPlanosParaCombo();
        setPlanosDisponiveis(planos);
      } catch (error) {
        console.error('Erro ao carregar combos:', error);
        showMessage('Erro ao carregar dados do sistema', 'error');
      }
    };

    carregarCombos();
  }, []);

  // Carregar dados do associado para edição
  useEffect(() => {
    const carregarAssociado = async () => {
      if (!isEditMode || !id) return;
      
      setLoading(true);
      try {
        const associadoDTO = await associadoService.buscarPorId(parseInt(id));
        
        // Converter DTO para formato do formulário
        const formDataConvertido: AssociadoFormData = {
          id: associadoDTO.id,
          tipoPessoa: associadoDTO.tipoPessoa,
          cnpjCpf: associadoDTO.cnpjCpf,
          nomeRazao: associadoDTO.nomeRazao,
          nomeFantasia: associadoDTO.nomeFantasia,
          status: associadoDTO.status,
          codigoSpc: associadoDTO.codigoSpc,
          codigoRm: associadoDTO.codigoRm,
          faturamentoMinimo: associadoDTO.faturamentoMinimo,
          dataFiliacao: associadoDTO.dataFiliacao,
          dataCadastro: associadoDTO.dataCadastro,
          vendedorId: associadoDTO.vendedorId,
          vendedorExternoId: associadoDTO.vendedorExternoId,
          planoId: associadoDTO.planoId,
          categoriaId: associadoDTO.categoriaId,
          dataInativacao: associadoDTO.dataInativacao,
          dataInicioSuspensao: associadoDTO.dataInicioSuspensao,
          dataFimSuspensao: associadoDTO.dataFimSuspensao,
          motivoInativacao: associadoDTO.motivoInativacao,
          motivoSuspensao: associadoDTO.motivoSuspensao,
          parametroFaturamento: parametroFaturamento,
          produtosHabilitados: produtosHabilitados,
          
          // Converter arrays
          enderecos: associadoDTO.enderecos?.map((endereco: EnderecoDTO, index: number) => ({
            id: endereco.id,
            cep: endereco.cep,
            logradouro: endereco.logradouro,
            numero: endereco.numero,
            complemento: endereco.complemento,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            tipoEndereco: (endereco.tipoEndereco as any) || 'RESIDENCIAL',
            ativo: true,
            principal: index === 0,
          })) || [],
          
          telefones: associadoDTO.telefones?.map((telefone: TelefoneDTO, index: number) => ({
            id: telefone.id,
            ddd: telefone.ddd,
            numero: telefone.numero,
            tipoTelefone: (telefone.tipoTelefone as any) || 'CELULAR',
            whatsapp: telefone.whatsapp,
            ativo: telefone.ativo,
            principal: index === 0,
          })) || [],
          
          emails: associadoDTO.emails?.map((email: EmailDTO, index: number) => ({
            id: email.id,
            email: email.email,
            tipoEmail: (email.tipoEmail as any) || 'PESSOAL',
            ativo: email.ativo,
            principal: index === 0,
          })) || [],
        };
        
        setFormData(formDataConvertido);
      } catch (error) {
        console.error('Erro ao carregar associado:', error);
        showMessage('Associado não encontrado', 'error');
        navigate('/associados');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      carregarAssociado();
    } else {
      // Para novo associado, adicionar campos padrão
      setFormData(prev => ({
        ...prev,
        enderecos: [],
        telefones: [],
        emails: [],
        parametroFaturamento: parametroFaturamento,
        produtosHabilitados: produtosHabilitados
      }));
    }
  }, [id, isEditMode, navigate]);

  // Buscar CEP usando o hook
  const handleBuscarCEP = async (index: number) => {
    const cep = formData.enderecos[index]?.cep?.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
      showMessage('CEP inválido', 'error');
      return;
    }

    try {
      const enderecoEncontrado = await buscarCEP(cep);
      
      if (!enderecoEncontrado) {
        showMessage(erroCEP || 'CEP não encontrado', 'error');
        return;
      }

      const novosEnderecos = [...formData.enderecos];
      novosEnderecos[index] = {
        ...novosEnderecos[index],
        logradouro: enderecoEncontrado.logradouro || '',
        bairro: enderecoEncontrado.bairro || '',
        cidade: enderecoEncontrado.localidade || '',
        estado: enderecoEncontrado.uf || '',
        cep: enderecoEncontrado.cep || cep,
      };
      
      setFormData(prev => ({
        ...prev,
        enderecos: novosEnderecos
      }));
      
      showMessage('CEP encontrado com sucesso!', 'success');
    } catch (error) {
      showMessage('Erro ao buscar CEP', 'error');
    }
  };

  // Replicar dados do endereço principal para outros endereços
  const handleReplicarEnderecoPrincipal = () => {
    const enderecoPrincipal = formData.enderecos.find(e => e.principal && e.tipoEndereco === subAbaEnderecos);
    if (!enderecoPrincipal) {
      showMessage('Nenhum endereço principal definido para este tipo', 'error');
      return;
    }

    const novosEnderecos = formData.enderecos.map((endereco, index) => {
      if (endereco.principal || endereco.tipoEndereco !== subAbaEnderecos) return endereco;
      
      return {
        ...endereco,
        cep: enderecoPrincipal.cep,
        logradouro: enderecoPrincipal.logradouro,
        numero: enderecoPrincipal.numero,
        bairro: enderecoPrincipal.bairro,
        cidade: enderecoPrincipal.cidade,
        estado: enderecoPrincipal.estado,
      };
    });
    
    setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
    showMessage(`Dados do endereço principal ${subAbaEnderecos.toLowerCase()} replicados com sucesso!`, 'success');
  };

  // Replicar dados do telefone principal para outros telefones
  const handleReplicarTelefonePrincipal = () => {
    const telefonePrincipal = formData.telefones.find(t => t.principal && t.tipoTelefone === subAbaTelefones);
    if (!telefonePrincipal) {
      showMessage('Nenhum telefone principal definido para este tipo', 'error');
      return;
    }

    const novosTelefones = formData.telefones.map((telefone, index) => {
      if (telefone.principal || telefone.tipoTelefone !== subAbaTelefones) return telefone;
      
      return {
        ...telefone,
        ddd: telefonePrincipal.ddd,
        numero: telefonePrincipal.numero,
        tipoTelefone: telefonePrincipal.tipoTelefone,
        whatsapp: telefonePrincipal.whatsapp,
      };
    });
    
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
    showMessage(`Dados do telefone principal ${subAbaTelefones.toLowerCase()} replicados com sucesso!`, 'success');
  };

  // Replicar dados do email principal para outros emails
  const handleReplicarEmailPrincipal = () => {
    const emailPrincipal = formData.emails.find(e => e.principal && e.tipoEmail === subAbaEmails);
    if (!emailPrincipal) {
      showMessage('Nenhum email principal definido para este tipo', 'error');
      return;
    }

    const novosEmails = formData.emails.map((email, index) => {
      if (email.principal || email.tipoEmail !== subAbaEmails) return email;
      
      return {
        ...email,
        email: emailPrincipal.email,
        tipoEmail: emailPrincipal.tipoEmail,
      };
    });
    
    setFormData(prev => ({ ...prev, emails: novosEmails }));
    showMessage(`Dados do email principal ${subAbaEmails.toLowerCase()} replicados com sucesso!`, 'success');
  };

  // Handler para produtos habilitados
  const handleEditarProduto = (id: number) => {
    showMessage(`Editar produto ${id} - Funcionalidade em desenvolvimento`, 'info');
  };

  const handleExcluirProduto = (id: number) => {
    setProdutosHabilitados(prev => prev.filter(produto => produto.id !== id));
    showMessage('Produto removido com sucesso!', 'success');
  };

  // Handler para adicionar produtos selecionados
  const handleAdicionarProdutosSelecionados = () => {
    const novosProdutos = produtosDisponiveis
      .filter(produto => produtosSelecionados.includes(produto.id))
      .map(produto => ({
        id: produto.id,
        tipo: produto.tipo,
        produto: produto.nome,
        valor: produto.valor
      }));
    
    // Evitar duplicatas
    const produtosExistentesIds = produtosHabilitados.map(p => p.id);
    const produtosNovos = novosProdutos.filter(p => !produtosExistentesIds.includes(p.id));
    
    if (produtosNovos.length > 0) {
      setProdutosHabilitados([...produtosHabilitados, ...produtosNovos]);
      showMessage(`${produtosNovos.length} produto(s) adicionado(s) com sucesso!`, 'success');
      setProdutosSelecionados([]);
      setModalProdutosAberto(false);
    } else {
      showMessage('Nenhum produto novo para adicionar', 'info');
    }
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.cnpjCpf.trim()) {
      novosErros.cnpjCpf = 'CPF/CNPJ é obrigatório';
    }

    if (!formData.nomeRazao.trim()) {
      novosErros.nomeRazao = 'Nome/Razão Social é obrigatório';
    }

    if (formData.tipoPessoa === 'J' && !formData.nomeFantasia?.trim()) {
      novosErros.nomeFantasia = 'Nome Fantasia é obrigatório para PJ';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let valorFinal: any = value;
    
    if (type === 'number') {
      valorFinal = value === '' ? undefined : parseFloat(value);
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      valorFinal = target.checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: valorFinal
    }));

    // Limpar erro do campo quando editado
    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleChangeNested = (
    section: 'enderecos' | 'telefones' | 'emails',
    index: number,
    field: string,
    value: any
  ) => {
    setFormData(prev => {
      const updated = [...prev[section]];
      
      // Se mudando o campo principal, garantir que apenas um seja principal para cada tipo
      if (field === 'principal' && value === true) {
        updated.forEach((item, i) => {
          if (i !== index && 
              ((section === 'enderecos' && item.tipoEndereco === updated[index].tipoEndereco) ||
               (section === 'telefones' && item.tipoTelefone === updated[index].tipoTelefone) ||
               (section === 'emails' && item.tipoEmail === updated[index].tipoEmail))) {
            item.principal = false;
          }
        });
      }
      
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [section]: updated };
    });

    // Limpar erro específico
    const erroKey = `${section.slice(0, -1)}_${index}_${field}`;
    if (erros[erroKey]) {
      setErros(prev => ({ ...prev, [erroKey]: '' }));
    }
  };

  // Handler para parâmetro de faturamento
  const handleParametroFaturamentoChange = (
    field: keyof ParametroFaturamento,
    value: string | number
  ) => {
    setParametroFaturamento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler para mudança de status
  const handleStatusChange = (novoStatus: 'A' | 'I' | 'S') => {
    setFormData(prev => {
      const updated = { ...prev, status: novoStatus };
      
      // Limpar campos baseados no novo status
      if (novoStatus === 'A') {
        updated.dataInativacao = undefined;
        updated.motivoInativacao = undefined;
        updated.dataInicioSuspensao = undefined;
        updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'I') {
        updated.dataInativacao = new Date().toISOString().split('T')[0];
        updated.dataInicioSuspensao = undefined;
        updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'S') {
        updated.dataInicioSuspensao = new Date().toISOString().split('T')[0];
        const dataFim = new Date();
        dataFim.setMonth(dataFim.getMonth() + 1);
        updated.dataFimSuspensao = dataFim.toISOString().split('T')[0];
        updated.dataInativacao = undefined;
        updated.motivoInativacao = undefined;
      }
      
      return updated;
    });
  };

  // Função para converter formData para DTO
  const converterParaDTO = (data: AssociadoFormData): AssociadoDTO => {
    return {
      id: data.id,
      tipoPessoa: data.tipoPessoa,
      cnpjCpf: data.cnpjCpf,
      nomeRazao: data.nomeRazao,
      nomeFantasia: data.nomeFantasia,
      status: data.status,
      codigoSpc: data.codigoSpc,
      codigoRm: data.codigoRm,
      faturamentoMinimo: data.faturamentoMinimo,
      dataFiliacao: data.dataFiliacao,
      dataCadastro: data.dataCadastro,
      vendedorId: data.vendedorId,
      vendedorExternoId: data.vendedorExternoId,
      planoId: data.planoId,
      categoriaId: data.categoriaId,
      dataInativacao: data.dataInativacao,
      dataInicioSuspensao: data.dataInicioSuspensao,
      dataFimSuspensao: data.dataFimSuspensao,
      motivoInativacao: data.motivoInativacao,
      motivoSuspensao: data.motivoSuspensao,
      
      // Converter arrays mantendo a estrutura do DTO
      enderecos: data.enderecos.map(endereco => ({
        id: endereco.id,
        cep: endereco.cep,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        tipoEndereco: endereco.tipoEndereco,
      })),
      
      telefones: data.telefones.map(telefone => ({
        id: telefone.id,
        ddd: telefone.ddd,
        numero: telefone.numero,
        tipoTelefone: telefone.tipoTelefone,
        whatsapp: telefone.whatsapp,
        ativo: telefone.ativo,
      })),
      
      emails: data.emails.map(email => ({
        id: email.id,
        email: email.email,
        tipoEmail: email.tipoEmail,
        ativo: email.ativo,
      })),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showMessage('Por favor, corrija os erros antes de salvar.', 'error');
      return;
    }

    setSalvando(true);
    
    try {
      const dto = converterParaDTO(formData);
      
      if (isEditMode && formData.id) {
        // Atualizar
        await associadoService.atualizar(formData.id, dto);
        showMessage('Associado atualizado com sucesso!', 'success');
      } else {
        // Criar novo
        await associadoService.criar(dto);
        showMessage('Associado criado com sucesso!', 'success');
      }
      
      // Navegar de volta após 2 segundos
      setTimeout(() => {
        navigate('/associados');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao salvar associado:', error);
      
      // Tratar erro específico da API
      const mensagemErro = error.response?.data?.message || 'Erro ao salvar associado. Tente novamente.';
      showMessage(mensagemErro, 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/associados');
  };

  // Componente de abas principais
  const Abas = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex flex-wrap space-x-1">
        <button
          type="button"
          onClick={() => setAbaAtiva('dados-cadastrais')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'dados-cadastrais'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Dados Cadastrais
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('relacionamento')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'relacionamento'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          👥 Relacionamento
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('enderecos-contatos')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'enderecos-contatos'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📍 Endereços e Contatos
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('parametro-faturamento')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'parametro-faturamento'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          💰 Parâmetro Faturamento
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('produtos-habilitados')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'produtos-habilitados'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📦 Produtos Habilitados
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Endereços
  const SubAbasEnderecos = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('RESIDENCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'RESIDENCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠 Residencial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('COBRANCA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'COBRANCA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Cobrança
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('ENTREGA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'ENTREGA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚚 Entrega
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Telefones
  const SubAbasTelefones = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaTelefones('CELULAR')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'CELULAR'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📱 Celular
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('RESIDENCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'RESIDENCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠 Residencial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('FAX')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'FAX'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📠 Fax
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Emails
  const SubAbasEmails = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaEmails('PESSOAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'PESSOAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 Pessoal
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEmails('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEmails('COBRANCA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'COBRANCA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Cobrança
        </button>
      </nav>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (modalProdutosAberto) return <ModalProdutos />;

  // Renderizar conteúdo baseado na aba ativa
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'dados-cadastrais':
        return renderDadosCadastrais();
      case 'relacionamento':
        return renderRelacionamento();
      case 'enderecos-contatos':
        return renderEnderecosContatos();
      case 'parametro-faturamento':
        return renderParametroFaturamento();
      case 'produtos-habilitados':
        return renderProdutosHabilitados();
      default:
        return renderDadosCadastrais();
    }
  };

  const renderDadosCadastrais = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Dados Cadastrais</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo Pessoa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Pessoa * <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoPessoa"
            value={formData.tipoPessoa}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="F">Pessoa Física</option>
            <option value="J">Pessoa Jurídica</option>
          </select>
        </div>

        {/* CPF/CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} * <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="cnpjCpf"
            value={formData.cnpjCpf}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              erros.cnpjCpf ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.tipoPessoa === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
          />
          {erros.cnpjCpf && (
            <p className="mt-1 text-sm text-red-600">{erros.cnpjCpf}</p>
          )}
        </div>

        {/* Nome/Razão Social */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipoPessoa === 'F' ? 'Nome Completo' : 'Razão Social'} * <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nomeRazao"
            value={formData.nomeRazao}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              erros.nomeRazao ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.tipoPessoa === 'F' ? 'João da Silva' : 'Empresa LTDA'}
          />
          {erros.nomeRazao && (
            <p className="mt-1 text-sm text-red-600">{erros.nomeRazao}</p>
          )}
        </div>

        {/* Nome Fantasia (só para PJ) */}
        {formData.tipoPessoa === 'J' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Fantasia *
            </label>
            <input
              type="text"
              name="nomeFantasia"
              value={formData.nomeFantasia || ''}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                erros.nomeFantasia ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome comercial da empresa"
            />
            {erros.nomeFantasia && (
              <p className="mt-1 text-sm text-red-600">{erros.nomeFantasia}</p>
            )}
          </div>
        )}

        {/* Data Filiação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Filiação
          </label>
          <input
            type="date"
            name="dataFiliacao"
            value={formData.dataFiliacao || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center gap-3">
            <select
              name="status"
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value as 'A' | 'I' | 'S')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="A">Ativo</option>
              <option value="I">Inativo</option>
              <option value="S">Suspenso</option>
            </select>
            
            {/* Badge colorido do status */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.status)}`}>
              {getStatusText(formData.status)}
            </span>
          </div>
        </div>

        {/* Código SPC */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código SPC
          </label>
          <input
            type="text"
            name="codigoSpc"
            value={formData.codigoSpc || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Código no sistema SPC"
          />
        </div>

        {/* Código RM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código RM
          </label>
          <input
            type="text"
            name="codigoRm"
            value={formData.codigoRm || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Código no sistema RM"
          />
        </div>

        {/* Faturamento Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Faturamento Mínimo (R$)
          </label>
          <input
            type="number"
            name="faturamentoMinimo"
            value={formData.faturamentoMinimo || ''}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Seção de Status Específico */}
      {(formData.status === 'I' || formData.status === 'S') && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-orange-600 rounded"></div>
            <h3 className="text-md font-semibold text-gray-800">
              {formData.status === 'I' ? 'Inativação' : 'Suspensão'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data de Inativação/Suspensão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Data de Inativação' : 'Data de Início da Suspensão'} *
              </label>
              <input
                type="date"
                name={formData.status === 'I' ? 'dataInativacao' : 'dataInicioSuspensao'}
                value={formData.status === 'I' ? (formData.dataInativacao || '') : (formData.dataInicioSuspensao || '')}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Data Fim Suspensão (apenas para suspenso) */}
            {formData.status === 'S' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim da Suspensão *
                </label>
                <input
                  type="date"
                  name="dataFimSuspensao"
                  value={formData.dataFimSuspensao || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            {/* Motivo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Motivo da Inativação' : 'Motivo da Suspensão'} *
              </label>
              <textarea
                name={formData.status === 'I' ? 'motivoInativacao' : 'motivoSuspensao'}
                value={formData.status === 'I' ? (formData.motivoInativacao || '') : (formData.motivoSuspensao || '')}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={formData.status === 'I' ? 'Descreva o motivo da inativação...' : 'Descreva o motivo da suspensão...'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRelacionamento = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-purple-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Relacionamento</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor
          </label>
          <select
            name="vendedorId"
            value={formData.vendedorId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione um vendedor...</option>
            {vendedoresDisponiveis.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nomeRazao}
              </option>
            ))}
          </select>
        </div>

        {/* Vendedor Externo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor Externo
          </label>
          <select
            name="vendedorExternoId"
            value={formData.vendedorExternoId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione um vendedor externo...</option>
            {vendedoresDisponiveis.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nomeRazao}
              </option>
            ))}
          </select>
        </div>

        {/* Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plano
          </label>
          <select
            name="planoId"
            value={formData.planoId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione um plano...</option>
            {planosDisponiveis.map(plano => (
              <option key={plano.id} value={plano.id}>
                {plano.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            name="categoriaId"
            value={formData.categoriaId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione uma categoria...</option>
            {categoriasDisponiveis.map(categoria => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.descricao}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderEnderecosContatos = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-green-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Endereços e Contatos</h2>
      </div>
      
      <div className="space-y-8">
        {/* Endereços */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">Endereços</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarEnderecoPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Principal
            </button>
          </div>
          <SubAbasEnderecos />
          {renderEnderecos()}
        </div>

        {/* Telefones */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-yellow-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">Telefones</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarTelefonePrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Principal
            </button>
          </div>
          <SubAbasTelefones />
          {renderTelefones()}
        </div>

        {/* Emails */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">E-mails</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarEmailPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Principal
            </button>
          </div>
          <SubAbasEmails />
          {renderEmails()}
        </div>
      </div>
    </div>
  );

  const renderParametroFaturamento = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-indigo-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Parâmetro Faturamento</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dia de Emissão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dia de Emissão
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={parametroFaturamento.diaEmissao}
              onChange={(e) => handleParametroFaturamentoChange('diaEmissao', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="1"
              max="31"
              step="1"
            />
            <span className="text-sm text-gray-500">(Dia do mês)</span>
          </div>
        </div>

        {/* Dia de Vencimento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dia de Vencimento
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={parametroFaturamento.diaVencimento}
              onChange={(e) => handleParametroFaturamentoChange('diaVencimento', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              min="1"
              max="31"
              step="1"
            />
            <span className="text-sm text-gray-500">(Dia do mês)</span>
          </div>
        </div>

        {/* Observação */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observação
          </label>
          <textarea
            value={parametroFaturamento.observacao}
            onChange={(e) => handleParametroFaturamentoChange('observacao', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Observações sobre faturamento..."
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Nota:</span> Estes parâmetros são específicos para este associado. 
          As alterações serão aplicadas apenas às faturas deste associado.
        </p>
      </div>
    </div>
  );

  const renderProdutosHabilitados = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-teal-600 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">Produtos Habilitados</h2>
        </div>
        
        <button
          type="button"
          onClick={() => setModalProdutosAberto(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <span>➕</span>
          Adicionar Produto
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor R$
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {produtosHabilitados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Nenhum produto habilitado. Clique em "Adicionar Produto" para selecionar produtos.
                </td>
              </tr>
            ) : (
              produtosHabilitados.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {produto.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produto.produto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditarProduto(produto.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirProduto(produto.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Nota:</span> Estes são os produtos habilitados para este associado. 
          Clique em "Adicionar Produto" para pesquisar e adicionar novos produtos disponíveis no sistema.
        </p>
      </div>
    </div>
  );

  const renderEnderecos = () => {
    const enderecosDoTipo = formData.enderecos.filter(e => e.tipoEndereco === subAbaEnderecos);
    
    return (
      <div>
        {enderecosDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum endereço {subAbaEnderecos.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newEndereco: Endereco = {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  bairro: '',
                  cidade: '',
                  estado: '',
                  tipoEndereco: subAbaEnderecos,
                  ativo: true,
                  principal: enderecosDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  enderecos: [...prev.enderecos, newEndereco]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar Endereço {subAbaEnderecos}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enderecosDoTipo.map((endereco, indexOriginal) => {
              const indexGlobal = formData.enderecos.findIndex(e => 
                e.id === endereco.id || 
                (e.cep === endereco.cep && e.logradouro === endereco.logradouro && e.numero === endereco.numero)
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        Endereço {subAbaEnderecos} {endereco.principal && '(Principal)'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {enderecosDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosEnderecos = formData.enderecos.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={endereco.cep}
                          onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'cep', e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            erros[`endereco_${indexGlobal}_cep`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="00000-000"
                        />
                        <button
                          type="button"
                          onClick={() => handleBuscarCEP(indexGlobal)}
                          disabled={buscandoCEP}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buscandoCEP ? 'Buscando...' : 'Buscar CEP'}
                        </button>
                      </div>
                      {erros[`endereco_${indexGlobal}_cep`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_cep`]}</p>
                      )}
                    </div>

                    {/* Logradouro */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro *
                      </label>
                      <input
                        type="text"
                        value={endereco.logradouro}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'logradouro', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_logradouro`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_logradouro`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_logradouro`]}</p>
                      )}
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={endereco.numero}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'numero', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_numero`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_numero`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_numero`]}</p>
                      )}
                    </div>

                    {/* Complemento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={endereco.complemento || ''}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'complemento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={endereco.bairro}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'bairro', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_bairro`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_bairro`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_bairro`]}</p>
                      )}
                    </div>

                    {/* Cidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={endereco.cidade}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'cidade', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_cidade`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_cidade`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_cidade`]}</p>
                      )}
                    </div>

                    {/* UF */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF *
                      </label>
                      <input
                        type="text"
                        value={endereco.estado}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'estado', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_estado`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={2}
                        placeholder="SP"
                      />
                      {erros[`endereco_${indexGlobal}_estado`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_estado`]}</p>
                      )}
                    </div>

                    {/* Principal */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={endereco.principal}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'principal', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Principal
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newEndereco: Endereco = {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  bairro: '',
                  cidade: '',
                  estado: '',
                  tipoEndereco: subAbaEnderecos,
                  ativo: true,
                  principal: enderecosDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  enderecos: [...prev.enderecos, newEndereco]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro endereço {subAbaEnderecos}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTelefones = () => {
    const telefonesDoTipo = formData.telefones.filter(t => t.tipoTelefone === subAbaTelefones);
    
    return (
      <div>
        {telefonesDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum telefone {subAbaTelefones.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newTelefone: Telefone = {
                  ddd: '',
                  numero: '',
                  tipoTelefone: subAbaTelefones,
                  whatsapp: subAbaTelefones === 'CELULAR',
                  ativo: true,
                  principal: telefonesDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  telefones: [...prev.telefones, newTelefone]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar Telefone {subAbaTelefones}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {telefonesDoTipo.map((telefone, indexOriginal) => {
              const indexGlobal = formData.telefones.findIndex(t => 
                t.id === telefone.id || 
                (t.ddd === telefone.ddd && t.numero === telefone.numero)
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        Telefone {subAbaTelefones} {telefone.principal && '(Principal)'}
                        {telefone.whatsapp && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            WhatsApp
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {telefonesDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosTelefones = formData.telefones.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, telefones: novosTelefones }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* DDD */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DDD *
                      </label>
                      <input
                        type="text"
                        value={telefone.ddd}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'ddd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        maxLength={2}
                        placeholder="11"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={telefone.numero}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="99999-9999"
                      />
                    </div>

                    {/* Principal */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={telefone.principal}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'principal', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Principal
                      </label>
                    </div>

                    {/* WhatsApp (só para celular) */}
                    {subAbaTelefones === 'CELULAR' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={telefone.whatsapp}
                          onChange={(e) => handleChangeNested('telefones', indexGlobal, 'whatsapp', e.target.checked)}
                          className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <label className="text-sm text-gray-700">
                          WhatsApp
                        </label>
                      </div>
                    )}

                    {/* Ativo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={telefone.ativo}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'ativo', e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-700">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newTelefone: Telefone = {
                  ddd: '',
                  numero: '',
                  tipoTelefone: subAbaTelefones,
                  whatsapp: subAbaTelefones === 'CELULAR',
                  ativo: true,
                  principal: telefonesDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  telefones: [...prev.telefones, newTelefone]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro telefone {subAbaTelefones}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderEmails = () => {
    const emailsDoTipo = formData.emails.filter(e => e.tipoEmail === subAbaEmails);
    
    return (
      <div>
        {emailsDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum e-mail {subAbaEmails.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newEmail: Email = {
                  email: '',
                  tipoEmail: subAbaEmails,
                  ativo: true,
                  principal: emailsDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  emails: [...prev.emails, newEmail]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar E-mail {subAbaEmails}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {emailsDoTipo.map((email, indexOriginal) => {
              const indexGlobal = formData.emails.findIndex(e => 
                e.id === email.id || 
                e.email === email.email
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        E-mail {subAbaEmails} {email.principal && '(Principal)'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {emailsDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosEmails = formData.emails.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, emails: novosEmails }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={email.email}
                        onChange={(e) => handleChangeNested('emails', indexGlobal, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="exemplo@email.com"
                      />
                    </div>

                    {/* Principal */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={email.principal}
                        onChange={(e) => handleChangeNested('emails', indexGlobal, 'principal', e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Principal
                      </label>
                    </div>

                    {/* Ativo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={email.ativo}
                        onChange={(e) => handleChangeNested('emails', indexGlobal, 'ativo', e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-700">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newEmail: Email = {
                  email: '',
                  tipoEmail: subAbaEmails,
                  ativo: true,
                  principal: emailsDoTipo.length === 0,
                };
                
                setFormData(prev => ({
                  ...prev,
                  emails: [...prev.emails, newEmail]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro e-mail {subAbaEmails}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb />
      
      {/* Mensagem de alerta */}
      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg ${mensagem.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center">
            <span className="mr-2">{mensagem.tipo === 'success' ? '✅' : '❌'}</span>
            <span>{mensagem.texto}</span>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Editar Associado' : 'Novo Associado'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? 'Atualize as informações do associado' 
                : 'Preencha os dados para cadastrar um novo associado'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancelar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span>✕</span>
              Cancelar
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <span>💾</span>
              {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sistema de Abas */}
          <Abas />
          
          {/* Conteúdo da aba ativa */}
          {renderConteudoAba()}

          {/* Botões de ação */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancelar}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span>✕</span>
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <span>💾</span>
              {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssociadoForm;