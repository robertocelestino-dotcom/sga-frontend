// src/pages/faturamento/ReguaFaturamento.tsx - VERSÃO CDL
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento } from '../../services/reguaFaturamentoService';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import ConfirmModal from '../../components/ui/ConfirmModal';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const ReguaFaturamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();

  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reguaParaExcluir, setReguaParaExcluir] = useState<ReguaFaturamento | null>(null);

  const carregarReguas = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);
    try {
      const data = await reguaFaturamentoService.listarComContagem();
      setReguas(data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar réguas:', error);
      setErroCarregamento(error.message || 'Erro ao carregar réguas');
      showToast('Erro ao carregar réguas de faturamento', 'error');
      setReguas([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { carregarReguas(); }, [carregarReguas]);

  const handleVerDetalhes = (id: number) => navigate(`/faturamento/regua/editar/${id}`);
  const handleEditar = (id: number) => navigate(`/faturamento/regua/editar/${id}`);

  const handleExcluirClick = (regua: ReguaFaturamento) => {
    setReguaParaExcluir(regua);
    setShowDeleteModal(true);
  };

  const handleConfirmarExcluir = async () => {
    if (reguaParaExcluir) {
      try {
        await reguaFaturamentoService.excluir(reguaParaExcluir.id);
        showToast(`Régua "${reguaParaExcluir.nome}" excluída com sucesso!`, 'success');
        carregarReguas();
      } catch (error: any) {
        console.error('Erro ao excluir régua:', error);
        showToast(error.response?.data?.message || 'Erro ao excluir régua', 'error');
      } finally {
        setShowDeleteModal(false);
        setReguaParaExcluir(null);
      }
    }
  };

  const handleNovaRegua = () => navigate('/faturamento/regua/novo');
  const handleRecarregar = () => carregarReguas();

  const getStatusColor = (ativo: boolean) =>
    ativo ? 'bg-cdl-green-100 text-cdl-green-700' : 'bg-cdl-danger-50 text-cdl-danger-500';

  const getPeriodoLabel = (periodo: string, diaEmissao: number) => {
    if (periodo === 'PRIMEIRO') return `1º Período (Dia ${diaEmissao})`;
    if (periodo === 'SEGUNDO') return '2º Período (Dia 16)';
    if (periodo === 'TERCEIRO') return '3º Período (Dia 26 - Padrão)';
    return periodo;
  };

  const getIconePorPeriodo = (periodo: string) => {
    if (periodo === 'PRIMEIRO') return '📅';
    if (periodo === 'SEGUNDO') return '📋';
    return '📊';
  };

  const totalAssociados = reguas.reduce((sum, r) => sum + (r.totalAssociados || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Régua de Faturamento" />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-cdl-navy-700">Régua de Faturamento</h1>
            <p className="text-gray-600 mt-1">
              Configure os períodos de faturamento e os tipos de arquivo
            </p>
            {erroCarregamento && (
              <p className="text-sm text-cdl-danger-500 mt-1 flex items-center gap-1">
                <span>⚠️</span> {erroCarregamento}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleRecarregar}
              disabled={loading}
              className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                         rounded-lg hover:bg-cdl-navy-50 disabled:opacity-50 flex items-center gap-2
                         transition-colors font-medium"
            >
              {loading ? '⏳' : '🔄'} Atualizar
            </button>
            <button
              onClick={handleNovaRegua}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 flex items-center gap-2 font-medium
                         transition-all active:scale-[.98]"
            >
              <span>➕</span> Nova Régua
            </button>
          </div>
        </div>

        {/* Estados */}
        {loading && reguas.length === 0 ? (
          <TableSkeleton rows={6} cols={8} />
        ) : reguas.length === 0 ? (
          <EmptyState
            icon="📏"
            title="Nenhuma régua de faturamento cadastrada"
            description="Crie a primeira régua para começar a organizar os períodos de faturamento e os tipos de arquivo."
            action={
              <button
                onClick={handleNovaRegua}
                className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ➕ Criar Primeira Régua
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cdl-navy-50">
                <tr>
                  {['Nome','Período','Dia Emissão','Associados','Regras','Status','Padrão','Ações'].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider ${
                      ['Dia Emissão','Associados','Regras','Status','Padrão','Ações'].includes(h) ? 'text-center' : 'text-left'
                    }`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {reguas.map((regua) => (
                  <tr key={regua.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{regua.icone || getIconePorPeriodo(regua.periodo)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{regua.nome}</div>
                          {regua.descricao && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{regua.descricao}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-cdl-navy-50 text-cdl-navy-700 font-medium">
                        {getPeriodoLabel(regua.periodo, regua.diaEmissao)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      Dia {regua.diaEmissao}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium
                                       bg-cdl-navy-50 text-cdl-navy-700 rounded-full border border-cdl-navy-100">
                        👥 {regua.totalAssociados || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1 flex-wrap">
                        {regua.aplicarFranquia && (
                          <span className="inline-flex px-2 py-0.5 text-xs bg-cdl-navy-100 text-cdl-navy-700 rounded font-medium" title="Aplicar Franquia">
                            🎯 Franquia
                          </span>
                        )}
                        {regua.aplicarFaturamentoMinimo && (
                          <span className="inline-flex px-2 py-0.5 text-xs bg-cdl-yellow-100 text-cdl-yellow-700 rounded font-medium" title="Aplicar Faturamento Mínimo">
                            💰 Mínimo
                          </span>
                        )}
                        {regua.aplicarCancelamentos && (
                          <span className="inline-flex px-2 py-0.5 text-xs bg-cdl-danger-50 text-cdl-danger-500 rounded font-medium" title="Aplicar Cancelamentos">
                            🗑️ Cancel.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(regua.ativo)}`}>
                        {regua.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {regua.ehPadrao ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-cdl-yellow-100 text-cdl-yellow-700 rounded-full font-medium">
                          ⭐ Padrão
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => handleVerDetalhes(regua.id!)}
                          className="p-1.5 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                          title="Detalhes"
                        >👁️</button>
                        <button
                          onClick={() => handleEditar(regua.id!)}
                          className="p-1.5 text-cdl-green-600 hover:text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                          title="Editar"
                        >✏️</button>
                        <button
                          onClick={() => handleExcluirClick(regua)}
                          disabled={regua.ehPadrao}
                          className={`p-1.5 rounded transition-colors ${
                            regua.ehPadrao
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50'
                          }`}
                          title={regua.ehPadrao ? 'Não é possível excluir a régua padrão' : 'Excluir'}
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Resumo total */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between gap-3 text-sm text-gray-600">
              <span>
                Total: <strong className="text-cdl-navy-700">{reguas.length}</strong> régua(s)
              </span>
              <span>
                Total de associados: <strong className="text-cdl-navy-700">{totalAssociados}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarExcluir}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a régua "${reguaParaExcluir?.nome}"?\n\nEsta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ReguaFaturamentoPage;