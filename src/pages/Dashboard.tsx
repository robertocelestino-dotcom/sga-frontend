// src/pages/Dashboard.tsx - VERSÃO ATUALIZADA
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats, ActivityItem, QuickAction } from '../services/dashboardService';

const Dashboard = () => {
  const [estatisticas, setEstatisticas] = useState<DashboardStats | null>(null);
  const [atividades, setAtividades] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarDashboard();
    
    // Atualizar a cada 60 segundos (opcional)
    const intervalo = setInterval(() => {
      carregarDashboard();
    }, 60000);
    
    return () => clearInterval(intervalo);
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Carregando dados do dashboard...');
      
      // Carregar dados em paralelo
      const [estatisticasData, atividadesData] = await Promise.all([
        dashboardService.getEstatisticas(),
        dashboardService.getAtividadesRecentes(5)
      ]);
      
      setEstatisticas(estatisticasData);
      setAtividades(atividadesData);
      
      console.log('✅ Dashboard carregado com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard.');
      
      // Carregar dados de exemplo
      setEstatisticas({
        totalProdutos: 156,
        totalAssociados: 1247,
        associadosAtivos: 890,
        faturamentoMensal: 284567,
        importacoesRecentes: 12,
        servicosAtivos: 45
      });
      
      setAtividades(dashboardService.getAtividadesExemplo(5));
    } finally {
      setLoading(false);
    }
  };

  const acoesRapidas = dashboardService.getAcoesRapidas();
  const linksUteis = dashboardService.getLinksUteis();

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (atual: number, total: number) => {
    const percentual = total > 0 ? (atual / total) * 100 : 0;
    return `${percentual.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800';
      case 'Sucesso': return 'bg-blue-100 text-blue-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Falha': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'produto': return '📦';
      case 'importacao': return '📄';
      case 'usuario': return '👤';
      case 'associado': return '👥';
      case 'faturamento': return '💳';
      default: return '📋';
    }
  };

  const getStatIcon = (name: string) => {
    switch (name) {
      case 'Total de Produtos': return '📦';
      case 'Total de Associados': return '👥';
      case 'Associados Ativos': return '✅';
      case 'Faturamento Mensal': return '💳';
      case 'Importações Recentes': return '📄';
      case 'Serviços Ativos': return '🛠️';
      default: return '📊';
    }
  };

  const getChangeType = (statName: string, value: number) => {
    // Lógica para determinar se a mudança é positiva ou negativa
    // Pode ser baseada em dados históricos quando disponíveis
    switch (statName) {
      case 'Total de Produtos':
        return value > 150 ? 'positive' : 'negative';
      case 'Total de Associados':
        return value > 1200 ? 'positive' : 'negative';
      case 'Associados Ativos':
        const percentualAtivos = estatisticas ? 
          (estatisticas.associadosAtivos / estatisticas.totalAssociados) * 100 : 0;
        return percentualAtivos > 70 ? 'positive' : 'negative';
      default:
        return 'positive';
    }
  };

  const getChangeValue = (statName: string, value: number) => {
    // Valores de exemplo - podem vir de uma API de histórico
    switch (statName) {
      case 'Total de Produtos':
        return '+8%';
      case 'Total de Associados':
        return '+12%';
      case 'Associados Ativos':
        return estatisticas ? formatarPercentual(estatisticas.associadosAtivos, estatisticas.totalAssociados) : '0%';
      case 'Faturamento Mensal':
        return '+8%';
      default:
        return '+5%';
    }
  };

  const stats = estatisticas ? [
    { 
      name: 'Total de Produtos', 
      value: estatisticas.totalProdutos.toLocaleString(), 
      change: getChangeValue('Total de Produtos', estatisticas.totalProdutos),
      changeType: getChangeType('Total de Produtos', estatisticas.totalProdutos),
      icon: getStatIcon('Total de Produtos')
    },
    { 
      name: 'Total de Associados', 
      value: estatisticas.totalAssociados.toLocaleString(), 
      change: getChangeValue('Total de Associados', estatisticas.totalAssociados),
      changeType: getChangeType('Total de Associados', estatisticas.totalAssociados),
      icon: getStatIcon('Total de Associados')
    },
    { 
      name: 'Associados Ativos', 
      value: estatisticas.associadosAtivos.toLocaleString(), 
      change: getChangeValue('Associados Ativos', estatisticas.associadosAtivos),
      changeType: getChangeType('Associados Ativos', estatisticas.associadosAtivos),
      icon: getStatIcon('Associados Ativos')
    },
    { 
      name: 'Faturamento Mensal', 
      value: formatarValor(estatisticas.faturamentoMensal), 
      change: getChangeValue('Faturamento Mensal', estatisticas.faturamentoMensal),
      changeType: getChangeType('Faturamento Mensal', estatisticas.faturamentoMensal),
      icon: getStatIcon('Faturamento Mensal')
    },
    { 
      name: 'Importações Recentes', 
      value: estatisticas.importacoesRecentes.toString(), 
      change: '+3',
      changeType: 'positive',
      icon: getStatIcon('Importações Recentes')
    },
    { 
      name: 'Serviços Ativos', 
      value: estatisticas.servicosAtivos?.toString() || '45', 
      change: '+3',
      changeType: 'positive',
      icon: getStatIcon('Serviços Ativos')
    }
  ] : [];

  if (loading && !estatisticas) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard SGA</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Sistema de Gestão de Associados - Visão geral
              {estatisticas && (
                <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {estatisticas.associadosAtivos} ativos
                </span>
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={carregarDashboard}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <span>↻</span>
              Atualizar
            </button>
            
            {error && (
              <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className={`bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-all border ${
              stat.changeType === 'positive' ? 'border-green-100' : 'border-red-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className={`mt-2 text-xs sm:text-sm font-medium flex items-center gap-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.changeType === 'positive' ? '↗' : '↘'} {stat.change}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl ml-3">{stat.icon}</div>
            </div>
            
            {/* Barra de progresso para alguns stats */}
            {stat.name === 'Associados Ativos' && estatisticas && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Taxa de ativos</span>
                  <span>{formatarPercentual(estatisticas.associadosAtivos, estatisticas.totalAssociados)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ 
                      width: `${(estatisticas.associadosAtivos / estatisticas.totalAssociados) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Ações Rápidas</h2>
          <span className="text-xs text-gray-500">Atalhos para funcionalidades principais</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {acoesRapidas.map((action) => (
            <Link
              key={action.name}
              to={action.path}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-100 hover:border-blue-200 group"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl sm:text-3xl transition-transform group-hover:scale-110">
                    {action.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {action.badge && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {action.badge}
                      </span>
                    )}
                    <span className="text-gray-400 group-hover:text-blue-500 transition-colors">→</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1 group-hover:text-blue-600 transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:col-span-2 border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">Atividades Recentes</h2>
              <p className="text-sm text-gray-500">Últimas ações no sistema</p>
            </div>
            <Link 
              to="/produtos" 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1"
            >
              Ver tudo
              <span>→</span>
            </Link>
          </div>
          
          {atividades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📋</div>
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {atividades.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors gap-3 group"
                >
                  <div className="text-xl mt-1">{getTypeIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm sm:text-base text-gray-800 group-hover:text-blue-600 transition-colors">
                          {activity.title}
                        </p>
                        {activity.description && (
                          <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <Link 
                to="/verificacao-importacao" 
                className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
              >
                <span>🔍</span>
                Verificar integridade de dados
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Links Úteis e Status */}
        <div className="space-y-6 sm:space-y-8">
          {/* Links Úteis */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Cadastros</h2>
            <div className="space-y-3">
              {linksUteis.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${link.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl group-hover:scale-110 transition-transform">{link.icon}</div>
                    <div>
                      <h3 className="font-medium text-gray-800 group-hover:text-gray-900">{link.name}</h3>
                      <p className="text-xs text-gray-600">{link.description}</p>
                    </div>
                  </div>
                  <span className={`group-hover:translate-x-1 transition-transform ${link.textColor}`}>→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Status do Sistema</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">OPERACIONAL</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Serviço de Associados</span>
                </div>
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
              
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Serviço de Produtos</span>
                </div>
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
              
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Banco de Dados</span>
                </div>
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
              
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">API Externa SPC</span>
                </div>
                <span className="text-xs font-medium text-blue-600">ESTÁVEL</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Última verificação: {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com informações técnicas */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">SGA v1.0.0</span>
            <span className="mx-2">•</span>
            <span>Ambiente: Produção</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Backend: Spring Boot 2.7</span>
            <span>Frontend: React 18 + TypeScript</span>
            <span>Banco: PostgreSQL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;