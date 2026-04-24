// src/pages/faturamento/ReguaFaturamento.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento } from '../../services/reguaFaturamentoService';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import ConfirmModal from '../../components/ui/ConfirmModal';

const ReguaFaturamentoPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [reguas, setReguas] = useState<ReguaFaturamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reguaParaExcluir, setReguaParaExcluir] = useState<ReguaFaturamento | null>(null);
  
  const pageSize = 10;
  
  const carregarReguas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await reguaFaturamentoService.listar(pagina, pageSize, 'sequencia', 'asc');
      setReguas(response.content);
      setTotalPaginas(response.totalPages);
      setTotalItens(response.totalElements);
    } catch (error) {
      console.error('Erro ao carregar réguas:', error);
      showToast('Erro ao carregar réguas de faturamento', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagina, showToast]);
  
  useEffect(() => {
    carregarReguas();
  }, [carregarReguas]);
  
  const handleVerDetalhes = (id: number) => {
    navigate(`/faturamento/regua/editar/${id}`);
  };
  
  const handleEditar = (id: number) => {
    navigate(`/faturamento/regua/editar/${id}`);
  };
  
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
  
  const handleNovaRegua = () => {
    navigate('/faturamento/regua/novo');
  };
  
  const getStatusColor = (ativo: boolean) => {
    return ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  
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
  
  const getCorPorPeriodo = (periodo: string) => {
    if (periodo === 'PRIMEIRO') return 'blue';
    if (periodo === 'SEGUNDO') return 'green';
    return 'purple';
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Régua de Faturamento" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Régua de Faturamento</h1>
            <p className="text-gray-600 mt-1">
              Configure os períodos de faturamento e os tipos de arquivo
            </p>
          </div>
          <button
            onClick={handleNovaRegua}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>➕</span> Nova Régua
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : reguas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📏</div>
            <p className="text-gray-500">Nenhuma régua de faturamento cadastrada</p>
            <button
              onClick={handleNovaRegua}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar primeira régua
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia Emissão</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Arquivo</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Padrão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reguas.map((regua) => (
                    <tr key={regua.id} className="hover:bg-gray-50 transition-colors">
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
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full bg-${getCorPorPeriodo(regua.periodo)}-100 text-${getCorPorPeriodo(regua.periodo)}-800`}>
                          {getPeriodoLabel(regua.periodo, regua.diaEmissao)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        Dia {regua.diaEmissao}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {regua.tipoArquivo === 'CONSOLIDACAO' ? 'Consolidação' : 
                           regua.tipoArquivo === 'PREVIA_CORRENTE' ? 'Prévia Corrente' : 'Prévia Anterior'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(regua.ativo)}`}>
                          {regua.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {regua.ehPadrao ? (
                          <span className="inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            ⭐ Padrão
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          {/* 🔥 ALTERADO: "Gerenciar Associados" para "Detalhes" */}
                          <button
                            onClick={() => handleVerDetalhes(regua.id)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditar(regua.id)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleExcluirClick(regua)}
                            disabled={regua.ehPadrao}
                            className={`p-1.5 rounded transition-colors ${
                              regua.ehPadrao 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            }`}
                            title={regua.ehPadrao ? 'Não é possível excluir a régua padrão' : 'Excluir'}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  ◀ Anterior
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Página {pagina + 1} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina === totalPaginas - 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Próxima ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarExcluir}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a régua "${reguaParaExcluir?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ReguaFaturamentoPage;