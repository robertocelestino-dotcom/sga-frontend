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

// Interfaces
interface ResumoFinanceiro {
  totalDebitos: number;
  totalCreditos: number;
  valorCobrado: number;
  quantidadeNotas: number;
}

export default function VerificacaoDashboardPage() {
  const navigate = useNavigate();

  // Estados principais
  const [listaImportacoes, setListaImportacoes] = useState<any[]>([]);
  const [importacaoSelecionada, setImportacaoSelecionada] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [resumo, setResumo] = useState<any[]>([]);

  // Estado para resumo financeiro
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro | null>(null);
  
  // Estado para armazenar TODAS as notas (para exportação)
  const [todasNotas, setTodasNotas] = useState<any[]>([]);

  // Estados do GRID DE NOTAS
  const [notas, setNotas] = useState<any>({ content: [], totalElements: 0 });
  const [notasPage, setNotasPage] = useState(0);
  const [notasFiltro, setNotasFiltro] = useState("");
  const notasPageSize = 10;

  // Estados do MODAL
  const [modalAberto, setModalAberto] = useState(false);
  const [notaDetalhes, setNotaDetalhes] = useState<any>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  // --------------------------------------------------------------------------
  // FUNÇÃO PARA BUSCAR TODAS AS NOTAS (para exportação)
  // --------------------------------------------------------------------------
  const buscarTodasNotas = async (importacaoId: number) => {
    try {
      console.log(`🔍 Buscando TODAS as notas para exportação...`);
      
      let todasNotasArray: any[] = [];
      let paginaAtual = 0;
      let totalPaginas = 1;
      const tamanhoPagina = 100;

      while (paginaAtual < totalPaginas) {
        const response = await api.get(`/notas-debito`, {
          params: {
            importacaoId: importacaoId,
            page: paginaAtual,
            size: tamanhoPagina
          }
        });

        const dados = response.data;
        const notasPagina = dados.content || [];
        todasNotasArray = [...todasNotasArray, ...notasPagina];
        
        totalPaginas = dados.totalPages || 1;
        paginaAtual++;
      }

      console.log(`✅ Total de notas carregadas: ${todasNotasArray.length}`);
      setTodasNotas(todasNotasArray);
      
      // Calcular resumo financeiro com TODAS as notas
      let totalDebitos = 0;
      let totalCreditos = 0;

      todasNotasArray.forEach((nota: any) => {
        totalDebitos += Number(nota.totalDebitos) || 0;
        totalCreditos += Number(nota.totalCreditos) || 0;
      });

      const valorCobrado = totalDebitos - totalCreditos;

      setResumoFinanceiro({
        totalDebitos,
        totalCreditos,
        valorCobrado,
        quantidadeNotas: todasNotasArray.length
      });

    } catch (error) {
      console.error("❌ Erro ao buscar todas as notas:", error);
    }
  };

  // --------------------------------------------------------------------------
  // Carrega lista de importações
  // --------------------------------------------------------------------------
  async function carregarListaImportacoes() {
    try {
      const lista = await getImportacoesLista();
      setListaImportacoes(lista ?? []);

      if (lista?.length > 0) {
        setImportacaoSelecionada(lista[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar lista de importações:", error);
    }
  }

  useEffect(() => {
    carregarListaImportacoes();
  }, []);

  // --------------------------------------------------------------------------
  // Carrega verificação + notas + resumo ao trocar importação
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (importacaoSelecionada) {
      carregarVerificacao();
      carregarNotas();
      buscarTodasNotas(importacaoSelecionada);
      setNotasFiltro("");
      setNotasPage(0);
    }
  }, [importacaoSelecionada]);

  // --------------------------------------------------------------------------
  // Verificação (resumo + divergências)
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // GRID DE NOTAS (paginado)
  // --------------------------------------------------------------------------
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
  }, [notasPage, notasFiltro, importacaoSelecionada]);

  // --------------------------------------------------------------------------
  // Handlers de paginação das notas
  // --------------------------------------------------------------------------
  function handleNotasPreviousPage() {
    if (notasPage > 0) setNotasPage(notasPage - 1);
  }

  function handleNotasNextPage() {
    if (notasPage < Math.ceil(notas.totalElements / notasPageSize) - 1) {
      setNotasPage(notasPage + 1);
    }
  }

  // --------------------------------------------------------------------------
  // Abrir modal com detalhes da nota
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // 🔥 FUNÇÃO: Exportar CSV (SEM data de vencimento)
  // --------------------------------------------------------------------------
  function exportarCSV() {
    if (!importacaoSelecionada || !todasNotas.length) return;

    // Cabeçalho com BOM para acentuação correta
    const BOM = "\uFEFF";
    
    // Cabeçalho simplificado (sem data de vencimento)
    let csvContent = "Código;Nome;Total Débito;Total Crédito;Valor Cobrado\n";

    // Adicionar todas as notas
    todasNotas.forEach((nota: any) => {
      const linha = [
        nota.codigoSocio || '',
        `"${nota.nomeAssociado || ''}"`,
        (Number(nota.totalDebitos) || 0).toFixed(2).replace('.', ','),
        (Number(nota.totalCreditos) || 0).toFixed(2).replace('.', ','),
        (Number(nota.valorFaturado) || 0).toFixed(2).replace('.', ',')
      ].join(';');
      
      csvContent += linha + '\n';
    });

    // Linha de totais
    if (resumoFinanceiro) {
      csvContent += '\n';
      csvContent += `TOTAIS;;${resumoFinanceiro.totalDebitos.toFixed(2).replace('.', ',')};${resumoFinanceiro.totalCreditos.toFixed(2).replace('.', ',')};${resumoFinanceiro.valorCobrado.toFixed(2).replace('.', ',')}\n`;
    }

    // Criar e baixar arquivo
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

  // --------------------------------------------------------------------------
  // 🔥 FUNÇÃO: Exportar PDF (Capa de lote - resumo apenas)
  // --------------------------------------------------------------------------
  function exportarPDFLote() {
    if (!importacaoSelecionada || !resumoFinanceiro) return;

    // Criar conteúdo HTML para o PDF (apenas resumo)
    const htmlContent = `
      <html>
      <head>
        <title>Resumo da Importação ${importacaoSelecionada}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
            border: 2px solid #007bff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          h1 { 
            color: #007bff; 
            font-size: 24px; 
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #007bff;
          }
          .info-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #dee2e6;
          }
          .info-label {
            font-weight: bold;
            color: #495057;
          }
          .info-value {
            color: #007bff;
            font-weight: bold;
          }
          .resumo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 25px 0;
          }
          .resumo-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            text-align: center;
          }
          .resumo-label {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 5px;
          }
          .resumo-valor {
            font-size: 20px;
            font-weight: bold;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
          }
          .highlight {
            color: #28a745;
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📋 RESUMO DE FATURAMENTO</h1>
          
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Importação Nº:</span>
              <span class="info-value">${importacaoSelecionada}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Data de Geração:</span>
              <span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Horário:</span>
              <span class="info-value">${new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>

          <div class="resumo-grid">
            <div class="resumo-card">
              <div class="resumo-label">Total de Notas</div>
              <div class="resumo-valor" style="color: #007bff;">${resumoFinanceiro.quantidadeNotas}</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-label">Total Débitos</div>
              <div class="resumo-valor" style="color: #dc2626;">R$ ${resumoFinanceiro.totalDebitos.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-label">Total Créditos</div>
              <div class="resumo-valor" style="color: #16a34a;">R$ ${resumoFinanceiro.totalCreditos.toFixed(2).replace('.', ',')}</div>
            </div>
            <div class="resumo-card">
              <div class="resumo-label">Valor Cobrado</div>
              <div class="resumo-valor" style="color: #2563eb;">R$ ${resumoFinanceiro.valorCobrado.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p class="highlight">✓ Importação processada com sucesso</p>
            <p style="color: #6c757d;">Para visualizar o detalhamento das notas, utilize a exportação em CSV.</p>
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

  // --------------------------------------------------------------------------
  // 🔥 FUNÇÃO: Exportar RM (formato para integração)
  // --------------------------------------------------------------------------
  async function exportarRM() {
    if (!importacaoSelecionada) {
      console.warn("⚠️ Nenhuma importação selecionada");
      return;
    }

    try {
      console.log("📤 Exportando RM para importação:", importacaoSelecionada);
      
      const response = await api.get(`/verificacao-importacao/${importacaoSelecionada}/exportar/rm`, {
        responseType: 'blob'
      });
      
      // Criar URL do blob e download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `importacao_${importacaoSelecionada}.rm`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log("✅ RM exportado com sucesso!");
      
    } catch (error) {
      console.error("❌ Erro ao exportar RM:", error);
      alert("Erro ao exportar arquivo RM. Verifique o console para mais detalhes.");
    }
    
  }

  // --------------------------------------------------------------------------
  // 🔥 FUNÇÃO: Gerar PDF da nota individual
  // --------------------------------------------------------------------------
  async function gerarPDFNota(notaId: number) {
    try {
      console.log(`📄 Gerando PDF para nota ID: ${notaId}`);
      
      // Verificar se a função existe
      if (typeof visualizarNotaPDF !== 'function') {
        console.error("❌ Função visualizarNotaPDF não está disponível");
        return;
      }
      
      // Chamar a função do serviço
      await visualizarNotaPDF(notaId);
      console.log(`✅ PDF gerado com sucesso para nota ${notaId}`);
      
    } catch (error) {
      console.error("❌ Erro ao gerar PDF da nota:", error);
      
      // Fallback: abrir URL diretamente
      try {
        const pdfUrl = `http://localhost:8080/api/notas-debito/${notaId}/pdf`;
        window.open(pdfUrl, '_blank');
      } catch (fallbackError) {
        console.error("❌ Fallback também falhou:", fallbackError);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Formatação
  // --------------------------------------------------------------------------
  function formatarMoeda(valor: number) {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
      const dia = numeros.substring(0, 2);
      const mes = numeros.substring(2, 4);
      const ano = numeros.substring(4, 8);
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  };

  // --------------------------------------------------------------------------
  // Renderização
  // --------------------------------------------------------------------------
  if (loading) return <Loading />;

  return (
    <div className="p-5">
      <BreadCrumb atual="Verificação de Faturamento" />

      {/* Seleção de Importação */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600">Importação:</label>
        <select
          className="px-3 py-2 border rounded bg-white"
          value={importacaoSelecionada ?? ""}
          onChange={(e) => {
            setImportacaoSelecionada(Number(e.target.value));
            setNotasPage(0);
          }}
        >
          {listaImportacoes.map((imp) => (
            <option key={imp.id} value={imp.id}>
              #{imp.id} — {formatarData(imp.dataImportacao)}
            </option>
          ))}
        </select>
      </div>

      <h1 className="text-xl font-bold mb-3">
        Painel de Verificação — Importação #{importacaoSelecionada}
      </h1>

      {/* Botões de Exportação */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={exportarCSV}
          disabled={!todasNotas.length}
          className={`px-4 py-2 rounded shadow flex items-center gap-2 ${
            todasNotas.length 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📊</span> Exportar CSV (Detalhado)
        </button>

        <button
          onClick={exportarPDFLote}
          disabled={!resumoFinanceiro}
          className={`px-4 py-2 rounded shadow flex items-center gap-2 ${
            resumoFinanceiro 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📄</span> Exportar PDF (Resumo)
        </button>

        {/* 🔥 NOVO BOTÃO RM */}
        <button
          onClick={exportarRM}
          disabled={!todasNotas.length}
          className={`px-4 py-2 rounded shadow flex items-center gap-2 ${
            todasNotas.length 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>📤</span> Exportar RM
        </button>
      </div>

      {/* ================= RESUMO FINANCEIRO ================= */}
      {resumoFinanceiro && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow mb-8 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumo Financeiro da Importação</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Total Débitos</p>
              <p className="text-xl font-bold text-red-600">{formatarMoeda(resumoFinanceiro.totalDebitos)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Total Créditos</p>
              <p className="text-xl font-bold text-green-600">{formatarMoeda(resumoFinanceiro.totalCreditos)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Valor Cobrado</p>
              <p className="text-xl font-bold text-blue-600">{formatarMoeda(resumoFinanceiro.valorCobrado)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Notas</p>
              <p className="text-xl font-bold text-purple-600">{resumoFinanceiro.quantidadeNotas}</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= GRID DE NOTAS ================= */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-lg">Notas Faturadas</h2>
          <span className="text-sm text-gray-600">
            Total: {notas.totalElements} nota(s)
          </span>
        </div>

        <input
          className="mb-3 px-3 py-2 border rounded w-64"
          placeholder="Filtrar por código, nome..."
          value={notasFiltro}
          onChange={(e) => {
            setNotasFiltro(e.target.value);
            setNotasPage(0);
          }}
        />

        <div className="overflow-x-auto">
          <table className="w-full border text-sm bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Código</th>
                <th className="p-2 border">Nome</th>
                <th className="p-2 border text-right">Débitos</th>
                <th className="p-2 border text-right">Créditos</th>
                <th className="p-2 border text-right">Faturado</th>
                <th className="p-2 border text-center">Ações</th>
               </tr>
            </thead>
            <tbody>
              {notas.content.map((n: any) => (
                <tr key={n.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{n.codigoSocio}</td>
                  <td className="p-2 border">{n.nomeAssociado}</td>
                  <td className="p-2 border text-right text-red-600">
                    {formatarMoeda(n.totalDebitos)}
                  </td>
                  <td className="p-2 border text-right text-green-600">
                    {formatarMoeda(n.totalCreditos)}
                  </td>
                  <td className="p-2 border text-right font-semibold">
                    {formatarMoeda(n.valorFaturado)}
                  </td>
                  <td className="p-2 border text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirDetalhesNota(n.id)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Visualizar detalhes"
                      >
                        Detalhes
                      </button>
                      <button
                        onClick={() => gerarPDFNota(n.id)}
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        title="Gerar PDF da nota"
                      >
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {notas.content.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    Nenhuma nota encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação das Notas */}
        {notas.totalElements > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Mostrando {notasPage * notasPageSize + 1} a{" "}
              {Math.min((notasPage + 1) * notasPageSize, notas.totalElements)} de{" "}
              {notas.totalElements} notas
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNotasPreviousPage}
                disabled={notasPage === 0}
                className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {notasPage + 1} de {Math.ceil(notas.totalElements / notasPageSize)}
              </span>
              <button
                onClick={handleNotasNextPage}
                disabled={notasPage >= Math.ceil(notas.totalElements / notasPageSize) - 1}
                className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALHES DA NOTA */}
      {modalAberto && (
        <Modal
          title={`Detalhes da Nota - ${notaDetalhes?.numeroNota || ''}`}
          onClose={fecharModal}
          size="xl"
        >
          {loadingDetalhes ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Carregando detalhes...</p>
            </div>
          ) : notaDetalhes ? (
            <div className="space-y-4">
              {/* Cabeçalho da Nota */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">Número da Nota</p>
                  <p className="font-medium">{notaDetalhes.numeroNota}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data Vencimento</p>
                  <p className="font-medium">
                    {formatarDataVencimento(notaDetalhes.dataVencimento)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Código do Associado</p>
                  <p className="font-medium">{notaDetalhes.codigoSocio}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nome do Associado</p>
                  <p className="font-medium">{notaDetalhes.nomeAssociado}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNPJ/CPF</p>
                  <p className="font-medium">{notaDetalhes.cnpjCic || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor da Nota</p>
                  <p className="font-medium">{formatarMoeda(notaDetalhes.valorNota)}</p>
                </div>
              </div>

              {/* Itens da Nota */}
              <h3 className="font-semibold text-md">Itens da Nota</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border">Código</th>
                      <th className="p-2 border">Descrição</th>
                      <th className="p-2 border text-right">Quantidade</th>
                      <th className="p-2 border text-right">Valor Unit.</th>
                      <th className="p-2 border text-right">Valor Total</th>
                      <th className="p-2 border text-center">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notaDetalhes.itens?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 border">{item.codigo}</td>
                        <td className="p-2 border">{item.descricao}</td>
                        <td className="p-2 border text-right">{item.quantidade}</td>
                        <td className="p-2 border text-right">{formatarMoeda(item.valorUnitario)}</td>
                        <td className="p-2 border text-right">{formatarMoeda(item.valorTotal)}</td>
                        <td className="p-2 border text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.tipoLancamento === 'D' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
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
              <div className="flex justify-end gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <span className="text-sm text-gray-600">Total Débitos:</span>
                  <span className="ml-2 font-medium text-red-600">
                    {formatarMoeda(notaDetalhes.totalDebitos)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Créditos:</span>
                  <span className="ml-2 font-medium text-green-600">
                    {formatarMoeda(notaDetalhes.totalCreditos)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Valor Faturado:</span>
                  <span className="ml-2 font-semibold">
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