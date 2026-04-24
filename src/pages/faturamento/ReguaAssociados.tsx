import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { reguaFaturamentoService, AssociadoRegua } from '../../services/reguaFaturamentoService';
import { associadoService, AssociadoResumoDTO } from '../../services/associadoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import { useMessage } from '../../providers/MessageProvider';
import Modal from '../../components/ui/Modal';

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
      type: 'danger'
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
  
  if (loading) {
    return <Loading />;
  }
  
  return (
    <div className="p-6">
      <BreadCrumb 
        items={[
          { label: 'Faturamento', path: '/faturamento/regua' },
          { label: `Associados da Régua: ${reguaNome}` }
        ]}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Associados da Régua</h1>
          <p className="text-gray-600">
            Gerencie os associados que fazem parte da régua de faturamento <strong>{reguaNome}</strong>
          </p>
        </div>
        
        <button
          onClick={() => setModalAberto(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          ➕ Adicionar Associado
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {associados.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum associado nesta régua</h3>
            <p className="text-gray-600 mb-6">
              Adicione associados para que eles sejam considerados no faturamento deste período.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ➕ Adicionar Associado
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código SPC</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Fim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associados.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-900">
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
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRemover(assoc.associadoId, assoc.associadoNome)}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="Remover da régua"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Modal para adicionar associado */}
      <Modal
        title={`Adicionar Associado à Régua ${reguaNome}`}
        onClose={() => setModalAberto(false)}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Associado *
            </label>
            <select
              value={associadoSelecionado || ''}
              onChange={(e) => setAssociadoSelecionado(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início *
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data a partir da qual o associado começa a ser faturado nesta régua
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setModalAberto(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdicionar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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