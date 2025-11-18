import React from 'react';

const AtualizacaoAssociados = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Atualização de Associados</h1>
        <p className="text-gray-600 mt-2">
          Faça a importação e atualização dos dados dos associados
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Upload de Arquivo de Associados
          </h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">
              <span className="text-4xl">📄</span>
            </div>
            <p className="text-gray-600 mb-2">
              Arraste e solte o arquivo de associados aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos suportados: .CSV, .XLSX (até 10MB)
            </p>
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Selecionar Arquivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Total de Associados</h3>
            <p className="text-2xl font-bold text-blue-600">1.247</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Ativos</h3>
            <p className="text-2xl font-bold text-green-600">1.089</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Pendentes</h3>
            <p className="text-2xl font-bold text-yellow-600">158</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtualizacaoAssociados;