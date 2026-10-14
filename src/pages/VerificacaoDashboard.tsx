// src/pages/VerificacaoDashboard.tsx - VERSÃO CDL
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchVerificacao,
  getImportacoesLista,
  listarNotas,
  getNotaDetalhes,
  visualizarNotaPDF,
} from "../services/api";
import api from "../services/api";

import BreadCrumb from "../components/BreadCrumb";
import Loading from "../components/Loading";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";

/* ============================================================
   TIPOS
   ============================================================ */
interface ResumoFinanceiro {
  totalDebitos: number;
  totalCreditos: number;
  valorCobrado: number;
  quantidadeNotas: number;
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
export default function VerificacaoDashboardPage() {
  const navigate = useNavigate();

  const [listaImportacoes, setListaImportacoes] = useState<any[]>([]);
  const [importacaoSelecionada, setImportacaoSelecionada] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [, setResultado] = useState<any>(null);
  const [, setResumo] = useState<any[]>([]);

  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null);
  const [todasNotas, setTodasNotas] = useState<any[]>([]);

  const [notas, setNotas] = useState<any>({ content: [], totalElements: 0 });
  const [notasPage, setNotasPage] = useState(0);
  const [notasFiltro, setNotasFiltro] = useState("");
  const notasPageSize = 10;

  const [modalAberto, setModalAberto] = useState(false);
  const [notaDetalhes, setNotaDetalhes] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  /* ============================================================
     BUSCAR TODAS AS NOTAS (para exportação)
     ============================================================ */
  const buscarTodasNotas = async (importacaoId: number) => {
    try {
      let todasNotasArray: any[] = [];
      let paginaAtual = 0;
      let totalPaginas = 1;
      const tamanhoPagina = 100;

      while (paginaAtual < totalPaginas) {
        const response = await api.get(`/notas-debito`, {
          params: { importacaoId, page: paginaAtual, size: tamanhoPagina },
        });
        const dados = response.data;
        todasNotasArray = [...todasNotasArray, ...(dados.content || [])];
        totalPaginas = dados.totalPages || 1;
        paginaAtual++;
      }

      setTodasNotas(todasNotasArray);

      let totalDebitos = 0;
      let totalCreditos = 0;
      todasNotasArray.forEach((nota: any) => {
        totalDebitos += Number(nota.totalDebitos) || 0;
        totalCreditos += Number(nota.totalCreditos) || 0;
      });

      setResumoFinanceiro({
        totalDebitos,
        totalCreditos,
        valorCobrado: totalDebitos - totalCreditos,
        quantidadeNotas: todasNotasArray.length,
      });
    } catch (error) {
      console.error("❌ Erro ao buscar todas as notas:", error);
    }
  };

  /* ============================================================
     LISTA DE IMPORTAÇÕES
     ============================================================ */
  async function carregarListaImportacoes() {
    try {
      const lista = await getImportacoesLista();
      setListaImportacoes(lista ?? []);
      if (lista?.length > 0) setImportacaoSelecionada(lista[0].id);
    } catch (error) {
      console.error("Erro ao carregar lista de importações:", error);
    }
  }

  useEffect(() => { carregarListaImportacoes(); }, []);

  useEffect(() => {
    if (importacaoSelecionada) {
      carregarVerificacao();
      carregarNotas();
      buscarTodasNotas(importacaoSelecionada);
      setNotasFiltro("");
      setNotasPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importacaoSelecionada]);

  async function carregarVerificacao() {
    try {
      setLoading(true);
      const resposta = await fetchVerificacao(importacaoSelecionada);
      setResultado(resposta);
      setResumo(resposta?.resumo ?? []);
    } catch (error) {
      console.error("Erro ao carregar verificação:", error);
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     GRID DE NOTAS
     ============================================================ */
  async function carregarNotas() {
    if (!importacaoSelecionada) return;
    try {
      const data = await listarNotas(importacaoSelecionada, notasPage, notasPageSize, notasFiltro);
      setNotas(data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
  }

  useEffect(() => {
    carregarNotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notasPage, notasFiltro, importacaoSelecionada]);

  function handleNotasPreviousPage() {
    if (notasPage > 0) setNotasPage(notasPage - 1);
  }

  function handleNotasNextPage() {
    if (notasPage < Math.ceil(notas.totalElements / notasPageSize) - 1) {
      setNotasPage(notasPage + 1);
    }
  }

  /* ============================================================
     MODAL
     ============================================================ */
  async function abrirDetalhesNota(notaId: number) {
    setLoadingDetalhes(true);
    setModalAberto(true);
    try {
      const detalhes = await getNotaDetalhes(notaId);
      setNotaDetalhes(detalhes);
    } catch (error) {
      console.error("Erro ao carregar detalhes da nota:", error);
    } finally {
      setLoadingDetalhes(false);
    }
  }

  function fecharModal() {
    setModalAberto(false);
    setNotaDetalhes(null);
  }

  /* ============================================================
     EXPORTAR CSV
     ============================================================ */
  function exportarCSV() {
    if (!importacaoSelecionada || !todasNotas.length) return;

    const BOM = "\uFEFF";
    let csvContent = "Código;Nome;Total Débito;Total Crédito;Valor Cobrado\n";

    todasNotas.forEach((nota: any) => {
      const linha = [
        nota.codigoSocio || '',
        `"${nota.nomeAssociado || ''}"`,
        (Number(nota.totalDebitos) || 0).toFixed(2).replace('.', ','),
        (Number(nota.totalCreditos) || 0).toFixed(2).replace('.', ','),
        (Number(nota.valorFaturado) || 0).toFixed(2).replace('.', ','),
      ].join(';');
      csvContent += linha + '\n';
    });

    if (resumoFinanceiro) {
      csvContent += '\n';
      csvContent += `TOTAIS;;${resumoFinanceiro.totalDebitos.toFixed(2).replace('.', ',')};${resumoFinanceiro.totalCreditos.toFixed(2).replace('.', ',')};${resumoFinanceiro.valorCobrado.toFixed(2).replace('.', ',')}\n`;
    }

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `notas_importacao_${importacaoSelecionada}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /* ============================================================
     EXPORTAR PDF (RESUMO)
     ============================================================ */
  function exportarPDFLote() {
    if (!importacaoSelecionada || !resumoFinanceiro) return;

    const htmlContent = `
      <html>
      <head>
        <title>Resumo da Importação ${importacaoSelecionada}</title>
        <style>
          body {
            font-family: 'Inter', Arial, sans-serif;
            margin: 40px;
            display: flex; flex-direction: column;
            justify-content: center; min-height: 100vh;
            color: #1F2937;
          }
          .container {
            max-width: 800px; margin: 0 auto; padding: 30px;
            border: 2px solid #1F3A8A; border-radius: 12px;
            box-shadow: 0 0 20px rgba(31,58,138,0.10);
          }
          h1 {
            color: #1F3A8A; font-size: 24px; text-align: center;
            margin-bottom: 30px; padding-bottom: 15px;
            border-bottom: 2px solid #F5C518;
          }
          .info-box {
            background-color: #EEF2FB; padding: 20px;
            border-radius: 8px; margin: 20px 0;
          }
          .info-row {
            display: flex; justify-content: space-between;
            padding: 10px 0; border-bottom: 1px solid #D9E1F5;
          }
          .info-label { font-weight: 600; color: #1F3A8A; }
          .info-value { color: #1F3A8A; font-weight: 700; }
          .resumo-grid {
            display: grid; grid-template-columns: repeat(2, 1fr);
            gap: 15px; margin: 25px 0;
          }
          .resumo-card {
            background: white; padding: 15px; border-radius: 8px;
            border: 1px solid #D9E1F5; text-align: center;
          }
          .resumo-label { font-size: 14px; color: #4A4A4A; margin-bottom: 5px; }
          .resumo-valor { font-size: 20px; font-weight: bold; }
          .footer {
            margin-top: 40px; text-align: center;
            font-size: 12px; color: #4A4A4A;
            padding-top: 20px; border-top: 1px solid #D9E1F5;
          }
          .highlight { color: #2D8B4E; font-size: 18px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📋 RESUMO DE FATURAMENTO</h1>
          <div class="info-box">
            <div class="info-row"><span class="info-label">Importação Nº:</span><span class="info-value">${importacaoSelecionada}</span></div>
            <div class="info-row"><span class="info-label">Data de Geração:</span><span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span></div>
            <div class="info-row"><span class="info-label">Horário:</span><span class="info-value">${new Date().toLocaleTimeString('pt-BR')}</span></div>
          </div>
          <div class="resumo-grid">
            <div class="resumo-card"><div class="resumo-label">Total de Notas</div><div class="resumo-valor" style="color:#1F3A8A">${resumoFinanceiro.quantidadeNotas}</div></div>
            <div class="resumo-card"><div class="resumo-label">Total Débitos</div><div class="resumo-valor" style="color:#C0392B">R$ ${resumoFinanceiro.totalDebitos.toFixed(2).replace('.', ',')}</div></div>
            <div class="resumo-card"><div class="resumo-label">Total Créditos</div><div class="resumo-valor" style="color:#2D8B4E">R$ ${resumoFinanceiro.totalCreditos.toFixed(2).replace('.', ',')}</div></div>
            <div class="resumo-card"><div class="resumo-label">Valor Cobrado</div><div class="resumo-valor" style="color:#1F3A8A">R$ ${resumoFinanceiro.valorCobrado.toFixed(2).replace('.', ',')}</div></div>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <p class="highlight">✓ Importação processada com sucesso</p>
            <p style="color:#4A4A4A">Para visualizar o detalhamento das notas, utilize a exportação em CSV.</p>
          </div>
          <div class="footer">
            <p>Sistema de Gestão de Associados (SGA)</p>
            <p>Este é um resumo consolidado da importação. O arquivo CSV contém o detalhamento completo.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.print();
    }
  }

  /* ============================================================
     EXPORTAR RM
     ============================================================ */
  async function exportarRM() {
    if (!importacaoSelecionada) return;
    try {
      const response = await api.get(`/verificacao-importacao/${importacaoSelecionada}/exportar/rm`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `importacao_${importacaoSelecionada}.rm`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("❌ Erro ao exportar RM:", error);
      alert("Erro ao exportar arquivo RM. Verifique o console para mais detalhes.");
    }
  }

  /* ============================================================
     GERAR PDF DE UMA NOTA
     ============================================================ */
  async function gerarPDFNota(notaId: number) {
    try {
      if (typeof visualizarNotaPDF !== 'function') return;
      await visualizarNotaPDF(notaId);
    } catch (error) {
      console.error("❌ Erro ao gerar PDF da nota:", error);
      try {
        const pdfUrl = `http://localhost:8080/api/notas-debito/${notaId}/pdf`;
        window.open(pdfUrl, '_blank');
      } catch (fallbackError) {
        console.error("❌ Fallback também falhou:", fallbackError);
      }
    }
  }

  /* ============================================================
     FORMATAÇÃO
     ============================================================ */
  function formatarMoeda(valor: number) {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    });
  }

  function formatarData(data: string) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  const formatarDataVencimento = (dataStr: string): string => {
    if (!dataStr) return '-';
    const numeros = dataStr.replace(/\D/g, '');
    if (numeros.length === 8) {
      return `${numeros.substring(0, 2)}/${numeros.substring(2, 4)}/${numeros.substring(4, 8)}`;
    }
    return dataStr;
  };

  /* ============================================================
     RENDER
     ============================================================ */
  if (loading) return <Loading />;

  const totalPaginasNotas = Math.ceil(notas.totalElements / notasPageSize);

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <BreadCrumb atual="Verificação de Faturamento" />

      {/* ========== HEADER: Título + Seletor ========== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">
            Painel de Verificação
            {importacaoSelecionada && (
              <>
                {" "}
                <span className="font-mono text-cdl-navy-700 bg-cdl-navy-50 px-2 py-1 rounded">
                  #{importacaoSelecionada}
                </span>
              </>
            )}
          </h1>
          <p className="text-gray-600 mt-1">Análise financeira e de notas da importação SPC</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-cdl-navy-700">Importação:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white min-w-[220px]
                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                       focus:border-cdl-navy-600 transition-colors"
            value={importacaoSelecionada ?? ""}
            onChange={(e) => {
              setImportacaoSelecionada(Number(e.target.value));
              setNotasPage(0);
            }}
          >
            {listaImportacoes.length === 0 ? (
              <option value="">Nenhuma importação disponível</option>
            ) : (
              listaImportacoes.map((imp) => (
                <option key={imp.id} value={imp.id}>
                  #{imp.id} — {formatarData(imp.dataImportacao)}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* ========== BOTÕES DE EXPORTAÇÃO ========== */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={exportarCSV}
          disabled={!todasNotas.length}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-[.98] ${
            todasNotas.length
              ? 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📊</span> Exportar CSV (Detalhado)
        </button>

        <button
          onClick={exportarPDFLote}
          disabled={!resumoFinanceiro}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-[.98] ${
            resumoFinanceiro
              ? 'bg-cdl-danger-500 text-white hover:bg-cdl-danger-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📄</span> Exportar PDF (Resumo)
        </button>

        <button
          onClick={exportarRM}
          disabled={!todasNotas.length}
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all active:scale-[.98] ${
            todasNotas.length
              ? 'bg-cdl-green-500 text-white hover:bg-cdl-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📤</span> Exportar RM
        </button>
      </div>

      {/* ========== RESUMO FINANCEIRO ========== */}
      {resumoFinanceiro && (
        <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-6 rounded-xl shadow-cdl mb-8">
          <h2 className="text-lg font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
            <span>📊</span> Resumo Financeiro da Importação
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cdl-danger-500">
              <p className="text-sm text-cdl-danger-500 font-medium">Total Débitos</p>
              <p className="text-xl font-bold text-cdl-danger-500 mt-1">
                {formatarMoeda(resumoFinanceiro.totalDebitos)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cdl-green-500">
              <p className="text-sm text-cdl-green-600 font-medium">Total Créditos</p>
              <p className="text-xl font-bold text-cdl-green-700 mt-1">
                {formatarMoeda(resumoFinanceiro.totalCreditos)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cdl-navy-700">
              <p className="text-sm text-cdl-navy-600 font-medium">Valor Cobrado</p>
              <p className="text-xl font-bold text-cdl-navy-700 mt-1">
                {formatarMoeda(resumoFinanceiro.valorCobrado)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cdl-yellow-500">
              <p className="text-sm text-cdl-yellow-700 font-medium">Notas</p>
              <p className="text-xl font-bold text-cdl-yellow-700 mt-1">
                {resumoFinanceiro.quantidadeNotas}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== GRID DE NOTAS ========== */}
      <div>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <h2 className="font-semibold text-lg text-cdl-navy-700 flex items-center gap-2">
            <span>🧾</span> Notas Faturadas
          </h2>
          <span className="text-sm text-cdl-navy-600 bg-cdl-navy-50 px-3 py-1 rounded-full font-medium">
            Total: <strong>{notas.totalElements}</strong> nota(s)
          </span>
        </div>

        <div className="mb-4 relative max-w-md">
          <input
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                       focus:border-cdl-navy-600 transition-colors"
            placeholder="Filtrar por código, nome..."
            value={notasFiltro}
            onChange={(e) => {
              setNotasFiltro(e.target.value);
              setNotasPage(0);
            }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* Tabela */}
        {notas.content.length === 0 ? (
          <div className="bg-white rounded-xl shadow-cdl">
            <EmptyState
              icon="🧾"
              title={notasFiltro ? "Nenhuma nota corresponde ao filtro" : "Nenhuma nota encontrada"}
              description={
                notasFiltro
                  ? `Não encontramos notas para "${notasFiltro}".`
                  : "Esta importação não possui notas cadastradas."
              }
              action={
                notasFiltro ? (
                  <button
                    onClick={() => { setNotasFiltro(""); setNotasPage(0); }}
                    className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  >
                    🔄 Limpar filtro
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-cdl">
              <table className="w-full text-sm">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {[
                      { label: 'Código', align: 'left' },
                      { label: 'Nome', align: 'left' },
                      { label: 'Débitos', align: 'right' },
                      { label: 'Créditos', align: 'right' },
                      { label: 'Faturado', align: 'right' },
                      { label: 'Ações', align: 'center' },
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`px-4 py-3 text-${h.align} text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider`}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {notas.content.map((n: any) => (
                    <tr key={n.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-cdl-navy-700">{n.codigoSocio}</td>
                      <td className="px-4 py-3 text-gray-900">{n.nomeAssociado}</td>
                      <td className="px-4 py-3 text-right text-cdl-danger-500 font-medium">
                        {formatarMoeda(n.totalDebitos)}
                      </td>
                      <td className="px-4 py-3 text-right text-cdl-green-700 font-medium">
                        {formatarMoeda(n.totalCreditos)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-cdl-navy-700">
                        {formatarMoeda(n.valorFaturado)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => abrirDetalhesNota(n.id)}
                            className="px-3 py-1.5 text-xs bg-cdl-navy-700 text-white rounded-md
                                       hover:bg-cdl-navy-800 transition-colors font-medium"
                            title="Visualizar detalhes"
                          >
                            Detalhes
                          </button>
                          <button
                            onClick={() => gerarPDFNota(n.id)}
                            className="px-3 py-1.5 text-xs bg-cdl-yellow-gradient text-cdl-navy-700
                                       rounded-md hover:brightness-105 transition-all font-medium"
                            title="Gerar PDF da nota"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {notas.totalElements > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-sm text-gray-700">
                  Mostrando <strong>{notasPage * notasPageSize + 1}</strong> a{" "}
                  <strong>{Math.min((notasPage + 1) * notasPageSize, notas.totalElements)}</strong>{" "}
                  de <strong>{notas.totalElements}</strong> notas
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNotasPreviousPage}
                    disabled={notasPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                               text-gray-700 hover:bg-white hover:border-cdl-navy-300
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Página <strong>{notasPage + 1}</strong> de <strong>{totalPaginasNotas}</strong>
                  </span>
                  <button
                    onClick={handleNotasNextPage}
                    disabled={notasPage >= totalPaginasNotas - 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                               text-gray-700 hover:bg-white hover:border-cdl-navy-300
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========== MODAL DE DETALHES ========== */}
      {modalAberto && (
        <Modal
          title={`Detalhes da Nota${notaDetalhes?.numeroNota ? ` - ${notaDetalhes.numeroNota}` : ''}`}
          onClose={fecharModal}
          size="xl"
        >
          {loadingDetalhes ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
              <p className="mt-3 text-sm text-cdl-navy-700 font-medium">Carregando detalhes...</p>
            </div>
          ) : notaDetalhes ? (
            <div className="space-y-4">
              {/* Cabeçalho da Nota */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">Número da Nota</p>
                  <p className="font-medium text-cdl-navy-700 font-mono">{notaDetalhes.numeroNota}</p>
                </div>
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">Data Vencimento</p>
                  <p className="font-medium text-cdl-navy-700">
                    {formatarDataVencimento(notaDetalhes.dataVencimento)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">Código do Associado</p>
                  <p className="font-medium text-cdl-navy-700 font-mono">{notaDetalhes.codigoSocio}</p>
                </div>
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">Nome do Associado</p>
                  <p className="font-medium text-cdl-navy-700">{notaDetalhes.nomeAssociado}</p>
                </div>
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">CNPJ/CPF</p>
                  <p className="font-medium text-cdl-navy-700">{notaDetalhes.cnpjCic || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-cdl-navy-600 font-medium">Valor da Nota</p>
                  <p className="font-medium text-cdl-navy-700">{formatarMoeda(notaDetalhes.valorNota)}</p>
                </div>
              </div>

              {/* Itens */}
              <h3 className="font-semibold text-md text-cdl-navy-700 flex items-center gap-2">
                <span>📦</span> Itens da Nota
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-cdl-navy-50">
                    <tr>
                      {[
                        { label: 'Código', align: 'left' },
                        { label: 'Descrição', align: 'left' },
                        { label: 'Quantidade', align: 'right' },
                        { label: 'Valor Unit.', align: 'right' },
                        { label: 'Valor Total', align: 'right' },
                        { label: 'Tipo', align: 'center' },
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2 text-${h.align} text-xs font-semibold text-cdl-navy-700 uppercase`}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {notaDetalhes.itens?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-3 py-2 font-mono text-cdl-navy-700">{item.codigo}</td>
                        <td className="px-3 py-2 text-gray-900">{item.descricao}</td>
                        <td className="px-3 py-2 text-right text-gray-900">{item.quantidade}</td>
                        <td className="px-3 py-2 text-right text-gray-900">{formatarMoeda(item.valorUnitario)}</td>
                        <td className="px-3 py-2 text-right font-medium text-cdl-navy-700">
                          {formatarMoeda(item.valorTotal)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.tipoLancamento === 'D'
                              ? 'bg-cdl-danger-50 text-cdl-danger-500'
                              : 'bg-cdl-green-100 text-cdl-green-700'
                          }`}>
                            {item.tipoLancamentoDesc || (item.tipoLancamento === 'D' ? 'Débito' : 'Crédito')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais */}
              <div className="flex flex-wrap justify-end gap-4 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                <div>
                  <span className="text-sm text-cdl-navy-600">Total Débitos:</span>
                  <span className="ml-2 font-semibold text-cdl-danger-500">
                    {formatarMoeda(notaDetalhes.totalDebitos)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-cdl-navy-600">Total Créditos:</span>
                  <span className="ml-2 font-semibold text-cdl-green-700">
                    {formatarMoeda(notaDetalhes.totalCreditos)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-cdl-navy-600">Valor Faturado:</span>
                  <span className="ml-2 font-bold text-cdl-navy-700">
                    {formatarMoeda(notaDetalhes.valorFaturado)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}