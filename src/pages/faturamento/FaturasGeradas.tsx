// src/pages/faturamento/FaturasGeradas.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import faturamentoService, { Fatura } from '../../services/faturamentoService';

const FaturasGeradas: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroAssociado, setFiltroAssociado] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  
  // Paginação
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);
  const pageSize = 15;
  
  const carregarFaturas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await faturamentoService.listarFaturas(pagina, pageSize, {
        numeroFatura: filtroNumero || undefined,
        associadoNome: filtroAssociado || undefined,
        status: filtroStatus || undefined,
        mes: filtroMes,
        ano: filtroAno
      });
      
      setFaturas(response.content);
      setTotalPaginas(response.totalPages);
      setTotalItens(response.totalElements);
      
    } catch (error: any) {
      console.error('Erro ao carregar faturas:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar faturas', 'error');
    } finally {
      setLoading(false);
    }
  }, [pagina, filtroNumero, filtroAssociado, filtroStatus, filtroMes, filtroAno, showToast]);
  
  useEffect(() => {
    carregarFaturas();
  }, [pagina, carregarFaturas]);
  
  const handleVerDetalhes = (id: number) => {
    navigate(`/faturamento/faturas/${id}`);
  };
  
  const handleExportarPdf = async (id: number, numeroFatura: string) => {
    try {
      showToast('Gerando PDF, aguarde...', 'info');
      const blob = await faturamentoService.exportarPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${numeroFatura}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF exportado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao exportar PDF:', error);
      showToast(error.response?.data?.message || 'Erro ao exportar PDF', 'error');
    }
  };
  
  const handleMarcarComoPaga = async (id: number) => {
    try {
      await faturamentoService.atualizarStatus(id, 'PAGA');
      showToast('Fatura marcada como paga!', 'success');
      carregarFaturas();
    } catch (error: any) {
      console.error('Erro ao marcar fatura:', error);
      showToast(error.response?.data?.message || 'Erro ao marcar fatura como paga', 'error');
    }
  };
  
  const handleCancelarFatura = async (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar esta fatura?')) {
      try {
        await faturamentoService.atualizarStatus(id, 'CANCELADA');
        showToast('Fatura cancelada!', 'success');
        carregarFaturas();
      } catch (error: any) {
        console.error('Erro ao cancelar fatura:', error);
        showToast(error.response?.data?.message || 'Erro ao cancelar fatura', 'error');
      }
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'PAGA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return '⏳';
      case 'PAGA': return '✅';
      case 'CANCELADA': return '❌';
      default: return '📄';
    }
  };
  
  const formatCurrency = (value: number) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };
  
  const aplicarFiltros = () => {
    setPagina(0);
    carregarFaturas();
  };
  
  const limparFiltros = () => {
    setFiltroNumero('');
    setFiltroAssociado('');
    setFiltroStatus('');
    setFiltroMes(new Date().getMonth() + 1);
    setFiltroAno(new Date().getFullYear());
    setPagina(0);
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Faturas Geradas" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">📄 Faturas Geradas</h1>
          <p className="text-gray-600">
            Consulte as faturas geradas a partir do processamento de faturamento
          </p>
        </div>
        
        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input
              type="text"
              placeholder="Nº Fatura"
              value={filtroNumero}
              onChange={(e) => setFiltroNumero(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Associado"
              value={filtroAssociado}
              onChange={(e) => setFiltroAssociado(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos status</option>
              <option value="PENDENTE">⏳ Pendente</option>
              <option value="PAGA">✅ Paga</option>
              <option value="CANCELADA">❌ Cancelada</option>
            </select>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(parseInt(e.target.value))}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => (
                <option key={idx} value={idx + 1}>{mes}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Ano"
              value={filtroAno}
              onChange={(e) => setFiltroAno(parseInt(e.target.value))}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={2020}
              max={2030}
            />
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔍 Buscar
            </button>
            <button
              onClick={limparFiltros}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              🗑️ Limpar
            </button>
          </div>
        </div>
        
        {/* Resumo */}
        {!loading && faturas.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            Mostrando {faturas.length} de {totalItens} fatura(s)
          </div>
        )}
        
        {/* Tabela de Faturas */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : faturas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">Nenhuma fatura encontrada</p>
            <p className="text-sm text-gray-400 mt-2">
              Tente ajustar os filtros ou aguarde o processamento de faturamento
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Fatura</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Nota Débito</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Associado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ/CPF</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Emissão</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {faturas.map((fatura) => (
                    <tr key={fatura.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{fatura.numeroFatura}</div>
                        <div className="text-xs text-gray-500">ID: {fatura.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {fatura.numeroNotaDebito || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{fatura.associadoNome}</div>
                        <div className="text-xs text-gray-500">Código: {fatura.associadoId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fatura.cnpjCpf || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {formatDate(fatura.dataEmissao)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {formatDate(fatura.dataVencimento)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right">
                        {formatCurrency(fatura.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(fatura.status)}`}>
                          <span>{getStatusIcon(fatura.status)}</span>
                          <span>{fatura.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleVerDetalhes(fatura.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalhes"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleExportarPdf(fatura.id, fatura.numeroFatura)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Exportar PDF"
                          >
                            📄
                          </button>
                          {fatura.status === 'PENDENTE' && (
                            <>
                              <button
                                onClick={() => handleMarcarComoPaga(fatura.id)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                title="Marcar como paga"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => handleCancelarFatura(fatura.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Cancelar fatura"
                              >
                                ❌
                              </button>
                            </>
                          )}
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
    </div>
  );
};

export default FaturasGeradas;