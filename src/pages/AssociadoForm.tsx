// src/pages/AssociadoForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  associadoService,
  AssociadoDTO,
  associadoOpcoes,
  VendedorResumoDTO,
  CategoriaResumoDTO,
  PlanoResumoDTO
} from '../services/associadoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

const AssociadoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<AssociadoDTO>({
    id: 0,
    codigoSpc: '',
    codigoRm: '',
    cnpjCpf: '',
    nomeRazao: '',
    nomeFantasia: '',
    tipoPessoa: 'J',
    status: 'A',
    dataCadastro: new Date().toISOString(),
    enderecos: [],
    emails: [],
    telefones: [],
    definicoesNotificacao: [],
    definicoesFaturamento: []
  });

  // Dados para selects com tipos corretos
  const [vendedores, setVendedores] = useState<VendedorResumoDTO[]>([]);
  const [planos, setPlanos] = useState<PlanoResumoDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaResumoDTO[]>([]);

  // Carregar TODOS os dados em paralelo
  useEffect(() => {
    const carregarTodosDados = async () => {
      setLoading(true);
      
      try {
        // Carrega tudo em paralelo (muito mais rápido!)
        const [associadoData, vendedoresData, categoriasData, planosData] = await Promise.all([
          isEditMode ? associadoService.buscarPorId(parseInt(id!)) : Promise.resolve(null),
          associadoService.listarVendedores(),
          associadoService.listarCategorias(),
          associadoService.listarPlanos()
        ]);
        
        // Atualiza os estados
        if (associadoData) {
          setFormData(associadoData);
        }
        
        setVendedores(vendedoresData || []);
        setCategorias(categoriasData || []);
        setPlanos(planosData || []);
        
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        
        if (isEditMode) {
          showToast('Erro ao carregar dados do associado', 'error');
          navigate('/associados');
        } else {
          // Para novo cadastro, não redireciona, apenas mostra aviso
          if (error.response?.status !== 404) {
            showToast('Erro ao carregar dados para cadastro', 'warning');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    carregarTodosDados();
  }, [id, isEditMode, navigate, showToast]);

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.cnpjCpf.trim()) {
      novosErros.cnpjCpf = 'CNPJ/CPF é obrigatório';
    } else if (formData.tipoPessoa === 'F' && formData.cnpjCpf.length !== 11) {
      novosErros.cnpjCpf = 'CPF deve ter 11 dígitos';
    } else if (formData.tipoPessoa === 'J' && formData.cnpjCpf.length !== 14) {
      novosErros.cnpjCpf = 'CNPJ deve ter 14 dígitos';
    }

    if (!formData.nomeRazao.trim()) {
      novosErros.nomeRazao = 'Nome/Razão Social é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Handlers para campos simples
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let valorFinal: any = value;
    
    if (type === 'number') {
      valorFinal = value === '' ? '' : parseFloat(value);
    }
    
    // Se mudou o CNPJ/CPF, ajustar tipo pessoa automaticamente
    if (name === 'cnpjCpf') {
      const apenasNumeros = value.replace(/\D/g, '');
      if (apenasNumeros.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [name]: apenasNumeros,
          tipoPessoa: 'F'
        }));
        return;
      } else if (apenasNumeros.length <= 14) {
        setFormData(prev => ({
          ...prev,
          [name]: apenasNumeros,
          tipoPessoa: 'J'
        }));
        return;
      }
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

  // Handlers para endereços
  const handleEnderecoChange = (index: number, field: string, value: any) => {
    const novosEnderecos = [...(formData.enderecos || [])];
    
    if (!novosEnderecos[index]) {
      novosEnderecos[index] = {
        id: 0,
        tipoLogradouro: 'Rua',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        cep: '',
        estado: '',
        tipoEndereco: 'COMERCIAL'
      };
    }
    
    novosEnderecos[index] = {
      ...novosEnderecos[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      enderecos: novosEnderecos
    }));
  };

  const handleAdicionarEndereco = () => {
    setFormData(prev => ({
      ...prev,
      enderecos: [
        ...(prev.enderecos || []),
        {
          id: 0,
          logradouro: '',
          tipoLogradouro: 'Rua',
          numero: '',
          bairro: '',
          cidade: '',
          cep: '',
          estado: '',
          tipoEndereco: 'COMERCIAL'
        }
      ]
    }));
  };

  const handleRemoverEndereco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      enderecos: prev.enderecos?.filter((_, i) => i !== index) || []
    }));
  };

  // Handlers para telefones
  const handleTelefoneChange = (index: number, field: string, value: any) => {
    const novosTelefones = [...(formData.telefones || [])];
    
    if (!novosTelefones[index]) {
      novosTelefones[index] = {
        id: 0,
        ddd: '',
        numero: '',
        tipoTelefone: 'CELULAR',
        whatsapp: false,
        ativo: true
      };
    }
    
    novosTelefones[index] = {
      ...novosTelefones[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      telefones: novosTelefones
    }));
  };

  const handleAdicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: [
        ...(prev.telefones || []),
        {
          id: 0,
          ddd: '',
          numero: '',
          tipoTelefone: 'CELULAR',
          whatsapp: false,
          ativo: true
        }
      ]
    }));
  };

  const handleRemoverTelefone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      telefones: prev.telefones?.filter((_, i) => i !== index) || []
    }));
  };

  // Handlers para emails
  const handleEmailChange = (index: number, field: string, value: any) => {
    const novosEmails = [...(formData.emails || [])];
    
    if (!novosEmails[index]) {
      novosEmails[index] = {
        id: 0,
        email: '',
        tipoEmail: 'COMERCIAL',
        ativo: true
      };
    }
    
    novosEmails[index] = {
      ...novosEmails[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      emails: novosEmails
    }));
  };

  const handleAdicionarEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [
        ...(prev.emails || []),
        {
          id: 0,
          email: '',
          tipoEmail: 'COMERCIAL',
          ativo: true
        }
      ]
    }));
  };

  const handleRemoverEmail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails?.filter((_, i) => i !== index) || []
    }));
  };

  // Formatar CPF/CNPJ para exibição
  const formatarCnpjCpf = (cnpjCpf: string) => {
    if (!cnpjCpf) return '';
    
    const apenasNumeros = cnpjCpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpjCpf;
  };

  // Formatar CEP
  const formatarCep = (cep: string) => {
    if (!cep) return '';
    const apenasNumeros = cep.replace(/\D/g, '');
    if (apenasNumeros.length === 8) {
      return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  };

  // Formatar telefone
  const formatarTelefone = (ddd: string, numero: string) => {
    if (!ddd || !numero) return '';
    const apenasNumeros = numero.replace(/\D/g, '');
    
    if (apenasNumeros.length === 8) {
      return `(${ddd}) ${apenasNumeros.replace(/(\d{4})(\d{4})/, '$1-$2')}`;
    } else if (apenasNumeros.length === 9) {
      return `(${ddd}) ${apenasNumeros.replace(/(\d{5})(\d{4})/, '$1-$2')}`;
    }
    
    return `(${ddd}) ${numero}`;
  };

  // Salvar associado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showToast('Por favor, corrija os erros antes de salvar.', 'warning');
      return;
    }

    setSalvando(true);
    
    try {
      if (isEditMode) {
        await associadoService.atualizar(parseInt(id!), formData);
        showToast('Associado atualizado com sucesso!', 'success');
      } else {
        const associadoCriado = await associadoService.criar(formData);
        showToast('Associado criado com sucesso!', 'success');
        // Redirecionar para detalhes se criou novo
        setTimeout(() => {
          navigate(`/associados/${associadoCriado.id}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Erro ao salvar associado:', error);
      
      if (error.response?.data?.mensagem) {
        const mensagemErro = error.response.data.mensagem;
        
        if (mensagemErro.includes('CNPJ/CPF') || mensagemErro.includes('cpf') || mensagemErro.includes('cnpj')) {
          setErros(prev => ({ ...prev, cnpjCpf: mensagemErro }));
          showToast(mensagemErro, 'error');
        } else if (mensagemErro.includes('Código SPC') || mensagemErro.includes('código spc')) {
          setErros(prev => ({ ...prev, codigoSpc: mensagemErro }));
          showToast(mensagemErro, 'error');
        } else {
          showToast(mensagemErro || 'Erro ao salvar associado', 'error');
        }
      } else {
        showToast('Erro ao salvar associado. Tente novamente.', 'error');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = async () => {
    const confirmado = await showConfirm({
      title: 'Confirmar cancelamento',
      message: 'Deseja cancelar? As alterações não salvas serão perdidas.',
      confirmText: 'Sim, cancelar',
      cancelText: 'Não, continuar',
      type: 'warning'
    });

    if (confirmado) {
      navigate('/associados');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Associados', path: '/associados' },
          { label: isEditMode ? 'Editar Associado' : 'Novo Associado' }
        ]}
      />
      
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              ✕ Cancelar
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              💾 {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">Informações Básicas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CNPJ/CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CNPJ/CPF * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cnpjCpf"
                  value={formData.cnpjCpf}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.cnpjCpf ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.tipoPessoa === 'F' ? '000.000.000-00' : '00.000.000/0000-00'}
                  disabled={isEditMode}
                />
                {erros.cnpjCpf && (
                  <p className="mt-1 text-sm text-red-600">{erros.cnpjCpf}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} - {formatarCnpjCpf(formData.cnpjCpf)}
                </p>
              </div>

              {/* Tipo Pessoa (auto-definido pelo CNPJ/CPF) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Pessoa
                </label>
                <select
                  name="tipoPessoa"
                  value={formData.tipoPessoa}
                  onChange={handleChange}
                  disabled={isEditMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                >
                  {associadoOpcoes.tipoPessoa.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Definido automaticamente pelo CNPJ/CPF
                </p>
              </div>

              {/* Nome/Razão Social */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome/Razão Social * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nomeRazao"
                  value={formData.nomeRazao}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.nomeRazao ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.tipoPessoa === 'F' ? 'Nome completo' : 'Razão Social'}
                />
                {erros.nomeRazao && (
                  <p className="mt-1 text-sm text-red-600">{erros.nomeRazao}</p>
                )}
              </div>

              {/* Nome Fantasia */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  name="nomeFantasia"
                  value={formData.nomeFantasia || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome fantasia/comercial (opcional)"
                />
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.codigoSpc ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: SPC001"
                />
                {erros.codigoSpc && (
                  <p className="mt-1 text-sm text-red-600">{erros.codigoSpc}</p>
                )}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {associadoOpcoes.status.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor atendimento
                </label>
                <select
                  name="vendedorId"
                  value={formData.vendedorId || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {vendedores.map(vendedor => (
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {planos.map(plano => (
                    <option key={plano.id} value={plano.id}>
                      {plano.plano}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {categorias.map(categoria => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção 2: Endereços */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Endereços</h2>
              </div>
              <button
                type="button"
                onClick={handleAdicionarEndereco}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                ➕ Adicionar Endereço
              </button>
            </div>
            
            {(!formData.enderecos || formData.enderecos.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🏠</div>
                <p>Nenhum endereço cadastrado</p>
                <p className="text-sm mt-1">Clique no botão acima para adicionar um endereço</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.enderecos.map((endereco, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                          {endereco.tipoEndereco}
                        </span>
                        <span className="text-sm text-gray-500">
                          Endereço {index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoverEndereco(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Remover
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo Endereço */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Endereço
                        </label>
                        <select
                          value={endereco.tipoEndereco}
                          onChange={(e) => handleEnderecoChange(index, 'tipoEndereco', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {associadoOpcoes.tipoEndereco.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* CEP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={endereco.cep}
                          onChange={(e) => handleEnderecoChange(index, 'cep', e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="00000-000"
                        />
                        {endereco.cep && (
                          <p className="mt-1 text-xs text-gray-500">
                            {formatarCep(endereco.cep)}
                          </p>
                        )}
                      </div>

                      {/* Logradouro */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Logradouro
                        </label>
                        <input
                          type="text"
                          value={endereco.logradouro}
                          onChange={(e) => handleEnderecoChange(index, 'logradouro', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Rua, Avenida, etc."
                        />
                      </div>

                      {/* Número */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número
                        </label>
                        <input
                          type="text"
                          value={endereco.numero}
                          onChange={(e) => handleEnderecoChange(index, 'numero', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="123"
                        />
                      </div>

                      {/* Complemento */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={endereco.complemento || ''}
                          onChange={(e) => handleEnderecoChange(index, 'complemento', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Apto, Sala, etc."
                        />
                      </div>

                      {/* Bairro */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={endereco.bairro}
                          onChange={(e) => handleEnderecoChange(index, 'bairro', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      {/* Cidade */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={endereco.cidade}
                          onChange={(e) => handleEnderecoChange(index, 'cidade', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>

                      {/* Estado */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <select
                          value={endereco.estado}
                          onChange={(e) => handleEnderecoChange(index, 'estado', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Selecione...</option>
                          {associadoOpcoes.estados.map(estado => (
                            <option key={estado.value} value={estado.value}>
                              {estado.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 3: Telefones */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Telefones</h2>
              </div>
              <button
                type="button"
                onClick={handleAdicionarTelefone}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                📞 Adicionar Telefone
              </button>
            </div>
            
            {(!formData.telefones || formData.telefones.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📱</div>
                <p>Nenhum telefone cadastrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.telefones.map((telefone, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-500">
                        Telefone {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverTelefone(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Remover
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* DDD + Número */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            DDD
                          </label>
                          <input
                            type="text"
                            value={telefone.ddd}
                            onChange={(e) => handleTelefoneChange(index, 'ddd', e.target.value.replace(/\D/g, ''))}
                            maxLength={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="11"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número
                          </label>
                          <input
                            type="text"
                            value={telefone.numero}
                            onChange={(e) => handleTelefoneChange(index, 'numero', e.target.value.replace(/\D/g, ''))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="99999-9999"
                          />
                          {telefone.ddd && telefone.numero && (
                            <p className="mt-1 text-xs text-gray-500">
                              {formatarTelefone(telefone.ddd, telefone.numero)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo
                        </label>
                        <select
                          value={telefone.tipoTelefone}
                          onChange={(e) => handleTelefoneChange(index, 'tipoTelefone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {associadoOpcoes.tipoTelefone.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Configurações */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={telefone.whatsapp || false}
                            onChange={(e) => handleTelefoneChange(index, 'whatsapp', e.target.checked)}
                            className="h-4 w-4 text-green-600"
                            id={`whatsapp-${index}`}
                          />
                          <label htmlFor={`whatsapp-${index}`} className="text-sm">
                            WhatsApp
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={telefone.ativo || false}
                            onChange={(e) => handleTelefoneChange(index, 'ativo', e.target.checked)}
                            className="h-4 w-4 text-blue-600"
                            id={`ativo-${index}`}
                          />
                          <label htmlFor={`ativo-${index}`} className="text-sm">
                            Ativo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 4: Emails */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-orange-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Emails</h2>
              </div>
              <button
                type="button"
                onClick={handleAdicionarEmail}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
              >
                ✉️ Adicionar Email
              </button>
            </div>
            
            {(!formData.emails || formData.emails.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📧</div>
                <p>Nenhum email cadastrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.emails.map((email, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-500">
                        Email {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoverEmail(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        🗑️ Remover
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Endereço de Email
                        </label>
                        <input
                          type="email"
                          value={email.email}
                          onChange={(e) => handleEmailChange(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="exemplo@empresa.com"
                        />
                      </div>

                      {/* Tipo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo
                        </label>
                        <select
                          value={email.tipoEmail}
                          onChange={(e) => handleEmailChange(index, 'tipoEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {associadoOpcoes.tipoEmail.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Ativo */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={email.ativo || false}
                          onChange={(e) => handleEmailChange(index, 'ativo', e.target.checked)}
                          className="h-4 w-4 text-blue-600"
                          id={`email-ativo-${index}`}
                        />
                        <label htmlFor={`email-ativo-${index}`} className="text-sm">
                          Email ativo para envio
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancelar}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              ✕ Cancelar
            </button>
            
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              💾 {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssociadoFormPage;