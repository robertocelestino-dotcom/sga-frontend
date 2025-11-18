import React from 'react';

const Associados = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestão de Associados</h1>
        <p className="text-gray-600">Gerencie os associados do sistema</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Associados</h2>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Adicionar Associado
          </button>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <p>Funcionalidade em desenvolvimento</p>
        </div>
      </div>
    </div>
  );
};

export default Associados;