// src/config/permissaoLabels.ts

/**
 * Mapa de tradução: nome técnico da permissão → label amigável em português.
 *
 * - Se a permissão estiver no mapa, usa o label.
 * - Se não estiver, faz fallback derivando do nome (ex: ASSOCIADO_VIEW → "Associado View").
 * - Se ainda assim não der, usa o nome bruto.
 */

export const PERMISSAO_LABELS: Record<string, string> = {
    // DASHBOARD
    'DASHBOARD_VIEW': 'Dashboard - Visualizar',
    'DASHBOARD_EXPORT': 'Dashboard - Exportar',

    // ASSOCIADOS
    'ASSOCIADO_VIEW': 'Associados - Visualizar',
    'ASSOCIADO_CREATE': 'Associados - Incluir',
    'ASSOCIADO_EDIT': 'Associados - Alterar',
    'ASSOCIADO_DELETE': 'Associados - Excluir',
    'ASSOCIADO_EXPORT': 'Associados - Exportar',

    // PRODUTOS
    'PRODUTO_VIEW': 'Produtos - Visualizar',
    'PRODUTO_CREATE': 'Produtos - Incluir',
    'PRODUTO_EDIT': 'Produtos - Alterar',
    'PRODUTO_DELETE': 'Produtos - Excluir',

    // PLANOS
    'PLANO_VIEW': 'Planos - Visualizar',
    'PLANO_CREATE': 'Planos - Incluir',
    'PLANO_EDIT': 'Planos - Alterar',
    'PLANO_DELETE': 'Planos - Excluir',

    // FATURAMENTO
    'FATURA_VIEW': 'Faturas - Visualizar',
    'FATURA_PROCESS': 'Faturas - Processar',
    'FATURA_EXPORT_RM': 'Faturas - Exportar RM',
    'FATURA_DELETE': 'Faturas - Cancelar',
    'CONFERENCIA_FATURAMENTO_VIEW': 'Faturas - Conferência',

    // IMPORTAÇÕES
    'IMPORTACAO_VIEW': 'Importações - Visualizar',
    'IMPORTACAO_CREATE': 'Importações - Incluir',
    'IMPORTACAO_VERIFICAR': 'Importações - Verificar',
    'IMPORTACAO_CORRIGIR': 'Importações - Corrigir',

    // INTEGRAÇÕES RM
    'RM_CONFIG_VIEW': 'RM - Visualizar',
    'RM_CONFIG_EDIT': 'RM - Configurar',
    'RM_EXECUTAR': 'RM - Executar',

    // RELATÓRIOS E LOGS
    'RELATORIO_VIEW': 'Relatórios - Visualizar',
    'RELATORIO_EXPORT': 'Relatórios - Exportar',
    'LOG_VIEW': 'Logs - Visualizar',

    // USUÁRIOS
    'USUARIO_VIEW': 'Usuários - Visualizar',
    'USUARIO_CREATE': 'Usuários - Incluir',
    'USUARIO_EDIT': 'Usuários - Alterar',
    'USUARIO_DELETE': 'Usuários - Excluir',
    'USUARIO_BLOQUEAR': 'Usuários - Bloquear',

    // PERFIS
    'PERFIL_VIEW': 'Perfis - Visualizar',
    'PERFIL_CREATE': 'Perfis - Incluir',
    'PERFIL_EDIT': 'Perfis - Alterar',
    'PERFIL_DELETE': 'Perfis - Excluir',
    'PERFIL_ASSOCIAR': 'Perfis - Associar',

    // PARÂMETROS
    'PARAMETRO_VIEW': 'Parâmetros - Visualizar',
    'PARAMETRO_EDIT': 'Parâmetros - Alterar',

    // LDAP (mantém nome original — tem espaços no banco)
    'LDAP - Visualizar': 'LDAP - Visualizar',
    'LDAP - Configurar': 'LDAP - Configurar',
    'LDAP - Executar': 'LDAP - Executar',
    'LDAP - Usuários': 'LDAP - Usuários',

    // SISTEMA
    'SWAGGER_VIEW': 'Sistema - Acessar Swagger',

   // ============================================================
    // NOVAS — Fase 3
    // ============================================================
    'NOTIFICACAO_VIEW': 'Notificações - Visualizar',
    'VENDEDOR_VIEW': 'Vendedores - Visualizar',
    'VENDEDOR_CREATE': 'Vendedores - Incluir',
    'GESTAO_VIEW': 'Gestão - Visualizar',
    'INTEGRACAO_VIEW': 'Integrações - Visualizar',  

};

/**
 * Deriva uma label amigável a partir do nome técnico.
 * Ex: ASSOCIADO_VIEW → "Associado View"
 */
const derivarLabel = (nome: string): string => {
    if (!nome) return '';

    if (nome.includes(' ')) return nome;

    return nome
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Retorna a label amigável de uma permissão.
 */
export const getPermissaoLabel = (nome: string): string => {
    if (!nome) return '';
    return PERMISSAO_LABELS[nome] || derivarLabel(nome);
};

/**
 * Agrupa permissões por "categoria" derivada do prefixo do nome.
 */
export const getPermissaoCategoria = (nome: string): string => {
    if (!nome) return 'Outros';

    if (nome.includes(' ')) {
        return nome.split(' ')[0];
    }

    const prefixo = nome.split('_')[0];

    const mapaCategorias: Record<string, string> = {

        'DASHBOARD': 'Dashboard',
        'ASSOCIADO': 'Associados',
        'PRODUTO': 'Produtos',
        'PLANO': 'Planos',
        'FATURA': 'Faturamento',
        'CONFERENCIA': 'Faturamento',
        'IMPORTACAO': 'Importações',
        'RM': 'Integrações RM',
        'RELATORIO': 'Relatórios',
        'LOG': 'Logs',
        'USUARIO': 'Usuários',
        'PERFIL': 'Perfis',
        'PARAMETRO': 'Parâmetros',
        'SWAGGER': 'Sistema',
        'NOTIFICACAO': 'Notificações',
        'VENDEDOR': 'Vendedores',
        'GESTAO': 'Gestão',
        'INTEGRACAO': 'Integrações',
        
    };

    return mapaCategorias[prefixo] || derivarLabel(prefixo);
};
