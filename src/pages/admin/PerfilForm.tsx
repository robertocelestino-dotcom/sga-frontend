// src/pages/admin/PerfilForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Users, CheckSquare, Square, ChevronDown, ChevronRight, Key, Menu as MenuIcon } from 'lucide-react';
import { perfilService } from '../../services/perfilService';
import { menuService } from '../../services/menuService';
import { PermissionGuard } from '../../components/PermissionGuard';
import { Perfil, Menu } from '../../types/auth';
import { useMessage } from '../../providers/MessageProvider';

// 🔥 PERMISSÕES COM NOMES EM PORTUGUÊS
const PERMISSOES_DISPONIVEIS = [
    // Dashboard
    { id: 1, nome: 'Dashboard - Visualizar', descricao: 'Visualizar dashboard', categoria: 'Dashboard' },
    { id: 2, nome: 'Dashboard - Exportar', descricao: 'Exportar dashboard', categoria: 'Dashboard' },
    
    // Associados
    { id: 3, nome: 'Associados - Visualizar', descricao: 'Visualizar associados', categoria: 'Associados' },
    { id: 4, nome: 'Associados - Incluir', descricao: 'Incluir associados', categoria: 'Associados' },
    { id: 5, nome: 'Associados - Alterar', descricao: 'Alterar associados', categoria: 'Associados' },
    { id: 6, nome: 'Associados - Excluir', descricao: 'Excluir associados', categoria: 'Associados' },
    { id: 7, nome: 'Associados - Exportar', descricao: 'Exportar associados', categoria: 'Associados' },
    
    // Produtos
    { id: 8, nome: 'Produtos - Visualizar', descricao: 'Visualizar produtos', categoria: 'Produtos' },
    { id: 9, nome: 'Produtos - Incluir', descricao: 'Incluir produtos', categoria: 'Produtos' },
    { id: 10, nome: 'Produtos - Alterar', descricao: 'Alterar produtos', categoria: 'Produtos' },
    { id: 11, nome: 'Produtos - Excluir', descricao: 'Excluir produtos', categoria: 'Produtos' },
    
    // Planos
    { id: 12, nome: 'Planos - Visualizar', descricao: 'Visualizar planos', categoria: 'Planos' },
    { id: 13, nome: 'Planos - Incluir', descricao: 'Incluir planos', categoria: 'Planos' },
    { id: 14, nome: 'Planos - Alterar', descricao: 'Alterar planos', categoria: 'Planos' },
    { id: 15, nome: 'Planos - Excluir', descricao: 'Excluir planos', categoria: 'Planos' },
    
    // Faturamento
    { id: 16, nome: 'Faturas - Visualizar', descricao: 'Visualizar faturas', categoria: 'Faturamento' },
    { id: 17, nome: 'Faturas - Processar', descricao: 'Processar faturamento', categoria: 'Faturamento' },
    { id: 18, nome: 'Faturas - Exportar RM', descricao: 'Exportar para RM', categoria: 'Faturamento' },
    { id: 19, nome: 'Faturas - Cancelar', descricao: 'Cancelar faturas', categoria: 'Faturamento' },
    
    // Importações
    { id: 20, nome: 'Importações - Visualizar', descricao: 'Visualizar importações', categoria: 'Importações' },
    { id: 21, nome: 'Importações - Incluir', descricao: 'Realizar importações', categoria: 'Importações' },
    { id: 22, nome: 'Importações - Verificar', descricao: 'Verificar importações', categoria: 'Importações' },
    { id: 23, nome: 'Importações - Corrigir', descricao: 'Corrigir divergências', categoria: 'Importações' },
    
    // Integrações
    { id: 24, nome: 'RM - Visualizar', descricao: 'Visualizar configurações RM', categoria: 'Integrações' },
    { id: 25, nome: 'RM - Configurar', descricao: 'Editar configurações RM', categoria: 'Integrações' },
    { id: 26, nome: 'RM - Executar', descricao: 'Executar integração RM', categoria: 'Integrações' },
    
    // Relatórios
    { id: 27, nome: 'Relatórios - Visualizar', descricao: 'Visualizar relatórios', categoria: 'Relatórios' },
    { id: 28, nome: 'Relatórios - Exportar', descricao: 'Exportar relatórios', categoria: 'Relatórios' },
    { id: 29, nome: 'Logs - Visualizar', descricao: 'Visualizar logs do sistema', categoria: 'Relatórios' },
    
    // Administração - Usuários
    { id: 30, nome: 'Usuários - Visualizar', descricao: 'Visualizar usuários', categoria: 'Usuários' },
    { id: 31, nome: 'Usuários - Incluir', descricao: 'Incluir usuários', categoria: 'Usuários' },
    { id: 32, nome: 'Usuários - Alterar', descricao: 'Alterar usuários', categoria: 'Usuários' },
    { id: 33, nome: 'Usuários - Excluir', descricao: 'Excluir usuários', categoria: 'Usuários' },
    { id: 34, nome: 'Usuários - Bloquear', descricao: 'Bloquear/desbloquear usuários', categoria: 'Usuários' },
    
    // Administração - Perfis
    { id: 35, nome: 'Perfis - Visualizar', descricao: 'Visualizar perfis', categoria: 'Perfis' },
    { id: 36, nome: 'Perfis - Incluir', descricao: 'Incluir perfis', categoria: 'Perfis' },
    { id: 37, nome: 'Perfis - Alterar', descricao: 'Alterar perfis', categoria: 'Perfis' },
    { id: 38, nome: 'Perfis - Excluir', descricao: 'Excluir perfis', categoria: 'Perfis' },
    { id: 39, nome: 'Perfis - Associar', descricao: 'Associar menus/permissões', categoria: 'Perfis' },
    
    // Administração - Parâmetros
    { id: 40, nome: 'Parâmetros - Visualizar', descricao: 'Visualizar parâmetros', categoria: 'Parâmetros' },
    { id: 41, nome: 'Parâmetros - Alterar', descricao: 'Alterar parâmetros', categoria: 'Parâmetros' },
];

