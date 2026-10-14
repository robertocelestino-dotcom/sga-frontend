// src/components/ModalConfigurarFaturamento.tsx - VERSÃO CDL (identidade visual aplicada)

import React, { useState, useEffect } from 'react';
import { ConfiguracaoFaturamento } from '../types/associadoDefFaturamento.types';
import { associadoService } from '../services/associadoService';

interface ModalConfigurarFaturamentoProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvar: (config: ConfiguracaoFaturamento) => void;
  configuracaoInicial?: ConfiguracaoFaturamento;
  diasExistentes?: number[];
}

const ModalConfigurarFaturamento: React.FC<ModalConfigurarFaturamentoProps> = ({
  aberto,
  onFechar,
  onSalvar,
  configuracaoInicial,
  diasExistentes = [],
}) => {
  const [config, setConfig] = useState<ConfiguracaoFaturamento>(() => {
    if (configuracaoInicial) {
      return {
        ...configuracaoInicial,
        diaEmissao: configuracaoInicial.diaEmissao || 1,
        diaVencimento: configuracaoInicial.diaVencimento || 10,
      };
    }
    return {
      diaEmissao: 1,
      diaVencimento: 10,
      valorDef: undefined,
      planoId: undefined,
      observacao: '',
    };
  });

  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    if (aberto) carregarPlanos();
  }, [aberto]);

  const carregarPlanos = async () => {
    try {
      setLoading(true);
      const data = await associadoService.listarPlanos();
      setPlanos(data);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarCampos = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!config.diaEmissao) {
      novosErros.diaEmissao = 'Dia de emissão é obrigatório';
    } else if (config.diaEmissao < 1 || config.diaEmissao > 31) {
      novosErros.diaEmissao = 'Dia de emissão deve ser entre 1 e 31';
    } else if (!configuracaoInicial && diasExistentes.includes(config.diaEmissao)) {
      novosErros.diaEmissao = `Dia ${config.diaEmissao} já está cadastrado`;
    }

    if (!config.diaVencimento) {
      novosErros.diaVencimento = 'Dia de vencimento é obrigatório';
    } else if (config.diaVencimento < 1 || config.diaVencimento > 31) {
      novosErros.diaVencimento = 'Dia de vencimento deve ser entre 1 e 31';
    }

    if (config.valorDef && config.valorDef < 0) {
      novosErros.valorDef = 'Valor não pode ser negativo';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = () => {
    if (!validarCampos()) return;
    onSalvar(config);
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-cdl-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-cdl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200">

        {/* ===== Header ===== */}
        <div className="p-6 border-b border-gray-200 bg-cdl-navy-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-cdl-navy-700">
                {configuracaoInicial
                  ? '✏️ Editar Configuração de Faturamento'
                  : '➕ Nova Configuração de Faturamento'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure os dias de emissão e vencimento
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

        {/* ===== Body ===== */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">

            {/* Dias de Emissão e Vencimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia de Emissão <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={config.diaEmissao}
                  onChange={(e) =>
                    setConfig({ ...config, diaEmissao: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  max="31"
                  className={`w-full px-3 py-2 border rounded-md transition-colors
                    focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600
                    ${erros.diaEmissao ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                  placeholder="1 a 31"
                />
                {erros.diaEmissao && (
                  <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.diaEmissao}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dia de Vencimento <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="number"
                  value={config.diaVencimento}
                  onChange={(e) =>
                    setConfig({ ...config, diaVencimento: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  max="31"
                  className={`w-full px-3 py-2 border rounded-md transition-colors
                    focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600
                    ${erros.diaVencimento ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                  placeholder="1 a 31"
                />
                {erros.diaVencimento && (
                  <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.diaVencimento}</p>
                )}
              </div>
            </div>

            {/* Plano (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <select
                value={config.planoId || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    planoId: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                  focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                disabled={loading}
              >
                <option value="">Selecione um plano...</option>
                {planos.map((plano) => (
                  <option key={plano.id} value={plano.id}>
                    {plano.plano}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor Definido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Definido <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-cdl-navy-700">
                  R$
                </span>
                <input
                  type="number"
                  value={config.valorDef || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      valorDef: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 border rounded-md transition-colors
                    focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600
                    ${erros.valorDef ? 'border-cdl-danger-500' : 'border-gray-300'}`}
                  placeholder="0,00"
                />
              </div>
              {erros.valorDef && (
                <p className="mt-1 text-xs text-cdl-danger-600">⚠️ {erros.valorDef}</p>
              )}
            </div>

            {/* Observação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={config.observacao || ''}
                onChange={(e) => setConfig({ ...config, observacao: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md transition-colors
                  focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 resize-none"
                placeholder="Observações sobre esta configuração de faturamento..."
              />
            </div>
          </div>
        </div>

        {/* ===== Footer ===== */}
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
            💾 {configuracaoInicial ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarFaturamento;