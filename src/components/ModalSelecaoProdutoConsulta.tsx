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
  produtoSelecionadoId
}) => {
  const [pesquisa, setPesquisa] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoConsulta | null>(null);
  
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
    } else {
      setProdutoSelecionado(null);
    }
  }, [produtoSelecionadoId, produtosDisponiveis]);

  // Filtrar apenas produtos do tipo PRODUTO_CONSULTA ou SERVICO (para compatibilidade)
  const produtosFiltrados = produtosDisponiveis
    .filter(produto => 
      produto.tipoProduto === 'CONSULTA' || 
      produto.tipoProduto === 'SERVICO' // fallback para compatibilidade
    )
    .filter(produto =>
      produto.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(pesquisa.toLowerCase()) ||
      (produto.categoria && produto.categoria.toLowerCase().includes(pesquisa.toLowerCase()))
    );

  const handleSelecionarProduto = (produto: ProdutoConsulta) => {
    setProdutoSelecionado(produto);
  };

  const handleConfirmar = () => {
    if (produtoSelecionado) {
      onSelecionar(produtoSelecionado);
    }
  };

  const handleDoubleClick = (produto: ProdutoConsulta) => {
    onSelecionar(produto);
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Produto de Consulta</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecione o produto que será associado à franquia
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
            {/* Coluna 1: Lista de Produtos */}
            <div>
              <div className="mb-4">
                <input
                  ref={pesquisaInputRef}
                  type="text"
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  placeholder="Pesquisar produtos por nome, código ou categoria..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Categoria
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {produtosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          Nenhum produto de consulta encontrado
                        </td>
                      </tr>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <tr
                          key={produto.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            produtoSelecionado?.id === produto.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => handleSelecionarProduto(produto)}
                          onDoubleClick={() => handleDoubleClick(produto)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="radio"
                              name="produtoSelecionado"
                              checked={produtoSelecionado?.id === produto.id}
                              onChange={() => handleSelecionarProduto(produto)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {produto.codigo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {produto.nome}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {produto.categoria || 'Geral'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Duplo clique para selecionar rapidamente
              </p>
            </div>

            {/* Coluna 2: Detalhes do Produto Selecionado */}
            <div className="border-l border-gray-200 pl-6">
              <h4 className="font-medium text-gray-800 mb-4">Detalhes do Produto</h4>
              
              {!produtoSelecionado ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Selecione um produto para ver os detalhes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 mb-1">Produto selecionado:</p>
                    <p className="font-medium text-gray-900">{produtoSelecionado.nome}</p>
                    <p className="text-sm text-gray-500">Código: {produtoSelecionado.codigo}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Descrição</p>
                      <p className="text-sm text-gray-900">
                        {produtoSelecionado.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Categoria</p>
                      <p className="text-sm text-gray-900">
                        {produtoSelecionado.categoria || 'Não definida'}
                      </p>
                    </div>

                    {produtoSelecionado.valorUnitario && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Valor Unitário</p>
                        <p className="text-sm font-medium text-gray-900">
                          R$ {produtoSelecionado.valorUnitario.toFixed(2)}
                        </p>
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Tipo</p>
                      <p className="text-sm text-gray-900">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {produtoSelecionado.tipoProduto === 'PRODUTO_CONSULTA' ? 'Produto de Consulta' : produtoSelecionado.tipoProduto}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center border-t pt-6">
            <div className="text-sm text-gray-600">
              {produtosFiltrados.length} produto(s) de consulta disponível(is)
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
                disabled={!produtoSelecionado}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default ModalSelecaoProdutoConsulta;