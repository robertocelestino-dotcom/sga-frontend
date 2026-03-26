import React, { useState, useEffect, useRef } from 'react';

interface Produto {
  id: number;
  codigo: string;
  nome: string;
  tipoProduto: string;
  valorUnitario?: number;
}

interface ModalSelecaoProdutoProps {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (produto: Produto) => void;
  produtosDisponiveis: Produto[];
  produtoSelecionadoId?: number;
}

const ModalSelecaoProduto: React.FC<ModalSelecaoProdutoProps> = ({
  aberto,
  onFechar,
  onSelecionar,
  produtosDisponiveis,
  produtoSelecionadoId
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  
  const pesquisaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto && pesquisaInputRef.current) {
      setTimeout(() => {
        pesquisaInputRef.current?.focus();
      }, 100);
    }
  }, [aberto]);

  useEffect(() => {
    if (produtoSelecionadoId && produtosDisponiveis.length > 0) {
      const produto = produtosDisponiveis.find(p => p.id === produtoSelecionadoId);
      if (produto) {
        setProdutoSelecionado(produto);
      }
    }
  }, [produtoSelecionadoId, produtosDisponiveis]);

  const produtosFiltrados = produtosDisponiveis.filter(produto =>
    produto.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    produto.codigo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleSelecionar = (produto: Produto) => {
    setProdutoSelecionado(produto);
  };

  const handleConfirmar = () => {
    if (produtoSelecionado) {
      onSelecionar(produtoSelecionado);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Produto</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione o produto para incluir no plano
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
          <div className="mb-4">
            <input
              ref={pesquisaInputRef}
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar produtos por nome ou código..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosFiltrados.map((produto) => (
                  <tr
                    key={produto.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      produtoSelecionado?.id === produto.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelecionar(produto)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="produtoSelecionado"
                        checked={produtoSelecionado?.id === produto.id}
                        onChange={() => handleSelecionar(produto)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{produto.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{produto.nome}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {produto.tipoProduto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-between items-center border-t pt-6">
            <div className="text-sm text-gray-600">
              {produtosFiltrados.length} produto(s) disponível(is)
            </div>
            <div className="flex space-x-3">
              <button onClick={onFechar} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={!produtoSelecionado}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoProduto;