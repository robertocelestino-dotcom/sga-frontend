// src/pages/faturamento/IntegracaoRmApi.tsx

import React, { useState, useEffect } from 'react';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import { rmApiService } from '../../services/rmApiService';
import { RmApiConfig } from '../../types/rmApi.types';

const IntegracaoRmApi: React.FC = () => {
    const { showToast } = useMessage();
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
        integracaoAutomatica: false
    });
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [mostrarForm, setMostrarForm] = useState(false);

    useEffect(() => {
        carregarConfiguracoes();
    }, []);

    const carregarConfiguracoes = async () => {
        setLoading(true);
        try {
            const data = await rmApiService.listarConfiguracoes();
            setConfigs(data);
            
            // Se tiver configurações e não estiver editando, carrega a ativa
            if (data.length > 0 && !editandoId) {
                const ativa = data.find(c => c.ativo);
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
        if (!config.nome.trim()) {
            showToast('Nome é obrigatório', 'error');
            return;
        }

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
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

        try {
            await rmApiService.excluirConfiguracao(id);
            showToast('Configuração excluída com sucesso!', 'success');
            await carregarConfiguracoes();
            if (editandoId === id) {
                setEditandoId(null);
                setConfig({
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
                    integracaoAutomatica: false
                });
            }
        } catch (error) {
            showToast('Erro ao excluir configuração', 'error');
        }
    };

    const handleTestarConexao = async () => {
        if (!config.wsUrl) {
            showToast('URL do WebService é obrigatória', 'error');
            return;
        }

        setTestando(true);
        try {
            const resultado = await rmApiService.testarConexao(config);
            if (resultado) {
                showToast('✅ Conexão estabelecida com sucesso!', 'success');
            } else {
                showToast('❌ Falha na conexão. Verifique as configurações.', 'error');
            }
        } catch (error) {
            showToast('Erro ao testar conexão', 'error');
        } finally {
            setTestando(false);
        }
    };

    const handleNovaConfig = () => {
        setConfig({
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
            integracaoAutomatica: false
        });
        setEditandoId(null);
        setMostrarForm(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loading size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <BreadCrumb atual="Integração RM API" />

            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🔌 Integração RM via API</h1>
                        <p className="text-gray-600 mt-1">
                            Configure a integração com o TOTVS RM utilizando WebService (TBC)
                        </p>
                    </div>
                    <button
                        onClick={handleNovaConfig}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <span>➕</span> Nova Configuração
                    </button>
                </div>

                {/* Lista de Configurações */}
                {configs.length > 0 && (
                    <div className="mb-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {configs.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{c.nome}</div>
                                            <div className="text-sm text-gray-500">{c.descricao}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                                            {c.wsUrl}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                c.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {c.ativo ? '✅ Ativo' : 'Inativo'}
                                            </span>
                                            {c.integracaoAutomatica && (
                                                <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    🤖 Automático
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setConfig(c);
                                                        setEditandoId(c.id || null);
                                                        setMostrarForm(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    ✏️
                                                </button>
                                                {!c.ativo && (
                                                    <button
                                                        onClick={() => handleAtivar(c.id!)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        🔛
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleExcluir(c.id!)}
                                                    className="text-red-600 hover:text-red-900"
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
                )}

                {/* Formulário de Configuração */}
                {(mostrarForm || configs.length === 0) && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            {editandoId ? '✏️ Editar Configuração' : '➕ Nova Configuração'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome da Configuração *
                                </label>
                                <input
                                    type="text"
                                    value={config.nome}
                                    onChange={(e) => setConfig({...config, nome: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Configuração Produção - TBC"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                </label>
                                <input
                                    type="text"
                                    value={config.descricao || ''}
                                    onChange={(e) => setConfig({...config, descricao: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Descrição da configuração"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL do WebService *
                                </label>
                                <input
                                    type="text"
                                    value={config.wsUrl}
                                    onChange={(e) => setConfig({...config, wsUrl: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="http://localhost:8051/wsMov/MEX?wsdl"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuário
                                </label>
                                <input
                                    type="text"
                                    value={config.wsUsername}
                                    onChange={(e) => setConfig({...config, wsUsername: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    value={config.wsPassword}
                                    onChange={(e) => setConfig({...config, wsPassword: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Coligada
                                </label>
                                <input
                                    type="text"
                                    value={config.wsColigada}
                                    onChange={(e) => setConfig({...config, wsColigada: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Sistema
                                </label>
                                <input
                                    type="text"
                                    value={config.wsSistema}
                                    onChange={(e) => setConfig({...config, wsSistema: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Usuário do Sistema
                                </label>
                                <input
                                    type="text"
                                    value={config.wsUsuario}
                                    onChange={(e) => setConfig({...config, wsUsuario: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    DataServer
                                </label>
                                <input
                                    type="text"
                                    value={config.wsDataServer}
                                    onChange={(e) => setConfig({...config, wsDataServer: e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="MovMovimentoTBCData"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Timeout (ms)
                                </label>
                                <input
                                    type="number"
                                    value={config.wsTimeout}
                                    onChange={(e) => setConfig({...config, wsTimeout: parseInt(e.target.value)})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tentativas
                                </label>
                                <input
                                    type="number"
                                    value={config.wsTentativas}
                                    onChange={(e) => setConfig({...config, wsTentativas: parseInt(e.target.value)})}
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={config.wsAutoReconnect}
                                        onChange={(e) => setConfig({...config, wsAutoReconnect: e.target.checked})}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Auto Reconnect</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={config.integracaoAutomatica}
                                        onChange={(e) => setConfig({...config, integracaoAutomatica: e.target.checked})}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Integração Automática</span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={config.ativo}
                                        onChange={(e) => setConfig({...config, ativo: e.target.checked})}
                                        className="h-4 w-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Ativo</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleTestarConexao}
                                disabled={testando}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {testando ? 'Testando...' : '🧪 Testar Conexão'}
                            </button>

                            <button
                                onClick={handleSalvar}
                                disabled={salvando}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {salvando ? 'Salvando...' : '💾 Salvar'}
                            </button>

                            <button
                                onClick={() => setMostrarForm(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {configs.length === 0 && !mostrarForm && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhuma configuração encontrada.</p>
                        <p className="text-sm text-gray-400 mt-1">Clique em "Nova Configuração" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntegracaoRmApi;