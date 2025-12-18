// src/pages/Dashboard.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const stats = [
    { name: 'Total de Produtos', value: '156', change: '+8%', changeType: 'positive', icon: '📦' },
    { name: 'Total de Associados', value: '1.247', change: '+12%', changeType: 'positive', icon: '👥' },
    { name: 'Serviços Ativos', value: '45', change: '+3', changeType: 'positive', icon: '🛠️' },
    { name: 'Faturamento Mensal', value: 'R$ 284.567', change: '+8%', changeType: 'positive', icon: '💳' },
  ];

  const quickActions = [
    { name: 'Gestão de Produtos', path: '/produtos', icon: '📦', description: 'Cadastro e consulta' },
    { name: 'Importar SPC', path: '/importacao-spc', icon: '📄', description: 'Arquivos TXT' },
    { name: 'Gestão de Associados', path: '/associados', icon: '👥', description: 'Cadastros' },
    { name: 'Processar Faturamento', path: '/processar-faturamento', icon: '⚡', description: 'Executar' },
  ];

  const recentActivities = [
    { title: 'Novo produto cadastrado', date: '16/12/2025 - 17:45', status: 'Concluído', type: 'produto' },
    { title: 'Importação SPC concluída', date: '15/11/2025 - 14:30', status: 'Concluído', type: 'importacao' },
    { title: 'Novo usuário cadastrado', date: '15/11/2025 - 13:15', status: 'Sucesso', type: 'usuario' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Sucesso': return 'bg-blue-100 text-blue-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'produto': return '📦';
      case 'importacao': return '📄';
      case 'usuario': return '👤';
      default: return '📋';
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard SGA</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Sistema de Gestão de Associados - Visão geral
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="text-2xl sm:text-3xl">{stat.icon}</div>
            </div>
            <div className={`mt-2 text-xs sm:text-sm font-medium ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.path}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer block border border-transparent hover:border-blue-200"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl sm:text-3xl">{action.icon}</div>
                  <span className="text-xs text-gray-400">▶</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">{action.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Atividades Recentes</h2>
            <Link 
              to="/produtos" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Ver todos os produtos →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors gap-3"
              >
                <div className="text-xl">{getTypeIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base text-gray-800 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{activity.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Links Úteis */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Cadastros</h2>
          <div className="space-y-3">
            <Link
              to="/produtos"
              className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">📦</div>
                <div>
                  <h3 className="font-medium text-gray-800">Produtos</h3>
                  <p className="text-xs text-gray-600">Gestão completa</p>
                </div>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              to="/associados"
              className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">👥</div>
                <div>
                  <h3 className="font-medium text-gray-800">Associados</h3>
                  <p className="text-xs text-gray-600">Cadastro e gestão</p>
                </div>
              </div>
              <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              to="/usuarios"
              className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">👤</div>
                <div>
                  <h3 className="font-medium text-gray-800">Usuários</h3>
                  <p className="text-xs text-gray-600">Acessos e permissões</p>
                </div>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            
            <Link
              to="/parametrizacao-associados"
              className="flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-xl">⚙️</div>
                <div>
                  <h3 className="font-medium text-gray-800">Parâmetros</h3>
                  <p className="text-xs text-gray-600">Configurações do sistema</p>
                </div>
              </div>
              <span className="text-yellow-600 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;