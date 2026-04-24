import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { importacaoSPCService } from "../services/api";
import ConfirmModal from "../components/ui/ConfirmModal";
import Loading from "../components/Loading";
import { useMessage } from "../providers/MessageProvider";

// Tipos
type TipoArquivo = "CONSOLIDADO" | "PREVIA_ANTERIOR" | "PREVIA_CORRENTE";

interface ProcessamentoDetalhes {
  id?: string | number;
  status?: string;
  tipoArquivo?: string;
  dataFimPeriodo?: string;
  descricaoArquivo?: string;
  totalRegistros?: number;
  registrosProcessados?: number;
  registrosComErro?: number;
  valorTotal?: number;
  totalDebitos?: number;
  totalCreditos?: number;
  valorCobrado?: number;
  quantidadeNotas?: number;
  dataProcessamento?: string;
  mensagem?: string;
  nomeArquivo?: string;
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
  const { showSuccess, showError } = useMessage();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processamentoDetalhes, setProcessamentoDetalhes] = useState<ProcessamentoDetalhes | null>(null);
  const [verificacaoAssociados, setVerificacaoAssociados] = useState<VerificacaoAssociados | null>(null);
  const [verificacaoFinanceira, setVerificacaoFinanceira] = useState<VerificacaoFinanceira | null>(null);
  const [showDivergencias, setShowDivergencias] = useState(false);
  const [showDetalhesFinanceiros, setShowDetalhesFinanceiros] = useState(false);
  const [showDesfazerModal, setShowDesfazerModal] = useState(false);
  const [showConfirmUploadModal, setShowConfirmUploadModal] = useState(false);

  // DETECTAR TIPO DE ARQUIVO PELO NOME
  const detectarTipoArquivo = (nomeArquivo: string): TipoArquivo | null => {
    const nome = nomeArquivo.toLowerCase();
    if (nome.includes("5501txtp.txt")) return "CONSOLIDADO";
    if (nome.includes("5501tmpp.txt")) return "PREVIA_CORRENTE";
    return null;
  };

  // OBTER INFORMAÇÕES DO TIPO
  const getTipoInfo = (tipo: string | undefined) => {
    if (tipo === "CONSOLIDADO") {
      return { nome: "Consolidado", cor: "green", uso: "Faturamento padrão (dia 26)", arquivo: "5501txtp.txt", icon: "📊" };
    }
    if (tipo === "PREVIA_CORRENTE" || tipo === "PREVIA_ANTERIOR") {
      return { nome: "Prévia", cor: "blue", uso: "Faturamento extemporâneo (dia 16)", arquivo: "5501tmpp.txt", icon: "📋" };
    }
    return { nome: "Desconhecido", cor: "gray", uso: "-", arquivo: "-", icon: "❓" };
  };

  /* ------------------------------ FILE HANDLERS ------------------------------ */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();

    if (!name.endsWith(".txt")) {
      setError("Por favor, selecione um arquivo .TXT válido.");
      return;
    }

    const tipo = detectarTipoArquivo(name);
    if (!tipo) {
      setError("O nome do arquivo deve seguir o padrão SPC: 5501txtp.txt ou 5501tmpp.txt");
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

    const tipo = detectarTipoArquivo(name);
    if (!tipo) {
      setError("O nome do arquivo deve seguir o padrão SPC: 5501txtp.txt ou 5501tmpp.txt");
      return;
    }

    setFile(dropped);
    setError(null);
  };

  /* ------------------------------ STATUS COLOR ------------------------------ */
  const getStatusColor = (status: string) => {
    const st = status?.toUpperCase();
    if (["PROCESSADO", "SUCESSO"].includes(st)) return "text-green-700 bg-green-100";
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
        associadosDivergentes: Array.isArray(dados.associadosDivergentes) ? dados.associadosDivergentes : [],
      });
    } catch (error) {
      console.error("Erro ao buscar verificação de associados:", error);
      showError("Erro ao buscar verificação de associados");
    }
  };

  // BUSCAR TOTAIS CORRETOS DO BACKEND (UNIFICADO)
  const buscarTotaisImportacao = async (importacaoId: string): Promise<any> => {
    try {
      const response = await api.get(`/verificacao-importacao/${importacaoId}/financeiro`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar totais da importação:", error);
      return null;
    }
  };

  const buscarVerificacaoFinanceira = async (id: string) => {
    try {
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
      
      setVerificacaoFinanceira({
        totalDebitos,
        totalCreditos,
        valorCobrado: valorCobradoTotal,
        quantidadeNotas: notas.length,
        quantidadeItens: totalItens,
        associados: associadosArray
      });
      
    } catch (error) {
      console.error("Erro ao buscar verificação financeira:", error);
      showError("Erro ao buscar verificação financeira");
    }
  };

  const buscarTodasNotas = async (importacaoId: string): Promise<any[]> => {
    let todasNotas: any[] = [];
    let paginaAtual = 0;
    let totalPaginas = 1;
    const tamanhoPagina = 100;

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
        todasNotas = [...todasNotas, ...notasPagina];
        totalPaginas = dados.totalPages || 1;
        paginaAtual++;
      }

      return todasNotas;
    } catch (error) {
      console.error("Erro ao buscar notas paginadas:", error);
      throw error;
    }
  };

  // 🔥 EXECUTAR UPLOAD APÓS CONFIRMAÇÃO
  const executarUpload = async () => {
    setShowConfirmUploadModal(false);
    
    if (!file) {
      setError("Selecione um arquivo primeiro.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await importacaoSPCService.uploadArquivo(file);
      const importacao = response.importacao || response;

      let totais = {
        totalDebitos: 0,
        totalCreditos: 0,
        valorCobrado: 0,
        quantidadeNotas: 0
      };
      
      try {
        const totaisResponse = await buscarTotaisImportacao(importacao.id);
        if (totaisResponse) {
          totais = {
            totalDebitos: totaisResponse.totalDebitos || 0,
            totalCreditos: totaisResponse.totalCreditos || 0,
            valorCobrado: totaisResponse.valorCobrado || 0,
            quantidadeNotas: totaisResponse.quantidadeNotas || 0
          };
        }
      } catch (e) {
        console.warn("Não foi possível buscar totais:", e);
      }

      const tipoInfo = getTipoInfo(importacao.tipoArquivo);
      
      const detalhes: ProcessamentoDetalhes = {
        id: importacao.id,
        status: importacao.status ?? "PROCESSADO",
        tipoArquivo: importacao.tipoArquivo,
        dataFimPeriodo: importacao.dataFimPeriodo,
        descricaoArquivo: importacao.descricaoArquivo,
        nomeArquivo: file.name,
        totalRegistros: importacao.quantidadeRegistros ?? 0,
        registrosProcessados: importacao.quantidadeRegistros ?? 0,
        registrosComErro: importacao.registrosComErro ?? 0,
        valorTotal: importacao.totalValor ?? 0,
        totalDebitos: totais.totalDebitos,
        totalCreditos: totais.totalCreditos,
        valorCobrado: totais.valorCobrado,
        quantidadeNotas: totais.quantidadeNotas,
        dataProcessamento: importacao.dataImportacao ?? new Date().toISOString(),
        mensagem: response.mensagem ?? "Arquivo processado!",
      };

      setProcessamentoDetalhes(detalhes);
      setSuccess(`Arquivo ${tipoInfo.nome} importado com sucesso!`);
      showSuccess(`Arquivo ${tipoInfo.nome} importado com sucesso!`);

      if (detalhes.id) {
        const idStr = String(detalhes.id);
        buscarVerificacaoAssociados(idStr);
        buscarVerificacaoFinanceira(idStr);
      }

      setFile(null);
      const input = document.getElementById("file-upload") as HTMLInputElement;
      if (input) input.value = "";
    } catch (err: any) {
      console.error("Erro no upload:", err);
      const msg = err.response?.data?.erro || err.response?.data?.mensagem || "Erro ao processar arquivo";
      setError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 DESFAZER IMPORTAÇÃO ATUAL - FECHA O MODAL PRIMEIRO
  const handleDesfazerImportacaoAtual = async () => {
    // Fecha o modal imediatamente
    setShowDesfazerModal(false);
    
    if (!processamentoDetalhes?.id) {
      showError("Nenhuma importação para desfazer");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await api.delete(`/importacao-spc/${processamentoDetalhes.id}`);
      showSuccess(`Importação ${processamentoDetalhes.nomeArquivo} desfeita com sucesso!`);
      
      setProcessamentoDetalhes(null);
      setVerificacaoAssociados(null);
      setVerificacaoFinanceira(null);
      
    } catch (error: any) {
      console.error("Erro ao desfazer importação:", error);
      showError(error.response?.data?.message || "Erro ao desfazer importação");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVerificarImportacao = (id: string | number) => {
    const num = Number(id);
    if (isNaN(num) || num <= 0) return;
    navigate(`/importacao-spc/${num}/verificacao`);
  };

  const formatarMoeda = (valor: number) => {
    if (isNaN(valor) || valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "-";
    try {
      const data = new Date(dataStr);
      return data.toLocaleDateString("pt-BR");
    } catch {
      return dataStr;
    }
  };

  const tipoAtual = processamentoDetalhes?.tipoArquivo ? getTipoInfo(processamentoDetalhes.tipoArquivo) : null;

  // Verificar se está em qualquer processo de loading
  const isAnyLoading = isLoading || isDeleting;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Importação SPC — Faturamento</h1>
        <p className="text-gray-600 mt-1">
          Envie o arquivo oficial do SPC e processe as notas para faturamento.
          O sistema identifica automaticamente se é Consolidado ou Prévia.
        </p>
      </div>

      {/* Loading Overlay durante delete - TAMANHO AJUSTADO */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-700">Removendo importação...</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA 1 — UPLOAD */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Upload */}
          <div className="bg-white shadow rounded-xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Upload do Arquivo SPC</h2>
              {file && !isAnyLoading && (
                <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:text-red-700">
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

            {/* Dropzone */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
                file ? "border-green-400 bg-green-50" : "border-gray-300 hover:bg-gray-50"
              } ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <p className="text-4xl mb-3">📄</p>
              {file ? (
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tipo: {detectarTipoArquivo(file.name) === "CONSOLIDADO" ? "Consolidado" : "Prévia"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">Arraste o arquivo aqui ou clique para selecionar</p>
              )}
              <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleFileChange} />
              <label htmlFor="file-upload" className="mt-4 inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700">
                Selecionar Arquivo
              </label>
            </div>

            {/* Botão Upload */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowConfirmUploadModal(true)}
                disabled={!file || isAnyLoading}
                className={`px-8 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-colors ${
                  !file || isAnyLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  "🚀 Iniciar Importação"
                )}
              </button>
            </div>
          </div>

          {/* Detalhes do Processamento */}
          {processamentoDetalhes && (
            <div className="bg-white shadow rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Detalhes do Processamento</h3>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(processamentoDetalhes.status || "")}`}>
                    {processamentoDetalhes.status}
                  </span>
                  <button
                    onClick={() => setShowDesfazerModal(true)}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    title="Desfazer importação"
                  >
                    {isDeleting ? "⏳" : "🗑️"} Desfazer
                  </button>
                </div>
              </div>

              {tipoAtual && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Tipo de Arquivo:</span>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${tipoAtual.cor}-100 text-${tipoAtual.cor}-800`}>
                      {tipoAtual.icon} {tipoAtual.nome}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Uso:</span> {tipoAtual.uso}
                  </div>
                  {processamentoDetalhes.dataFimPeriodo && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Data fim período:</span> {formatarData(processamentoDetalhes.dataFimPeriodo)}
                    </div>
                  )}
                  {processamentoDetalhes.descricaoArquivo && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Descrição:</span> {processamentoDetalhes.descricaoArquivo}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <StatBox label="Total Registros" value={processamentoDetalhes.totalRegistros} />
                <StatBox label="Notas" value={processamentoDetalhes.quantidadeNotas || 0} />
                <StatBox label="Processados" value={processamentoDetalhes.registrosProcessados} />
                <StatBox label="Com Erro" value={processamentoDetalhes.registrosComErro} color="text-red-600" />
                <StatBox label="Valor Total" value={formatarMoeda(processamentoDetalhes.valorTotal || 0)} />
              </div>

              {(processamentoDetalhes.totalDebitos !== undefined || processamentoDetalhes.totalCreditos !== undefined) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Total Débitos</div>
                      <div className="text-lg font-bold text-red-600">{formatarMoeda(processamentoDetalhes.totalDebitos || 0)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Total Créditos</div>
                      <div className="text-lg font-bold text-green-600">{formatarMoeda(processamentoDetalhes.totalCreditos || 0)}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Valor Cobrado</div>
                      <div className="text-lg font-bold text-blue-600">{formatarMoeda(processamentoDetalhes.valorCobrado || 0)}</div>
                    </div>
                  </div>
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

          {/* Verificação Associados */}
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
            <InfoLine label="Consolidado" value="5501txtp.txt" />
            <InfoLine label="Prévia" value="5501tmpp.txt" />
            <InfoLine label="Tamanho Máximo" value="100MB" />
            <InfoLine label="Layout" value="Oficial SPC Brasil" />
          </SideCard>

          <SideCard title="📋 Tipos de Arquivo">
            <div className="mb-3 p-2 bg-green-50 rounded">
              <p className="text-sm font-semibold text-green-800">📊 Consolidado</p>
              <p className="text-xs text-green-700">Nome: 5501txtp.txt</p>
              <p className="text-xs text-green-700">Descrição: ARQUIVO PADRAO CON</p>
              <p className="text-xs text-green-700">Uso: Faturamento padrão (dia 26)</p>
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <p className="text-sm font-semibold text-blue-800">📋 Prévia</p>
              <p className="text-xs text-blue-700">Nome: 5501tmpp.txt</p>
              <p className="text-xs text-blue-700">Descrição: ARQUIVO PADRAO FAT</p>
              <p className="text-xs text-blue-700">Uso: Faturamento extemporâneo (dia 16)</p>
            </div>
          </SideCard>

          <SideCard title="💡 Instruções">
            <ul className="text-sm text-blue-700 space-y-2">
              <li>• Exporte do sistema SPC</li>
              <li>• Nome correto: 5501txtp.txt ou 5501tmpp.txt</li>
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

      {/* MODAL DE CONFIRMAÇÃO PARA UPLOAD */}
      <ConfirmModal
        isOpen={showConfirmUploadModal}
        onClose={() => setShowConfirmUploadModal(false)}
        onConfirm={executarUpload}
        title="Confirmar Importação"
        message={`Deseja importar o arquivo "${file?.name}" para o período atual?`}
        confirmText="Sim, Importar"
        cancelText="Cancelar"
        type="warning"
      />

      {/* MODAL DE CONFIRMAÇÃO PARA DESFAZER IMPORTAÇÃO */}
      <ConfirmModal
        isOpen={showDesfazerModal}
        onClose={() => setShowDesfazerModal(false)}
        onConfirm={handleDesfazerImportacaoAtual}
        title="Confirmar Desfazer Importação"
        message={`ATENÇÃO: Isso irá REMOVER TODOS os dados da importação "${processamentoDetalhes?.nomeArquivo}". Esta ação não pode ser desfeita.`}
        confirmText="Sim, Remover Tudo"
        cancelText="Cancelar"
        type="danger"
      />
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