// src/pages/faturamento/Cancelamentos.tsx - VERSÃO CDL
import React from 'react';
import BreadCrumb from '../../components/BreadCrumb';

const Cancelamentos: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb items={[{ label: 'Faturamento' }, { label: 'Cancelamentos' }]} />

      <div className="bg-white rounded-xl shadow-cdl p-12 mt-6 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl font-bold text-cdl-navy-700 mb-3">
          Cancelamentos de Serviços
        </h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Esta funcionalidade está em desenvolvimento. Em breve você poderá gerenciar cancelamentos de serviços diretamente por aqui.
        </p>
        <div className="mt-6 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg inline-flex items-center gap-2">
          <span>💡</span>
          <span className="text-sm text-cdl-yellow-700">
            Enquanto isso, use a <strong>Importação de Cancelamentos</strong> para processar em lote.
          </span>
        </div>
      </div>
    </div>
  );
};

export default Cancelamentos;