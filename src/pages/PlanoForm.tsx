// src/pages/PlanoForm.tsx - VERSÃO CDL (alinhada a AssociadoForm.tsx)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  planoService,
  PlanoDTO,
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

  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalFranquiaAberto, setModalFranquiaAberto] = useState(false);

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
    periodoFranquia: 'MENSAL',
  });

  const [associacoes, setAssociacoes] = useState<
    Array<{
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
    }>
  >([]);

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
    observacao: '',
  });

  useEffect(() => {
    const carregarDados = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const plano = await planoService.buscarPorId(parseInt(id!));
          setFormData(plano);

          const associacoesExistentes = await planoProdutoFranquiaService.listarPorPlano(
            parseInt(id!)
          );
          setAssociacoes(
            associacoesExistentes.map((a: any, index: number) => ({
              ...a,
              id: `existing-${index}-${Date.now()}`,
            }))
          );
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

  const carregarProdutosDisponiveis = async () => {
    try {
      const response = await produtoService.listar({ size: 1000 });
      setProdutosDisponiveis(response.content || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarFranquiasDisponiveis = async () => {
    try {
      const franquias = await produtoService.listarFranquiasDisponiveis();
      setFranquiasDisponiveis(franquias);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
    }
  };

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

    setFormData((prev) => ({ ...prev, [name]: valorFinal }));

    if (erros[name]) {
      setErros((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelecionarProduto = (produto: any) => {
    setNovaAssociacao((prev) => ({
      ...prev,
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoCodigo: produto.codigo,
    }));
    setModalProdutoAberto(false);
  };

  const handleSelecionarFranquia = (franquia: any) => {
    setNovaAssociacao((prev) => ({
      ...prev,
      franquiaId: franquia.id,
      franquiaNome: franquia.nome,
      franquiaCodigo: franquia.codigo,
      limiteFranquia: franquia.limiteFranquia || 20,
      periodoFranquia: franquia.periodoFranquia || 'MENSAL',
      valorExcedente: franquia.valorExcedente,
    }));
    setModalFranquiaAberto(false);
  };

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

    const existe = associacoes.some((a) => a.produtoId === novaAssociacao.produtoId);
    if (existe) {
      showToast('Este produto já possui uma franquia associada neste plano', 'error');
      return;
    }

    setAssociacoes((prev) => [
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
        valorExcedente: novaAssociacao.valorExcedente,
      },
    ]);

    setNovaAssociacao({ periodoFranquia: 'MENSAL' });
    showToast('Associação adicionada com sucesso!', 'success');
  };

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
    setAssociacoes((prev) => prev.filter((a) => a.id !== id));
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

      if (isEditMode) {
        planoSalvo = await planoService.atualizar(parseInt(id!), formData);
        showToast('Plano atualizado com sucesso!', 'success');
      } else {
        planoSalvo = await planoService.criar(formData);
        showToast('Plano criado com sucesso!', 'success');
      }

      if (associacoes.length > 0 && planoSalvo?.id) {
        let associacoesSalvas = 0;
        let associacoesComErro = 0;

        for (const assoc of associacoes) {
          try {
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
          showToast(
            `${associacoesSalvas} associação(ões) salva(s) com sucesso!`,
            'success'
          );
        } else {
          showToast(
            `${associacoesSalvas} associações salvas, ${associacoesComErro} com erro`,
            'warning'
          );
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
      type: 'warning',
    });

    if (confirmado) navigate('/planos');
  };

  if (loading) return <Loading />;

  // Classe base dos inputs (padrão Associados.tsx)
  const inputBase =
    'w-full px-3 py-2 border rounded-md transition-colors ' +
    'focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  return (
    <div className="p-6">
      <BreadCrumb
        links={[
          { label: 'Planos', path: '/planos' },
          { label: isEditMode ? 'Editar Plano' : 'Novo Plano' },
        ]}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">
            {isEditMode ? 'Editar Plano' : 'Novo Plano'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Atualize as informações do plano'
              : 'Preencha os dados para cadastrar um novo plano'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCancelar}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            ✕ Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 {salvando ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================
            SEÇÃO 1: Informações do Plano
            ============================================================ */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 bg-cdl-navy-50">
            <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
            <h2 className="text-lg font-semibold text-cdl-navy-700">
              📋 Informações do Plano
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`${inputBase} ${
                    erros.nome ? 'border-cdl-danger-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: PLANO 20 MIX 1/1"
                />
                {erros.nome && (
                  <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.nome}</p>
                )}
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor <span className="text-cdl-danger-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-cdl-navy-700">
                    R$
                  </span>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`${inputBase} pl-10 ${
                      erros.valor ? 'border-cdl-danger-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {erros.valor && (
                  <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.valor}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`${inputBase} border-gray-300 bg-white`}
                >
                  <option value="ATIVO">Ativo</option>
                  <option value="INATIVO">Inativo</option>
                </select>
              </div>

              {/* Tipo de Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Plano
                </label>
                <select
                  name="tipoPlano"
                  value={formData.tipoPlano}
                  onChange={handleChange}
                  className={`${inputBase} border-gray-300 bg-white`}
                >
                  <option value="MENSAL">Mensal</option>
                  <option value="ANUAL">Anual</option>
                  <option value="TRIMESTRAL">Trimestral</option>
                  <option value="SEMESTRAL">Semestral</option>
                </select>
              </div>

              {/* Dia do Faturamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia do Faturamento
                </label>
                <input
                  type="number"
                  name="diaFaturamento"
                  value={formData.diaFaturamento}
                  onChange={handleChange}
                  min="1"
                  max="31"
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Quantidade Mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Mínima
                </label>
                <input
                  type="number"
                  name="quantidadeMinima"
                  value={formData.quantidadeMinima}
                  onChange={handleChange}
                  min="1"
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Quantidade Máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Máxima
                </label>
                <input
                  type="number"
                  name="quantidadeMaxima"
                  value={formData.quantidadeMaxima}
                  onChange={handleChange}
                  min="1"
                  className={`${inputBase} border-gray-300`}
                />
              </div>

              {/* Checkboxes */}
              <div className="md:col-span-2 p-4 bg-cdl-navy-50/50 rounded-lg border border-cdl-navy-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="permiteExcedente"
                    checked={formData.permiteExcedente}
                    onChange={handleChange}
                    className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Permite excedente (cobrança adicional)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="faturamentoAntecipado"
                    checked={formData.faturamentoAntecipado}
                    onChange={handleChange}
                    className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Faturamento antecipado
                  </span>
                </label>
              </div>

              {/* Observação */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observação
                </label>
                <textarea
                  name="observacao"
                  value={formData.observacao || ''}
                  onChange={handleChange}
                  rows={3}
                  className={`${inputBase} border-gray-300 resize-none`}
                  placeholder="Observações sobre o plano..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SEÇÃO 2: Produtos e Franquias
            ============================================================ */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 bg-cdl-navy-50">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
              <h2 className="text-lg font-semibold text-cdl-navy-700">
                🎯 Produtos e Franquias do Plano
              </h2>
            </div>
            <span className="text-sm text-gray-500">
              Associe produtos de consulta com suas respectivas franquias
            </span>
          </div>

          <div className="p-6">
            {/* Lista de associações existentes */}
            {associacoes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-cdl-navy-700 mb-3">
                  Produtos inclusos no plano ({associacoes.length})
                </h3>
                <div className="space-y-3">
                  {associacoes.map((assoc) => (
                    <div
                      key={assoc.id}
                      className="bg-cdl-neutral-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-cdl-navy-50 p-3 rounded-lg border border-cdl-navy-100">
                              <p className="text-xs text-cdl-navy-600 mb-1 uppercase tracking-wide font-semibold">
                                📋 Produto
                              </p>
                              <p className="font-medium text-cdl-navy-800">
                                {assoc.produtoNome}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                Código: {assoc.produtoCodigo}
                              </p>
                            </div>
                            <div className="bg-cdl-green-50 p-3 rounded-lg border border-cdl-green-100">
                              <p className="text-xs text-cdl-green-700 mb-1 uppercase tracking-wide font-semibold">
                                📦 Franquia
                              </p>
                              <p className="font-medium text-gray-800">
                                {assoc.franquiaNome}
                              </p>
                              <p className="text-xs text-gray-500 font-mono">
                                Código: {assoc.franquiaCodigo}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Limite incluso
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {assoc.limiteFranquia} consultas
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">
                                Período
                              </p>
                              <p className="text-sm font-medium text-gray-900">
                                {assoc.periodoFranquia}
                              </p>
                            </div>
                            {assoc.valorExcedente !== undefined && (
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">
                                  Valor Excedente
                                </p>
                                <p className="text-sm font-medium text-gray-900">
                                  R$ {assoc.valorExcedente.toFixed(2)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoverAssociacao(
                              assoc.id,
                              parseInt(assoc.id.split('-')[1])
                            )
                          }
                          className="p-1.5 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                          title="Remover associação"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário nova associação */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-cdl-navy-700 mb-4">
                Adicionar produto ao plano
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Produto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto <span className="text-cdl-danger-500">*</span>
                  </label>
                  {!novaAssociacao.produtoId ? (
                    <button
                      type="button"
                      onClick={() => setModalProdutoAberto(true)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-white
                                 hover:bg-cdl-navy-50 flex items-center justify-between text-left
                                 transition-colors focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
                    >
                      <span className="text-gray-500 text-sm">
                        Clique para selecionar um produto...
                      </span>
                      <span className="text-gray-400">🔍</span>
                    </button>
                  ) : (
                    <div className="bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-cdl-navy-800">
                            {novaAssociacao.produtoNome}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            Código: {novaAssociacao.produtoCodigo}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNovaAssociacao((prev) => ({
                              ...prev,
                              produtoId: undefined,
                              produtoNome: undefined,
                              produtoCodigo: undefined,
                            }))
                          }
                          className="text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 p-1 rounded transition-colors"
                          title="Remover seleção"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Franquia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Franquia Associada <span className="text-cdl-danger-500">*</span>
                  </label>
                  {!novaAssociacao.franquiaId ? (
                    <button
                      type="button"
                      onClick={() => setModalFranquiaAberto(true)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-white
                                 hover:bg-cdl-navy-50 flex items-center justify-between text-left
                                 transition-colors focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
                    >
                      <span className="text-gray-500 text-sm">
                        Clique para selecionar uma franquia...
                      </span>
                      <span className="text-gray-400">🔍</span>
                    </button>
                  ) : (
                    <div className="bg-cdl-green-50 border border-cdl-green-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {novaAssociacao.franquiaNome}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            Código: {novaAssociacao.franquiaCodigo}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setNovaAssociacao((prev) => ({
                              ...prev,
                              franquiaId: undefined,
                              franquiaNome: undefined,
                              franquiaCodigo: undefined,
                              limiteFranquia: undefined,
                            }))
                          }
                          className="text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 p-1 rounded transition-colors"
                          title="Remover seleção"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Limite */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite incluso no plano <span className="text-cdl-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={novaAssociacao.limiteFranquia || ''}
                    onChange={(e) =>
                      setNovaAssociacao((prev) => ({
                        ...prev,
                        limiteFranquia: e.target.value ? parseInt(e.target.value) : undefined,
                      }))
                    }
                    min="1"
                    className={`${inputBase} border-gray-300`}
                    placeholder="Ex: 20"
                  />
                </div>

                {/* Período */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período
                  </label>
                  <select
                    value={novaAssociacao.periodoFranquia}
                    onChange={(e) =>
                      setNovaAssociacao((prev) => ({
                        ...prev,
                        periodoFranquia: e.target.value,
                      }))
                    }
                    className={`${inputBase} border-gray-300 bg-white`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor por Consulta Excedente
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-cdl-navy-700">
                      R$
                    </span>
                    <input
                      type="number"
                      value={novaAssociacao.valorExcedente || ''}
                      onChange={(e) =>
                        setNovaAssociacao((prev) => ({
                          ...prev,
                          valorExcedente: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        }))
                      }
                      step="0.01"
                      min="0"
                      className={`${inputBase} pl-10 border-gray-300`}
                      placeholder="0,00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Valor cobrado por consulta além do limite (deixe 0 se não permitir excedente)
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleAdicionarAssociacao}
                  disabled={
                    !novaAssociacao.produtoId ||
                    !novaAssociacao.franquiaId ||
                    !novaAssociacao.limiteFranquia
                  }
                  className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                             hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ➕ Adicionar ao Plano
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé - Botões de ação */}
        <div className="bg-white rounded-lg shadow border border-gray-200 px-6 py-4 bg-cdl-neutral-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancelar}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            ✕ Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 {salvando ? 'Salvando...' : 'Salvar Plano'}
          </button>
        </div>
      </form>

      {/* Modais */}
      <ModalSelecaoProduto
        aberto={modalProdutoAberto}
        onFechar={() => setModalProdutoAberto(false)}
        onSelecionar={handleSelecionarProduto}
        produtosDisponiveis={produtosDisponiveis}
        produtoSelecionadoId={novaAssociacao.produtoId}
      />

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