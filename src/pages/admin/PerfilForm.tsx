// src/pages/admin/PerfilForm.tsx - VERSÃO CDL (alinhada a Associados.tsx / PlanoForm.tsx)
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Shield, CheckSquare, Square,
  ChevronDown, ChevronRight, Key, Menu as MenuIcon, AlertCircle,
} from 'lucide-react';
import { perfilService } from '../../services/perfilService';
import { menuService } from '../../services/menuService';
import { permissaoService } from '../../services/permissaoService';
import { Perfil, Menu, Permissao } from '../../types/auth';
import { getPermissaoLabel, getPermissaoCategoria } from '../../config/permissaoLabels';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';

export const PerfilForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { showToast } = useMessage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [permissoesDisponiveis, setPermissoesDisponiveis] = useState<Permissao[]>([]);

  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  const [expandedPermissoes, setExpandedPermissoes] = useState<Set<string>>(
    new Set(['Dashboard', 'Associados', 'Faturamento'])
  );

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    menusIds: [] as number[],
    permissoesIds: [] as number[],
  });

  const permissoesPorCategoria = useMemo<Record<string, Permissao[]>>(() => {
    const agrupado: Record<string, Permissao[]> = {};
    permissoesDisponiveis.forEach((p) => {
      const cat = getPermissaoCategoria(p.nome);
      if (!agrupado[cat]) agrupado[cat] = [];
      agrupado[cat].push(p);
    });
    Object.keys(agrupado).forEach((cat) => {
      agrupado[cat].sort((a, b) =>
        getPermissaoLabel(a.nome).localeCompare(getPermissaoLabel(b.nome))
      );
    });
    return agrupado;
  }, [permissoesDisponiveis]);

  useEffect(() => { carregarDados(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (isEditing && permissoesDisponiveis.length > 0) carregarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditing, permissoesDisponiveis.length]);

  const carregarDados = async () => {
    try {
      const [menusData, permissoesData] = await Promise.all([
        menuService.listar(),
        permissaoService.listar(),
      ]);
      setMenus(menusData);
      setPermissoesDisponiveis(permissoesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar menus e permissões', 'error');
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
        menusIds: data.menus?.map((m) => m.id) || [],
        permissoesIds: data.permissoes?.map((p) => p.id) || [],
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /* ==================== MENUS ==================== */
  const getAllMenuIds = (m: Menu): number[] => {
    let ids = [m.id];
    if (m.subMenus && m.subMenus.length > 0) {
      m.subMenus.forEach((sub) => { ids = [...ids, ...getAllMenuIds(sub)]; });
    }
    return ids;
  };

  const toggleMenu = (menuId: number) => {
    setFormData((prev) => ({
      ...prev,
      menusIds: prev.menusIds.includes(menuId)
        ? prev.menusIds.filter((id) => id !== menuId)
        : [...prev.menusIds, menuId],
    }));
  };

  const toggleMenuCascata = (menu: Menu) => {
    const allIds = getAllMenuIds(menu);
    const allSelected = allIds.every((id) => formData.menusIds.includes(id));
    setFormData((prev) => ({
      ...prev,
      menusIds: allSelected
        ? prev.menusIds.filter((id) => !allIds.includes(id))
        : [...new Set([...prev.menusIds, ...allIds])],
    }));
  };

  const isMenuCompleto = (menu: Menu): boolean => {
    const allIds = getAllMenuIds(menu);
    return allIds.every((id) => formData.menusIds.includes(id));
  };

  const isMenuParcial = (menu: Menu): boolean => {
    const allIds = getAllMenuIds(menu);
    return allIds.some((id) => formData.menusIds.includes(id)) && !isMenuCompleto(menu);
  };

  /* ==================== PERMISSÕES ==================== */
  const togglePermissao = (permissaoId: number) => {
    setFormData((prev) => ({
      ...prev,
      permissoesIds: prev.permissoesIds.includes(permissaoId)
        ? prev.permissoesIds.filter((id) => id !== permissaoId)
        : [...prev.permissoesIds, permissaoId],
    }));
  };

  const toggleCategoriaPermissao = (categoria: string) => {
    const ids = permissoesPorCategoria[categoria]?.map((p) => p.id) || [];
    const allSelected = ids.every((id) => formData.permissoesIds.includes(id));
    setFormData((prev) => ({
      ...prev,
      permissoesIds: allSelected
        ? prev.permissoesIds.filter((id) => !ids.includes(id))
        : [...new Set([...prev.permissoesIds, ...ids])],
    }));
  };

  const isCategoriaCompleta = (categoria: string) => {
    const ids = permissoesPorCategoria[categoria]?.map((p) => p.id) || [];
    return ids.length > 0 && ids.every((id) => formData.permissoesIds.includes(id));
  };

  const isCategoriaParcial = (categoria: string) => {
    const ids = permissoesPorCategoria[categoria]?.map((p) => p.id) || [];
    return ids.some((id) => formData.permissoesIds.includes(id)) && !isCategoriaCompleta(categoria);
  };

  const toggleExpandMenu = (menuId: number) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) newExpanded.delete(menuId);
    else newExpanded.add(menuId);
    setExpandedMenus(newExpanded);
  };

  const toggleExpandPermissao = (categoria: string) => {
    const newExpanded = new Set(expandedPermissoes);
    if (newExpanded.has(categoria)) newExpanded.delete(categoria);
    else newExpanded.add(categoria);
    setExpandedPermissoes(newExpanded);
  };

  const toggleAllMenus = () => {
    const allMenuIds = menus.filter((m) => m.ativo).map((m) => m.id);
    const allSelected = allMenuIds.every((id) => formData.menusIds.includes(id));
    setFormData((prev) => ({ ...prev, menusIds: allSelected ? [] : allMenuIds }));
  };

  const toggleAllPermissoes = () => {
    const allPermissaoIds = permissoesDisponiveis.map((p) => p.id);
    const allSelected = allPermissaoIds.every((id) => formData.permissoesIds.includes(id));
    setFormData((prev) => ({
      ...prev,
      permissoesIds: allSelected ? [] : allPermissaoIds,
    }));
  };

  /* ==================== SUBMIT ==================== */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        nome: formData.nome,
        descricao: formData.descricao,
        ativo: formData.ativo,
        menusIds: formData.menusIds,
        permissoesIds: formData.permissoesIds,
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-2 border-cdl-navy-100 border-t-cdl-navy-700 mb-4" />
          <p className="text-cdl-navy-700 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <BreadCrumb atual={isEditing ? 'Editar Perfil' : 'Novo Perfil'} />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">
            {isEditing ? 'Editar Perfil' : 'Novo Perfil'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Atualize as informações do perfil' : 'Crie um novo perfil de acesso'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/perfis')}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            ✕ Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>💾 {isEditing ? 'Atualizar' : 'Criar'}</>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ===== Seção 1: Dados Básicos ===== */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
            <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
            <h2 className="text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
              🛡️ Informações do Perfil
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Perfil <span className="text-cdl-danger-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md
                             focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                  placeholder="Ex: ADMIN, GERENTE, OPERADOR"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center pt-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ativo"
                      checked={formData.ativo}
                      onChange={handleChange}
                      className="h-4 w-4 rounded text-cdl-navy-700 focus:ring-cdl-navy-600 border-gray-300"
                    />
                    <span className="text-sm text-gray-700 font-medium">Perfil ativo</span>
                  </label>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    formData.ativo
                      ? 'bg-cdl-green-100 text-cdl-green-700'
                      : 'bg-cdl-danger-50 text-cdl-danger-500'
                  }`}>
                    {formData.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none
                             focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                  placeholder="Descreva as permissões deste perfil"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== Seção 2: Menus ===== */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
              <h2 className="text-lg font-semibold text-cdl-navy-700">
                📋 Menus Disponíveis
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleAllMenus}
              className="text-sm text-cdl-navy-700 hover:text-cdl-navy-900 font-medium underline"
            >
              {menus.filter((m) => m.ativo).every((id) => formData.menusIds.includes(id.id))
                ? 'Desmarcar Todos'
                : 'Selecionar Todos'}
            </button>
          </div>
          <div className="p-6">
            <div className="border border-gray-200 rounded-lg p-3 max-h-80 overflow-y-auto bg-cdl-neutral-50/40">
              {menus.filter((m) => m.ativo).map((menu) => {
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
                          className="p-1 hover:bg-cdl-navy-50 rounded transition-colors text-cdl-navy-700"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleMenuCascata(menu)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors flex-1 ${
                          isComplete
                            ? 'bg-cdl-navy-100 text-cdl-navy-700 border border-cdl-navy-200'
                            : isPartial
                              ? 'bg-cdl-navy-50 text-cdl-navy-600 border border-cdl-navy-100'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-cdl-navy-50'
                        }`}
                      >
                        {isComplete ? (
                          <CheckSquare size={16} className="text-cdl-navy-700" />
                        ) : isPartial ? (
                          <Square size={16} className="text-cdl-navy-500" />
                        ) : (
                          <Square size={16} className="text-gray-400" />
                        )}
                        <span className="font-medium">{menu.nome}</span>
                        {menu.caminho && (
                          <span className="text-xs text-gray-400 ml-1">({menu.caminho})</span>
                        )}
                        {hasChildren && (
                          <span className="text-xs text-cdl-navy-600 ml-auto font-medium">
                            ({menu.subMenus?.filter((s) => formData.menusIds.includes(s.id)).length || 0}/
                            {menu.subMenus?.length || 0})
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
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                                          transition-colors w-full ${
                                isSubChecked
                                  ? 'bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-200'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-cdl-navy-50'
                              }`}
                            >
                              {isSubChecked ? (
                                <CheckSquare size={14} className="text-cdl-navy-700" />
                              ) : (
                                <Square size={14} className="text-gray-400" />
                              )}
                              <span>{subMenu.nome}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {menus.filter((m) => m.ativo).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">Nenhum menu disponível</div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Clique no menu pai para selecionar/deselecionar todos os submenus
            </p>
          </div>
        </div>

        {/* ===== Seção 3: Permissões ===== */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
              <h2 className="text-lg font-semibold text-cdl-navy-700">
                🔑 Permissões
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({permissoesDisponiveis.length} disponíveis)
                </span>
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleAllPermissoes}
              className="text-sm text-cdl-navy-700 hover:text-cdl-navy-900 font-medium underline"
            >
              {permissoesDisponiveis.every((p) => formData.permissoesIds.includes(p.id))
                ? 'Desmarcar Todas'
                : 'Selecionar Todas'}
            </button>
          </div>
          <div className="p-6">
            {permissoesDisponiveis.length === 0 ? (
              <div className="border border-cdl-yellow-200 bg-cdl-yellow-50 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-cdl-yellow-700 flex-shrink-0" />
                <span className="text-sm text-cdl-yellow-700">
                  Nenhuma permissão carregada. Verifique se o backend está no ar e se você tem acesso a{" "}
                  <code className="font-mono bg-white px-1.5 py-0.5 rounded">/api/admin/permissoes</code>.
                </span>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto bg-cdl-neutral-50/40">
                {Object.entries(permissoesPorCategoria).map(([categoria, items]) => {
                  const isExpanded = expandedPermissoes.has(categoria);
                  const isComplete = isCategoriaCompleta(categoria);
                  const isPartial = isCategoriaParcial(categoria);
                  const count = items.filter((p) => formData.permissoesIds.includes(p.id)).length;

                  return (
                    <div key={categoria} className="border-b border-gray-100 pb-2 mb-2 last:border-0 last:mb-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpandPermissao(categoria)}
                          className="p-1 hover:bg-cdl-navy-50 rounded transition-colors text-cdl-navy-700"
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCategoriaPermissao(categoria)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                                      transition-colors flex-1 ${
                            isComplete
                              ? 'bg-cdl-navy-100 text-cdl-navy-700 border border-cdl-navy-200'
                              : isPartial
                                ? 'bg-cdl-navy-50 text-cdl-navy-600 border border-cdl-navy-100'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-cdl-navy-50'
                          }`}
                        >
                          {isComplete ? (
                            <CheckSquare size={14} className="text-cdl-navy-700" />
                          ) : isPartial ? (
                            <Square size={14} className="text-cdl-navy-500" />
                          ) : (
                            <Square size={14} className="text-gray-400" />
                          )}
                          <span className="font-medium">{categoria}</span>
                          <span className="text-xs text-cdl-navy-600 ml-1 font-medium">
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
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
                                            transition-colors text-left ${
                                  isChecked
                                    ? 'bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-200'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-cdl-navy-50'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare size={14} className="text-cdl-navy-700 flex-shrink-0" />
                                ) : (
                                  <Square size={14} className="text-gray-400 flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate text-cdl-navy-700">
                                    {getPermissaoLabel(permissao.nome)}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {permissao.descricao || permissao.nome}
                                  </div>
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
            )}
            <p className="text-xs text-gray-500 mt-2">
              💡 Clique na categoria para selecionar/deselecionar todas as permissões
            </p>
          </div>
        </div>

        {/* ===== Rodapé com botões ===== */}
        <div className="bg-white rounded-lg shadow border border-gray-200 px-6 py-4 bg-cdl-neutral-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/perfis')}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            ✕ Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>💾 {isEditing ? 'Atualizar' : 'Criar'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PerfilForm;