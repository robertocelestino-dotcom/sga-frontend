import React from 'react';
import BreadCrumb from '../../components/BreadCrumb';

const Cancelamentos: React.FC = () => {
  return (
    <div className="p-6">
      <BreadCrumb items={[{ label: 'Faturamento' }, { label: 'Cancelamentos' }]} />
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Cancelamentos de Serviços</h1>
        <p className="text-gray-600">Funcionalidade em desenvolvimento...</p>
      </div>
    </div>
  );
};

export default Cancelamentos;