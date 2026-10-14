// src/components/ModalSelecaoProdutoConsulta.tsx - VERSÃO CDL

import React, { useState, useEffect, useRef } from 'react';

interface ProdutoConsulta {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  valorUnitario?: number;
  tipoProduto: string;
  categoria?: string;
}

interface ModalSelecaoProdutoConsultaProps {
  aberto: boolean;
  onFechar: () => void;
  onSelecionar: (produto: ProdutoConsulta) => void;
  produtosDisponiveis: ProdutoConsulta[];
  produtoSelecionadoId?: number;
}

const ModalSelecaoProdutoConsulta: React.FC<ModalSelecaoProdutoConsultaProps> = ({
  aberto,
  onFechar,
  onSelecionar,
  produtosDisponiveis,
  produtoSelecionadoId,
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoConsulta | null>(null);
  const pesquisaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aberto && pesquisaInputRef.current) {
      setTimeout(() => pesquisaInputRef.current?.focus(), 100);
    }
  }, [aberto]);

  useEffect(() => {
    if (produtoSelecionadoId && produtosDisponiveis.length > 0) {
      const produto = produtosDisponiveis.find((p) => p.id === produtoSelecionadoId);
      setProdutoSelecionado(produto || null);
    } else {
      setProdutoSelecionado(null);
    }
  }, [produtoSelecionadoId, produtosDisponiveis]);

  const produtosFiltrados = produtosDisponiveis
    .filter(
      (p) => p.tipoProduto === 'CONSULTA' || p.tipoProduto === 'SERVICO'
    )
    .filter(
      (p) =>
        p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        p.codigo.toLowerCase().includes(pesquisa.toLowerCase()) ||
        (p.categoria && p.categoria.toLowerCase().includes(pesquisa.toLowerCase()))
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
                🔍 Selecionar Produto de Consulta
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione o produto que será associado à franquia
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
                  placeholder="Pesquisar por nome, código ou categoria..."
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
                        Categoria
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          <div className="text-3xl mb-2">🔎</div>
                          Nenhum produto de consulta encontrado
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
                          onDoubleClick={() => onSelecionar(produto)}
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
                              {produto.categoria || 'Geral'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 Duplo clique para selecionar rapidamente</p>
            </div>

            {/* Coluna 2: Detalhes */}
            <div className="md:border-l md:border-gray-200 md:pl-6">
              <h4 className="font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
                📄 Detalhes do Produto
              </h4>

              {!produtoSelecionado ? (
                <div className="text-center py-12 bg-cdl-navy-50/40 rounded-lg border border-dashed border-cdl-navy-200">
                  <div className="text-4xl mb-2">👈</div>
                  <p className="text-gray-500 text-sm">
                    Selecione um produto para ver os detalhes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-cdl-navy-50 p-4 rounded-lg border border-cdl-navy-100">
                    <p className="text-xs text-cdl-navy-600 mb-1 uppercase font-semibold tracking-wide">
                      Produto selecionado
                    </p>
                    <p className="font-medium text-cdl-navy-800">{produtoSelecionado.nome}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      Código: {produtoSelecionado.codigo}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-cdl-neutral-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Descrição</p>
                      <p className="text-sm text-gray-900">
                        {produtoSelecionado.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="bg-cdl-neutral-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Categoria</p>
                      <p className="text-sm text-gray-900">
                        {produtoSelecionado.categoria || 'Não definida'}
                      </p>
                    </div>

                    {produtoSelecionado.valorUnitario && (
                      <div className="bg-cdl-green-50 p-3 rounded-lg border border-cdl-green-100">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                          Valor Unitário
                        </p>
                        <p className="text-sm font-semibold text-cdl-green-700">
                          R$ {produtoSelecionado.valorUnitario.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="bg-cdl-neutral-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tipo</p>
                      <p className="text-sm">
                        <span className="px-2 py-1 text-xs font-medium bg-cdl-navy-100 text-cdl-navy-800 rounded-full">
                          {produtoSelecionado.tipoProduto === 'PRODUTO_CONSULTA'
                            ? 'Produto de Consulta'
                            : produtoSelecionado.tipoProduto}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-cdl-neutral-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            🔍 <span className="font-medium">{produtosFiltrados.length}</span> produto(s) de consulta
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
              ✅ Confirmar Seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalSelecaoProdutoConsulta;