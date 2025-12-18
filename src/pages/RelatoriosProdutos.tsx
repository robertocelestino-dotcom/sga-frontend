// src/pages/RelatoriosProdutos.tsx
import React, { useState } from 'react';
import { produtoService } from '../services/produtoService';
import { exportToExcel } from '../utils/exportUtils';
import BreadCrumb from '../components/BreadCrumb';
import { FaChartBar, FaDownload, FaFilter, FaMoneyBillWave } from 'react-icons/fa';

const RelatoriosProdutosPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<'mes' | 'ano' | 'tudo'>('mes');
  const [tipoRelatorio, setTipoRelatorio] = useState<'vendas' | 'franquias' | 'ativos'>('vendas');

  const handleGerarRelatorio = async () => {
    try {
      // Implementar lógica de relatório
      const estatisticas = await produtoService.getEstatisticas();
      console.log('Estatísticas:', estatisticas);
      
      // Exemplo de exportação
      const data = [
        ['Relatório de Produtos', new Date().toLocaleDateString('pt-BR')],
        ['Tipo', 'Quantidade', 'Valor Médio', 'Status'],
        ['Ativos', estatisticas.ativos, 'R$ X,XX', 'OK'],
        // ... mais dados
      ];
      
      exportToExcel(data, `relatorio-produtos-${tipoRelatorio}`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  };

  return (
    <div className="p-6">
      <BreadCrumb 
        links={[
          { label: 'Produtos', path: '/produtos' },
          { label: 'Relatórios' }
        ]}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          <FaChartBar className="inline mr-2" />
          Relatórios de Produtos
        </h1>
        <p className="text-gray-600 mb-6">
          Gere relatórios detalhados sobre produtos, vendas e franquias
        </p>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-600 font-medium">Total Produtos</div>
            <div className="text-2xl font-bold text-blue-700">-</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-sm text-green-600 font-medium">Produtos Ativos</div>
            <div className="text-2xl font-bold text-green-700">-</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-sm text-purple-600 font-medium">Com Franquias</div>
            <div className="text-2xl font-bold text-purple-700">-</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="text-sm text-yellow-600 font-medium">Valor Médio</div>
            <div className="text-2xl font-bold text-yellow-700">-</div>
          </div>
        </div>

        {/* Configuração do Relatório */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaFilter /> Configurar Relatório
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={tipoRelatorio}
                onChange={(e) => setTipoRelatorio(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="vendas">Vendas e Faturamento</option>
                <option value="franquias">Uso de Franquias</option>
                <option value="ativos">Produtos Ativos/Inativos</option>
                <option value="mix">Produtos MIX</option>
                <option value="spc">Produtos SPC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="mes">Último Mês</option>
                <option value="ano">Último Ano</option>
                <option value="tudo">Todo o Período</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input type="radio" name="formato" defaultChecked className="mr-2" />
                  <span>Excel (.xlsx)</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="formato" className="mr-2" />
                  <span>PDF</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGerarRelatorio}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaDownload /> Gerar Relatório
            </button>
          </div>
        </div>

        {/* Visualização Prévia (simulada) */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Visualização Prévia</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franquias</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-500 text-center" colSpan={6}>
                    Configure o relatório e clique em "Gerar Relatório"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosProdutosPage;