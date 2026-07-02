// src/pages/Notificacoes.tsx
import React, { useState, useEffect } from 'react';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import ModalDetalheNotificacao from '../components/faturamento/ModalDetalheNotificacao';
import notificacaoService from '../services/notificacaoService';

const Notificacoes: React.FC = () => {
  const { showToast } = useMessage();
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [notificacoesAgrupadas, setNotificacoesAgrupadas] = useState<any[]>([]);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  
  // 🔥 FILTROS: Data Inicial e Data Final
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 0);
  });
  
  const [msSqlDisponivel, setMsSqlDisponivel] = useState<boolean | null>(null);
  const [erroConexao, setErroConexao] = useState<boolean>(false);

  // Modal de Detalhes
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [notificacaoSelecionada, setNotificacaoSelecionada] = useState<any>(null);

  // 🔥 FORMATAR DATA PARA DD/MM/YYYY
  const formatarData = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // 🔥 CARREGAR NOTIFICAÇÕES AGRUPADAS POR PERÍODO
  const carregarNotificacoesAgrupadas = async () => {
    setLoading(true);
    setErroConexao(false);
    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);
      
      const data = await notificacaoService.buscarAgrupadasPorPeriodo(
        dataInicioStr, 
        dataFimStr, 
        filtroCodigo || undefined
      );
      setNotificacoesAgrupadas(data);
      
      if (data.length === 0) {
        setMsSqlDisponivel(false);
      } else {
        setMsSqlDisponivel(true);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar notificações agrupadas:', error);
      setErroConexao(true);
      setMsSqlDisponivel(false);
      setNotificacoesAgrupadas([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SINCRONIZAR
  const handleSincronizar = async () => {
    setSincronizando(true);
    setErroConexao(false);
    try {
      const dataInicioStr = formatarData(dataInicio);
      const dataFimStr = formatarData(dataFim);
      
      const response = await notificacaoService.sincronizarAgrupadoPorPeriodo(
        dataInicioStr, 
        dataFimStr, 
        filtroCodigo || undefined
      );
      
      console.log('📊 Resposta da sincronização:', response);
      
      if (response && response.associadosProcessados > 0) {
        showToast(`✅ ${response.associadosProcessados} associados sincronizados!`, 'success');
        setMsSqlDisponivel(true);
        setErroConexao(false);
      } else {
        if (response && response.associadosProcessados === 0) {
          showToast('ℹ️ Nenhum dado novo encontrado para sincronizar', 'info');
        } else {
          showToast('⚠️ Servidor de Notificação indisponível', 'warning');
          setErroConexao(true);
          setMsSqlDisponivel(false);
        }
      }
      
      await carregarNotificacoesAgrupadas();
    } catch (error: any) {
      console.error('❌ Erro na sincronização:', error);
      setErroConexao(true);
      setMsSqlDisponivel(false);
      showToast('⚠️ Erro ao sincronizar com o servidor de notificação', 'error');
    } finally {
      setSincronizando(false);
    }
  };

  // 🔥 ABRIR MODAL DE DETALHES
  const handleAbrirDetalhes = (notificacao: any) => {
    setNotificacaoSelecionada(notificacao);
    setModalDetalheAberto(true);
  };

  // 🔥 AGRUPAR NOTIFICAÇÕES POR CÓDIGO DO ASSOCIADO
  const notificacoesAgrupadasPorCodigo = () => {
    const mapa = new Map<number, any>();
    
    notificacoesAgrupadas.forEach(item => {
      const codigo = item.codigoAssociado;
      if (!mapa.has(codigo)) {
        mapa.set(codigo, {
          codigoAssociado: codigo,
          nomeAssociado: item.nomeAssociado,
          totalRegistros: 0,
          totalSms: 0,
          totalEmail: 0,
          cartasEnviadas: 0,
          naoEnviada: 0,
          detalhes: []
        });
      }
      
      const grupo = mapa.get(codigo);
      grupo.totalRegistros += item.totalRegistrosDigital || 0;
      grupo.totalSms += item.totalSms || 0;
      grupo.totalEmail += item.totalEmail || 0;
      grupo.cartasEnviadas += item.cartasEnviadas || 0;
      grupo.naoEnviada += item.naoEnviada || 0;
      grupo.detalhes.push(item);
    });
    
    return Array.from(mapa.values());
  };

  const dadosAgrupados = notificacoesAgrupadasPorCodigo();

  // Calcular totais gerais
  const totais = dadosAgrupados.reduce((acc, n) => ({
    totalRegistros: acc.totalRegistros + n.totalRegistros,
    sms: acc.sms + n.totalSms,
    emails: acc.emails + n.totalEmail,
    cartas: acc.cartas + n.cartasEnviadas,
    naoEnviadas: acc.naoEnviadas + n.naoEnviada
  }), { totalRegistros: 0, sms: 0, emails: 0, cartas: 0, naoEnviadas: 0 });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Notificações" />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">📬 Notificações</h1>
            <p className="text-gray-600">
              Visualize as notificações enviadas (SMS/E-mails/Cartas) por associado
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSincronizar}
              disabled={sincronizando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {sincronizando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                '🔄'
              )}
              Sincronizar
            </button>
          </div>
        </div>

        {erroConexao && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Servidor de Notificação indisponível
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Não foi possível conectar ao servidor MS-SQL. Verifique a conexão com o servidor de notificação.
                </p>
              </div>
            </div>
          </div>
        )}

        {!erroConexao && msSqlDisponivel === false && dadosAgrupados.length === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📭</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Nenhuma notificação encontrada
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Não há notificações registradas para o período selecionado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 FILTROS */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Código do Associado"
              value={filtroCodigo}
              onChange={(e) => setFiltroCodigo(e.target.value)}
              className="p-2 border rounded-lg"
            />
            
            <input
              type="date"
              value={dataInicio.toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  const [ano, mes, dia] = e.target.value.split('-').map(Number);
                  setDataInicio(new Date(ano, mes - 1, dia));
                }
              }}
              className="p-2 border rounded-lg"
            />
            
            <input
              type="date"
              value={dataFim.toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  const [ano, mes, dia] = e.target.value.split('-').map(Number);
                  setDataFim(new Date(ano, mes - 1, dia));
                }
              }}
              className="p-2 border rounded-lg"
            />
            
            <span className="text-xs text-gray-500 self-center">
              Período: {formatarData(dataInicio)} à {formatarData(dataFim)}
            </span>
            
            <button
              onClick={carregarNotificacoesAgrupadas}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Buscar
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{totais.totalRegistros}</div>
            <div className="text-xs text-gray-600">Total Registros</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{totais.sms}</div>
            <div className="text-xs text-gray-600">SMS</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{totais.emails}</div>
            <div className="text-xs text-gray-600">E-mails</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{totais.cartas}</div>
            <div className="text-xs text-gray-600">Cartas</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{totais.naoEnviadas}</div>
            <div className="text-xs text-gray-600">Não Enviadas</div>
          </div>
        </div>

        {/* Tabela Agrupada por Associado */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="large" />
          </div>
        ) : dadosAgrupados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500">Nenhuma notificação encontrada para o período</p>
            {msSqlDisponivel === false && (
              <p className="text-xs text-yellow-600 mt-2">⚠️ Servidor de Notificação indisponível</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SMS</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cartas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Não Env.</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Períodos</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {dadosAgrupados.map((grupo, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{grupo.codigoAssociado}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={grupo.nomeAssociado}>
                      {grupo.nomeAssociado || '-'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{grupo.totalRegistros}</td>
                    <td className="px-4 py-3 text-center text-purple-600">{grupo.totalSms}</td>
                    <td className="px-4 py-3 text-center text-green-600">{grupo.totalEmail}</td>
                    <td className="px-4 py-3 text-center text-yellow-600">{grupo.cartasEnviadas}</td>
                    <td className="px-4 py-3 text-center text-red-600">{grupo.naoEnviada}</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {grupo.detalhes.length} período(s)
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleAbrirDetalhes({
                          ...grupo,
                          detalhes: grupo.detalhes,
                          dataInicio: dataInicio,
                          dataFim: dataFim
                        })}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Ver detalhes"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔥 MODAL DE DETALHES */}
      <ModalDetalheNotificacao
        isOpen={modalDetalheAberto}
        onClose={() => {
          setModalDetalheAberto(false);
          setNotificacaoSelecionada(null);
        }}
        notificacao={notificacaoSelecionada}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </div>
  );
};

export default Notificacoes;