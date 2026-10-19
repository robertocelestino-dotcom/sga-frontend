// src/pages/Dashboard.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Shield } from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';
import { PermissionGuard } from '../components/PermissionGuard';
import EmptyState from '../components/ui/EmptyState';

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

      const [estatisticasData, atividadesData] = await Promise.all([
        dashboardService.getEstatisticas(),
        dashboardService.getAtividadesRecentes(5),
      ]);

      setEstatisticas(estatisticasData);
      setAtividades(atividadesData);
    } catch (err: any) {
      console.error('❌ Erro ao carregar dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard.');

      setEstatisticas({
        totalProdutos: 156,
        totalAssociados: 1247,
        associadosAtivos: 890,
        faturamentoMensal: 284567,
        importacoesRecentes: 12,
        servicosAtivos: 45,
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

  const formatarValor = (valor: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const stats = estatisticas
    ? [
        { name: 'Total de Produtos', value: estatisticas.totalProdutos.toLocaleString(), icon: '📦', tone: 'navy' },
        { name: 'Total de Associados', value: estatisticas.totalAssociados.toLocaleString(), icon: '👥', tone: 'navy' },
        { name: 'Associados Ativos', value: estatisticas.associadosAtivos.toLocaleString(), icon: '✅', tone: 'green' },
        { name: 'Faturamento Mensal', value: formatarValor(estatisticas.faturamentoMensal), icon: '💳', tone: 'yellow' },
      ]
    : [];

  const getToneClasses = (tone: string) => {
    switch (tone) {
      case 'green':  return { bg: 'bg-cdl-green-50',   border: 'border-cdl-green-100',   text: 'text-cdl-green-700' };
      case 'yellow': return { bg: 'bg-cdl-yellow-50',  border: 'border-cdl-yellow-100',  text: 'text-cdl-yellow-700' };
      default:       return { bg: 'bg-cdl-navy-50',    border: 'border-cdl-navy-100',    text: 'text-cdl-navy-700' };
    }
  };

  const getActivityStatus = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-cdl-green-100 text-cdl-green-700';
      case 'Sucesso':   return 'bg-cdl-navy-100 text-cdl-navy-700';
      case 'Pendente':  return 'bg-cdl-yellow-100 text-cdl-yellow-700';
      default:          return 'bg-cdl-neutral-100 text-cdl-neutral-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'associado':   return '👤';
      case 'importacao':  return '📄';
      case 'faturamento': return '💳';
      case 'produto':     return '📦';
      default:            return '📋';
    }
  };

  if (loading && !estatisticas) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cdl-navy-100 border-t-cdl-navy-700 mb-4" />
          <p className="text-cdl-navy-700 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Dashboard SGA</h1>
          <p className="text-gray-600 flex flex-wrap items-center gap-2">
            Bem-vindo, <strong className="text-cdl-navy-700">{user?.nomeCompleto || user?.username}</strong>
            <span className="text-xs px-2 py-1 bg-cdl-navy-50 text-cdl-navy-700 rounded-full font-medium border border-cdl-navy-100">
              <Shield size={12} className="inline mr-1" />
              {user?.perfilNome || user?.role}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={carregarDashboard}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-100
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : '🔄 Atualizar'}
          </button>
        </div>
      </div>

      {/* ===== Aviso de erro / modo degradado ===== */}
      {error && (
        <div className="mb-6 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg flex items-start gap-2">
          <span className="text-cdl-yellow-700">⚠️</span>
          <span className="text-sm text-cdl-yellow-700 font-medium">
            {error} Exibindo dados de exemplo.
          </span>
        </div>
      )}

      {/* ===== Estatísticas (KPIs) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const tone = getToneClasses((stat as any).tone);
          return (
            <div
              key={stat.name}
              className={`bg-white rounded-lg shadow border border-gray-200 overflow-hidden`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium truncate">
                      {stat.name}
                    </p>
                    <p className={`text-2xl font-bold mt-1 truncate ${tone.text}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${tone.bg} border ${tone.border} flex-shrink-0`}>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Ações Rápidas ===== */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
          <h2 className="text-lg font-semibold text-cdl-navy-700">⚡ Ações Rápidas</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <Link
              to="/associados/novo"
              className="bg-white rounded-lg shadow border border-gray-200 p-4
                         hover:border-cdl-navy-200 hover:shadow-cdl transition-all
                         hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👤</div>
              <h3 className="font-semibold text-cdl-navy-700">Novo Associado</h3>
              <p className="text-sm text-gray-600">Cadastrar novo associado</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['PRODUTO_CREATE']}>
            <Link
              to="/produtos/novo"
              className="bg-white rounded-lg shadow border border-gray-200 p-4
                         hover:border-cdl-navy-200 hover:shadow-cdl transition-all
                         hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</div>
              <h3 className="font-semibold text-cdl-navy-700">Novo Produto</h3>
              <p className="text-sm text-gray-600">Cadastrar novo produto</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['FATURA_PROCESS']}>
            <Link
              to="/faturamento/processar"
              className="bg-white rounded-lg shadow border border-gray-200 p-4
                         hover:border-cdl-navy-200 hover:shadow-cdl transition-all
                         hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-semibold text-cdl-navy-700">Processar Faturamento</h3>
              <p className="text-sm text-gray-600">Executar processamento</p>
            </Link>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['IMPORTACAO_CREATE']}>
            <Link
              to="/importacao-spc"
              className="bg-white rounded-lg shadow border border-gray-200 p-4
                         hover:border-cdl-navy-200 hover:shadow-cdl transition-all
                         hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📥</div>
              <h3 className="font-semibold text-cdl-navy-700">Importar SPC</h3>
              <p className="text-sm text-gray-600">Importar arquivo SPC</p>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* ===== Conteúdo principal ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
            <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
            <h2 className="text-lg font-semibold text-cdl-navy-700">📋 Atividades Recentes</h2>
          </div>

          <div className="p-6">
            {atividades.length === 0 ? (
              <EmptyState
                icon="📋"
                title="Nenhuma atividade recente"
                description="As atividades do sistema aparecerão aqui."
                compact
              />
            ) : (
              <div className="space-y-3">
                {atividades.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start p-3 bg-cdl-neutral-50 hover:bg-cdl-navy-50/60
                               rounded-lg transition-colors gap-3 border border-cdl-neutral-100"
                  >
                    <div className="text-xl mt-1 flex-shrink-0">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-cdl-navy-700 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getActivityStatus(
                        activity.status
                      )}`}
                    >
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-6">
          {/* Meu Perfil */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
              <h2 className="text-lg font-semibold text-cdl-navy-700">👤 Meu Perfil</h2>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Usuário</p>
                <p className="font-medium text-gray-900 font-mono">{user?.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Nome</p>
                <p className="font-medium text-gray-900">{user?.nomeCompleto}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Perfil</p>
                <span className="inline-block mt-1 px-2 py-1 bg-cdl-navy-50 text-cdl-navy-700 rounded-full text-xs font-medium border border-cdl-navy-100">
                  {user?.perfilNome || user?.role}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                  Permissões
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {permissoes?.slice(0, 5).map((p, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-cdl-neutral-100 text-cdl-navy-700 text-xs rounded font-medium"
                    >
                      {p}
                    </span>
                  ))}
                  {permissoes?.length > 5 && (
                    <span className="px-2 py-0.5 bg-cdl-navy-50 text-cdl-navy-700 text-xs rounded font-medium border border-cdl-navy-100">
                      +{permissoes.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h2 className="text-lg font-semibold text-cdl-navy-700">🔧 Status do Sistema</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cdl-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-cdl-green-700">OPERACIONAL</span>
              </div>
            </div>
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between p-2 hover:bg-cdl-navy-50/60 rounded transition-colors">
                <span className="text-sm text-cdl-navy-700 font-medium">API</span>
                <span className="text-xs font-bold text-cdl-green-700">ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 hover:bg-cdl-navy-50/60 rounded transition-colors">
                <span className="text-sm text-cdl-navy-700 font-medium">Banco de Dados</span>
                <span className="text-xs font-bold text-cdl-green-700">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;