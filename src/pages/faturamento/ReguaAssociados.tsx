// src/pages/faturamento/ReguaAssociados.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { reguaFaturamentoService, AssociadoRegua } from '../../services/reguaFaturamentoService';
import { associadoService, AssociadoResumoDTO } from '../../services/associadoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import { useMessage } from '../../providers/MessageProvider';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const ReguaAssociados: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { showToast, showConfirm } = useMessage();

  const reguaId = parseInt(id!);
  const reguaNome = (location.state as any)?.reguaNome || 'Régua';

  const [associados, setAssociados] = useState<AssociadoRegua[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [associadosDisponiveis, setAssociadosDisponiveis] = useState<AssociadoResumoDTO[]>([]);
  const [associadoSelecionado, setAssociadoSelecionado] = useState<number | null>(null);
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    carregarAssociados();
    carregarAssociadosDisponiveis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reguaId]);

  const carregarAssociados = async () => {
    try {
      setLoading(true);
      const data = await reguaFaturamentoService.listarAssociadosPorRegua(reguaId);
      setAssociados(data);
    } catch (error) {
      console.error('Erro ao carregar associados:', error);
      showToast('Erro ao carregar associados da régua', 'error');
    } finally {
      setLoading(false);
    }
  };

  const carregarAssociadosDisponiveis = async () => {
    try {
      const response = await associadoService.listar({ page: 0, size: 1000, sort: 'nomeRazao', direction: 'asc' });
      setAssociadosDisponiveis(response.content || []);
    } catch (error) {
      console.error('Erro ao carregar associados disponíveis:', error);
    }
  };

  const handleAdicionar = async () => {
    if (!associadoSelecionado) {
      showToast('Selecione um associado', 'warning');
      return;
    }
    try {
      await reguaFaturamentoService.adicionarAssociadoARegua(reguaId, associadoSelecionado, dataInicio);
      showToast('Associado adicionado com sucesso!', 'success');
      setModalAberto(false);
      setAssociadoSelecionado(null);
      carregarAssociados();
    } catch (error: any) {
      console.error('Erro ao adicionar associado:', error);
      showToast(error.response?.data?.message || 'Erro ao adicionar associado', 'error');
    }
  };

  const handleRemover = async (associadoId: number, nome: string) => {
    const confirmado = await showConfirm({
      title: 'Confirmar remoção',
      message: `Deseja remover o associado "${nome}" da régua ${reguaNome}?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!confirmado) return;
    try {
      await reguaFaturamentoService.removerAssociadoDaRegua(associadoId);
      showToast('Associado removido com sucesso!', 'success');
      carregarAssociados();
    } catch (error: any) {
      console.error('Erro ao remover associado:', error);
      showToast(error.response?.data?.message || 'Erro ao remover associado', 'error');
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '-';
    return new Date(dataStr).toLocaleDateString('pt-BR');
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb items={[
        { label: 'Faturamento', path: '/faturamento/regua' },
        { label: `Associados da Régua: ${reguaNome}` },
      ]} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Associados da Régua</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os associados que fazem parte da régua <strong className="text-cdl-navy-700">{reguaNome}</strong>
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg hover:bg-cdl-navy-800
                     flex items-center gap-2 font-medium transition-all active:scale-[.98]"
        >
          ➕ Adicionar Associado
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-cdl overflow-hidden">
        {associados.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Nenhum associado nesta régua"
            description="Adicione associados para que eles sejam considerados no faturamento deste período."
            action={
              <button
                onClick={() => setModalAberto(true)}
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ➕ Adicionar Associado
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cdl-navy-50">
                <tr>
                  {['Código SPC','Associado','Data Início','Data Fim','Status','Ações'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associados.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-cdl-navy-700">
                      {assoc.associadoCodigoSpc}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{assoc.associadoNome}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatarData(assoc.dataInicio)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {assoc.dataFim ? formatarData(assoc.dataFim) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assoc.ativo ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-cdl-green-100 text-cdl-green-700 rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-cdl-danger-50 text-cdl-danger-500 rounded-full">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemover(assoc.associadoId, assoc.associadoNome)}
                        className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                        title="Remover da régua"
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        title={`Adicionar Associado à Régua ${reguaNome}`}
        onClose={() => setModalAberto(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Associado *</label>
            <select
              value={associadoSelecionado || ''}
              onChange={(e) => setAssociadoSelecionado(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors"
            >
              <option value="">Selecione um associado...</option>
              {associadosDisponiveis
                .filter(a => !associados.some(ar => ar.associadoId === a.id))
                .map(assoc => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.codigoSpc} - {assoc.nomeRazao}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Data de Início *</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                         focus:border-cdl-navy-600 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data a partir da qual o associado começa a ser faturado nesta régua
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setModalAberto(false)}
              className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdicionar}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
            >
              Adicionar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReguaAssociados;