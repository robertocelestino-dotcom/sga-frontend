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
  franquiaSelecionadaId
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<Franquia | null>(null);
  const [parametros, setParametros] = useState({
    limiteFranquia: 20,
    periodoFranquia: 'MENSAL',
    valorExcedente: undefined as number | undefined
  });
  
  const pesquisaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto && pesquisaInputRef.current) {
      setTimeout(() => {
        pesquisaInputRef.current?.focus();
      }, 100);
    }
  }, [aberto]);

  useEffect(() => {
    if (franquiaSelecionadaId && franquiasDisponiveis.length > 0) {
      const franquia = franquiasDisponiveis.find(f => f.id === franquiaSelecionadaId);
      if (franquia) {
        setFranquiaSelecionada(franquia);
        setParametros({
          limiteFranquia: franquia.limiteFranquia || 20,
          periodoFranquia: franquia.periodoFranquia || 'MENSAL',
          valorExcedente: franquia.valorExcedente
        });
      }
    }
  }, [franquiaSelecionadaId, franquiasDisponiveis]);

  const franquiasFiltradas = franquiasDisponiveis.filter(franquia =>
    franquia.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    franquia.codigo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleSelecionarFranquia = (franquia: Franquia) => {
    setFranquiaSelecionada(franquia);
    setParametros({
      limiteFranquia: franquia.limiteFranquia || 20,
      periodoFranquia: franquia.periodoFranquia || 'MENSAL',
      valorExcedente: franquia.valorExcedente
    });
  };

  const handleConfirmar = () => {
    if (franquiaSelecionada) {
      // Mesclar os parâmetros com a franquia selecionada
      const franquiaComParametros = {
        ...franquiaSelecionada,
        limiteFranquia: parametros.limiteFranquia,
        periodoFranquia: parametros.periodoFranquia,
        valorExcedente: parametros.valorExcedente
      };
      onSelecionar(franquiaComParametros);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Franquia</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione uma franquia e configure os parâmetros
              </p>
            </div>
            <button
              onClick={onFechar}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Lista de Franquias */}
            <div>
              <div className="mb-4">
                <input
                  ref={pesquisaInputRef}
                  type="text"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  placeholder="Pesquisar franquias por nome ou código..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Selecionar
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Código
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nome
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {franquiasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                          Nenhuma franquia encontrada
                        </td>
                      </tr>
                    ) : (
                      franquiasFiltradas.map((franquia) => (
                        <tr
                          key={franquia.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            franquiaSelecionada?.id === franquia.id ? 'bg-indigo-50' : ''
                          }`}
                          onClick={() => handleSelecionarFranquia(franquia)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="franquiaSelecionada"
                              checked={franquiaSelecionada?.id === franquia.id}
                              onChange={() => handleSelecionarFranquia(franquia)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {franquia.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {franquia.nome}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna 2: Parâmetros da Franquia */}
            <div className="border-l border-gray-200 pl-6">
              <h4 className="font-medium text-gray-800 mb-4">Parâmetros da Franquia</h4>
              
              {!franquiaSelecionada ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Selecione uma franquia para configurar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-indigo-600 mb-1">Franquia selecionada:</p>
                    <p className="font-medium text-gray-900">{franquiaSelecionada.nome}</p>
                    <p className="text-sm text-gray-500">Código: {franquiaSelecionada.codigo}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite de Franquia *
                    </label>
                    <input
                      type="number"
                      value={parametros.limiteFranquia}
                      onChange={(e) => setParametros(prev => ({
                        ...prev,
                        limiteFranquia: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ex: 20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Quantidade de consultas inclusas no plano
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período da Franquia
                    </label>
                    <select
                      value={parametros.periodoFranquia}
                      onChange={(e) => setParametros(prev => ({
                        ...prev,
                        periodoFranquia: e.target.value
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="MENSAL">Mensal</option>
                      <option value="BIMESTRAL">Bimestral</option>
                      <option value="TRIMESTRAL">Trimestral</option>
                      <option value="SEMESTRAL">Semestral</option>
                      <option value="ANUAL">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Excedente (R$)
                    </label>
                    <input
                      type="number"
                      value={parametros.valorExcedente || ''}
                      onChange={(e) => setParametros(prev => ({
                        ...prev,
                        valorExcedente: e.target.value ? parseFloat(e.target.value) : undefined
                      }))}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0,00"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Valor por consulta excedente (deixe 0 se não permitir)
                    </p>
                  </div>

                  {franquiaSelecionada.valorUnitario && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Valor da franquia:</span>{' '}
                        R$ {franquiaSelecionada.valorUnitario.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center border-t pt-6">
            <div className="text-sm text-gray-600">
              {franquiasDisponiveis.length} franquia(s) disponível(is)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onFechar}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={!franquiaSelecionada}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Seleção
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoFranquia;