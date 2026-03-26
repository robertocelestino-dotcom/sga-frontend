import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { importacaoSPCService } from "../services/api";

interface ProcessamentoDetalhes {
  id?: string | number;
  status?: string;
  totalRegistros?: number;
  registrosProcessados?: number;
  registrosComErro?: number;
  valorTotal?: number;
  totalDebitos?: number;
  totalCreditos?: number;
  valorCobrado?: number;
  dataProcessamento?: string;
  mensagem?: string;
  respostaCompleta?: any;
}

interface VerificacaoAssociados {
  quantidadeArquivo: number;
  quantidadeBanco: number;
  diferenca: number;
  associadosDivergentes: Array<{
    codigoSocio: string;
    nomeAssociado: string;
  }>;
}

interface AssociadoFaturado {
  id: number;
  codigoSocio: string;
  nomeAssociado: string;
  totalDebito: number;
  totalCredito: number;
  valorCobrado: number;
}

interface VerificacaoFinanceira {
  totalDebitos: number;
  totalCreditos: number;
  valorCobrado: number;
  quantidadeNotas: number;
  quantidadeItens: number;
  associados: AssociadoFaturado[];
}

const ImportacaoSPC: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processamentoDetalhes, setProcessamentoDetalhes] = useState<ProcessamentoDetalhes | null>(null);
  const [verificacaoAssociados, setVerificacaoAssociados] = useState<VerificacaoAssociados | null>(null);
  const [verificacaoFinanceira, setVerificacaoFinanceira] = useState<VerificacaoFinanceira | null>(null);
  const [showDivergencias, setShowDivergencias] = useState(false);
  const [showDetalhesFinanceiros, setShowDetalhesFinanceiros] = useState(false);

  const navigate = useNavigate();

  /* ------------------------------ FILE HANDLERS ------------------------------ */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();

    if (!name.endsWith(".txt")) {
      setError("Por favor, selecione um arquivo .TXT válido.");
      return;
    }

    if (!/^\d+txtp\.txt$/.test(name)) {
      setError("O nome do arquivo deve seguir o padrão: 5501txtp.txt");
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError("Arquivo muito grande. Tamanho máximo permitido: 100MB.");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setProcessamentoDetalhes(null);
    setVerificacaoAssociados(null);
    setVerificacaoFinanceira(null);
    setShowDivergencias(false);
    setShowDetalhesFinanceiros(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files[0];
    if (!dropped) return;

    const name = dropped.name.toLowerCase();

    if (!name.endsWith(".txt")) {
      setError("Por favor, solte um arquivo TXT.");
      return;
    }

    if (!/^\d+txtp\.txt$/.test(name)) {
      setError("O nome do arquivo deve seguir o padrão SPC: 5501txtp.txt");
      return;
    }

    setFile(dropped);
    setError(null);
  };

  /* ------------------------------ STATUS COLOR ------------------------------ */
  const getStatusColor = (status: string) => {
    const st = status?.toUpperCase();
    if (["PROCESSADO", "SUCESSO"].includes(st))
      return "text-green-700 bg-green-100";
    if (["ERRO", "FALHA"].includes(st)) return "text-red-700 bg-red-100";
    if (["PROCESSANDO"].includes(st)) return "text-blue-700 bg-blue-100";
    return "text-gray-700 bg-gray-100";
  };

  /* ------------------------------ VERIFICAÇÃO AUTOMÁTICA ------------------------------ */
  const buscarVerificacaoAssociados = async (id: string) => {
    try {
      const response = await importacaoSPCService.verificarAssociados(id);
      const dados = response?.data || response;

      setVerificacaoAssociados({
        quantidadeArquivo: dados.quantidadeArquivo ?? 0,
        quantidadeBanco: dados.quantidadeBanco ?? 0,
        diferenca: dados.diferenca ?? 0,
        associadosDivergentes: Array.isArray(dados.associadosDivergentes)
          ? dados.associadosDivergentes
          : [],
      });
    } catch (error) {
      console.error("Erro ao buscar verificação de associados:", error);
    }
  };

  /* ------------------------------ FUNÇÃO PARA BUSCAR TODAS AS NOTAS (PAGINADA) ------------------------------ */
  const buscarTodasNotas = async (importacaoId: string): Promise<any[]> => {
    let todasNotas: any[] = [];
    let paginaAtual = 0;
    let totalPaginas = 1;
    const tamanhoPagina = 100;

    console.log(`🔍 Buscando TODAS as notas da importação ${importacaoId}...`);

    try {
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
        
        console.log(`📄 Página ${paginaAtual + 1}: ${notasPagina.length} notas`);
        
        todasNotas = [...todasNotas, ...notasPagina];
        
        totalPaginas = dados.totalPages || 1;
        paginaAtual++;
      }

      console.log(`✅ Total de notas carregadas: ${todasNotas.length}`);
      return todasNotas;
      
    } catch (error) {
      console.error("❌ Erro ao buscar notas paginadas:", error);
      throw error;
    }
  };

  /* ------------------------------ BUSCAR VERIFICAÇÃO FINANCEIRA ------------------------------ */
  const buscarVerificacaoFinanceira = async (id: string) => {
    try {
      console.log("🔍 Buscando verificação financeira para importação:", id);
      
      const notas = await buscarTodasNotas(id);
      
      let totalDebitos = 0;
      let totalCreditos = 0;
      let totalItens = 0;
      
      const associadosMap = new Map<string, AssociadoFaturado>();
      
      notas.forEach((nota: any) => {
        const debitoNota = Number(nota.totalDebitos) || 0;
        const creditoNota = Number(nota.totalCreditos) || 0;
        
        totalDebitos += debitoNota;
        totalCreditos += creditoNota;
        totalItens += nota.quantidadeItens || 0;
        
        const chaveAssociado = `${nota.codigoSocio}-${nota.nomeAssociado}`;
        
        if (!associadosMap.has(chaveAssociado)) {
          associadosMap.set(chaveAssociado, {
            id: nota.id,
            codigoSocio: nota.codigoSocio,
            nomeAssociado: nota.nomeAssociado,
            totalDebito: 0,
            totalCredito: 0,
            valorCobrado: 0
          });
        }
        
        const associado = associadosMap.get(chaveAssociado)!;
        associado.totalDebito += debitoNota;
        associado.totalCredito += creditoNota;
        associado.valorCobrado = associado.totalDebito - associado.totalCredito;
      });
      
      const valorCobradoTotal = totalDebitos - totalCreditos;
      const associadosArray = Array.from(associadosMap.values());
      
      console.log("📈 RESULTADO FINAL:", {
        totalDebitos,
        totalCreditos,
        valorCobrado: valorCobradoTotal,
        quantidadeNotas: notas.length,
        quantidadeAssociados: associadosArray.length
      });
      
      setVerificacaoFinanceira({
        totalDebitos,
        totalCreditos,
        valorCobrado: valorCobradoTotal,
        quantidadeNotas: notas.length,
        quantidadeItens: totalItens,
        associados: associadosArray
      });
      
    } catch (error) {
      console.error("❌ Erro ao buscar verificação financeira:", error);
    }
  };

  /* ------------------------------ UPLOAD ------------------------------ */
  const handleUpload = async () => {
    if (!file) {
      setError("Selecione um arquivo primeiro.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("🚀 Iniciando upload do arquivo:", file.name);
      
      const response = await importacaoSPCService.uploadArquivo(file);
      console.log("📥 Resposta do upload:", response);
      
      const importacao = response.importacao || response;

      let totalDebitos = 0;
      let totalCreditos = 0;
      let valorCobrado = 0;
      
      try {
        console.log("🔍 Buscando TODAS as notas da importação:", importacao.id);
        
        const notas = await buscarTodasNotas(importacao.id);
        
        notas.forEach((nota: any) => {
          totalDebitos += Number(nota.totalDebitos) || 0;
          totalCreditos += Number(nota.totalCreditos) || 0;
        });
        
        valorCobrado = totalDebitos - totalCreditos;
        
        console.log("💰 Totais calculados (Débitos - Créditos):", {
          totalDebitos,
          totalCreditos,
          valorCobrado,
          totalNotas: notas.length
        });
        
      } catch (e) {
        console.warn("⚠️ Não foi possível buscar detalhes das notas:", e);
      }

      const detalhes: ProcessamentoDetalhes = {
        id: importacao.id,
        status: importacao.status ?? "PROCESSADO",
        totalRegistros: importacao.quantidadeRegistros ?? 0,
        registrosProcessados: importacao.quantidadeRegistros ?? 0,
        registrosComErro: importacao.registrosComErro ?? 0,
        valorTotal: importacao.totalValor ?? 0,
        totalDebitos: totalDebitos,
        totalCreditos: totalCreditos,
        valorCobrado: valorCobrado,
        dataProcessamento: importacao.dataImportacao ?? new Date().toISOString(),
        mensagem: response.mensagem ?? "Arquivo processado!",
      };

      setProcessamentoDetalhes(detalhes);
      setSuccess("Arquivo importado com sucesso!");

      if (detalhes.id) {
        const idStr = String(detalhes.id);
        buscarVerificacaoAssociados(idStr);
        buscarVerificacaoFinanceira(idStr);
      }

      setFile(null);
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err: any) {
      console.error("❌ Erro no upload:", err);
      const msg =
        err.response?.data?.erro ||
        err.response?.data?.mensagem ||
        "Erro ao processar arquivo";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------ NAVEGAÇÃO ------------------------------ */
  const handleVerificarImportacao = (id: string | number) => {
    const num = Number(id);
    if (isNaN(num) || num <= 0) return;
    navigate(`/importacao-spc/${num}/verificacao`);
  };

  /* ------------------------------ FORMATAR MOEDA ------------------------------ */
  const formatarMoeda = (valor: number) => {
    if (isNaN(valor) || valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${valor.toLocaleString("pt-BR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  /* ------------------------------ JSX ------------------------------ */
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Importação SPC — Faturamento
        </h1>
        <p className="text-gray-600 mt-1">
          Envie o arquivo oficial do SPC e processe as notas para faturamento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA 1 — UPLOAD */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD UPLOAD */}
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Upload do Arquivo SPC
              </h2>
              {file && (
                <button
                  onClick={() => setFile(null)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Limpar
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                ⚠ {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                ✅ {success}
              </div>
            )}

            {/* DROPZONE */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
                file ? "border-green-400 bg-green-50" : "border-gray-300 hover:bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <p className="text-4xl mb-3">📄</p>
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                </div>
              ) : (
                <p className="text-gray-600">
                  Arraste o arquivo aqui ou clique para selecionar
                </p>
              )}
              <input
                id="file-upload"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="mt-4 inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700"
              >
                Selecionar Arquivo
              </label>
            </div>

            {/* BOTÃO DE ENVIO */}
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className={`w-full mt-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-3 ${
                !file || isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Processando...
                </>
              ) : (
                "🚀 Iniciar Importação"
              )}
            </button>
          </div>

          {/* DETALHES DO PROCESSAMENTO */}
          {processamentoDetalhes && (
            <div className="bg-white shadow rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Detalhes do Processamento</h3>
                <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(processamentoDetalhes.status || "")}`}>
                  {processamentoDetalhes.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <StatBox label="Total Registros" value={processamentoDetalhes.totalRegistros} />
                <StatBox label="Processados" value={processamentoDetalhes.registrosProcessados} />
                <StatBox label="Com Erro" value={processamentoDetalhes.registrosComErro} color="text-red-600" />
                <StatBox label="Valor Total" value={formatarMoeda(processamentoDetalhes.valorTotal || 0)} />
              </div>

              {/* RESUMO FINANCEIRO - SEM FÓRMULA */}
              {(processamentoDetalhes.totalDebitos !== undefined || processamentoDetalhes.totalCreditos !== undefined) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Resumo Financeiro</h4>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Total Débitos</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatarMoeda(processamentoDetalhes.totalDebitos || 0)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Total Créditos</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatarMoeda(processamentoDetalhes.totalCreditos || 0)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Valor Cobrado</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatarMoeda(processamentoDetalhes.valorCobrado || 0)}
                      </div>
                    </div>
                  </div>
                  
                  {verificacaoFinanceira && (
                    <div className="mt-3 text-xs text-center text-gray-500">
                      Total de notas processadas: {verificacaoFinanceira.quantidadeNotas}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleVerificarImportacao(String(processamentoDetalhes.id))}
                className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                🔍 Verificar Importação
              </button>
            </div>
          )}

          {/* VERIFICAÇÃO ASSOCIADOS */}
          {verificacaoAssociados && (
            <div className={`p-6 rounded-xl shadow bg-white border ${verificacaoAssociados.diferenca === 0 ? "border-green-300" : "border-yellow-300"}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👥</span> Verificação de Associados
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <StatBox label="Arquivo" value={verificacaoAssociados.quantidadeArquivo} />
                <StatBox label="Banco" value={verificacaoAssociados.quantidadeBanco} />
                <StatBox label="Diferença" value={verificacaoAssociados.diferenca} 
                  color={verificacaoAssociados.diferenca === 0 ? "text-gray-600" : "text-red-600"} />
              </div>
            </div>
          )}
        </div>

        {/* COLUNA 2 — PAINEL LATERAL */}
        <div className="space-y-6">
          <SideCard title="📋 Especificações SPC">
            <InfoLine label="Formato" value=".TXT" />
            <InfoLine label="Nome" value="5501txtp.txt" />
            <InfoLine label="Tamanho Máximo" value="100MB" />
            <InfoLine label="Layout" value="Oficial SPC Brasil" />
          </SideCard>

          <SideCard title="💡 Instruções">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Exporte do sistema SPC</li>
              <li>• Nome correto: 5501txtp.txt</li>
              <li>• Arraste ou selecione o arquivo</li>
              <li>• Aguarde o processamento</li>
              <li>• Analise as verificações</li>
            </ul>
          </SideCard>

          <SideCard title="🔧 Status do Sistema">
            <StatusDot label="API SPC" />
            <StatusDot label="Backend" />
            <StatusDot label="Banco de Dados" />
            <StatusDot label="Verificação" />
          </SideCard>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ COMPONENTES AUX ------------------------------ */
const StatBox = ({ label, value, color }: { label: string; value: any; color?: string }) => (
  <div>
    <div className={`text-xl font-bold ${color ? color : "text-gray-800"}`}>
      {value !== undefined && value !== null ? value : "0"}
    </div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

const SideCard = ({ children, title }: { children: any; title: string }) => (
  <div className="bg-white shadow rounded-xl p-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
    {children}
  </div>
);

const InfoLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm text-gray-700 mb-1">
    <span className="font-medium">{label}:</span>
    <span>{value}</span>
  </div>
);

const StatusDot = ({ label }: { label: string }) => (
  <div className="flex items-center space-x-2 text-sm">
    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
    <span>{label}</span>
  </div>
);

export default ImportacaoSPC;