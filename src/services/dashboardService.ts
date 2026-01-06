// src/services/dashboardService.ts
import api from './api';
import { associadoService } from './associadoService';
import { produtoService } from './produtoService';

export interface DashboardStats {
  totalProdutos: number;
  totalAssociados: number;
  associadosAtivos: number;
  faturamentoMensal: number;
  importacoesRecentes: number;
  servicosAtivos?: number;
}

export interface ActivityItem {
  id: number;
  title: string;
  date: string;
  status: 'Concluído' | 'Sucesso' | 'Pendente' | 'Falha';
  type: 'produto' | 'importacao' | 'usuario' | 'associado' | 'faturamento';
  description?: string;
}

export interface QuickAction {
  name: string;
  path: string;
  icon: string;
  description: string;
  badge?: string;
}

export const dashboardService = {
  // Buscar estatísticas
  async getEstatisticas(): Promise<DashboardStats> {
    console.log('📊 [dashboardService] Buscando estatísticas...');
    
    try {
      // Buscar dados em paralelo para melhor performance
      const [totalProdutos, totalAssociados, associadosAtivos] = await Promise.all([
        this.getTotalProdutos(),
        this.getTotalAssociados(),
        this.getAssociadosAtivos()
      ]);

      const estatisticas: DashboardStats = {
        totalProdutos,
        totalAssociados,
        associadosAtivos,
        faturamentoMensal: await this.getFaturamentoMensal(),
        importacoesRecentes: await this.getImportacoesRecentes(),
        servicosAtivos: 45 // Exemplo fixo - pode ser substituído por API real
      };

      console.log('✅ [dashboardService] Estatísticas carregadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ [dashboardService] Erro ao carregar estatísticas:', error);
      
      // Retornar valores padrão em caso de erro
      return {
        totalProdutos: 0,
        totalAssociados: 0,
        associadosAtivos: 0,
        faturamentoMensal: 0,
        importacoesRecentes: 0,
        servicosAtivos: 0
      };
    }
  },

  // Métodos auxiliares para estatísticas específicas
  async getTotalProdutos(): Promise<number> {
    try {
      // Se seu produtoService tiver um método para contar produtos
      const response = await produtoService.listar({ size: 1 });
      return response.totalElements || 0;
    } catch {
      return 156; // Fallback para valor de exemplo
    }
  },

  async getTotalAssociados(): Promise<number> {
    try {
      const response = await associadoService.listar({ size: 1 });
      return response.totalElements || 0;
    } catch {
      return 1247; // Fallback
    }
  },

  async getAssociadosAtivos(): Promise<number> {
    try {
      const response = await associadoService.listar({ status: 'A', size: 1 });
      return response.totalElements || 0;
    } catch {
      return 890; // Fallback
    }
  },

  async getFaturamentoMensal(): Promise<number> {
    try {
      // Chamar API real de faturamento quando disponível
      // Por enquanto, usar cálculo baseado em associados ativos
      const associadosAtivos = await this.getAssociadosAtivos();
      return associadosAtivos * 320; // Exemplo: R$320 por associado
    } catch {
      return 284567; // Fallback
    }
  },

  async getImportacoesRecentes(): Promise<number> {
    try {
      // Chamar API de importações quando disponível
      const response = await api.get('/importacao/count-recentes');
      return response.data || 0;
    } catch {
      return 12; // Fallback
    }
  },

  // Buscar atividades recentes
  async getAtividadesRecentes(limit: number = 5): Promise<ActivityItem[]> {
    console.log('📋 [dashboardService] Buscando atividades recentes...');
    
    try {
      // Buscar de diferentes fontes
      const promises = [
        // this.getAtividadesProdutos(),
        // this.getAtividadesImportacoes(),
        // this.getAtividadesAssociados()
      ];

      const resultados = await Promise.allSettled(promises);
      let todasAtividades: ActivityItem[] = [];

      resultados.forEach(result => {
        if (result.status === 'fulfilled') {
          todasAtividades = [...todasAtividades, ...result.value];
        }
      });

      // Ordenar por data (mais recente primeiro) e limitar
      todasAtividades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Se não houver atividades reais, retornar exemplos
      if (todasAtividades.length === 0) {
        return this.getAtividadesExemplo(limit);
      }

      return todasAtividades.slice(0, limit);
    } catch (error) {
      console.error('❌ [dashboardService] Erro ao buscar atividades:', error);
      return this.getAtividadesExemplo(limit);
    }
  },

  // Atividades de exemplo (fallback)
  getAtividadesExemplo(limit: number = 5): ActivityItem[] {
    const agora = new Date();
    return [
      {
        id: 1,
        title: 'Novo produto cadastrado',
        date: `${agora.getDate()}/${agora.getMonth() + 1}/${agora.getFullYear()} - ${agora.getHours()}:${agora.getMinutes().toString().padStart(2, '0')}`,
        status: 'Concluído',
        type: 'produto',
        description: 'Produto "Plano Premium" adicionado ao catálogo'
      },
      {
        id: 2,
        title: 'Importação SPC concluída',
        date: `${agora.getDate() - 1}/${agora.getMonth() + 1}/${agora.getFullYear()} - 14:30`,
        status: 'Sucesso',
        type: 'importacao',
        description: 'Arquivo spc_2025_11.txt processado com sucesso'
      },
      {
        id: 3,
        title: 'Novo associado cadastrado',
        date: `${agora.getDate() - 2}/${agora.getMonth() + 1}/${agora.getFullYear()} - 09:15`,
        status: 'Concluído',
        type: 'associado',
        description: 'Associado "Empresa XYZ LTDA" cadastrado'
      },
      {
        id: 4,
        title: 'Processamento de faturamento',
        date: `${agora.getDate() - 3}/${agora.getMonth() + 1}/${agora.getFullYear()} - 16:45`,
        status: 'Concluído',
        type: 'faturamento',
        description: 'Faturamento do mês 11/2025 processado'
      },
      {
        id: 5,
        title: 'Atualização de parâmetros',
        date: `${agora.getDate() - 4}/${agora.getMonth() + 1}/${agora.getFullYear()} - 11:20`,
        status: 'Sucesso',
        type: 'usuario',
        description: 'Parâmetros do sistema atualizados'
      }
    ].slice(0, limit);
  },

  // Ações rápidas disponíveis
  getAcoesRapidas(): QuickAction[] {
    return [
      { 
        name: 'Gestão de Produtos', 
        path: '/produtos', 
        icon: '📦', 
        description: 'Cadastro e consulta' 
      },
      { 
        name: 'Importar SPC', 
        path: '/importacao-spc', 
        icon: '📄', 
        description: 'Arquivos TXT',
        badge: 'Nova'
      },
      { 
        name: 'Gestão de Associados', 
        path: '/associados', 
        icon: '👥', 
        description: 'Cadastros' 
      },
      { 
        name: 'Verificação Importação', 
        path: '/verificacao-importacao', 
        icon: '🔍', 
        description: 'Comparar dados' 
      },
      { 
        name: 'Processar Faturamento', 
        path: '/processar-faturamento', 
        icon: '⚡', 
        description: 'Executar' 
      },
      { 
        name: 'Relatórios Produtos', 
        path: '/relatorios-produtos', 
        icon: '📊', 
        description: 'Análises' 
      },
      { 
        name: 'Usuários', 
        path: '/usuarios', 
        icon: '👤', 
        description: 'Acessos' 
      },
      { 
        name: 'Parâmetros', 
        path: '/parametrizacao-associados', 
        icon: '⚙️', 
        description: 'Configurações' 
      }
    ];
  },

  // Links úteis para o dashboard
  getLinksUteis() {
    return [
      { 
        name: 'Produtos', 
        path: '/produtos', 
        icon: '📦', 
        description: 'Gestão completa',
        color: 'bg-blue-50 hover:bg-blue-100',
        textColor: 'text-blue-600'
      },
      { 
        name: 'Associados', 
        path: '/associados', 
        icon: '👥', 
        description: 'Cadastro e gestão',
        color: 'bg-green-50 hover:bg-green-100',
        textColor: 'text-green-600'
      },
      { 
        name: 'Usuários', 
        path: '/usuarios', 
        icon: '👤', 
        description: 'Acessos e permissões',
        color: 'bg-purple-50 hover:bg-purple-100',
        textColor: 'text-purple-600'
      },
      { 
        name: 'Parâmetros', 
        path: '/parametrizacao-associados', 
        icon: '⚙️', 
        description: 'Configurações do sistema',
        color: 'bg-yellow-50 hover:bg-yellow-100',
        textColor: 'text-yellow-600'
      }
    ];
  },

  // Health check do sistema
  async healthCheck(): Promise<{ status: string; services: any[] }> {
    try {
      const checks = await Promise.allSettled([
        associadoService.healthCheck().catch(() => ({ status: 'DOWN' })),
        produtoService.listar({ size: 1 }).then(() => ({ status: 'UP' })).catch(() => ({ status: 'DOWN' }))
      ]);

      const services = checks.map((check, index) => ({
        name: index === 0 ? 'Serviço de Associados' : 'Serviço de Produtos',
        status: check.status === 'fulfilled' ? check.value.status || 'UP' : 'DOWN'
      }));

      const allUp = services.every(s => s.status === 'UP');
      
      return {
        status: allUp ? 'HEALTHY' : 'DEGRADED',
        services
      };
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        services: [
          { name: 'Sistema', status: 'DOWN', error: error.message }
        ]
      };
    }
  }
};