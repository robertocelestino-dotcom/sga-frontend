// src/pages/ImportacaoProdutos.tsx
import React, { useState } from 'react';
import { produtoService } from '../services/produtoService';
import { exportToExcel } from '../utils/exportUtils';
import BreadCrumb from '../components/BreadCrumb';
import { FaUpload, FaDownload, FaFileExcel, FaFileCsv } from 'react-icons/fa';

const ImportacaoProdutosPage: React.FC = () => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [template, setTemplate] = useState<'simples' | 'completo'>('simples');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleImportar = async () => {
    if (!arquivo) {
      alert('Selecione um arquivo para importar');
      return;
    }

    // Validar tipo de arquivo
    if (!arquivo.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert('Formato inválido. Use CSV ou Excel.');
      return;
    }

    setImportando(true);
    // Implementar lógica de upload
    // const formData = new FormData();
    // formData.append('file', arquivo);
    // await api.post('/produtos/importar', formData, {...})
    setTimeout(() => {
      alert('Importação em desenvolvimento');
      setImportando(false);
      setArquivo(null);
    }, 2000);
  };

  const handleExportarTemplate = () => {
    const headers = template === 'simples' 
      ? ['codigo', 'nome', 'valorUnitario', 'tipoProduto', 'status']
      : Object.keys(produtoOpcoes).map(key => key);
    
    const data = [headers];
    exportToExcel(data, `template-produtos-${template}`);
  };

  const handleExportarProdutos = async () => {
    try {
      const produtos = await produtoService.listar({ size: 10000 });
      const data = produtos.content.map(p => ({
        Código: p.codigo,
        Nome: p.nome,
        Valor: p.valorUnitario,
        Tipo: p.tipoProduto,
        Status: p.status,
        Categoria: p.categoria,
        'Tem Franquia': p.temFranquia ? 'Sim' : 'Não'
      }));
      exportToExcel(data, 'produtos-exportados');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar produtos');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Produtos', path: '/produtos' },
          { label: 'Importação/Exportação' }
        ]}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Importação e Exportação de Produtos
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Importação */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaUpload /> Importar Produtos
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o arquivo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer block"
                  >
                    <FaUpload className="mx-auto text-3xl text-gray-400 mb-3" />
                    <div className="text-gray-600">
                      {arquivo ? (
                        <span className="font-medium">{arquivo.name}</span>
                      ) : (
                        <>
                          <span className="font-medium text-blue-600">Clique para selecionar</span>
                          <p className="text-sm text-gray-500 mt-1">
                            ou arraste um arquivo CSV ou Excel
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Template
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="simples"
                      checked={template === 'simples'}
                      onChange={(e) => setTemplate(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Simples (campos básicos)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="completo"
                      checked={template === 'completo'}
                      onChange={(e) => setTemplate(e.target.value as any)}
                      className="mr-2"
                    />
                    <span>Completo (todos os campos)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleExportarTemplate}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <FaFileExcel /> Baixar Template
                </button>
                
                <button
                  onClick={handleImportar}
                  disabled={!arquivo || importando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex-1 flex items-center justify-center gap-2"
                >
                  {importando ? 'Importando...' : 'Iniciar Importação'}
                </button>
              </div>
            </div>
          </div>

          {/* Exportação */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaDownload /> Exportar Produtos
            </h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">
                  Exportar para Excel
                </h3>
                <p className="text-blue-700 text-sm mb-4">
                  Gere um relatório completo com todos os produtos cadastrados
                </p>
                <button
                  onClick={handleExportarProdutos}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <FaFileExcel size={20} />
                  Exportar Todos os Produtos
                </button>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Exportar para CSV
                </h3>
                <p className="text-green-700 text-sm mb-4">
                  Formato simples para integração com outros sistemas
                </p>
                <button
                  onClick={handleExportarProdutos}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <FaFileCsv size={20} />
                  Exportar em Formato CSV
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Dicas para exportação:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Os dados são exportados com a formatação atual</li>
                  <li>Inclui filtros aplicados na lista de produtos</li>
                  <li>Formato compatível com Excel e Google Sheets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Instruções de Importação</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
              <h4 className="font-medium text-gray-700 mb-1">Baixe o Template</h4>
              <p className="text-sm text-gray-600">
                Use o template correto para evitar erros na importação
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
              <h4 className="font-medium text-gray-700 mb-1">Preencha os Dados</h4>
              <p className="text-sm text-gray-600">
                Mantenha o formato das colunas e valores permitidos
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-2">3</div>
              <h4 className="font-medium text-gray-700 mb-1">Importe o Arquivo</h4>
              <p className="text-sm text-gray-600">
                O sistema validará e importará os produtos automaticamente
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoProdutosPage;