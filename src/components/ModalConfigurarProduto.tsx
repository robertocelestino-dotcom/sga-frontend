// src/components/ModalConfigurarProduto.tsx - VERSÃO CDL

import React, { useState, useEffect } from 'react';
import { ProdutoDisponivel } from '../pages/AssociadoForm';
import { ConfiguracaoProduto, TipoEnvio } from '../types/associadoProduto.types';
import { tipoEnvioService } from '../services/tipoEnvioService';

interface ModalConfigurarProdutoProps {
  produto: ProdutoDisponivel;
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (config: ConfiguracaoProduto) => void;
  valorPadrao: number;
  configuracaoInicial?: ConfiguracaoProduto;
}

const ModalConfigurarProduto: React.FC<ModalConfigurarProdutoProps> = ({
  produto,
  aberto,
  onFechar,
  onSalvar,
  valorPadrao,
  configuracaoInicial,
}) => {
  const [config, setConfig] = useState<ConfiguracaoProduto>(() => {
    if (configuracaoInicial) {
      return {
        ...configuracaoInicial,
        valorDefinido: configuracaoInicial.valorDefinido,
        statusNoProcesso: configuracaoInicial.statusNoProcesso || 'A',
        envioPadrao: configuracaoInicial.envioPadrao ?? false,
        utilizaEnriquecimento: configuracaoInicial.utilizaEnriquecimento ?? false,
        deduzirDoPlano: configuracaoInicial.deduzirDoPlano ?? false,
      };
    }
    return {
      valorDefinido: valorPadrao,
      statusNoProcesso: 'A',
      envioPadrao: false,
      utilizaEnriquecimento: false,
      deduzirDoPlano: false,
    };
  });

  const [tiposEnvio, setTiposEnvio] = useState<TipoEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const isNotificacao =
    produto.tipo?.toUpperCase().includes('NOTIFICAÇÃO') ||
    produto.tipo?.toUpperCase().includes('SPC') ||
    produto.nome?.toUpperCase().includes('NOTIFICAÇÃO');

  useEffect(() => {
    if (aberto && isNotificacao) carregarTiposEnvio();
  }, [aberto, isNotificacao]);

  const carregarTiposEnvio = async () => {
    try {
      setLoading(true);
      const data = await tipoEnvioService.listarAtivos();
      setTiposEnvio(data);
      if (isNotificacao && !config.tipoEnvioId && data.length > 0) {
        const email = data.find((t) => t.codigo === 1);
        setConfig((prev) => ({ ...prev, tipoEnvioId: email?.id || data[0].id }));
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de envio:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarCampos = (): boolean => {
    const novosErros: Record<string, string> = {};
    if (isNotificacao) {
      if (!config.dataAdesao) novosErros.dataAdesao = 'Data de adesão é obrigatória';
      if (!config.dataInicio) novosErros.dataInicio = 'Data de início é obrigatória';
      if (!config.tipoEnvioId) novosErros.tipoEnvioId = 'Tipo de envio é obrigatório';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validarCampos()) return;
    onSalvar({
      ...config,
      valorDefinido: config.valorDefinido === undefined ? undefined : config.valorDefinido,
    });
  };

  if (!aberto) return null;

  const inputBase =
    'w-full px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  return (
    <div className="fixed inset-0 bg-cdl-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-cdl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-cdl-navy-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-cdl-navy-700">
                {configuracaoInicial ? '✏️ Editar Configuração' : '⚙️ Configurar Produto'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {produto.nome} — <span className="font-mono">{produto.codigo}</span>
              </p>
            </div>
            <button
              onClick={onFechar}
              className="p-1 rounded-md text-gray-400 hover:text-cdl-navy-700 hover:bg-cdl-navy-100 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">

            {/* Valor Definido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Definido{' '}
                <span className="text-gray-400 text-xs">
                  (deixe em branco para usar R$ {valorPadrao.toFixed(2)})
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-cdl-navy-700">
                  R$
                </span>
                <input
                  type="number"
                  value={config.valorDefinido || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      valorDefinido: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  step="0.01"
                  className={`${inputBase} pl-10 border-gray-300`}
                  placeholder={valorPadrao.toFixed(2)}
                />
              </div>
              {config.valorDefinido !== undefined && (
                <p className="text-xs text-cdl-navy-600 mt-1">
                  💰 Valor customizado: R$ {config.valorDefinido.toFixed(2)}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status no Processo
              </label>
              <select
                value={config.statusNoProcesso}
                onChange={(e) =>
                  setConfig({ ...config, statusNoProcesso: e.target.value as 'A' | 'I' })
                }
                className={`${inputBase} border-gray-300 bg-white`}
              >
                <option value="A">✅ Ativo</option>
                <option value="I">⛔ Inativo</option>
              </select>
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
              <textarea
                value={config.observacao || ''}
                onChange={(e) => setConfig({ ...config, observacao: e.target.value })}
                rows={3}
                className={`${inputBase} border-gray-300 resize-none`}
                placeholder="Observações sobre este produto..."
              />
            </div>

            {/* Campos para NOTIFICAÇÃO */}
            {isNotificacao && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-md font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
                  🔔 Configurações de Notificação
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Adesão <span className="text-cdl-danger-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={config.dataAdesao || ''}
                      onChange={(e) => setConfig({ ...config, dataAdesao: e.target.value })}
                      className={`${inputBase} ${erros.dataAdesao ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                    />
                    {erros.dataAdesao && (
                      <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.dataAdesao}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Início <span className="text-cdl-danger-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={config.dataInicio || ''}
                      onChange={(e) => setConfig({ ...config, dataInicio: e.target.value })}
                      className={`${inputBase} ${erros.dataInicio ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                    />
                    {erros.dataInicio && (
                      <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.dataInicio}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                    <input
                      type="date"
                      value={config.dataFim || ''}
                      onChange={(e) => setConfig({ ...config, dataFim: e.target.value })}
                      className={`${inputBase} border-gray-300`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Reinício</label>
                    <input
                      type="date"
                      value={config.dataReinicio || ''}
                      onChange={(e) => setConfig({ ...config, dataReinicio: e.target.value })}
                      className={`${inputBase} border-gray-300`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Envio <span className="text-cdl-danger-500">*</span>
                    </label>
                    <select
                      value={config.tipoEnvioId || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          tipoEnvioId: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      className={`${inputBase} bg-white ${erros.tipoEnvioId ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                      disabled={loading}
                    >
                      <option value="">Selecione...</option>
                      {tiposEnvio.map((tipo) => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.descricao} (cód. {tipo.codigo})
                        </option>
                      ))}
                    </select>
                    {erros.tipoEnvioId && (
                      <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.tipoEnvioId}</p>
                    )}
                  </div>

                  {/* Checkboxes */}
                  <div className="md:col-span-2 space-y-3 mt-2 p-4 bg-cdl-navy-50/50 rounded-lg border border-cdl-navy-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.envioPadrao || false}
                        onChange={(e) => setConfig({ ...config, envioPadrao: e.target.checked })}
                        className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">📤 Envio Padrão</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.utilizaEnriquecimento || false}
                        onChange={(e) =>
                          setConfig({ ...config, utilizaEnriquecimento: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">✨ Utiliza Enriquecimento</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.deduzirDoPlano || false}
                        onChange={(e) => setConfig({ ...config, deduzirDoPlano: e.target.checked })}
                        className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">➖ Deduzir do Plano</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Info para produtos não-notificação */}
            {!isNotificacao && (
              <div className="mt-6 p-4 bg-cdl-navy-50 rounded-lg border border-cdl-navy-100">
                <p className="text-sm text-cdl-navy-700">
                  <span className="font-medium">ℹ️ Info:</span> Para este tipo de produto, apenas as
                  configurações básicas estão disponíveis.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-cdl-neutral-50 flex justify-end gap-3">
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
              rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
              hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
          >
            💾 {configuracaoInicial ? 'Atualizar Configuração' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarProduto;