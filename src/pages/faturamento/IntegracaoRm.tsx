// src/pages/faturamento/IntegracaoRm.tsx - VERSÃO CDL
import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmModal from '../../components/ui/ConfirmModal';
import integracaoRmService, { ConfiguracaoRm, ConfiguracaoRmParametro } from '../../services/integracaoRmService';

/* ============================================================
   MODAL DE CONFIGURAÇÃO
   ============================================================ */
const ModalConfiguracaoRm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  configuracao?: ConfiguracaoRm;
  onSalvar: (config: ConfiguracaoRm) => Promise<void>;
}> = ({ isOpen, onClose, configuracao, onSalvar }) => {
  const { showToast } = useMessage();
  const [formData, setFormData] = useState<ConfiguracaoRm>({
    descricao: '',
    ativo: true,
    tipoMovimento: '2.1.05',
    codigoTmv: '',
    centroCusto: '01.01',
    condicaoPagamento: '99',
    serie: 'RPS',
    contaCaixa: '78',
    codigoServico: '5.949.01',
    municipioServico: '04400',
    ufServico: 'CE',
    parametros: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (configuracao) {
        setFormData({ ...configuracao, parametros: configuracao.parametros || [] });
      } else {
        setFormData({
          descricao: '', ativo: true,
          tipoMovimento: '2.1.05', codigoTmv: '',
          centroCusto: '01.01', condicaoPagamento: '99',
          serie: 'RPS', contaCaixa: '78',
          codigoServico: '5.949.01', municipioServico: '04400',
          ufServico: 'CE', parametros: [],
        });
      }
    }
  }, [isOpen, configuracao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const adicionarParametro = () => {
    const novoParametro: ConfiguracaoRmParametro = {
      chave: '', valor: '', descricao: '', ordem: formData.parametros.length + 1,
    };
    setFormData((prev) => ({ ...prev, parametros: [...prev.parametros, novoParametro] }));
  };

  const atualizarParametro = (index: number, campo: keyof ConfiguracaoRmParametro, valor: any) => {
    const novosParametros = [...formData.parametros];
    novosParametros[index] = { ...novosParametros[index], [campo]: valor };
    setFormData((prev) => ({ ...prev, parametros: novosParametros }));
  };

  const removerParametro = (index: number) => {
    const novosParametros = formData.parametros.filter((_, i) => i !== index);
    novosParametros.forEach((param, i) => (param.ordem = i + 1));
    setFormData((prev) => ({ ...prev, parametros: novosParametros }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao) { showToast('Descrição é obrigatória', 'warning'); return; }
    setLoading(true);
    try { await onSalvar(formData); }
    catch (error) { console.error('Erro ao salvar:', error); }
    finally { setLoading(false); }
  };

  const handleCancelar = (e: React.MouseEvent) => { e.preventDefault(); onClose(); };

  const tiposMovimentoOptions = [
    { value: '2.1.05', label: '2.1.05 - Fatura de Serviço - SPC (RPS) - SPC (RPS)' },
    { value: '2.1.06', label: '2.1.06 - Faturamento - Beneficios NFS-e (RPS)' },
    { value: '2.2.21', label: '2.2.21 - Faturamento - Beneficios / ASSINATURA' },
  ];

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full sm:max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                      max-h-[95vh] sm:max-h-[90vh] flex flex-col border-t-4 border-cdl-navy-700">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center bg-cdl-navy-50 shrink-0">
          <h2 className="text-base sm:text-lg font-semibold text-cdl-navy-700">
            {configuracao ? 'Editar Configuração RM' : 'Nova Configuração RM'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-cdl-navy-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Dados */}
          <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>📋</span> Dados da Configuração
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                  placeholder="Ex: Faturamento Mensal - Associados"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                />
                <label className="text-sm text-cdl-navy-700 font-medium">Configuração Ativa</label>
              </div>
            </div>
          </div>

          {/* Parâmetros */}
          <div className="bg-cdl-neutral-50 border border-cdl-neutral-100 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
              <span>⚙️</span> Parâmetros da Integração
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Tipo Movimento</label>
                <select
                  name="tipoMovimento"
                  value={formData.tipoMovimento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                             focus:border-cdl-navy-600 transition-colors"
                >
                  {tiposMovimentoOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {[
                { label: 'Código TMV', name: 'codigoTmv', placeholder: 'Ex: FAT001' },
                { label: 'Centro de Custo', name: 'centroCusto' },
                { label: 'Condição Pagamento', name: 'condicaoPagamento' },
                { label: 'Série', name: 'serie' },
                { label: 'Conta Caixa', name: 'contaCaixa' },
                { label: 'Código Serviço', name: 'codigoServico' },
                { label: 'Município Serviço', name: 'municipioServico' },
                { label: 'UF Serviço', name: 'ufServico', maxLength: 2 },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Parâmetros adicionais */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-cdl-navy-700 flex items-center gap-2">
                <span>➕</span> Parâmetros Adicionais
              </label>
              <button
                type="button"
                onClick={adicionarParametro}
                className="px-3 py-1.5 text-sm bg-cdl-green-500 text-white rounded-lg
                           hover:bg-cdl-green-600 font-medium transition-all active:scale-[.98]"
              >
                + Adicionar
              </button>
            </div>

            {formData.parametros.map((param, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-2 mb-2 p-3 bg-cdl-neutral-50 rounded-lg border border-cdl-neutral-100">
                <input
                  type="text"
                  placeholder="Chave"
                  value={param.chave}
                  onChange={(e) => atualizarParametro(index, 'chave', e.target.value)}
                  className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                />
                <input
                  type="text"
                  placeholder="Valor"
                  value={param.valor}
                  onChange={(e) => atualizarParametro(index, 'valor', e.target.value)}
                  className="w-full md:w-1/4 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={param.descricao}
                  onChange={(e) => atualizarParametro(index, 'descricao', e.target.value)}
                  className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                />
                <input
                  type="number"
                  placeholder="Ordem"
                  value={param.ordem}
                  onChange={(e) => atualizarParametro(index, 'ordem', parseInt(e.target.value))}
                  className="w-full md:w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-cdl-navy-600"
                />
                <button
                  type="button"
                  onClick={() => removerParametro(index)}
                  className="self-end md:self-center p-2 text-cdl-danger-500 hover:text-cdl-danger-600
                             hover:bg-cdl-danger-50 rounded transition-colors"
                >
                  🗑️
                </button>
              </div>
            ))}

            {formData.parametros.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm bg-cdl-neutral-50 rounded-lg border border-dashed border-cdl-neutral-200">
                Nenhum parâmetro adicional configurado.
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 bg-cdl-neutral-50
                        flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCancelar}
            className="px-4 py-2.5 border border-gray-300 text-cdl-navy-700 rounded-lg
                       hover:bg-cdl-neutral-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       disabled:bg-gray-400 disabled:cursor-not-allowed transition-all
                       active:scale-[.98] flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Salvando...
              </>
            ) : '💾 Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const IntegracaoRm: React.FC = () => {
  const { showToast } = useMessage();
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoRm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [configuracaoEditando, setConfiguracaoEditando] = useState<ConfiguracaoRm | undefined>();
  const [confirmModalAberto, setConfirmModalAberto] = useState(false);
  const [configuracaoParaRemover, setConfiguracaoParaRemover] = useState<ConfiguracaoRm | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(10);
  const [filtroPesquisa, setFiltroPesquisa] = useState('');

  const carregarConfiguracoes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await integracaoRmService.listarConfiguracoes();
      setConfiguracoes(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      showToast('Erro ao carregar configurações RM', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { carregarConfiguracoes(); }, [carregarConfiguracoes]);

  const handleSalvar = async (config: ConfiguracaoRm) => {
    try {
      if (config.id) {
        await integracaoRmService.atualizarConfiguracao(config.id, config);
        showToast('Configuração atualizada com sucesso!', 'success');
      } else {
        await integracaoRmService.criarConfiguracao(config);
        showToast('Configuração criada com sucesso!', 'success');
      }
      await carregarConfiguracoes();
      setModalAberto(false);
      setConfiguracaoEditando(undefined);
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar configuração', 'error');
      throw error;
    }
  };

  const handleAbrirModalNova = () => {
    setConfiguracaoEditando(undefined);
    setModalAberto(true);
  };

  const handleEditar = (config: ConfiguracaoRm) => {
    setConfiguracaoEditando(config);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setConfiguracaoEditando(undefined);
  };

  const handleRemoverClick = (config: ConfiguracaoRm) => {
    setConfiguracaoParaRemover(config);
    setConfirmModalAberto(true);
  };

  const handleConfirmarRemover = async () => {
    if (configuracaoParaRemover) {
      try {
        await integracaoRmService.excluirConfiguracao(configuracaoParaRemover.id!);
        showToast('Configuração removida com sucesso!', 'success');
        await carregarConfiguracoes();
      } catch (error) {
        console.error('Erro ao remover configuração:', error);
        showToast('Erro ao remover configuração', 'error');
      } finally {
        setConfirmModalAberto(false);
        setConfiguracaoParaRemover(null);
      }
    }
  };

  const configuracoesFiltradas = configuracoes.filter((config) =>
    config.descricao.toLowerCase().includes(filtroPesquisa.toLowerCase())
  );

  const totalPaginas = Math.ceil(configuracoesFiltradas.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const configuracoesPaginadas = configuracoesFiltradas.slice(inicio, fim);

  const limparFiltro = () => {
    setFiltroPesquisa('');
    setPaginaAtual(1);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (ativo: boolean) => (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
      ativo ? 'bg-cdl-green-100 text-cdl-green-700' : 'bg-cdl-danger-50 text-cdl-danger-500'
    }`}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb items={[
        { label: 'Faturamento', path: '/faturamento/regua' },
        { label: 'Integração RM' },
      ]} />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700">Configurações de Integração RM</h1>
            <p className="text-gray-600 mt-1">
              Configure as regras para exportação dos arquivos para o sistema TOTVS RM
            </p>
          </div>
          <button
            onClick={handleAbrirModalNova}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                       flex items-center gap-2 font-medium transition-all active:scale-[.98]"
          >
            <span className="text-lg">+</span>
            Nova Configuração
          </button>
        </div>

        {/* Barra de pesquisa */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="🔍 Pesquisar por descrição..."
              value={filtroPesquisa}
              onChange={(e) => {
                setFiltroPesquisa(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors"
            />
            {filtroPesquisa && (
              <button
                onClick={limparFiltro}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cdl-navy-700"
              >✕</button>
            )}
          </div>
          {filtroPesquisa && (
            <div className="text-sm text-cdl-navy-600 mt-1">
              Encontradas <strong>{configuracoesFiltradas.length}</strong> configuração(ões)
            </div>
          )}
        </div>

        {/* Tabela / Empty */}
        {configuracoesFiltradas.length === 0 ? (
          <EmptyState
            icon="🔌"
            title={filtroPesquisa ? 'Nenhuma configuração encontrada' : 'Nenhuma configuração RM cadastrada'}
            description={
              filtroPesquisa
                ? `Nada encontrado para "${filtroPesquisa}". Tente ajustar a busca.`
                : 'Crie a primeira configuração para integrar com o TOTRM.'
            }
            action={
              filtroPesquisa ? (
                <button
                  onClick={limparFiltro}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  🔄 Limpar busca
                </button>
              ) : (
                <button
                  onClick={handleAbrirModalNova}
                  className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  ➕ Criar Configuração
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['ID','Descrição','Tipo Movimento','Centro Custo','Status','Criado em','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          i === 6 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configuracoesPaginadas.map((config) => (
                    <tr key={config.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-cdl-navy-700">
                        {config.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{config.descricao}</div>
                        {config.parametros && config.parametros.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {config.parametros.length} parâmetro(s) adicional(is)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {config.tipoMovimento}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {config.centroCusto}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {getStatusBadge(config.ativo)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(config.criadoEm)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditar(config)}
                            className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                            title="Editar"
                          >✏️</button>
                          <button
                            onClick={() => handleRemoverClick(config)}
                            className="p-1.5 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                            title="Remover"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando <strong className="text-cdl-navy-700">{inicio + 1}</strong> -{" "}
                  <strong className="text-cdl-navy-700">{Math.min(fim, configuracoesFiltradas.length)}</strong>{" "}
                  de <strong className="text-cdl-navy-700">{configuracoesFiltradas.length}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium
                               text-cdl-navy-700 disabled:opacity-50 disabled:cursor-not-allowed
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors"
                  >◀ Anterior</button>
                  <span className="px-3 py-1.5 text-sm text-gray-700">
                    Página <strong className="text-cdl-navy-700">{paginaAtual}</strong> de{" "}
                    <strong className="text-cdl-navy-700">{totalPaginas}</strong>
                  </span>
                  <button
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium
                               text-cdl-navy-700 disabled:opacity-50 disabled:cursor-not-allowed
                               hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors"
                  >Próxima ▶</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ModalConfiguracaoRm
        isOpen={modalAberto}
        onClose={handleFecharModal}
        configuracao={configuracaoEditando}
        onSalvar={handleSalvar}
      />

      <ConfirmModal
        isOpen={confirmModalAberto}
        onClose={() => setConfirmModalAberto(false)}
        onConfirm={handleConfirmarRemover}
        title="Confirmar Remoção"
        message={`Tem certeza que deseja remover a configuração "${configuracaoParaRemover?.descricao}"?\n\nEsta ação não poderá ser desfeita.`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default IntegracaoRm;