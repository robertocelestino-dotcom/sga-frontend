// src/components/BuscaProdutos.tsx
import React, { useState, useEffect } from 'react';
import { produtoService, ProdutoResumoDTO } from '../services/produtoService';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';

interface BuscaProdutosProps {
  onSelect: (produto: ProdutoResumoDTO) => void;
  placeholder?: string;
  tipoFiltro?: string;
  excluirIds?: number[];
}

const BuscaProdutos: React.FC<BuscaProdutosProps> = ({
  onSelect,
  placeholder = 'Buscar produto por nome ou código...',
  tipoFiltro,
  excluirIds = []
}) => {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<ProdutoResumoDTO[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const buscarProdutos = async () => {
      if (busca.length < 2) {
        setResultados([]);
        return;
      }

      setCarregando(true);
      try {
        const filtros: any = {
          nome: busca,
          size: 10,
          status: 'ATIVO'
        };

        if (tipoFiltro) {
          filtros.tipoProduto = tipoFiltro;
        }

        const response = await produtoService.listar(filtros);
        
        let produtosFiltrados = response.content;
        if (excluirIds.length > 0) {
          produtosFiltrados = produtosFiltrados.filter(p => !excluirIds.includes(p.id));
        }
        
        setResultados(produtosFiltrados);
        setMostrarResultados(true);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setCarregando(false);
      }
    };

    const timeoutId = setTimeout(buscarProdutos, 300);
    return () => clearTimeout(timeoutId);
  }, [busca, tipoFiltro, excluirIds]);

  const handleSelect = (produto: ProdutoResumoDTO) => {
    onSelect(produto);
    setBusca('');
    setMostrarResultados(false);
  };

  const handleClear = () => {
    setBusca('');
    setResultados([]);
    setMostrarResultados(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onFocus={() => busca.length >= 2 && setMostrarResultados(true)}
        />
        {busca && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {carregando && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
          <div className="text-center text-gray-500">Buscando...</div>
        </div>
      )}

      {mostrarResultados && resultados.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {resultados.map(produto => (
            <button
              key={produto.id}
              onClick={() => handleSelect(produto)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-800">{produto.nome}</div>
              <div className="text-sm text-gray-500 flex justify-between">
                <span>Código: {produto.codigo}</span>
                <span className="font-medium">R$ {produto.valorUnitario.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded ${
                  produto.tipoProduto === 'FRANQUIA' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {produto.tipoProduto}
                </span>
                {produto.temFranquia && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Com franquia
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {mostrarResultados && resultados.length === 0 && busca.length >= 2 && !carregando && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4">
          <div className="text-center text-gray-500">
            Nenhum produto encontrado para "{busca}"
          </div>
        </div>
      )}
    </div>
  );
};

export default BuscaProdutos;