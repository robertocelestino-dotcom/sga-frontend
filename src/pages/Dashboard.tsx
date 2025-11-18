import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const stats = [
    { name: 'Total de Associados', value: '1.247', change: '+12%', changeType: 'positive', icon: '👥' },
    { name: 'Serviços Ativos', value: '45', change: '+3', changeType: 'positive', icon: '🛠️' },
    { name: 'Faturamento Mensal', value: 'R$ 284.567', change: '+8%', changeType: 'positive', icon: '💳' },
    { name: 'Importações Hoje', value: '12', change: '-2', changeType: 'negative', icon: '📥' },
  ];

  const quickActions = [
    { name: 'Importar SPC', path: '/importacao-spc', icon: '📄', description: 'Arquivos TXT' },
    { name: 'Gestão de Associados', path: '/associados', icon: '👥', description: 'Cadastros' },
    { name: 'Processar Faturamento', path: '/processar-faturamento', icon: '⚡', description: 'Executar' },
    { name: 'Configurações', path: '/parametrizacao-associados', icon: '⚙️', description: 'Parâmetros' },
  ];

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Visão geral do sistema de gestão de associados
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="text-xl sm:text-2xl">{stat.icon}</div>
            </div>
            <div className={`mt-2 text-xs sm:text-sm ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.path}
            className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer block"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-xl sm:text-2xl">{action.icon}</div>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">{action.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Atividades Recentes</h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">Importação SPC concluída</p>
              <p className="text-xs sm:text-sm text-gray-500">15/11/2025 - 14:30</p>
            </div>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">Concluído</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">Novo usuário cadastrado</p>
              <p className="text-xs sm:text-sm text-gray-500">15/11/2025 - 13:15</p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs sm:text-sm self-start sm:self-auto">Sucesso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;