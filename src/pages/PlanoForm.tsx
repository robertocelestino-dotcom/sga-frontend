import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  planoService,
  PlanoDTO,
  planoOpcoes
} from '../services/planoService';
import { produtoService, ProdutoResumoDTO } from '../services/produtoService';
import { planoProdutoFranquiaService } from '../services/planoProdutoFranquiaService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

// Modais
import ModalSelecaoProduto from '../components/ModalSelecaoProduto';
import ModalSelecaoFranquia from '../components/ModalSelecaoFranquia';

const PlanoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoResumoDTO[]>([]);
  const [franquiasDisponiveis, setFranquiasDisponiveis] = useState<ProdutoResumoDTO[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  
  // Estados para modais
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalFranquiaAberto, setModalFranquiaAberto] = useState(false);
  
  // Estado para nova associação
  const [novaAssociacao, setNovaAssociacao] = useState<{
    produtoId?: number;
    produtoNome?: string;
    produtoCodigo?: string;
    franquiaId?: number;
    franquiaNome?: string;
    franquiaCodigo?: string;
    limiteFranquia?: number;
    periodoFranquia: string;
    valorExcedente?: number;
  }>({
    periodoFranquia: 'MENSAL'
  });

  // Lista de associações produto-franquia
  const [associacoes, setAssociacoes] = useState<Array<{
    id: string;
    produtoId: number;
    produtoNome: string;
    produtoCodigo: string;
    franquiaId: number;
    franquiaNome: string;
    franquiaCodigo: string;
    limiteFranquia: number;
    periodoFranquia: string;
    valorExcedente?: number;
  }>>([]);

  const [formData, setFormData] = useState<PlanoDTO>({
    nome: '',
    descricao: '',
    valor: 0,
    status: 'ATIVO',
    tipoPlano: 'MENSAL',
    quantidadeMinima: 1,
    quantidadeMaxima: 999999,
    permiteExcedente: true,
    faturamentoAntecipado: false,
    diaFaturamento: 1,
    observacao: ''
  });

  // Carregar dados se for edição
  useEffect(() => {
    const carregarDados = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const plano = await planoService.buscarPorId(parseInt(id!));
          setFormData(plano);
          
          // Carregar associações existentes
          const associacoesExistentes = await planoProdutoFranquiaService.listarPorPlano(parseInt(id!));
          setAssociacoes(associacoesExistentes.map((a: any, index: number) => ({
            ...a,
            id: `existing-${index}-${Date.now()}`
          })));
        } catch (error) {
          console.error('Erro ao carregar plano:', error);
          showToast('Plano não encontrado', 'error');
          navigate('/planos');
        } finally {
          setLoading(false);
        }
      }
    };

    carregarDados();
    carregarProdutosDisponiveis();
    carregarFranquiasDisponiveis();
  }, [id, isEditMode, navigate, showToast]);

  // Carregar produtos disponíveis (todos os tipos)
  const carregarProdutosDisponiveis = async () => {
    try {
      const response = await produtoService.listar({ size: 1000 });
      setProdutosDisponiveis(response.content || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  // Carregar franquias disponíveis (apenas produtos do tipo FRANQUIA)
  const carregarFranquiasDisponiveis = async () => {
    try {
      const franquias = await produtoService.listarFranquiasDisponiveis();
      setFranquiasDisponiveis(franquias);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
    }
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      novosErros.nome = 'Nome do plano é obrigatório';
    }

    if (formData.valor < 0) {
      novosErros.valor = 'Valor não pode ser negativo';
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

    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handler para selecionar produto via modal
  const handleSelecionarProduto = (produto: any) => {
    setNovaAssociacao(prev => ({
      ...prev,
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoCodigo: produto.codigo
    }));
    setModalProdutoAberto(false);
  };

  // Handler para selecionar franquia via modal
  const handleSelecionarFranquia = (franquia: any) => {
    setNovaAssociacao(prev => ({
      ...prev,
      franquiaId: franquia.id,
      franquiaNome: franquia.nome,
      franquiaCodigo: franquia.codigo,
      limiteFranquia: franquia.limiteFranquia || 20,
      periodoFranquia: franquia.periodoFranquia || 'MENSAL',
      valorExcedente: franquia.valorExcedente
    }));
    setModalFranquiaAberto(false);
  };

  // Handler para adicionar associação
  const handleAdicionarAssociacao = () => {
    if (!novaAssociacao.produtoId) {
      showToast('Selecione um produto', 'warning');
      return;
    }
    if (!novaAssociacao.franquiaId) {
      showToast('Selecione uma franquia', 'warning');
      return;
    }
    if (!novaAssociacao.limiteFranquia || novaAssociacao.limiteFranquia <= 0) {
      showToast('Defina o limite da franquia', 'warning');
      return;
    }

    // Verificar se já existe associação para este produto
    const existe = associacoes.some(a => a.produtoId === novaAssociacao.produtoId);
    if (existe) {
      showToast('Este produto já possui uma franquia associada neste plano', 'error');
      return;
    }

    setAssociacoes(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        produtoId: novaAssociacao.produtoId!,
        produtoNome: novaAssociacao.produtoNome!,
        produtoCodigo: novaAssociacao.produtoCodigo!,
        franquiaId: novaAssociacao.franquiaId!,
        franquiaNome: novaAssociacao.franquiaNome!,
        franquiaCodigo: novaAssociacao.franquiaCodigo!,
        limiteFranquia: novaAssociacao.limiteFranquia!,
        periodoFranquia: novaAssociacao.periodoFranquia,
        valorExcedente: novaAssociacao.valorExcedente
      }
    ]);

    setNovaAssociacao({
      periodoFranquia: 'MENSAL'
    });

    showToast('Associação adicionada com sucesso!', 'success');
  };

  // Handler para remover associação
  const handleRemoverAssociacao = async (id: string, associacaoId?: number) => {
    if (associacaoId) {
      try {
        await planoProdutoFranquiaService.remover(associacaoId);
        showToast('Associação removida do banco de dados', 'success');
      } catch (error) {
        console.error('Erro ao remover associação:', error);
        showToast('Erro ao remover associação', 'error');
        return;
      }
    }
    setAssociacoes(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      showToast('Por favor, corrija os erros antes de salvar.', 'warning');
      return;
    }

    setSalvando(true);
    
    try {
      let planoSalvo;
      
      // 1. Salvar o plano
      if (isEditMode) {
        planoSalvo = await planoService.atualizar(parseInt(id!), formData);
        showToast('Plano atualizado com sucesso!', 'success');
      } else {
        planoSalvo = await planoService.criar(formData);
        showToast('Plano criado com sucesso!', 'success');
      }

      // 2. Salvar as associações
      if (associacoes.length > 0 && planoSalvo?.id) {
        let associacoesSalvas = 0;
        let associacoesComErro = 0;

        for (const assoc of associacoes) {
          try {
            // Se não tem ID, é uma associação nova
            if (!assoc.id.startsWith('existing-')) {
              await planoProdutoFranquiaService.associar(
                planoSalvo.id,
                assoc.produtoId,
                assoc.franquiaId,
                assoc.limiteFranquia,
                assoc.valorExcedente,
                assoc.periodoFranquia
              );
              associacoesSalvas++;
            }
          } catch (error) {
            console.error('Erro ao salvar associação:', error);
            associacoesComErro++;
          }
        }

        if (associacoesComErro === 0) {
          showToast(`${associacoesSalvas} associação(ões) salva(s) com sucesso!`, 'success');
        } else {
          showToast(`${associacoesSalvas} associações salvas, ${associacoesComErro} com erro`, 'warning');
        }
      }
      
      navigate('/planos');
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      
      if (error.response?.data?.erro) {
        showToast(error.response.data.erro, 'error');
      } else {
        showToast('Erro ao salvar plano. Tente novamente.', 'error');
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
      navigate('/planos');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Planos', path: '/planos' },
          { label: isEditMode ? 'Editar Plano' : 'Novo Plano' }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Editar Plano' : 'Novo Plano'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? 'Atualize as informações do plano' 
                : 'Preencha os dados para cadastrar um novo plano'}
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
              💾 {salvando ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas do Plano */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">Informações do Plano</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome do Plano */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Plano * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: PLANO 20 MIX 1/1"
                />
                {erros.nome && (
                  <p className="mt-1 text-sm text-red-600">{erros.nome}</p>
                )}
              </div>

              {/* Valor do Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) * <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    erros.valor ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              {/* Tipo de Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Plano
                </label>
                <select
                  name="tipoPlano"
                  value={formData.tipoPlano}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MENSAL">Mensal</option>
                  <option value="ANUAL">Anual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                </select>
              </div>

              {/* Dia do Faturamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia do Faturamento
                </label>
                <input
                  type="number"
                  name="diaFaturamento"
                  value={formData.diaFaturamento}
                  onChange={handleChange}
                  min="1"
                  max="31"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quantidade Mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  name="quantidadeMinima"
                  value={formData.quantidadeMinima}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Quantidade Máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade Máxima
                </label>
                <input
                  type="number"
                  name="quantidadeMaxima"
                  value={formData.quantidadeMaxima}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Checkboxes */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="permiteExcedente"
                    checked={formData.permiteExcedente}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Permite excedente (cobrança adicional)
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="faturamentoAntecipado"
                    checked={formData.faturamentoAntecipado}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">
                    Faturamento antecipado
                  </label>
                </div>
              </div>

              {/* Observação */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observação
                </label>
                <textarea
                  name="observacao"
                  value={formData.observacao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Observações sobre o plano..."
                />
              </div>
            </div>
          </div>

          {/* 🔥 SEÇÃO 2: Associações Produto-Franquia */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-indigo-600 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">Produtos e Franquias do Plano</h2>
              <span className="text-sm text-gray-500 ml-2">
                (Associe produtos de consulta com suas respectivas franquias)
              </span>
            </div>

            {/* Lista de Associações Existentes */}
            {associacoes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Produtos inclusos no plano:</h3>
                <div className="space-y-3">
                  {associacoes.map((assoc) => (
                    <div key={assoc.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs text-blue-600 mb-1">📋 Produto</p>
                              <p className="font-medium text-gray-800">{assoc.produtoNome}</p>
                              <p className="text-xs text-gray-500">Código: {assoc.produtoCodigo}</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-xs text-purple-600 mb-1">📦 Franquia</p>
                              <p className="font-medium text-gray-800">{assoc.franquiaNome}</p>
                              <p className="text-xs text-gray-500">Código: {assoc.franquiaCodigo}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Limite incluso</p>
                              <p className="text-sm font-medium text-gray-900">{assoc.limiteFranquia} consultas</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Período</p>
                              <p className="text-sm font-medium text-gray-900">{assoc.periodoFranquia}</p>
                            </div>
                            {assoc.valorExcedente && (
                              <div>
                                <p className="text-xs text-gray-500">Valor Excedente</p>
                                <p className="text-sm font-medium text-gray-900">
                                  R$ {assoc.valorExcedente.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverAssociacao(assoc.id, parseInt(assoc.id.split('-')[1]))}
                          className="ml-4 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Remover associação"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário para Nova Associação */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Adicionar produto ao plano:</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seleção do Produto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produto *
                  </label>
                  {!novaAssociacao.produtoId ? (
                    <button
                      type="button"
                      onClick={() => setModalProdutoAberto(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between text-left"
                    >
                      <span className="text-gray-500">Clique para selecionar um produto...</span>
                      <span className="text-gray-400">🔍</span>
                    </button>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{novaAssociacao.produtoNome}</p>
                          <p className="text-xs text-gray-500">Código: {novaAssociacao.produtoCodigo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNovaAssociacao(prev => ({ 
                            ...prev, 
                            produtoId: undefined, 
                            produtoNome: undefined,
                            produtoCodigo: undefined
                          }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seleção da Franquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Franquia Associada *
                  </label>
                  {!novaAssociacao.franquiaId ? (
                    <button
                      type="button"
                      onClick={() => setModalFranquiaAberto(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between text-left"
                    >
                      <span className="text-gray-500">Clique para selecionar uma franquia...</span>
                      <span className="text-gray-400">🔍</span>
                    </button>
                  ) : (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{novaAssociacao.franquiaNome}</p>
                          <p className="text-xs text-gray-500">Código: {novaAssociacao.franquiaCodigo}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNovaAssociacao(prev => ({ 
                            ...prev, 
                            franquiaId: undefined, 
                            franquiaNome: undefined,
                            franquiaCodigo: undefined,
                            limiteFranquia: undefined
                          }))}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Limite da Franquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite incluso no plano *
                  </label>
                  <input
                    type="number"
                    value={novaAssociacao.limiteFranquia || ''}
                    onChange={(e) => setNovaAssociacao(prev => ({ 
                      ...prev, 
                      limiteFranquia: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: 20"
                  />
                </div>

                {/* Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={novaAssociacao.periodoFranquia}
                    onChange={(e) => setNovaAssociacao(prev => ({ ...prev, periodoFranquia: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="BIMESTRAL">Bimestral</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                {/* Valor Excedente */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Consulta Excedente (R$)
                  </label>
                  <input
                    type="number"
                    value={novaAssociacao.valorExcedente || ''}
                    onChange={(e) => setNovaAssociacao(prev => ({ 
                      ...prev, 
                      valorExcedente: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    step="0.01"
                    min="0"
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0,00"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Valor cobrado por consulta além do limite (deixe 0 se não permitir excedente)
                  </p>
                </div>
              </div>

              {/* Botão Adicionar */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarAssociacao}
                  disabled={!novaAssociacao.produtoId || !novaAssociacao.franquiaId || !novaAssociacao.limiteFranquia}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>➕</span>
                  Adicionar ao Plano
                </button>
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
              💾 {salvando ? 'Salvando...' : 'Salvar Plano'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Seleção de Produto */}
      <ModalSelecaoProduto
        aberto={modalProdutoAberto}
        onFechar={() => setModalProdutoAberto(false)}
        onSelecionar={handleSelecionarProduto}
        produtosDisponiveis={produtosDisponiveis}
        produtoSelecionadoId={novaAssociacao.produtoId}
      />

      {/* Modal de Seleção de Franquia */}
      <ModalSelecaoFranquia
        aberto={modalFranquiaAberto}
        onFechar={() => setModalFranquiaAberto(false)}
        onSelecionar={handleSelecionarFranquia}
        franquiasDisponiveis={franquiasDisponiveis}
        franquiaSelecionadaId={novaAssociacao.franquiaId}
      />
    </div>
  );
};

export default PlanoFormPage;