// Agrupar permissões por categoria
const permissoesPorCategoria = PERMISSOES_DISPONIVEIS.reduce((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = [];
    acc[p.categoria].push(p);
    return acc;
}, {} as Record<string, typeof PERMISSOES_DISPONIVEIS>);

export const PerfilForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const { showToast } = useMessage();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
    const [expandedPermissoes, setExpandedPermissoes] = useState<Set<string>>(new Set(['Dashboard', 'Associados']));
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        ativo: true,
        menusIds: [] as number[],
        permissoesIds: [] as number[]
    });

    useEffect(() => {
        carregarDados();
        if (isEditing) {
            carregarPerfil();
        }
    }, [id]);

    const carregarDados = async () => {
        try {
            const data = await menuService.listar();
            setMenus(data);
        } catch (error) {
            console.error('Erro ao carregar menus:', error);
            showToast('Erro ao carregar menus', 'error');
        }
    };

    const carregarPerfil = async () => {
        try {
            setLoading(true);
            const data = await perfilService.buscarPorId(Number(id));
            setFormData({
                nome: data.nome,
                descricao: data.descricao || '',
                ativo: data.ativo,
                menusIds: data.menus?.map(m => m.id) || [],
                permissoesIds: data.permissoes?.map(p => p.id) || []
            });
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            showToast('Erro ao carregar dados do perfil', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    // ============================================================
    // MENUS - SELEÇÃO EM CASCATA
    // ============================================================

    const toggleMenu = (menuId: number) => {
        setFormData(prev => ({
            ...prev,
            menusIds: prev.menusIds.includes(menuId)
                ? prev.menusIds.filter(id => id !== menuId)
                : [...prev.menusIds, menuId]
        }));
    };

    const toggleMenuCascata = (menu: Menu) => {
        const getAllMenuIds = (m: Menu): number[] => {
            let ids = [m.id];
            if (m.subMenus && m.subMenus.length > 0) {
                m.subMenus.forEach(sub => {
                    ids = [...ids, ...getAllMenuIds(sub)];
                });
            }
            return ids;
        };

        const allIds = getAllMenuIds(menu);
        const allSelected = allIds.every(id => formData.menusIds.includes(id));
        
        setFormData(prev => ({
            ...prev,
            menusIds: allSelected
                ? prev.menusIds.filter(id => !allIds.includes(id))
                : [...new Set([...prev.menusIds, ...allIds])]
        }));
    };

    const isMenuCompleto = (menu: Menu): boolean => {
        const getAllMenuIds = (m: Menu): number[] => {
            let ids = [m.id];
            if (m.subMenus && m.subMenus.length > 0) {
                m.subMenus.forEach(sub => {
                    ids = [...ids, ...getAllMenuIds(sub)];
                });
            }
            return ids;
        };

        const allIds = getAllMenuIds(menu);
        return allIds.every(id => formData.menusIds.includes(id));
    };

    const isMenuParcial = (menu: Menu): boolean => {
        const getAllMenuIds = (m: Menu): number[] => {
            let ids = [m.id];
            if (m.subMenus && m.subMenus.length > 0) {
                m.subMenus.forEach(sub => {
                    ids = [...ids, ...getAllMenuIds(sub)];
                });
            }
            return ids;
        };

        const allIds = getAllMenuIds(menu);
        return allIds.some(id => formData.menusIds.includes(id)) && !isMenuCompleto(menu);
    };

    // ============================================================
    // PERMISSÕES - SELEÇÃO EM CASCATA
    // ============================================================

    const togglePermissao = (permissaoId: number) => {
        setFormData(prev => ({
            ...prev,
            permissoesIds: prev.permissoesIds.includes(permissaoId)
                ? prev.permissoesIds.filter(id => id !== permissaoId)
                : [...prev.permissoesIds, permissaoId]
        }));
    };

    const toggleCategoriaPermissao = (categoria: string) => {
        const ids = permissoesPorCategoria[categoria]?.map(p => p.id) || [];
        const allSelected = ids.every(id => formData.permissoesIds.includes(id));
        
        setFormData(prev => ({
            ...prev,
            permissoesIds: allSelected
                ? prev.permissoesIds.filter(id => !ids.includes(id))
                : [...new Set([...prev.permissoesIds, ...ids])]
        }));
    };

    const isCategoriaCompleta = (categoria: string) => {
        const ids = permissoesPorCategoria[categoria]?.map(p => p.id) || [];
        return ids.length > 0 && ids.every(id => formData.permissoesIds.includes(id));
    };

    const isCategoriaParcial = (categoria: string) => {
        const ids = permissoesPorCategoria[categoria]?.map(p => p.id) || [];
        return ids.some(id => formData.permissoesIds.includes(id)) && !isCategoriaCompleta(categoria);
    };

    const toggleExpandMenu = (menuId: number) => {
        const newExpanded = new Set(expandedMenus);
        if (newExpanded.has(menuId)) {
            newExpanded.delete(menuId);
        } else {
            newExpanded.add(menuId);
        }
        setExpandedMenus(newExpanded);
    };

    const toggleExpandPermissao = (categoria: string) => {
        const newExpanded = new Set(expandedPermissoes);
        if (newExpanded.has(categoria)) {
            newExpanded.delete(categoria);
        } else {
            newExpanded.add(categoria);
        }
        setExpandedPermissoes(newExpanded);
    };

    const toggleAllMenus = () => {
        const allMenuIds = menus.filter(m => m.ativo).map(m => m.id);
        const allSelected = allMenuIds.every(id => formData.menusIds.includes(id));
        setFormData(prev => ({
            ...prev,
            menusIds: allSelected ? [] : allMenuIds
        }));
    };

    const toggleAllPermissoes = () => {
        const allPermissaoIds = PERMISSOES_DISPONIVEIS.map(p => p.id);
        const allSelected = allPermissaoIds.every(id => formData.permissoesIds.includes(id));
        setFormData(prev => ({
            ...prev,
            permissoesIds: allSelected ? [] : allPermissaoIds
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                nome: formData.nome,
                descricao: formData.descricao,
                ativo: formData.ativo,
                menusIds: formData.menusIds,
                permissoesIds: formData.permissoesIds
            };

            if (isEditing) {
                await perfilService.atualizar(Number(id), data);
                showToast('Perfil atualizado com sucesso!', 'success');
            } else {
                await perfilService.criar(data);
                showToast('Perfil criado com sucesso!', 'success');
            }
            navigate('/admin/perfis');
        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            showToast(error.response?.data?.message || 'Erro ao salvar perfil', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/perfis')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {isEditing ? 'Atualize as informações do perfil' : 'Crie um novo perfil de acesso'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Nome e Descrição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Shield size={16} className="inline mr-2" />
                            Nome do Perfil *
                        </label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: ADMIN, GERENTE, OPERADOR"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                name="ativo"
                                checked={formData.ativo}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ml-2 text-sm text-gray-700">Perfil ativo</label>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descreva as permissões deste perfil"
                    />
                </div>

                <hr className="border-gray-200" />

                {/* MENUS - Tree View com Seleção em Cascata */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <MenuIcon size={20} />
                            Menus Disponíveis
                        </h3>
                        <button
                            type="button"
                            onClick={toggleAllMenus}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {menus.filter(m => m.ativo).every(id => formData.menusIds.includes(id)) 
                                ? 'Desmarcar Todos' 
                                : 'Selecionar Todos'}
                        </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto">
                        {menus.filter(m => m.ativo).map((menu) => {
                            const hasChildren = menu.subMenus && menu.subMenus.length > 0;
                            const isExpanded = expandedMenus.has(menu.id);
                            const isComplete = isMenuCompleto(menu);
                            const isPartial = isMenuParcial(menu);

                            return (
                                <div key={menu.id} className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:mb-0">
                                    <div className="flex items-center gap-2">
                                        {hasChildren && (
                                            <button
                                                type="button"
                                                onClick={() => toggleExpandMenu(menu.id)}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleMenuCascata(menu)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors flex-1 ${
                                                isComplete
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : isPartial
                                                        ? 'bg-blue-50/50 text-blue-600 border border-blue-200'
                                                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {isComplete ? (
                                                <CheckSquare size={16} className="text-blue-600" />
                                            ) : isPartial ? (
                                                <Square size={16} className="text-blue-400" />
                                            ) : (
                                                <Square size={16} className="text-gray-400" />
                                            )}
                                            <span className="font-medium">{menu.nome}</span>
                                            {menu.caminho && (
                                                <span className="text-xs text-gray-400 ml-1">({menu.caminho})</span>
                                            )}
                                            {hasChildren && (
                                                <span className="text-xs text-gray-400 ml-auto">
                                                    ({menu.subMenus?.filter(s => formData.menusIds.includes(s.id)).length || 0}/{menu.subMenus?.length || 0})
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                    {hasChildren && isExpanded && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {menu.subMenus.map((subMenu) => {
                                                const isSubChecked = formData.menusIds.includes(subMenu.id);
                                                return (
                                                    <button
                                                        key={subMenu.id}
                                                        type="button"
                                                        onClick={() => toggleMenu(subMenu.id)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full ${
                                                            isSubChecked
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {isSubChecked ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} className="text-gray-400" />}
                                                        <span>{subMenu.nome}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {menus.filter(m => m.ativo).length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                Nenhum menu disponível
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Clique no menu pai para selecionar/deselecionar todos os submenus</p>
                </div>

                <hr className="border-gray-200" />

                {/* PERMISSÕES - Tree View com Nomes em Português */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Key size={20} />
                            Permissões
                        </h3>
                        <button
                            type="button"
                            onClick={toggleAllPermissoes}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {PERMISSOES_DISPONIVEIS.every(p => formData.permissoesIds.includes(p.id))
                                ? 'Desmarcar Todas'
                                : 'Selecionar Todas'}
                        </button>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto">
                        {Object.entries(permissoesPorCategoria).map(([categoria, items]) => {
                            const isExpanded = expandedPermissoes.has(categoria);
                            const isComplete = isCategoriaCompleta(categoria);
                            const isPartial = isCategoriaParcial(categoria);
                            const count = items.filter(p => formData.permissoesIds.includes(p.id)).length;

                            return (
                                <div key={categoria} className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:mb-0">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleExpandPermissao(categoria)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleCategoriaPermissao(categoria)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors flex-1 ${
                                                isComplete
                                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                    : isPartial
                                                        ? 'bg-indigo-50/50 text-indigo-600 border border-indigo-200'
                                                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                            }`}
                                        >
                                            {isComplete ? (
                                                <CheckSquare size={14} className="text-indigo-600" />
                                            ) : isPartial ? (
                                                <Square size={14} className="text-indigo-400" />
                                            ) : (
                                                <Square size={14} className="text-gray-400" />
                                            )}
                                            <span className="font-medium">{categoria}</span>
                                            <span className="text-xs text-gray-400 ml-1">
                                                ({count}/{items.length})
                                            </span>
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="ml-8 mt-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                                            {items.map((permissao) => {
                                                const isChecked = formData.permissoesIds.includes(permissao.id);
                                                return (
                                                    <button
                                                        key={permissao.id}
                                                        type="button"
                                                        onClick={() => togglePermissao(permissao.id)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                                            isChecked
                                                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {isChecked ? <CheckSquare size={14} className="text-indigo-600" /> : <Square size={14} className="text-gray-400" />}
                                                        <div className="text-left">
                                                            <div className="font-medium text-xs">{permissao.nome}</div>
                                                            <div className="text-xs text-gray-500">{permissao.descricao}</div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Clique na categoria para selecionar/deselecionar todas as permissões</p>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/perfis')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PerfilForm;