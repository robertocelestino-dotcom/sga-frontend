// src/pages/ProdutoForm.tsx - VERSÃO CDL (bug do cancelar corrigido)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Save } from 'lucide-react';
import {
  produtoService,
  ProdutoDTO,
  produtoOpcoes,
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
    nivelAutorizacao: undefined,
  });

  useEffect(() => {
    const carregarDados = async () => {
      if (!isEditMode) return;
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
    };
    carregarDados();
  }, [id, isEditMode, navigate, showToast]);

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.codigo?.trim()) novosErros.codigo = 'Código é obrigatório';
    if (!formData.nome?.trim()) novosErros.nome = 'Nome é obrigatório';
    if (formData.valorUnitario < 0) novosErros.valorUnitario = 'Valor não pode ser negativo';

    if (formData.tipoProduto === 'FRANQUIA' && !formData.limiteFranquia) {
      novosErros.limiteFranquia = 'Limite de franquia é obrigatório para franquias';
    }

    if (formData.cobrancaPeriodica && !formData.periodicidadeCobranca) {
      novosErros.periodicidadeCobranca = 'Periodicidade é obrigatória para cobrança periódica';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let valorFinal: any = value;

    if (type === 'number') {
      valorFinal = value === '' ? '' : parseFloat(value);
    } else if (type === 'checkbox') {
      valorFinal = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [name]: valorFinal }));
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
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
          setErros((prev) => ({ ...prev, codigo: mensagemErro }));
          showToast(mensagemErro, 'error');
        } else if (mensagemErro.includes('código RM') || mensagemErro.includes('Código RM')) {
          setErros((prev) => ({ ...prev, codigoRm: mensagemErro }));
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

  /* ✅ FIX: botão Cancelar usa type="button" para não submeter o form */
  const handleCancelar = async () => {
    const confirmado = await showConfirm({
      title: 'Confirmar cancelamento',
      message: 'Deseja cancelar? As alterações não salvas serão perdidas.',
      confirmText: 'Sim, cancelar',
      cancelText: 'Não, continuar',
      type: 'warning',
    });
    if (confirmado) navigate('/produtos');
  };

  if (loading) return <Loading />;

  const tipoProdutoOpcoesExpandidas = [
    ...produtoOpcoes.tipoProduto,
    { value: 'PRODUTO_CONSULTA', label: 'Produto de Consulta (SPC, SERASA, etc)' },
    { value: 'INSUMO', label: 'Insumo (Ação, Pefin, Protesto, Cadin)' },
    { value: 'PLANO', label: 'Plano (Assinatura Mensal)' },
  ];

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-2 border rounded-lg bg-white transition-colors
     focus:outline-none focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600
     ${hasError ? 'border-cdl-danger-500' : 'border-gray-300'}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb
        links={[
          { label: 'Produtos', path: '/produtos' },
          { label: isEditMode ? 'Editar Produto' : 'Novo Produto' },
        ]}
      />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700">
              {isEditMode ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode
                ? 'Atualize as informações do produto'
                : 'Preencha os dados para cadastrar um novo produto'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* ✅ FIX: type="button" para não submeter */}
            <button
              type="button"
              onClick={handleCancelar}
              className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-50 flex items-center gap-2 font-medium
                         transition-colors"
            >
              <X size={16} /> Cancelar
            </button>

            {/* ✅ Botão do cabeçalho também submit (não onClick para não duplicar) */}
            <button
              type="submit"
              form="produto-form"
              disabled={salvando}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2
                         font-medium transition-all active:scale-[.98]"
            >
              <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </div>

        <form id="produto-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded" />
              <h2 className="text-lg font-semibold text-cdl-navy-700">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                  Código <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className={inputCls(!!erros.codigo)}
                  placeholder="Ex: SPC001"
                />
                {erros.codigo && (
                  <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.codigo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Código RM</label>
                <input
                  type="text"
                  name="codigoRm"
                  value={formData.codigoRm || ''}
                  onChange={handleChange}
                  className={inputCls(!!erros.codigoRm)}
                  placeholder="Código no sistema RM"
                />
                {erros.codigoRm && (
                  <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.codigoRm}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                  Nome do Produto <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={inputCls(!!erros.nome)}
                  placeholder="Ex: SPC MIX POSITIVO FOR INTERNET"
                />
                {erros.nome && (
                  <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                  Valor Unitário (R$) <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="number"
                  name="valorUnitario"
                  value={formData.valorUnitario}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={inputCls(!!erros.valorUnitario)}
                />
                {erros.valorUnitario && (
                  <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.valorUnitario}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputCls(false)}
                >
                  {produtoOpcoes.status.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                  Tipo de Produto
                </label>
                <select
                  name="tipoProduto"
                  value={formData.tipoProduto}
                  onChange={handleChange}
                  className={inputCls(false)}
                >
                  {tipoProdutoOpcoesExpandidas.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                  Unidade de Medida
                </label>
                <select
                  name="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={handleChange}
                  className={inputCls(false)}
                >
                  {produtoOpcoes.unidadeMedida.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                  <option value="CONSULTA">Consulta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Categoria</label>
                <select
                  name="categoria"
                  value={formData.categoria || ''}
                  onChange={handleChange}
                  className={inputCls(false)}
                >
                  <option value="">Selecione...</option>
                  {produtoOpcoes.categoria.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Modalidade</label>
                <select
                  name="modalidade"
                  value={formData.modalidade || ''}
                  onChange={handleChange}
                  className={inputCls(false)}
                >
                  <option value="">Selecione...</option>
                  {produtoOpcoes.modalidade.map((opcao) => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cdl-navy-700 mb-2">Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao || ''}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputCls(false)} resize-none`}
                  placeholder="Descreva o produto..."
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Franquia */}
          {formData.tipoProduto === 'FRANQUIA' && (
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-cdl-navy-600 rounded" />
                <h2 className="text-lg font-semibold text-cdl-navy-700">Configurações de Franquia</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                    Limite de Franquia <span className="text-cdl-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="limiteFranquia"
                    value={formData.limiteFranquia || ''}
                    onChange={handleChange}
                    min="1"
                    className={inputCls(!!erros.limiteFranquia)}
                    placeholder="Ex: 20"
                  />
                  {erros.limiteFranquia && (
                    <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.limiteFranquia}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Número máximo de consultas incluso no plano
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                    Período da Franquia
                  </label>
                  <select
                    name="periodoFranquia"
                    value={formData.periodoFranquia || 'MENSAL'}
                    onChange={handleChange}
                    className={inputCls(false)}
                  >
                    <option value="MENSAL">Mensal</option>
                    <option value="BIMESTRAL">Bimestral</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                    Valor por Consulta Excedente (R$)
                  </label>
                  <input
                    type="number"
                    name="valorExcedente"
                    value={(formData as any).valorExcedente || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`${inputCls(false)} max-w-xs`}
                    placeholder="0,00"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Valor cobrado por consulta além do limite
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seção 3: Regras de Faturamento */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-cdl-yellow-500 rounded" />
              <h2 className="text-lg font-semibold text-cdl-navy-700">Regras de Faturamento</h2>
            </div>

            <div className="space-y-6">
              {/* Geração automática */}
              <div className="flex items-start gap-3 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                <input
                  type="checkbox"
                  name="geraCobrancaAutomatica"
                  checked={formData.geraCobrancaAutomatica}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                />
                <div>
                  <label className="font-medium text-cdl-navy-700">
                    Gerar cobrança automaticamente na importação
                  </label>
                  <p className="text-sm text-cdl-navy-600 mt-0.5">
                    Quando este produto aparecer na bilhetagem, gera cobrança automática
                  </p>
                </div>
              </div>

              {/* Cobrança periódica */}
              <div className="flex items-start gap-3 p-4 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg">
                <input
                  type="checkbox"
                  name="cobrancaPeriodica"
                  checked={formData.cobrancaPeriodica}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                />
                <div>
                  <label className="font-medium text-cdl-yellow-700">
                    Cobrança Periódica (Assinatura)
                  </label>
                  <p className="text-sm text-cdl-yellow-600 mt-0.5">
                    Cobrança recorrente mensal/anual
                  </p>
                </div>
              </div>

              {formData.cobrancaPeriodica && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-7">
                  <div>
                    <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                      Periodicidade
                    </label>
                    <select
                      name="periodicidadeCobranca"
                      value={formData.periodicidadeCobranca || ''}
                      onChange={handleChange}
                      className={inputCls(!!erros.periodicidadeCobranca)}
                    >
                      <option value="">Selecione...</option>
                      {produtoOpcoes.periodicidadeCobranca.map((opcao) => (
                        <option key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </option>
                      ))}
                    </select>
                    {erros.periodicidadeCobranca && (
                      <p className="mt-1 text-sm text-cdl-danger-500 font-medium">{erros.periodicidadeCobranca}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cdl-navy-700 mb-2">
                      Dia da Cobrança
                    </label>
                    <input
                      type="number"
                      name="diaCobranca"
                      value={formData.diaCobranca || ''}
                      onChange={handleChange}
                      min="1"
                      max="31"
                      className={inputCls(false)}
                      placeholder="Ex: 10"
                    />
                  </div>
                </div>
              )}

              {/* Desconto */}
              <div className="flex items-start gap-3 p-4 bg-cdl-green-50 border border-cdl-green-100 rounded-lg">
                <input
                  type="checkbox"
                  name="permiteDesconto"
                  checked={formData.permiteDesconto}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                />
                <div className="flex-1">
                  <label className="font-medium text-cdl-green-700">Permite Desconto</label>
                  <p className="text-sm text-cdl-green-600 mt-0.5">
                    Aplicar desconto na cobrança
                  </p>
                </div>

                {formData.permiteDesconto && (
                  <div className="w-32 flex-shrink-0">
                    <input
                      type="number"
                      name="descontoMaximo"
                      value={formData.descontoMaximo || 0}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-right
                                 focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                                 focus:border-cdl-navy-600 bg-white"
                      placeholder="%"
                    />
                    <p className="text-xs text-cdl-green-600 mt-1 font-medium">Máx. %</p>
                  </div>
                )}
              </div>

              {/* Autorização */}
              <div className="flex items-start gap-3 p-4 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg">
                <input
                  type="checkbox"
                  name="exigeAutorizacao"
                  checked={formData.exigeAutorizacao}
                  onChange={handleChange}
                  className="h-4 w-4 mt-0.5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                />
                <div className="flex-1">
                  <label className="font-medium text-cdl-danger-600">Exige Autorização</label>
                  <p className="text-sm text-cdl-danger-500 mt-0.5">
                    Necessário aprovação para faturamento
                  </p>
                </div>

                {formData.exigeAutorizacao && (
                  <div className="w-32 flex-shrink-0">
                    <input
                      type="number"
                      name="nivelAutorizacao"
                      value={formData.nivelAutorizacao || ''}
                      onChange={handleChange}
                      min="1"
                      max="3"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-center
                                 focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                                 focus:border-cdl-navy-600 bg-white"
                      placeholder="Nível"
                    />
                    <p className="text-xs text-cdl-danger-500 mt-1 font-medium">Nível mín.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões do rodapé */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            {/* ✅ FIX: type="button" para não submeter */}
            <button
              type="button"
              onClick={handleCancelar}
              className="px-6 py-3 border border-gray-300 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-50 flex items-center justify-center gap-2 font-medium
                         transition-colors"
            >
              <X size={16} /> Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                         disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center
                         justify-center gap-2 font-medium transition-all active:scale-[.98]"
            >
              {salvando ? (
                <>
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} /> Salvar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProdutoFormPage;