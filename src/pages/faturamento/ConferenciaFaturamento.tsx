// src/pages/faturamento/ConferenciaFaturamento.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../../providers/MessageProvider';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import { conferenciaFaturamentoService } from '../../services/conferenciaFaturamentoService';
import { reguaFaturamentoService } from '../../services/reguaFaturamentoService';
import { ConferenciaFaturamentoDTO, ConferenciaResumoDTO } from '../../types/conferenciaFaturamento';

const ConferenciaFaturamento: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useMessage();

    const [loading, setLoading] = useState(false);
    const [carregandoResumo, setCarregandoResumo] = useState(false);

    // Filtros
    const [reguaId, setReguaId] = useState<number | undefined>(undefined);
    const [dataInicio, setDataInicio] = useState(() => {
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    });
    const [dataFim, setDataFim] = useState(() => {
        const hoje = new Date();
        return new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    });
    const [codigoSpc, setCodigoSpc] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');

    // Lista de régias
    const [reguas, setReguas] = useState<any[]>([]);

    // Dados
    const [dados, setDados] = useState<ConferenciaFaturamentoDTO[]>([]);
    const [resumo, setResumo] = useState<ConferenciaResumoDTO | null>(null);

    // Paginação
    const [pagina, setPagina] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalElementos, setTotalElementos] = useState(0);
    const [itensPorPagina] = useState(20);

    // Modal de detalhes
    const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
    const [faturaSelecionada, setFaturaSelecionada] = useState<ConferenciaFaturamentoDTO | null>(null);
    const [detalhesFatura, setDetalhesFatura] = useState<any>(null);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

    // ============================================================
    // FORMATADORES
    // ============================================================

    const formatarData = (data: Date): string => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${ano}-${mes}-${dia}`;
    };

    const formatarDataExibicao = (data: string): string => {
        if (!data) return '-';
        const partes = data.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const formatarMoeda = (valor: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    // ============================================================
    // CARREGAR RÉGUAS
    // ============================================================

    const carregarReguas = async () => {
        try {
            const response = await reguaFaturamentoService.listarReguas(0, 100);
            setReguas(response.content || []);
        } catch (error) {
            console.error('❌ Erro ao carregar régias:', error);
        }
    };

    // ============================================================
    // BUSCAR DADOS PAGINADOS
    // ============================================================

    const buscarDados = async () => {
        setLoading(true);
        try {
            const response = await conferenciaFaturamentoService.listarConferencia({
                reguaId,
                dataInicio: formatarData(dataInicio),
                dataFim: formatarData(dataFim),
                codigoSpc: codigoSpc || undefined,
                status: statusFiltro || undefined,
                page: pagina,
                size: itensPorPagina,
                sort: 'dataEmissao',
                direction: 'desc'
            });

            setDados(response.content);
            setTotalPaginas(response.totalPages);
            setTotalElementos(response.totalElements);

            if (response.content.length === 0) {
                showToast('ℹ️ Nenhuma fatura encontrada para o período', 'info');
            }

        } catch (error) {
            console.error('❌ Erro ao buscar dados:', error);
            showToast('⚠️ Erro ao carregar dados da conferência', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 🔥 CARREGAR RESUMO (backend - todos os registros filtrados)
    // ============================================================

    const carregarResumo = async () => {
        setCarregandoResumo(true);
        try {
            const response = await conferenciaFaturamentoService.resumoConferencia(
                reguaId,
                formatarData(dataInicio),
                formatarData(dataFim),
                codigoSpc || undefined,
                statusFiltro || undefined
            );
            setResumo(response);
            console.log('📊 Resumo carregado do backend:', response);
        } catch (error) {
            console.error('❌ Erro ao carregar resumo:', error);
        } finally {
            setCarregandoResumo(false);
        }
    };

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        carregarReguas();
    }, []);

    useEffect(() => {
        if (dataInicio && dataFim) {
            buscarDados();
            carregarResumo();
        }
    }, [reguaId, dataInicio, dataFim, pagina, statusFiltro]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleBuscar = () => {
        setPagina(0);
        buscarDados();
        carregarResumo();
    };

    const handleLimpar = () => {
        const hoje = new Date();
        setReguaId(undefined);
        setDataInicio(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1));
        setDataFim(new Date(hoje.getFullYear(), hoje.getMonth(), 0));
        setCodigoSpc('');
        setStatusFiltro('');
        setPagina(0);
    };

    // Ver detalhes da fatura
    const handleVerDetalhes = async (fatura: ConferenciaFaturamentoDTO) => {
        setFaturaSelecionada(fatura);
        setModalDetalheAberto(true);
        setCarregandoDetalhes(true);
        setDetalhesFatura(null);

        try {
            const detalhes = await conferenciaFaturamentoService.detalharConferencia(fatura.faturaId);
            setDetalhesFatura(detalhes);
            console.log('📊 Detalhes da fatura:', detalhes);
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes:', error);
            showToast('⚠️ Erro ao carregar detalhes da fatura', 'error');
        } finally {
            setCarregandoDetalhes(false);
        }
    };

    // Exportar CSV
    const handleExportarCSV = async () => {
        try {
            const blob = await conferenciaFaturamentoService.exportarCSV(
                reguaId,
                formatarData(dataInicio),
                formatarData(dataFim),
                codigoSpc || undefined
            );
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `conferencia_faturamento_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('✅ CSV exportado com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao exportar CSV:', error);
            showToast('⚠️ Erro ao exportar CSV', 'error');
        }
    };

    // Status badge
    const getStatusBadge = (status: string) => {
        const configs: Record<string, { bg: string; text: string; label: string }> = {
            'OK': { bg: 'bg-green-100', text: 'text-green-800', label: '✅ OK' },
            'DIFERENCA': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⚠️ Diferença' },
        };
        const config = configs[status] || configs['DIFERENCA'];
        return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <BreadCrumb atual="Conferência de Faturamento" />

            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">📊 Conferência de Faturamento</h1>
                        <p className="text-gray-600">
                            Compare faturas geradas com as notas de débito originais para validar o processo
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleExportarCSV}
                            disabled={loading || dados.length === 0}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                                loading || dados.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            <span>📥</span>
                            Exportar CSV
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Régua</label>
                            <select
                                value={reguaId || ''}
                                onChange={(e) => setReguaId(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todas</option>
                                {reguas.map((r) => (
                                    <option key={r.id} value={r.id}>{r.nome}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                            <input
                                type="date"
                                value={dataInicio.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const [ano, mes, dia] = e.target.value.split('-').map(Number);
                                        setDataInicio(new Date(ano, mes - 1, dia));
                                    }
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                            <input
                                type="date"
                                value={dataFim.toISOString().split('T')[0]}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const [ano, mes, dia] = e.target.value.split('-').map(Number);
                                        setDataFim(new Date(ano, mes - 1, dia));
                                    }
                                }}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Código SPC</label>
                            <input
                                type="text"
                                placeholder="Código do associado"
                                value={codigoSpc}
                                onChange={(e) => setCodigoSpc(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={statusFiltro}
                                onChange={(e) => setStatusFiltro(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos</option>
                                <option value="OK">✅ OK</option>
                                <option value="DIFERENCA">⚠️ Diferença</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            onClick={handleBuscar}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Buscando...
                                </>
                            ) : (
                                '🔍 Buscar'
                            )}
                        </button>
                        <button
                            onClick={handleLimpar}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            🧹 Limpar
                        </button>
                        <span className="text-xs text-gray-400 flex items-center ml-2">
                            {totalElementos} registros encontrados
                        </span>
                    </div>
                </div>

                {/* 🔥 RESUMO DO BACKEND - Baseado em TODOS os registros filtrados */}
                {resumo && !carregandoResumo && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{resumo.totalFaturas}</div>
                            <div className="text-xs text-gray-600">Total Faturas</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{resumo.totalSemDiferenca}</div>
                            <div className="text-xs text-gray-600">✅ OK</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
                            <div className="text-2xl font-bold text-yellow-600">{resumo.totalComDiferenca}</div>
                            <div className="text-xs text-gray-600">⚠️ Diferença</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">
                                {formatarMoeda(resumo.somaDiferencas)}
                            </div>
                            <div className="text-xs text-gray-600">Soma Diferenças</div>
                        </div>
                    </div>
                )}

                {/* Tabela */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loading size="large" />
                    </div>
                ) : dados.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-500">Nenhuma fatura encontrada para o período</p>
                        <p className="text-sm text-gray-400 mt-1">Ajuste os filtros e tente novamente</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Associado</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código SPC</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Nota Débito</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fatura</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Diferença</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Itens</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {dados.map((item) => (
                                        <tr key={item.faturaId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 py-2 text-sm text-gray-600 max-w-xs truncate" title={item.nomeRazao}>
                                                {item.nomeRazao}
                                            </td>
                                            <td className="px-3 py-2 text-sm font-mono text-gray-600">{item.codigoSpc}</td>
                                            <td className="px-3 py-2 text-sm text-center font-medium">
                                                {formatarMoeda(item.valorNota)}
                                                <span className="block text-xs text-gray-400">{item.numeroNotaDebito}</span>
                                            </td>
                                            <td className="px-3 py-2 text-sm text-center font-medium">
                                                {formatarMoeda(item.valorFatura)}
                                                <span className="block text-xs text-gray-400">{item.numeroFatura}</span>
                                            </td>
                                            <td className={`px-3 py-2 text-sm text-center font-medium ${
                                                item.diferencaValor < 0 ? 'text-green-600' :
                                                item.diferencaValor > 0 ? 'text-red-600' :
                                                'text-gray-600'
                                            }`}>
                                                {formatarMoeda(item.diferencaValor)}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-center">
                                                <span className="text-xs">
                                                    {item.qtdItensNota} → {item.qtdItensFatura}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {getStatusBadge(item.statusConferencia)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    onClick={() => handleVerDetalhes(item)}
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

                        {/* Paginação */}
                        {totalPaginas > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
                                <div className="text-sm text-gray-500">
                                    Mostrando {pagina * itensPorPagina + 1} - {Math.min((pagina + 1) * itensPorPagina, totalElementos)} de {totalElementos}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => setPagina(0)}
                                        disabled={pagina === 0}
                                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        ⏮️
                                    </button>
                                    <button
                                        onClick={() => setPagina(p => Math.max(0, p - 1))}
                                        disabled={pagina === 0}
                                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        ◀
                                    </button>
                                    <span className="px-3 py-1.5 text-sm text-gray-600 font-medium min-w-[100px] text-center">
                                        Página {pagina + 1} de {totalPaginas}
                                    </span>
                                    <button
                                        onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                                        disabled={pagina === totalPaginas - 1}
                                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        ▶
                                    </button>
                                    <button
                                        onClick={() => setPagina(totalPaginas - 1)}
                                        disabled={pagina === totalPaginas - 1}
                                        className="px-3 py-1.5 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm"
                                    >
                                        ⏭️
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 🔥 MODAL DE DETALHES - IMPLEMENTADO */}
            {modalDetalheAberto && faturaSelecionada && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Detalhes da Conferência - Fatura {faturaSelecionada.numeroFatura}
                            </h2>
                            <button
                                onClick={() => {
                                    setModalDetalheAberto(false);
                                    setFaturaSelecionada(null);
                                    setDetalhesFatura(null);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
                            {carregandoDetalhes ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-gray-600">Carregando detalhes...</span>
                                </div>
                            ) : detalhesFatura ? (
                                <>
                                    {/* Dados da Fatura */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <span className="text-xs text-gray-500">Código SPC</span>
                                            <p className="font-medium">{detalhesFatura.codigoSpc}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Associado</span>
                                            <p className="font-medium">{detalhesFatura.nomeRazao}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Valor Nota</span>
                                            <p className="font-medium text-blue-600">
                                                {formatarMoeda(detalhesFatura.valorNota)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Valor Fatura</span>
                                            <p className="font-medium text-green-600">
                                                {formatarMoeda(detalhesFatura.valorFatura)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Comparação de Itens */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Itens da Nota Débito</h3>
                                            {detalhesFatura.itensNota && detalhesFatura.itensNota.length > 0 ? (
                                                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                        <thead className="bg-gray-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-2 py-1 text-left text-xs text-gray-500">Qtde</th>
                                                                <th className="px-2 py-1 text-left text-xs text-gray-500">Descrição</th>
                                                                <th className="px-2 py-1 text-right text-xs text-gray-500">Valor</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {detalhesFatura.itensNota.map((item: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-gray-50">
                                                                    <td className="px-2 py-1 text-center">{item.quantidade}</td>
                                                                    <td className="px-2 py-1">{item.descricao}</td>
                                                                    <td className="px-2 py-1 text-right">{formatarMoeda(item.valorTotal)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">Nenhum item na nota</p>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-2">📄 Itens da Fatura</h3>
                                            {detalhesFatura.itensFatura && detalhesFatura.itensFatura.length > 0 ? (
                                                <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                        <thead className="bg-gray-50 sticky top-0">
                                                            <tr>
                                                                <th className="px-2 py-1 text-left text-xs text-gray-500">Qtde</th>
                                                                <th className="px-2 py-1 text-left text-xs text-gray-500">Descrição</th>
                                                                <th className="px-2 py-1 text-right text-xs text-gray-500">Valor</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {detalhesFatura.itensFatura.map((item: any, idx: number) => (
                                                                <tr key={idx} className="hover:bg-gray-50">
                                                                    <td className="px-2 py-1 text-center">{item.quantidade}</td>
                                                                    <td className="px-2 py-1">{item.descricao}</td>
                                                                    <td className="px-2 py-1 text-right">{formatarMoeda(item.valorTotal)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">Nenhum item na fatura</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumo da comparação */}
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-semibold">Status:</span> {getStatusBadge(detalhesFatura.statusConferencia)}
                                            <span className="ml-4 font-semibold">Observação:</span> {detalhesFatura.observacao || '-'}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Nenhum detalhe disponível para esta fatura</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConferenciaFaturamento;