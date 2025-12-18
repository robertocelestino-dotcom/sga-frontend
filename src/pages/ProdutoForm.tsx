// src/pages/ProdutoForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  produtoService,
  ProdutoDTO,
  produtoOpcoes
} from '../services/produtoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

const ProdutoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [franquiasDisponiveis, setFranquiasDisponiveis] = useState<any[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<any[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<ProdutoDTO>({
    codigo: '',
    codigoRm: '',
    nome: '',
    descricao: '',
    valorUnitario: 0,
    status: 'ATIVO',
    tipoProduto: 'SERVICO',
    unidadeMedida: 'UNIDADE',
    categoria: '',
    modalidade: '',
    temFranquia: false,
    limiteFranquia: undefined,
    periodoFranquia: '',
    franquiasIds: [],
    produtosRelacionadosIds: [],
    geraCobrancaAutomatica: true,
    cobrancaPeriodica: false,
    periodicidadeCobranca: '',
    diaCobranca: undefined,
    permiteDesconto: true,
    descontoMaximo: 0,
    exigeAutorizacao: false,
    nivelAutorizacao: undefined
  });

  // Carregar dados se for edição
  useEffect(() => {
    const carregarDados = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const produto = await produtoService.buscarPorId(parseInt(id!));
          setFormData(produto);
        } catch (error) {
          console.error('Erro ao carregar produto:', error);
          showToast('Produto não encontrado', 'error');
          navigate('/produtos');
        } finally {
          setLoading(false);
        }
      }
    };

    carregarDados();
    carregarFranquiasDisponiveis();
    carregarProdutosDisponiveis();
  }, [id, isEditMode, navigate, showToast]);

  // Carregar franquias disponíveis
  const carregarFranquiasDisponiveis = async () => {
    try {
      const franquias = await produtoService.listarFranquiasDisponiveis();
      setFranquiasDisponiveis(franquias);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
    }
  };

  // Carregar produtos disponíveis para relacionamento
  const carregarProdutosDisponiveis = async () => {
    try {
      const produtos = await produtoService.listar({ size: 1000 });
      setProdutosDisponiveis(produtos.content);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      novosErros.codigo = 'Código é obrigatório';
    }

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (formData.valorUnitario < 0) {
      novosErros.valorUnitario = 'Valor não pode ser negativo';
    }

    if (formData.tipoProduto === 'FRANQUIA' && !formData.limiteFranquia) {
      novosErros.limiteFranquia = 'Limite de franquia é obrigatório para franquias';
    }

    if (formData.cobrancaPeriodica && !formData.periodicidadeCobranca) {
      novosErros.periodicidadeCobranca = 'Periodicidade é obrigatória para cobrança periódica';
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
      valorFinal = value === '' ? '' : parseFloat(value);
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

  const handleToggleFranquia = (franquiaId: number) => {
    setFormData(prev => {
      const currentIds = prev.franquiasIds || [];
      const newIds = currentIds.includes(franquiaId)
        ? currentIds.filter(id => id !== franquiaId)
        : [...currentIds, franquiaId];
      
      return {
        ...prev,
        franquiasIds: newIds,
        temFranquia: newIds.length > 0
      };
    });
  };

  const handleToggleProdutoRelacionado = (produtoId: number) => {
    setFormData(prev => {
      const currentIds = prev.produtosRelacionadosIds || [];
      const newIds = currentIds.includes(produtoId)
        ? currentIds.filter(id => id !== produtoId)
        : [...currentIds, produtoId];
      
      return { ...prev, produtosRelacionadosIds: newIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showToast('Por favor, corrija os erros antes de salvar.', 'warning');
      return;
    }

    setSalvando(true);
    
    try {
      if (isEditMode) {
        await produtoService.atualizar(parseInt(id!), formData);
        showToast('Produto atualizado com sucesso!', 'success');
      } else {
        await produtoService.criar(formData);
        showToast('Produto criado com sucesso!', 'success');
      }
      
      navigate('/produtos');
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      
      if (error.response?.data?.erro) {
        const mensagemErro = error.response.data.erro;
        
        if (mensagemErro.includes('código') || mensagemErro.includes('Código')) {
          setErros(prev => ({ ...prev, codigo: mensagemErro }));
          showToast(mensagemErro, 'error');
        } else if (mensagemErro.includes('código RM') || mensagemErro.includes('Código RM')) {
          setErros(prev => ({ ...prev, codigoRm: mensagemErro }));
          showToast(mensagemErro, 'error');
        } else {
          showToast(mensagemErro || 'Erro ao salvar produto', 'error');
        }
      } else {
        showToast('Erro ao salvar produto. Tente novamente.', 'error');
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
      navigate('/produtos');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Produtos', path: '/produtos' },
          { label: isEditMode ? 'Editar Produto' : 'Novo Produto' }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? 'Atualize as informações do produto' 
                : 'Preencha os dados para cadastrar um novo produto'}
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
              💾 {salvando ? 'Salvando...' : 'Salvar Produto'}
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
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.codigo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: SPC001"
                />
                {erros.codigo && (
                  <p className="mt-1 text-sm text-red-600">{erros.codigo}</p>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.codigoRm ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Código no sistema RM"
                />
                {erros.codigoRm && (
                  <p className="mt-1 text-sm text-red-600">{erros.codigoRm}</p>
                )}
              </div>

              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Consulta SPC Positivo"
                />
                {erros.nome && (
                  <p className="mt-1 text-sm text-red-600">{erros.nome}</p>
                )}
              </div>

              {/* Valor Unitário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Unitário (R$) * <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valorUnitario"
                  value={formData.valorUnitario}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.valorUnitario ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {erros.valorUnitario && (
                  <p className="mt-1 text-sm text-red-600">{erros.valorUnitario}</p>
                )}
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
                  {produtoOpcoes.status.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Produto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Produto
                </label>
                <select
                  name="tipoProduto"
                  value={formData.tipoProduto}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {produtoOpcoes.tipoProduto.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unidade de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade de Medida
                </label>
                <select
                  name="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {produtoOpcoes.unidadeMedida.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
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
                  name="categoria"
                  value={formData.categoria || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {produtoOpcoes.categoria.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modalidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalidade
                </label>
                <select
                  name="modalidade"
                  value={formData.modalidade || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione...</option>
                  {produtoOpcoes.modalidade.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  value={formData.descricao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descreva o produto..."
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Configurações de Franquia (se for franquia) */}
          {formData.tipoProduto === 'FRANQUIA' && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-purple-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Configurações de Franquia</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Limite de Franquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite de Franquia * <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="limiteFranquia"
                    value={formData.limiteFranquia || ''}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      erros.limiteFranquia ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: 100"
                  />
                  {erros.limiteFranquia && (
                    <p className="mt-1 text-sm text-red-600">{erros.limiteFranquia}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Número máximo de utilizações no período
                  </p>
                </div>

                {/* Período da Franquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período da Franquia
                  </label>
                  <select
                    name="periodoFranquia"
                    value={formData.periodoFranquia || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {produtoOpcoes.periodoFranquia.map(opcao => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Período para renovação do limite
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seção 3: Franquias Relacionadas (se não for franquia) */}
          {formData.tipoProduto !== 'FRANQUIA' && franquiasDisponiveis.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-purple-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Franquias Relacionadas</h2>
                <span className="text-sm text-gray-500 ml-2">
                  (Selecione as franquias inclusas neste produto)
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Produtos selecionados: {formData.franquiasIds?.length || 0}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
                  {franquiasDisponiveis.map(franquia => (
                    <div
                      key={franquia.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.franquiasIds?.includes(franquia.id)
                          ? 'bg-purple-50 border-purple-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleToggleFranquia(franquia.id)}
                    >
                      <input
                        type="checkbox"
                        checked={formData.franquiasIds?.includes(franquia.id) || false}
                        onChange={() => handleToggleFranquia(franquia.id)}
                        className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{franquia.nome}</div>
                        <div className="text-sm text-gray-500">
                          {franquia.codigo} • R$ {franquia.valorUnitario?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Seção 4: Produtos Relacionados (para produtos MIX) */}
          {formData.categoria === 'MIX' || formData.nome.includes('MIX') ? (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-green-600 rounded"></div>
                <h2 className="text-lg font-semibold text-gray-800">Produtos Relacionados (MIX)</h2>
                <span className="text-sm text-gray-500 ml-2">
                  (Selecione os produtos que compõem este MIX)
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Produtos selecionados: {formData.produtosRelacionadosIds?.length || 0}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2">
                  {produtosDisponiveis
                    .filter(p => p.id !== parseInt(id || '0'))
                    .map(produto => (
                      <div
                        key={produto.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          formData.produtosRelacionadosIds?.includes(produto.id)
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleToggleProdutoRelacionado(produto.id)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.produtosRelacionadosIds?.includes(produto.id) || false}
                          onChange={() => handleToggleProdutoRelacionado(produto.id)}
                          className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{produto.nome}</div>
                          <div className="text-sm text-gray-500">
                            {produto.codigo} • {produto.tipoProduto}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Seção 5: Regras de Faturamento */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-yellow-600 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">Regras de Faturamento</h2>
            </div>
            
            <div className="space-y-6">
              {/* Geração de Cobrança */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="geraCobrancaAutomatica"
                  checked={formData.geraCobrancaAutomatica}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <label className="font-medium text-gray-700">
                    Gerar cobrança automaticamente
                  </label>
                  <p className="text-sm text-gray-500">
                    Cobrança será gerada automaticamente na importação
                  </p>
                </div>
              </div>

              {/* Cobrança Periódica */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="cobrancaPeriodica"
                  checked={formData.cobrancaPeriodica}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <label className="font-medium text-gray-700">
                    Cobrança Periódica (Assinatura)
                  </label>
                  <p className="text-sm text-gray-500">
                    Cobrança recorrente mensal/anual
                  </p>
                </div>
              </div>

              {formData.cobrancaPeriodica && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Periodicidade
                    </label>
                    <select
                      name="periodicidadeCobranca"
                      value={formData.periodicidadeCobranca || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        erros.periodicidadeCobranca ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {produtoOpcoes.periodicidadeCobranca.map(opcao => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                    {erros.periodicidadeCobranca && (
                      <p className="mt-1 text-sm text-red-600">{erros.periodicidadeCobranca}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dia da Cobrança
                    </label>
                    <input
                      type="number"
                      name="diaCobranca"
                      value={formData.diaCobranca || ''}
                      onChange={handleChange}
                      min="1"
                      max="31"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: 10 (dia do mês)"
                    />
                  </div>
                </div>
              )}

              {/* Desconto */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="permiteDesconto"
                  checked={formData.permiteDesconto}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="font-medium text-gray-700">
                    Permite Desconto
                  </label>
                  <p className="text-sm text-gray-500">
                    Aplicar desconto na cobrança
                  </p>
                </div>
                
                {formData.permiteDesconto && (
                  <div className="w-32">
                    <input
                      type="number"
                      name="descontoMaximo"
                      value={formData.descontoMaximo || 0}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-right"
                      placeholder="%"
                    />
                    <p className="text-xs text-gray-500 mt-1">Desconto máximo %</p>
                  </div>
                )}
              </div>

              {/* Autorização */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="exigeAutorizacao"
                  checked={formData.exigeAutorizacao}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <label className="font-medium text-gray-700">
                    Exige Autorização
                  </label>
                  <p className="text-sm text-gray-500">
                    Necessário aprovação para faturamento
                  </p>
                </div>
                
                {formData.exigeAutorizacao && (
                  <div className="w-32">
                    <input
                      type="number"
                      name="nivelAutorizacao"
                      value={formData.nivelAutorizacao || ''}
                      onChange={handleChange}
                      min="1"
                      max="3"
                      className="w-full px-3 py-1 border border-gray-300 rounded text-center"
                      placeholder="Nível"
                    />
                    <p className="text-xs text-gray-500 mt-1">Nível mínimo</p>
                  </div>
                )}
              </div>
            </div>
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
              💾 {salvando ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProdutoFormPage;