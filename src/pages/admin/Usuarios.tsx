// src/pages/admin/Usuarios.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock, Unlock, Search } from 'lucide-react';
import { usuarioService } from '../../services/usuarioService';
import { perfilService } from '../../services/perfilService';
import { PermissionGuard } from '../../components/PermissionGuard';
import ConfirmModal from '../../components/ui/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { useMessage } from '../../providers/MessageProvider';
import { Usuario } from '../../types/auth';
import Avatar from '../../components/Avatar';

type TipoModal = 'bloquear' | 'desbloquear' | 'excluir';
interface EstadoModal { open: boolean; tipo: TipoModal; usuario: Usuario | null; }

export const Usuarios: React.FC = () => {
  const { showToast } = useMessage();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [perfis, setPerfis] = useState<any[]>([]);
  const [modal, setModal] = useState<EstadoModal>({ open: false, tipo: 'bloquear', usuario: null });
  const [processando, setProcessando] = useState(false);

  useEffect(() => { carregarUsuarios(); carregarPerfis(); }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      setUsuarios(await usuarioService.listarTodos());
    } catch (e) {
      console.error(e);
      showToast('❌ Erro ao carregar usuários', 'error');
    } finally { setLoading(false); }
  };

  const carregarPerfis = async () => {
    try { setPerfis(await perfilService.listar()); }
    catch (e) { console.error(e); }
  };

  const abrirModalBloquear     = (u: Usuario) => setModal({ open: true, tipo: 'bloquear', usuario: u });
  const abrirModalDesbloquear  = (u: Usuario) => setModal({ open: true, tipo: 'desbloquear', usuario: u });
  const abrirModalExcluir      = (u: Usuario) => setModal({ open: true, tipo: 'excluir', usuario: u });
  const fecharModal = () => { if (!processando) setModal({ open: false, tipo: 'bloquear', usuario: null }); };

  const executarAcaoConfirmada = async () => {
    if (!modal.usuario) return;
    const { tipo, usuario } = modal;
    setProcessando(true);
    try {
      if (tipo === 'bloquear') {
        await usuarioService.bloquear(usuario.id);
        showToast(`🔒 Usuário "${usuario.username}" bloqueado com sucesso.`, 'success');
      } else if (tipo === 'desbloquear') {
        await usuarioService.desbloquear(usuario.id);
        showToast(`🔓 Usuário "${usuario.username}" desbloqueado com sucesso.`, 'success');
      } else {
        await usuarioService.deletar(usuario.id);
        showToast(`🗑️ Usuário "${usuario.username}" excluído com sucesso.`, 'success');
      }
      await carregarUsuarios();
      setModal({ open: false, tipo: 'bloquear', usuario: null });
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || e.response?.data?.error || 'Erro ao executar ação';
      showToast(`❌ ${msg}`, 'error');
    } finally { setProcessando(false); }
  };

  const getModalConfig = () => {
    const { tipo, usuario } = modal;
    const nome = usuario?.username || '';
    switch (tipo) {
      case 'bloquear': return {
        title: 'Bloquear usuário',
        message: `Tem certeza que deseja bloquear o usuário "${nome}"?\n\nO usuário não poderá fazer login até ser desbloqueado pelo administrador.`,
        confirmText: 'Sim, bloquear', type: 'warning' as const,
      };
      case 'desbloquear': return {
        title: 'Desbloquear usuário',
        message: `Deseja desbloquear o usuário "${nome}"?\n\nO usuário poderá fazer login normalmente e as tentativas serão resetadas.`,
        confirmText: 'Sim, desbloquear', type: 'warning' as const,
      };
      case 'excluir': return {
        title: 'Excluir usuário',
        message: `Tem certeza que deseja excluir o usuário "${nome}"?\n\n⚠️ Esta ação não poderá ser desfeita.`,
        confirmText: 'Sim, excluir', type: 'danger' as const,
      };
    }
  };

  const getPerfilNome = (id: number) => perfis.find(p => p.id === id)?.nome || 'N/A';

  const filteredUsuarios = usuarios.filter(u =>
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modalConfig = modal.open ? getModalConfig() : null;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Usuários do Sistema</h1>
          <p className="text-gray-600 text-sm mt-1">Gerencie os usuários e suas permissões de acesso</p>
        </div>
        <PermissionGuard requiredPermissions={['USUARIO_CREATE']}>
          <Link
            to="/admin/usuarios/novo"
            className="flex items-center gap-2 bg-cdl-navy-700 text-white px-4 py-2
                       rounded-lg hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
          >
            <Plus size={20} /> Novo Usuário
          </Link>
        </PermissionGuard>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filteredUsuarios.length === 0 ? (
          <EmptyState
            icon="👤"
            title={searchTerm ? 'Nenhum usuário corresponde à busca' : 'Nenhum usuário cadastrado'}
            description={
              searchTerm
                ? `Nada foi encontrado para "${searchTerm}".`
                : 'Comece cadastrando o primeiro usuário do sistema.'
            }
            action={
              searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >🔄 Limpar busca</button>
              ) : (
                <PermissionGuard requiredPermissions={['USUARIO_CREATE']}>
                  <Link
                    to="/admin/usuarios/novo"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cdl-navy-700 text-white
                               rounded-lg font-medium hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  ><Plus size={20}/> Criar Primeiro Usuário</Link>
                </PermissionGuard>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Usuário','Nome','Email','Perfil','Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar fotoBase64={u.fotoBase64} nome={u.nomeCompleto || u.username} size={40} />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{u.nomeCompleto}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-500">{u.email}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-navy-100 text-cdl-navy-800">
                          {u.perfilNome || getPerfilNome(u.perfilId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            u.ativo ? 'bg-cdl-green-100 text-cdl-green-700' : 'bg-cdl-danger-50 text-cdl-danger-500'
                          }`}>{u.ativo ? 'Ativo' : 'Inativo'}</span>
                          {u.bloqueado && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cdl-yellow-100 text-cdl-yellow-700">
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                            <Link
                              to={`/admin/usuarios/${u.id}`}
                              className="text-cdl-navy-700 hover:text-cdl-navy-900 p-1 rounded hover:bg-cdl-navy-50 transition-colors"
                              title="Editar"
                            ><Edit size={18} /></Link>
                          </PermissionGuard>
                          {u.bloqueado ? (
                            <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                              <button
                                onClick={() => abrirModalDesbloquear(u)}
                                className="text-cdl-green-500 hover:text-cdl-green-700 p-1 rounded hover:bg-cdl-green-50 transition-colors"
                                title="Desbloquear"
                              ><Unlock size={18} /></button>
                            </PermissionGuard>
                          ) : (
                            <PermissionGuard requiredPermissions={['USUARIO_EDIT']}>
                              <button
                                onClick={() => abrirModalBloquear(u)}
                                className="text-cdl-yellow-600 hover:text-cdl-yellow-700 p-1 rounded hover:bg-cdl-yellow-50 transition-colors"
                                title="Bloquear"
                              ><Lock size={18} /></button>
                            </PermissionGuard>
                          )}
                          <PermissionGuard requiredPermissions={['USUARIO_DELETE']}>
                            <button
                              onClick={() => abrirModalExcluir(u)}
                              className="text-cdl-danger-500 hover:text-cdl-danger-600 p-1 rounded hover:bg-cdl-danger-50 transition-colors"
                              title="Excluir"
                            ><Trash2 size={18} /></button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-200 bg-cdl-neutral-50 text-sm text-gray-500">
              Total: <span className="font-medium text-cdl-navy-700">{filteredUsuarios.length}</span> usuário(s)
            </div>
          </>
        )}
      </div>

      {modalConfig && (
        <ConfirmModal
          isOpen={modal.open}
          onClose={fecharModal}
          onConfirm={executarAcaoConfirmada}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={processando ? 'Processando...' : modalConfig.confirmText}
          cancelText="Cancelar"
          type={modalConfig.type}
          loading={processando}
        />
      )}
    </div>
  );
};

export default Usuarios;