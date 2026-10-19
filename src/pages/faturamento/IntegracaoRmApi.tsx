// src/pages/faturamento/IntegracaoRmApi.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useEffect } from 'react';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { rmApiService } from '../../services/rmApiService';
import { RmApiConfig } from '../../types/rmApi.types';

const IntegracaoRmApi: React.FC = () => {
  const { showToast, showConfirm } = useMessage();

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [configs, setConfigs] = useState<RmApiConfig[]>([]);
  const [config, setConfig] = useState<RmApiConfig>({
    nome: '',
    descricao: '',
    wsUrl: 'http://localhost:8051/wsMov/MEX?wsdl',
    wsUsername: 'mestre',
    wsPassword: 'totvs',
    wsColigada: '1',
    wsSistema: 'T',
    wsUsuario: 'mestre',
    wsDataServer: 'MovMovimentoTBCData',
    wsTimeout: 30000,
    wsTentativas: 3,
    wsAutoReconnect: true,
    ativo: true,
    integracaoAutomatica: false,
  });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => { carregarConfiguracoes(); }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      const data = await rmApiService.listarConfiguracoes();
      setConfigs(data);
      if (data.length > 0 && !editandoId) {
        const ativa = data.find((c) => c.ativo);
        if (ativa) {
          setConfig(ativa);
          setEditandoId(ativa.id || null);
        }
      }
    } catch (error) {
      showToast('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!config.nome.trim()) { showToast('Nome é obrigatório', 'error'); return; }
    setSalvando(true);
    try {
      if (editandoId) {
        await rmApiService.atualizarConfiguracao(editandoId, config);
        showToast('Configuração atualizada com sucesso!', 'success');
      } else {
        const nova = await rmApiService.criarConfiguracao(config);
        setEditandoId(nova.id || null);
        showToast('Configuração criada com sucesso!', 'success');
      }
      await carregarConfiguracoes();
      setMostrarForm(false);
    } catch (error) {
      showToast('Erro ao salvar configuração', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleAtivar = async (id: number) => {
    try {
      await rmApiService.ativarConfiguracao(id);
      showToast('Configuração ativada com sucesso!', 'success');
      await carregarConfiguracoes();
    } catch (error) {
      showToast('Erro ao ativar configuração', 'error');
    }
  };

  const handleExcluir = async (id: number) => {
    const confirmado = await showConfirm({
      title: '🗑️ Excluir Configuração',
      message: 'Tem certeza que deseja excluir esta configuração?\n\nEsta ação não poderá ser desfeita.',
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!confirmado) return;

    try {
      await rmApiService.excluirConfiguracao(id);
      showToast('Configuração excluída com sucesso!', 'success');
      await carregarConfiguracoes();
      if (editandoId === id) {
        setEditandoId(null);
        setConfig({
          nome: '', descricao: '',
          wsUrl: 'http://localhost:8051/wsMov/MEX?wsdl',
          wsUsername: 'mestre', wsPassword: 'totvs',
          wsColigada: '1', wsSistema: 'T', wsUsuario: 'mestre',
          wsDataServer: 'MovMovimentoTBCData',
          wsTimeout: 30000, wsTentativas: 3,
          wsAutoReconnect: true, ativo: true,
          integracaoAutomatica: false,
        });
      }
    } catch (error) {
      showToast('Erro ao excluir configuração', 'error');
    }
  };

  const handleTestarConexao = async () => {
    if (!config.wsUrl) { showToast('URL do WebService é obrigatória', 'error'); return; }
    setTestando(true);
    try {
      const resultado = await rmApiService.testarConexao(config);
      if (resultado) showToast('✅ Conexão estabelecida com sucesso!', 'success');
      else showToast('❌ Falha na conexão. Verifique as configurações.', 'error');
    } catch (error) {
      showToast('Erro ao testar conexão', 'error');
    } finally {
      setTestando(false);
    }
  };

  const handleNovaConfig = () => {
    setConfig({
      nome: '', descricao: '',
      wsUrl: 'http://localhost:8051/wsMov/MEX?wsdl',
      wsUsername: 'mestre', wsPassword: 'totvs',
      wsColigada: '1', wsSistema: 'T', wsUsuario: 'mestre',
      wsDataServer: 'MovMovimentoTBCData',
      wsTimeout: 30000, wsTentativas: 3,
      wsAutoReconnect: true, ativo: true,
      integracaoAutomatica: false,
    });
    setEditandoId(null);
    setMostrarForm(true);
  };

  if (loading) return <Loading />;

  // Classes utilitárias
  const inputBase =
    'w-full px-3 py-2 border border-gray-300 rounded-md bg-white transition-colors ' +
    'focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  return (
    <div className="p-6">
      <BreadCrumb atual="Integração RM API" />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Integração RM via API</h1>
          <p className="text-gray-600">
            Configure a integração com o TOTVS RM utilizando WebService (TBC)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleNovaConfig}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
          >
            ➕ Nova Configuração
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {/* Lista de configurações */}
        {configs.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-neutral-50">
            <h2 className="text-sm font-semibold text-cdl-navy-700 mb-3">
              Configurações Existentes ({configs.length})
            </h2>
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Nome','URL','Status','Ações'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-6 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                          i === 3 ? 'text-center' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {configs.map((c) => (
                    <tr key={c.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.nome}</div>
                        <div className="text-xs text-gray-500">{c.descricao}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs font-mono" title={c.wsUrl}>
                        {c.wsUrl}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            c.ativo
                              ? 'bg-cdl-green-100 text-cdl-green-700'
                              : 'bg-cdl-neutral-100 text-cdl-neutral-500'
                          }`}>
                            {c.ativo ? '✅ Ativo' : 'Inativo'}
                          </span>
                          {c.integracaoAutomatica && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cdl-navy-100 text-cdl-navy-700">
                              🤖 Automático
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setConfig(c);
                              setEditandoId(c.id || null);
                              setMostrarForm(true);
                            }}
                            className="p-1 text-cdl-yellow-600 hover:text-cdl-yellow-700 hover:bg-cdl-yellow-50 rounded transition-colors"
                            title="Editar"
                          >✏️</button>
                          {!c.ativo && (
                            <button
                              onClick={() => handleAtivar(c.id!)}
                              className="p-1 text-cdl-green-600 hover:text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                              title="Ativar"
                            >🔛</button>
                          )}
                          <button
                            onClick={() => handleExcluir(c.id!)}
                            className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                            title="Excluir"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {configs.length === 0 && !mostrarForm && (
          <EmptyState
            icon="🔌"
            title="Nenhuma configuração encontrada"
            description="Crie a primeira configuração de WebService para começar a integrar com o TOTVS RM."
            action={
              <button
                onClick={handleNovaConfig}
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ➕ Criar Configuração
              </button>
            }
          />
        )}

        {/* Formulário */}
        {(mostrarForm || configs.length === 0) && (
          <div className={configs.length > 0 ? 'border-t border-gray-200' : ''}>
            <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
              <h3 className="text-lg font-semibold text-cdl-navy-700">
                {editandoId ? '✏️ Editar Configuração' : '➕ Nova Configuração'}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Configuração <span className="text-cdl-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.nome}
                    onChange={(e) => setConfig({ ...config, nome: e.target.value })}
                    className={inputBase}
                    placeholder="Ex: Configuração Produção - TBC"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={config.descricao || ''}
                    onChange={(e) => setConfig({ ...config, descricao: e.target.value })}
                    className={inputBase}
                    placeholder="Descrição da configuração"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do WebService <span className="text-cdl-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={config.wsUrl}
                    onChange={(e) => setConfig({ ...config, wsUrl: e.target.value })}
                    className={`${inputBase} font-mono text-sm`}
                    placeholder="http://localhost:8051/wsMov/MEX?wsdl"
                  />
                </div>

                {[
                  { label: 'Usuário', value: config.wsUsername, key: 'wsUsername' },
                  { label: 'Senha', value: config.wsPassword, key: 'wsPassword', type: 'password' },
                  { label: 'Coligada', value: config.wsColigada, key: 'wsColigada' },
                  { label: 'Sistema', value: config.wsSistema, key: 'wsSistema' },
                  { label: 'Usuário do Sistema', value: config.wsUsuario, key: 'wsUsuario' },
                  { label: 'DataServer', value: config.wsDataServer, key: 'wsDataServer', placeholder: 'MovMovimentoTBCData' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      type={field.type || 'text'}
                      value={field.value}
                      onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                      className={inputBase}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
                  <input
                    type="number"
                    value={config.wsTimeout}
                    onChange={(e) => setConfig({ ...config, wsTimeout: parseInt(e.target.value) })}
                    className={inputBase}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tentativas</label>
                  <input
                    type="number"
                    value={config.wsTentativas}
                    onChange={(e) => setConfig({ ...config, wsTentativas: parseInt(e.target.value) })}
                    className={inputBase}
                  />
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2 flex flex-wrap items-center gap-5 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.wsAutoReconnect}
                      onChange={(e) => setConfig({ ...config, wsAutoReconnect: e.target.checked })}
                      className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <span className="text-sm text-gray-700 font-medium">Auto Reconnect</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.integracaoAutomatica}
                      onChange={(e) => setConfig({ ...config, integracaoAutomatica: e.target.checked })}
                      className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <span className="text-sm text-gray-700 font-medium">Integração Automática</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.ativo}
                      onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
                      className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <span className="text-sm text-gray-700 font-medium">Ativo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleTestarConexao}
                disabled={testando}
                className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                           rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {testando ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-cdl-navy-700 border-t-transparent animate-spin" />
                    Testando...
                  </>
                ) : '🧪 Testar Conexão'}
              </button>

              <button
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                           rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors font-medium"
              >
                Cancelar
              </button>

              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                           hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <>
                    <span className="inline-block w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Salvando...
                  </>
                ) : '💾 Salvar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegracaoRmApi;