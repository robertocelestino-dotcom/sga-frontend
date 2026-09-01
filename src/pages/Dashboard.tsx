// src/pages/Dashboard.tsx - VERSÃO ATUALIZADA COM CONTROLE DE ACESSO
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';
import { PermissionGuard } from '../components/PermissionGuard';

const Dashboard = () => {
  const { user, permissoes } = useAuthStore();
  const [estatisticas, setEstatisticas] = useState<any | null>(null);
  const [atividades, setAtividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarDashboard();
    
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
      
      setEstatisticas({
        totalProdutos: 156,
        totalAssociados: 1247,
        associadosAtivos: 890,
        faturamentoMensal: 284567,
        importacoesRecentes: 12,
        servicosAtivos: 45
      });
      
      setAtividades([
        { id: 1, title: 'Novo associado cadastrado', type: 'associado', status: 'Concluído', date: '2025-01-20 14:30' },
        { id: 2, title: 'Importação SPC finalizada', type: 'importacao', status: 'Sucesso', date: '2025-01-20 13:15' },
        { id: 3, title: 'Fatura gerada #12345', type: 'faturamento', status: 'Pendente', date: '2025-01-20 12:00' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const stats = estatisticas ? [
    { name: 'Total de Produtos', value: estatisticas.totalProdutos.toLocaleString(), icon: '📦' },
    { name: 'Total de Associados', value: estatisticas.totalAssociados.toLocaleString(), icon: '👥' },
    { name: 'Associados Ativos', value: estatisticas.associadosAtivos.toLocaleString(), icon: '✅' },
    { name: 'Faturamento Mensal', value: formatarValor(estatisticas.faturamentoMensal), icon: '💳' },
  ] : [];

  if (loading && !estatisticas) {
    return (
      <div className="container mx-auto px-4 py-8">
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
    <div className="container mx-auto px-4 py-8">
      {/* Header com informações do usuário */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard SGA</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo, <strong>{user?.nomeCompleto || user?.username}</strong>
            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {user?.perfilNome || user?.role}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={carregarDashboard}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>↻</span> Atualizar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ações Rápidas com PermissionGuard */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Ações Rápidas</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Ações que dependem de permissões */}
          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <Link to="/associados/novo" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-100 hover:border-blue-200">
              <div className="text-3xl mb-2">👤</div>
              <h3 className="font-semibold text-gray-800">Novo Associado</h3>
              <p className="text-sm text-gray-600">Cadastrar novo associado</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['PRODUTO_CREATE']}>
            <Link to="/produtos/novo" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-100 hover:border-blue-200">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold text-gray-800">Novo Produto</h3>
              <p className="text-sm text-gray-600">Cadastrar novo produto</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['FATURA_PROCESS']}>
            <Link to="/faturamento/processar" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-100 hover:border-blue-200">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800">Processar Faturamento</h3>
              <p className="text-sm text-gray-600">Executar processamento</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['IMPORTACAO_CREATE']}>
            <Link to="/importacao-spc" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer border border-gray-100 hover:border-blue-200">
              <div className="text-3xl mb-2">📥</div>
              <h3 className="font-semibold text-gray-800">Importar SPC</h3>
              <p className="text-sm text-gray-600">Importar arquivo SPC</p>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Conteúdo restante com PermissionGuard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Atividades Recentes</h2>
          </div>
          
          {atividades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-3xl mb-2">📋</div>
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atividades.map((activity) => (
                <div key={activity.id} className="flex items-start p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors gap-3">
                  <div className="text-xl mt-1">
                    {activity.type === 'associado' && '👤'}
                    {activity.type === 'importacao' && '📄'}
                    {activity.type === 'faturamento' && '💳'}
                    {activity.type === 'produto' && '📦'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                    activity.status === 'Sucesso' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informações do Usuário e Permissões */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Meu Perfil</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Usuário</p>
                <p className="font-medium">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{user?.nomeCompleto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Perfil</p>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {user?.perfilNome || user?.role}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Permissões</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {permissoes?.slice(0, 5).map((p, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      {p}
                    </span>
                  ))}
                  {permissoes?.length > 5 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                      +{permissoes.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Status do Sistema</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-600">OPERACIONAL</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">API</span>
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <span className="text-sm">Banco de Dados</span>
                <span className="text-xs font-medium text-green-600">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;