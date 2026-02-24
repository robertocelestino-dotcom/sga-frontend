// src/components/ModalConfigurarProduto.tsx

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
  configuracaoInicial?: ConfiguracaoProduto; // NOVO: para edição
}

const ModalConfigurarProduto: React.FC<ModalConfigurarProdutoProps> = ({
  produto,
  aberto,
  onFechar,
  onSalvar,
  valorPadrao,
  configuracaoInicial
}) => {
  const [config, setConfig] = useState<ConfiguracaoProduto>(() => {
    if (configuracaoInicial) {
      // Se tem configuração inicial, usar ela
      return {
        ...configuracaoInicial,
        valorDefinido: configuracaoInicial.valorDefinido,
        statusNoProcesso: configuracaoInicial.statusNoProcesso || 'A',
        envioPadrao: configuracaoInicial.envioPadrao ?? false,
        utilizaEnriquecimento: configuracaoInicial.utilizaEnriquecimento ?? false,
        deduzirDoPlano: configuracaoInicial.deduzirDoPlano ?? false
      };
    }
    // Configuração padrão para novo produto
    return {
      valorDefinido: valorPadrao,
      statusNoProcesso: 'A',
      envioPadrao: false,
      utilizaEnriquecimento: false,
      deduzirDoPlano: false
    };
  });

  const [tiposEnvio, setTiposEnvio] = useState<TipoEnvio[]>([]);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Verificar se é produto de notificação
  const isNotificacao = produto.tipo?.toUpperCase().includes('NOTIFICAÇÃO') || 
                        produto.tipo?.toUpperCase().includes('SPC') ||
                        produto.nome?.toUpperCase().includes('NOTIFICAÇÃO');

  // Carregar tipos de envio quando o modal abrir (se for notificação)
  useEffect(() => {
    if (aberto && isNotificacao) {
      carregarTiposEnvio();
    }
  }, [aberto, isNotificacao]);

  const carregarTiposEnvio = async () => {
    try {
      setLoading(true);
      const data = await tipoEnvioService.listarAtivos();
      setTiposEnvio(data);
      
      // Se não tiver tipo selecionado e for notificação, seleciona EMAIL (código 1)
      if (isNotificacao && !config.tipoEnvioId && data.length > 0) {
        const email = data.find(t => t.codigo === 1);
        setConfig(prev => ({ ...prev, tipoEnvioId: email?.id || data[0].id }));
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
      if (!config.dataAdesao) {
        novosErros.dataAdesao = 'Data de adesão é obrigatória';
      }
      if (!config.dataInicio) {
        novosErros.dataInicio = 'Data de início é obrigatória';
      }
      if (!config.tipoEnvioId) {
        novosErros.tipoEnvioId = 'Tipo de envio é obrigatório';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validarCampos()) {
      return;
    }
    
    // Garantir que o valorDefinido seja enviado corretamente
    const configParaSalvar = {
      ...config,
      valorDefinido: config.valorDefinido === undefined ? undefined : config.valorDefinido
    };
    
    onSalvar(configParaSalvar);
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {configuracaoInicial ? 'Editar Configuração' : 'Configurar Produto'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {produto.nome} - {produto.codigo}
              </p>
            </div>
            <button
              onClick={onFechar}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Valor Definido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Definido <span className="text-gray-500 text-xs">(deixe em branco para usar R$ {valorPadrao.toFixed(2)})</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={config.valorDefinido || ''}
                  onChange={(e) => setConfig({ ...config, valorDefinido: e.target.value ? parseFloat(e.target.value) : undefined })}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Valor padrão: R$ ${valorPadrao.toFixed(2)}`}
                />
                <span className="text-sm text-gray-500">R$</span>
              </div>
              {config.valorDefinido && (
                <p className="text-xs text-blue-600 mt-1">
                  Valor customizado: R$ {config.valorDefinido.toFixed(2)}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status no Processo
              </label>
              <select
                value={config.statusNoProcesso}
                onChange={(e) => setConfig({ ...config, statusNoProcesso: e.target.value as 'A' | 'I' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">Ativo</option>
                <option value="I">Inativo</option>
              </select>
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observação
              </label>
              <textarea
                value={config.observacao || ''}
                onChange={(e) => setConfig({ ...config, observacao: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observações sobre este produto..."
              />
            </div>

            {/* Campos específicos para NOTIFICAÇÃO */}
            {isNotificacao && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4">
                  Configurações de Notificação
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Adesão */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Adesão <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={config.dataAdesao || ''}
                      onChange={(e) => setConfig({ ...config, dataAdesao: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        erros.dataAdesao ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {erros.dataAdesao && (
                      <p className="mt-1 text-sm text-red-600">{erros.dataAdesao}</p>
                    )}
                  </div>

                  {/* Data Início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={config.dataInicio || ''}
                      onChange={(e) => setConfig({ ...config, dataInicio: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        erros.dataInicio ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {erros.dataInicio && (
                      <p className="mt-1 text-sm text-red-600">{erros.dataInicio}</p>
                    )}
                  </div>

                  {/* Data Fim */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={config.dataFim || ''}
                      onChange={(e) => setConfig({ ...config, dataFim: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Data Reinício */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Reinício
                    </label>
                    <input
                      type="date"
                      value={config.dataReinicio || ''}
                      onChange={(e) => setConfig({ ...config, dataReinicio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tipo de Envio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Envio <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.tipoEnvioId || ''}
                      onChange={(e) => setConfig({ ...config, tipoEnvioId: e.target.value ? parseInt(e.target.value) : undefined })}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        erros.tipoEnvioId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <option value="">Selecione...</option>
                      {tiposEnvio.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.descricao} (cód. {tipo.codigo})
                        </option>
                      ))}
                    </select>
                    {erros.tipoEnvioId && (
                      <p className="mt-1 text-sm text-red-600">{erros.tipoEnvioId}</p>
                    )}
                  </div>

                  {/* Opções booleanas */}
                  <div className="md:col-span-2 space-y-4 mt-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="envioPadrao"
                        checked={config.envioPadrao || false}
                        onChange={(e) => setConfig({ ...config, envioPadrao: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="envioPadrao" className="text-sm text-gray-700">
                        Envio Padrão
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="utilizaEnriquecimento"
                        checked={config.utilizaEnriquecimento || false}
                        onChange={(e) => setConfig({ ...config, utilizaEnriquecimento: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="utilizaEnriquecimento" className="text-sm text-gray-700">
                        Utiliza Enriquecimento
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="deduzirDoPlano"
                        checked={config.deduzirDoPlano || false}
                        onChange={(e) => setConfig({ ...config, deduzirDoPlano: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="deduzirDoPlano" className="text-sm text-gray-700">
                        Deduzir do Plano
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem para produtos não-notificação */}
            {!isNotificacao && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">ℹ️ Info:</span> Para este tipo de produto, apenas as configurações básicas estão disponíveis.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onFechar}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {configuracaoInicial ? 'Atualizar Configuração' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarProduto;