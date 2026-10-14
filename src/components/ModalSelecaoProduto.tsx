// src/components/ModalSelecaoProduto.tsx - VERSÃO CDL

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
  produtoSelecionadoId,
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const pesquisaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto && pesquisaInputRef.current) {
      setTimeout(() => pesquisaInputRef.current?.focus(), 100);
    }
  }, [aberto]);

  useEffect(() => {
    if (produtoSelecionadoId && produtosDisponiveis.length > 0) {
      const produto = produtosDisponiveis.find((p) => p.id === produtoSelecionadoId);
      if (produto) setProdutoSelecionado(produto);
    }
  }, [produtoSelecionadoId, produtosDisponiveis]);

  const produtosFiltrados = produtosDisponiveis.filter(
    (p) =>
      p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      p.codigo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  const handleConfirmar = () => {
    if (produtoSelecionado) onSelecionar(produtoSelecionado);
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
                📦 Selecionar Produto
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione o produto para incluir no plano
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
          <div className="mb-4 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              ref={pesquisaInputRef}
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar produtos por nome ou código..."
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      <div className="text-3xl mb-2">🔎</div>
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  produtosFiltrados.map((produto) => (
                    <tr
                      key={produto.id}
                      className={`cursor-pointer transition-colors ${
                        produtoSelecionado?.id === produto.id
                          ? 'bg-cdl-navy-50'
                          : 'hover:bg-cdl-navy-50/40'
                      }`}
                      onClick={() => setProdutoSelecionado(produto)}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="radio"
                          name="produtoSelecionado"
                          checked={produtoSelecionado?.id === produto.id}
                          onChange={() => setProdutoSelecionado(produto)}
                          className="h-4 w-4 text-cdl-navy-700 focus:ring-cdl-navy-600"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{produto.nome}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium bg-cdl-navy-100 text-cdl-navy-800 rounded-full">
                          {produto.tipoProduto}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-cdl-neutral-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            📦 <span className="font-medium">{produtosFiltrados.length}</span> produto(s)
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
              disabled={!produtoSelecionado}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoProduto;