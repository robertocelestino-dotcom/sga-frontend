// src/pages/faturamento/IntegracaoRm.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import integracaoRmService, { ConfiguracaoRm, ConfiguracaoRmParametro } from '../../services/integracaoRmService';

// Modal de Configuração
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
    parametros: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (configuracao) {
        setFormData({
          ...configuracao,
          parametros: configuracao.parametros || []
        });
      } else {
        setFormData({
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
          parametros: []
        });
      }
    }
  }, [isOpen, configuracao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const adicionarParametro = () => {
    const novoParametro: ConfiguracaoRmParametro = {
      chave: '',
      valor: '',
      descricao: '',
      ordem: formData.parametros.length + 1
    };
    setFormData(prev => ({
      ...prev,
      parametros: [...prev.parametros, novoParametro]
    }));
  };

  const atualizarParametro = (index: number, campo: keyof ConfiguracaoRmParametro, valor: any) => {
    const novosParametros = [...formData.parametros];
    novosParametros[index] = { ...novosParametros[index], [campo]: valor };
    setFormData(prev => ({ ...prev, parametros: novosParametros }));
  };

  const removerParametro = (index: number) => {
    const novosParametros = formData.parametros.filter((_, i) => i !== index);
    novosParametros.forEach((param, i) => param.ordem = i + 1);
    setFormData(prev => ({ ...prev, parametros: novosParametros }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao) {
      showToast('Descrição é obrigatória', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      await onSalvar(formData);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  const tiposMovimentoOptions = [
    { value: '2.1.05', label: '2.1.05 - Fatura de Serviço - SPC (RPS) - SPC (RPS)' },
    { value: '2.1.06', label: '2.1.06 - Faturamento - Beneficios NFS-e (RPS)' },
    { value: '2.2.21', label: '2.2.21 - Faturamento - Beneficios / ASSINATURA' }
  ];

  if (!isOpen) return null;

  return (
    <Modal title={configuracao ? 'Editar Configuração RM' : 'Nova Configuração RM'} onClose={onClose} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-blue-800 mb-3">📋 Dados da Configuração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
              <input
                type="text"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Faturamento Mensal - Associados"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label className="text-sm text-gray-700">Configuração Ativa</label>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-md font-semibold text-gray-700 mb-3">⚙️ Parâmetros da Integração</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Movimento</label>
              <select
                name="tipoMovimento"
                value={formData.tipoMovimento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {tiposMovimentoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código TMV</label>
              <input
                type="text"
                name="codigoTmv"
                value={formData.codigoTmv}
                onChange={handleChange}
                placeholder="Ex: FAT001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Custo</label>
              <input
                type="text"
                name="centroCusto"
                value={formData.centroCusto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condição Pagamento</label>
              <input
                type="text"
                name="condicaoPagamento"
                value={formData.condicaoPagamento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Série</label>
              <input
                type="text"
                name="serie"
                value={formData.serie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta Caixa</label>
              <input
                type="text"
                name="contaCaixa"
                value={formData.contaCaixa}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Serviço</label>
              <input
                type="text"
                name="codigoServico"
                value={formData.codigoServico}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Município Serviço</label>
              <input
                type="text"
                name="municipioServico"
                value={formData.municipioServico}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF Serviço</label>
              <input
                type="text"
                name="ufServico"
                value={formData.ufServico}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">➕ Parâmetros Adicionais</label>
            <button
              type="button"
              onClick={adicionarParametro}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Adicionar Parâmetro
            </button>
          </div>

          {formData.parametros.map((param, index) => (
            <div key={index} className="flex gap-3 mb-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-1/4">
                <input
                  type="text"
                  placeholder="Chave"
                  value={param.chave}
                  onChange={(e) => atualizarParametro(index, 'chave', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="w-1/4">
                <input
                  type="text"
                  placeholder="Valor"
                  value={param.valor}
                  onChange={(e) => atualizarParametro(index, 'valor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="w-1/3">
                <input
                  type="text"
                  placeholder="Descrição"
                  value={param.descricao}
                  onChange={(e) => atualizarParametro(index, 'descricao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  placeholder="Ordem"
                  value={param.ordem}
                  onChange={(e) => atualizarParametro(index, 'ordem', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removerParametro(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800"
              >
                🗑️
              </button>
            </div>
          ))}

          {formData.parametros.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
              Nenhum parâmetro adicional configurado.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={handleCancelar} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Salvando...' : '💾 Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Componente Principal
const IntegracaoRm: React.FC = () => {
  const { showToast } = useMessage();
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoRm[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [configuracaoEditando, setConfiguracaoEditando] = useState<ConfiguracaoRm | undefined>();
  const [confirmModalAberto, setConfirmModalAberto] = useState(false);
  const [configuracaoParaRemover, setConfiguracaoParaRemover] = useState<ConfiguracaoRm | null>(null);
  
  // Paginação
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

  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

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

  // Filtrar configurações
  const configuracoesFiltradas = configuracoes.filter(config =>
    config.descricao.toLowerCase().includes(filtroPesquisa.toLowerCase())
  );

  // Paginação
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

  const getStatusBadge = (ativo: boolean) => {
    if (ativo) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ativo</span>;
    }
    return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inativo</span>;
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb 
        items={[
          { label: 'Faturamento', path: '/faturamento/regua' },
          { label: 'Integração RM' }
        ]}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Configurações de Integração RM</h1>
            <p className="text-gray-600 mt-1">
              Configure as regras para exportação dos arquivos para o sistema TOTVS RM
            </p>
          </div>
          <button
            onClick={handleAbrirModalNova}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <span className="text-lg">+</span>
            Nova Configuração
          </button>
        </div>

        {/* Barra de Pesquisa */}
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
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {filtroPesquisa && (
              <button
                onClick={limparFiltro}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {filtroPesquisa && (
            <div className="text-sm text-gray-500 mt-1">
              Encontradas {configuracoesFiltradas.length} configuração(ões)
            </div>
          )}
        </div>

        {/* Grid em Tabela */}
        {configuracoesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Nenhuma configuração RM cadastrada</p>
            <button
              onClick={handleAbrirModalNova}
              className="mt-3 text-blue-600 hover:text-blue-800"
            >
              Clique aqui para criar uma configuração
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo Movimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Centro Custo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configuracoesPaginadas.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {config.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{config.descricao}</div>
                        {config.parametros && config.parametros.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {config.parametros.length} parâmetro(s) adicional(is)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {config.tipoMovimento}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {config.centroCusto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(config.ativo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(config.criadoEm)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditar(config)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemoverClick(config)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remover"
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

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mt-4">
                <div className="text-sm text-gray-500">
                  Mostrando {inicio + 1} - {Math.min(fim, configuracoesFiltradas.length)} de {configuracoesFiltradas.length} configurações
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ◀ Anterior
                  </button>
                  <span className="px-3 py-1 text-gray-600">
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima ▶
                  </button>
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
        message={`Tem certeza que deseja remover a configuração "${configuracaoParaRemover?.descricao}"? Esta ação não poderá ser desfeita.`}
        confirmText="Sim, Remover"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default IntegracaoRm;