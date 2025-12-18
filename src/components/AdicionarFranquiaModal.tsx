// src/components/AdicionarFranquiaModal.tsx
import React, { useState, useEffect } from 'react';
import { produtoService, ProdutoResumoDTO } from '../services/produtoService';
import { FaTimes, FaSearch, FaPlus } from 'react-icons/fa';

interface AdicionarFranquiaModalProps {
  produtoId: number;
  produtoNome: string;
  franquiasAtuais: number[];
  onClose: () => void;
  onSuccess: () => void;
}

const AdicionarFranquiaModal: React.FC<AdicionarFranquiaModalProps> = ({
  produtoId,
  produtoNome,
  franquiasAtuais,
  onClose,
  onSuccess
}) => {
  const [franquiasDisponiveis, setFranquiasDisponiveis] = useState<ProdutoResumoDTO[]>([]);
  const [franquiasSelecionadas, setFranquiasSelecionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarFranquiasDisponiveis();
  }, []);

  const carregarFranquiasDisponiveis = async () => {
    try {
      const franquias = await produtoService.listarFranquiasDisponiveis();
      // Filtrar franquias já associadas
      const disponiveis = franquias.filter(f => !franquiasAtuais.includes(f.id));
      setFranquiasDisponiveis(disponiveis);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
      alert('Erro ao carregar franquias disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFranquia = (franquiaId: number) => {
    setFranquiasSelecionadas(prev =>
      prev.includes(franquiaId)
        ? prev.filter(id => id !== franquiaId)
        : [...prev, franquiaId]
    );
  };

  const handleSalvar = async () => {
    if (franquiasSelecionadas.length === 0) {
      alert('Selecione pelo menos uma franquia');
      return;
    }

    setSalvando(true);
    try {
      for (const franquiaId of franquiasSelecionadas) {
        await produtoService.adicionarFranquia(produtoId, franquiaId);
      }
      alert(`${franquiasSelecionadas.length} franquia(s) adicionada(s) com sucesso!`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar franquias:', error);
      alert('Erro ao adicionar franquias');
    } finally {
      setSalvando(false);
    }
  };

  const franquiasFiltradas = franquiasDisponiveis.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Adicionar Franquias
            </h2>
            <p className="text-gray-600">
              Produto: <span className="font-semibold">{produtoNome}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Busca */}
        <div className="p-4 border-b">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar franquias por nome ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {franquiasSelecionadas.length} franquia(s) selecionada(s)
          </div>
        </div>

        {/* Lista de Franquias */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Carregando franquias...</div>
          ) : franquiasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {busca ? 'Nenhuma franquia encontrada' : 'Nenhuma franquia disponível'}
            </div>
          ) : (
            <div className="grid gap-3">
              {franquiasFiltradas.map(franquia => (
                <div
                  key={franquia.id}
                  className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all ${
                    franquiasSelecionadas.includes(franquia.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => handleToggleFranquia(franquia.id)}
                >
                  <input
                    type="checkbox"
                    checked={franquiasSelecionadas.includes(franquia.id)}
                    onChange={() => handleToggleFranquia(franquia.id)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{franquia.nome}</div>
                    <div className="text-sm text-gray-500">
                      {franquia.codigo} • Valor: R$ {franquia.valorUnitario.toFixed(2)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    franquia.status === 'ATIVO' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {franquia.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando || franquiasSelecionadas.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FaPlus />
            {salvando ? 'Adicionando...' : `Adicionar (${franquiasSelecionadas.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdicionarFranquiaModal;