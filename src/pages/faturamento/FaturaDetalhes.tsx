// src/pages/faturamento/FaturaDetalhes.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import faturamentoService, { Fatura, FaturaItem } from '../../services/faturamentoService';

const FaturaDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    carregarFatura();
  }, [id]);
  
  const carregarFatura = async () => {
    setLoading(true);
    try {
      const data = await faturamentoService.buscarFatura(Number(id));
      setFatura(data);
    } catch (error: any) {
      console.error('Erro ao carregar fatura:', error);
      showToast(error.response?.data?.message || 'Erro ao carregar detalhes da fatura', 'error');
      navigate('/faturamento/faturas');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarcarComoPaga = async () => {
    try {
      await faturamentoService.atualizarStatus(Number(id), 'PAGA');
      showToast('Fatura marcada como paga!', 'success');
      carregarFatura();
    } catch (error: any) {
      console.error('Erro ao marcar fatura:', error);
      showToast(error.response?.data?.message || 'Erro ao marcar fatura como paga', 'error');
    }
  };
  
  const handleExportarPdf = async () => {
    if (!fatura) return;
    try {
      showToast('Gerando PDF, aguarde...', 'info');
      const blob = await faturamentoService.exportarPdf(fatura.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura_${fatura.numeroFatura}.pdf`);
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
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loading size="large" />
      </div>
    );
  }
  
  if (!fatura) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Fatura não encontrada</p>
      </div>
    );
  }
  
  const totalDebitos = fatura.itens?.filter(i => i.tipoLancamento === 'D').reduce((sum, i) => sum + i.valorTotal, 0) || 0;
  const totalCreditos = fatura.itens?.filter(i => i.tipoLancamento === 'C').reduce((sum, i) => sum + i.valorTotal, 0) || 0;
  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <BreadCrumb atual={`Fatura ${fatura.numeroFatura}`} />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Fatura {fatura.numeroFatura}</h1>
              <p className="text-blue-100 mt-1">Gerada em {formatDate(fatura.dataEmissao)}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                fatura.status === 'PENDENTE' ? 'bg-yellow-400 text-yellow-900' :
                fatura.status === 'PAGA' ? 'bg-green-400 text-green-900' :
                'bg-red-400 text-red-900'
              }`}>
                {fatura.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Corpo */}
        <div className="p-6">
          {/* Informações do Associado */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">📋 Informações do Associado</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Código:</span>
                <span className="ml-2 font-medium">{fatura.associadoId}</span>
              </div>
              <div>
                <span className="text-gray-500">Nome:</span>
                <span className="ml-2 font-medium">{fatura.associadoNome}</span>
              </div>
              <div>
                <span className="text-gray-500">CNPJ/CPF:</span>
                <span className="ml-2">{fatura.cnpjCpf || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Período:</span>
                <span className="ml-2">{fatura.mesReferencia}/{fatura.anoReferencia}</span>
              </div>
            </div>
          </div>
          
          {/* Informações da Fatura */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">💰 Informações da Fatura</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Nº Nota Débito:</span>
                <div className="font-medium">{fatura.numeroNotaDebito || '-'}</div>
              </div>
              <div>
                <span className="text-gray-500">Data Emissão:</span>
                <div className="font-medium">{formatDate(fatura.dataEmissao)}</div>
              </div>
              <div>
                <span className="text-gray-500">Data Vencimento:</span>
                <div className="font-medium">{formatDate(fatura.dataVencimento)}</div>
              </div>
              <div>
                <span className="text-gray-500">Valor Total:</span>
                <div className="font-bold text-lg text-blue-600">{formatCurrency(fatura.valorTotal)}</div>
              </div>
            </div>
          </div>
          
          {/* Itens da Fatura */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">📦 Itens da Fatura</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fatura.itens?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-600">{item.codigoProduto || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.descricao}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{formatCurrency(item.valorUnitario)}</td>
                      <td className="px-4 py-2 text-sm font-medium text-right">{formatCurrency(item.valorTotal)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.tipoLancamento === 'D' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.tipoLancamento === 'D' ? 'Débito' : 'Crédito'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right font-medium">Total Débitos:</td>
                    <td className="px-4 py-2 text-right font-medium text-red-600">{formatCurrency(totalDebitos)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right font-medium">Total Créditos:</td>
                    <td className="px-4 py-2 text-right font-medium text-green-600">{formatCurrency(totalCreditos)}</td>
                    <td></td>
                  </tr>
                  <tr className="border-t-2 border-gray-300">
                    <td colSpan={4} className="px-4 py-2 text-right font-bold">Valor Líquido:</td>
                    <td className="px-4 py-2 text-right font-bold text-blue-600">{formatCurrency(fatura.valorTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Observação */}
          {fatura.observacao && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-200">
              <p className="text-sm text-yellow-700">{fatura.observacao}</p>
            </div>
          )}
          
          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate('/faturamento/faturas')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={handleExportarPdf}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📄 Exportar PDF
            </button>
            {fatura.status === 'PENDENTE' && (
              <button
                onClick={handleMarcarComoPaga}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                💰 Marcar como Paga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaturaDetalhes;