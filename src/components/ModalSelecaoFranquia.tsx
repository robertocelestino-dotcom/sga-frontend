// src/components/ModalSelecaoFranquia.tsx - VERSÃO CDL

import React, { useState, useEffect, useRef } from 'react';

interface Franquia {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  valorUnitario?: number;
  limiteFranquia?: number;
  periodoFranquia?: string;
  valorExcedente?: number;
}

interface ModalSelecaoFranquiaProps {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (franquia: Franquia) => void;
  franquiasDisponiveis: Franquia[];
  franquiaSelecionadaId?: number;
}

const ModalSelecaoFranquia: React.FC<ModalSelecaoFranquiaProps> = ({
  aberto,
  onFechar,
  onSelecionar,
  franquiasDisponiveis,
  franquiaSelecionadaId,
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<Franquia | null>(null);
  const [parametros, setParametros] = useState({
    limiteFranquia: 20,
    periodoFranquia: 'MENSAL',
    valorExcedente: undefined as number | undefined,
  });

  const pesquisaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto && pesquisaInputRef.current) {
      setTimeout(() => pesquisaInputRef.current?.focus(), 100);
    }
  }, [aberto]);

  useEffect(() => {
    if (franquiaSelecionadaId && franquiasDisponiveis.length > 0) {
      const franquia = franquiasDisponiveis.find((f) => f.id === franquiaSelecionadaId);
      if (franquia) {
        setFranquiaSelecionada(franquia);
        setParametros({
          limiteFranquia: franquia.limiteFranquia || 20,
          periodoFranquia: franquia.periodoFranquia || 'MENSAL',
          valorExcedente: franquia.valorExcedente,
        });
      }
    }
  }, [franquiaSelecionadaId, franquiasDisponiveis]);

  const franquiasFiltradas = franquiasDisponiveis.filter(
    (f) =>
      f.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      f.codigo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleSelecionarFranquia = (franquia: Franquia) => {
    setFranquiaSelecionada(franquia);
    setParametros({
      limiteFranquia: franquia.limiteFranquia || 20,
      periodoFranquia: franquia.periodoFranquia || 'MENSAL',
      valorExcedente: franquia.valorExcedente,
    });
  };

  const handleConfirmar = () => {
    if (franquiaSelecionada) {
      onSelecionar({
        ...franquiaSelecionada,
        limiteFranquia: parametros.limiteFranquia,
        periodoFranquia: parametros.periodoFranquia,
        valorExcedente: parametros.valorExcedente,
      });
    }
  };

  if (!aberto) return null;

  const inputBase =
    'w-full px-3 py-2 border rounded-md transition-colors focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  return (
    <div className="fixed inset-0 bg-cdl-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-cdl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-cdl-navy-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-cdl-navy-700">
                🎯 Selecionar Franquia
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione uma franquia e configure os parâmetros
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
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Coluna 1: Lista */}
            <div>
              <div className="mb-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  ref={pesquisaInputRef}
                  type="text"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  placeholder="Pesquisar franquias por nome ou código..."
                  className={`${inputBase} pl-9 border-gray-300`}
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-cdl-navy-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                        Sel.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                        Nome
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {franquiasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          <div className="text-3xl mb-2">🔎</div>
                          Nenhuma franquia encontrada
                        </td>
                      </tr>
                    ) : (
                      franquiasFiltradas.map((franquia) => (
                        <tr
                          key={franquia.id}
                          className={`cursor-pointer transition-colors ${
                            franquiaSelecionada?.id === franquia.id
                              ? 'bg-cdl-navy-50'
                              : 'hover:bg-cdl-navy-50/40'
                          }`}
                          onClick={() => handleSelecionarFranquia(franquia)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="franquiaSelecionada"
                              checked={franquiaSelecionada?.id === franquia.id}
                              onChange={() => handleSelecionarFranquia(franquia)}
                              className="h-4 w-4 text-cdl-navy-700 focus:ring-cdl-navy-600"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-900">
                            {franquia.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{franquia.nome}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna 2: Parâmetros */}
            <div className="md:border-l md:border-gray-200 md:pl-6">
              <h4 className="font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
                ⚙️ Parâmetros da Franquia
              </h4>

              {!franquiaSelecionada ? (
                <div className="text-center py-12 bg-cdl-navy-50/40 rounded-lg border border-dashed border-cdl-navy-200">
                  <div className="text-4xl mb-2">👈</div>
                  <p className="text-gray-500 text-sm">
                    Selecione uma franquia para configurar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-cdl-navy-50 p-4 rounded-lg border border-cdl-navy-100">
                    <p className="text-xs text-cdl-navy-600 mb-1 uppercase font-semibold tracking-wide">
                      Franquia selecionada
                    </p>
                    <p className="font-medium text-cdl-navy-800">{franquiaSelecionada.nome}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      Código: {franquiaSelecionada.codigo}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limite de Franquia <span className="text-cdl-danger-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={parametros.limiteFranquia}
                      onChange={(e) =>
                        setParametros((prev) => ({
                          ...prev,
                          limiteFranquia: parseInt(e.target.value) || 0,
                        }))
                      }
                      min="1"
                      className={`${inputBase} border-gray-300`}
                      placeholder="Ex: 20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Quantidade de consultas inclusas no plano
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período da Franquia
                    </label>
                    <select
                      value={parametros.periodoFranquia}
                      onChange={(e) =>
                        setParametros((prev) => ({ ...prev, periodoFranquia: e.target.value }))
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Excedente
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-cdl-navy-700">
                        R$
                      </span>
                      <input
                        type="number"
                        value={parametros.valorExcedente || ''}
                        onChange={(e) =>
                          setParametros((prev) => ({
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
                      Valor por consulta excedente (deixe 0 se não permitir)
                    </p>
                  </div>

                  {franquiaSelecionada.valorUnitario && (
                    <div className="mt-4 p-3 bg-cdl-green-50 rounded-lg border border-cdl-green-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">💵 Valor da franquia:</span>{' '}
                        <span className="font-semibold text-cdl-green-700">
                          R$ {franquiaSelecionada.valorUnitario.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-cdl-neutral-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            📋 <span className="font-medium">{franquiasDisponiveis.length}</span> franquia(s)
            disponível(is)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onFechar}
              className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!franquiaSelecionada}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Confirmar Seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoFranquia;