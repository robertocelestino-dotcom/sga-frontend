// src/pages/ImportacaoSPC.tsx - VERSÃO CDL
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { importacaoSPCService } from "../services/api";
import ConfirmModal from "../components/ui/ConfirmModal";
import { useMessage } from "../providers/MessageProvider";
import EmptyState from "../components/ui/EmptyState";

// ==================== TIPOS ====================
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
  associadosDivergentes: Array<{ codigoSocio: string; nomeAssociado: string }>;
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

// ==================== COMPONENTE ====================
const ImportacaoSPC: React.FC = () => {
  const { showSuccess, showError } = useMessage();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processamentoDetalhes, setProcessamentoDetalhes] = useState<ProcessamentoDetalhes | null>(null);
  const [, setVerificacaoAssociados] = useState<VerificacaoAssociados | null>(null);
  const [, setVerificacaoFinanceira] = useState<VerificacaoFinanceira | null>(null);
  const [showDesfazerModal, setShowDesfazerModal] = useState(false);
  const [showConfirmUploadModal, setShowConfirmUploadModal] = useState(false);

  /* ---------- DETECÇÃO DE TIPO ---------- */
  const detectarTipoArquivo = (nomeArquivo: string): TipoArquivo | null => {
    const nome = nomeArquivo.toLowerCase();
    if (nome.includes("5501txtp.txt")) return "CONSOLIDADO";
    if (nome.includes("5501tmpp.txt")) return "PREVIA_CORRENTE";
    return null;
  };

  const getTipoInfo = (tipo: string | undefined) => {
    if (tipo === "CONSOLIDADO") {
      return { nome: "Consolidado", uso: "Faturamento padrão (dia 26)", arquivo: "5501txtp.txt", icon: "📊" };
    }
    if (tipo === "PREVIA_CORRENTE" || tipo === "PREVIA_ANTERIOR") {
      return { nome: "Prévia", uso: "Faturamento extemporâneo (dia 16)", arquivo: "5501tmpp.txt", icon: "📋" };
    }
    return { nome: "Desconhecido", uso: "-", arquivo: "-", icon: "❓" };
  };

  /* ---------- FILE HANDLERS ---------- */
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

  /* ---------- STATUS COLOR (CDL) ---------- */
  const getStatusColor = (status: string) => {
    const st = status?.toUpperCase();
    if (["PROCESSADO", "SUCESSO"].includes(st)) return "text-cdl-green-700 bg-cdl-green-100";
    if (["ERRO", "FALHA"].includes(st))       return "text-cdl-danger-500 bg-cdl-danger-50";
    if (["PROCESSANDO"].includes(st))         return "text-cdl-navy-700 bg-cdl-navy-100";
    return "text-cdl-neutral-500 bg-cdl-neutral-100";
  };

  /* ---------- VERIFICAÇÕES (inalterado) ---------- */
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
        const chave = `${nota.codigoSocio}-${nota.nomeAssociado}`;
        if (!associadosMap.has(chave)) {
          associadosMap.set(chave, {
            id: nota.id, codigoSocio: nota.codigoSocio, nomeAssociado: nota.nomeAssociado,
            totalDebito: 0, totalCredito: 0, valorCobrado: 0,
          });
        }
        const a = associadosMap.get(chave)!;
        a.totalDebito += debitoNota;
        a.totalCredito += creditoNota;
        a.valorCobrado = a.totalDebito - a.totalCredito;
      });

      setVerificacaoFinanceira({
        totalDebitos, totalCreditos,
        valorCobrado: totalDebitos - totalCreditos,
        quantidadeNotas: notas.length, quantidadeItens: totalItens,
        associados: Array.from(associadosMap.values()),
      });
    } catch (error) {
      console.error("Erro ao buscar verificação financeira:", error);
      showError("Erro ao buscar verificação financeira");
    }
  };

  const buscarTodasNotas = async (importacaoId: string): Promise<any[]> => {
    let todas: any[] = [];
    let pagina = 0;
    let total = 1;
    try {
      while (pagina < total) {
        const response = await api.get(`/notas-debito`, {
          params: { importacaoId, page: pagina, size: 100 },
        });
        const dados = response.data;
        todas = [...todas, ...(dados.content || [])];
        total = dados.totalPages || 1;
        pagina++;
      }
      return todas;
    } catch (error) {
      console.error("Erro ao buscar notas paginadas:", error);
      throw error;
    }
  };

  /* ---------- UPLOAD ---------- */
  const executarUpload = async () => {
    setShowConfirmUploadModal(false);
    if (!file) { setError("Selecione um arquivo primeiro."); return; }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await importacaoSPCService.uploadArquivo(file);
      const importacao = response.importacao || response;

      let totais = { totalDebitos: 0, totalCreditos: 0, valorCobrado: 0, quantidadeNotas: 0 };
      try {
        const totaisResponse = await buscarTotaisImportacao(importacao.id);
        if (totaisResponse) {
          totais = {
            totalDebitos: totaisResponse.totalDebitos || 0,
            totalCreditos: totaisResponse.totalCreditos || 0,
            valorCobrado: totaisResponse.valorCobrado || 0,
            quantidadeNotas: totaisResponse.quantidadeNotas || 0,
          };
        }
      } catch (e) {
        console.warn("Não foi possível buscar totais:", e);
      }

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
      setSuccess("Arquivo importado com sucesso!");
      showSuccess("Arquivo importado com sucesso!");

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

  const handleDesfazerImportacaoAtual = async () => {
    setShowDesfazerModal(false);
    if (!processamentoDetalhes?.id) { showError("Nenhuma importação para desfazer"); return; }
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

  /* ---------- FORMAT ---------- */
  const formatarMoeda = (valor: number) => {
    if (isNaN(valor) || valor === undefined || valor === null) return "R$ 0,00";
    return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return "-";
    try { return new Date(dataStr).toLocaleDateString("pt-BR"); }
    catch { return dataStr; }
  };

  const tipoAtual = processamentoDetalhes?.tipoArquivo ? getTipoInfo(processamentoDetalhes.tipoArquivo) : null;
  const isAnyLoading = isLoading || isDeleting;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* ===== HEADER ===== */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cdl-navy-700">Importação SPC — Faturamento</h1>
        <p className="text-gray-600 mt-1">
          Envie o arquivo oficial do SPC e processe as notas para faturamento.
          O sistema identifica automaticamente se é <strong>Consolidado</strong> ou <strong>Prévia</strong>.
        </p>
      </div>

      {/* Overlay desfazer */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center shadow-cdl-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-cdl-navy-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-cdl-navy-700 font-medium">Removendo importação…</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==================== COLUNA 1 — UPLOAD ==================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Upload */}
          <div className="bg-white shadow-cdl rounded-xl p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold text-cdl-navy-700">Upload do Arquivo SPC</h2>
              {file && !isAnyLoading && (
                <button onClick={() => setFile(null)} className="text-sm text-cdl-danger-500 hover:text-cdl-danger-600 font-medium">
                  Limpar
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 mb-4 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg text-cdl-danger-600 flex items-start gap-2">
                <span className="text-lg">⚠</span>
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 mb-4 bg-cdl-green-50 border border-cdl-green-100 rounded-lg text-cdl-green-700 flex items-start gap-2">
                <span className="text-lg">✅</span>
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Dropzone — EmptyState quando vazio, card verde quando tem arquivo */}
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("file-upload")?.click()}
                className={`border-2 border-dashed border-gray-300 hover:border-cdl-navy-400 hover:bg-cdl-navy-50
                            rounded-xl transition-colors cursor-pointer ${isAnyLoading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <EmptyState
                  icon="📄"
                  title="Arraste o arquivo aqui ou clique para selecionar"
                  description="Formato: .TXT — Consolidado (5501txtp.txt) ou Prévia (5501tmpp.txt)"
                  action={
                    <label
                      htmlFor="file-upload"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                                 hover:bg-cdl-navy-800 cursor-pointer transition-all active:scale-[.98]"
                    >
                      Selecionar Arquivo
                    </label>
                  }
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-cdl-green-400 bg-cdl-green-50 rounded-xl p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-medium text-cdl-green-700">{file.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Tipo: <strong>{detectarTipoArquivo(file.name) === "CONSOLIDADO" ? "Consolidado" : "Prévia"}</strong>
                  <span className="mx-2">•</span>
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 cursor-pointer transition-all active:scale-[.98] text-sm"
                >
                  Trocar Arquivo
                </label>
              </div>
            )}

            <input id="file-upload" type="file" accept=".txt" className="hidden" onChange={handleFileChange} />

            {/* Botão Upload */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowConfirmUploadModal(true)}
                disabled={!file || isAnyLoading}
                className={`px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-3
                            transition-all active:scale-[.98] ${
                  !file || isAnyLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-cdl-navy-700 text-white hover:bg-cdl-navy-800"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>🚀 Iniciar Importação</>
                )}
              </button>
            </div>
          </div>

          {/* ===== Detalhes do Processamento ===== */}
          {processamentoDetalhes && (
            <div className="bg-white shadow-cdl rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-cdl-navy-700">Detalhes do Processamento</h3>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(processamentoDetalhes.status || "")}`}>
                    {processamentoDetalhes.status}
                  </span>
                  <button
                    onClick={() => setShowDesfazerModal(true)}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-cdl-danger-50 text-cdl-danger-500
                               hover:bg-cdl-danger-100 disabled:opacity-50 transition-colors"
                    title="Desfazer importação"
                  >
                    {isDeleting ? "⏳" : "🗑️"} Desfazer
                  </button>
                </div>
              </div>

              {tipoAtual && (
                <div className="mb-4 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-cdl-navy-700">Tipo de Arquivo:</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white text-cdl-navy-700 border border-cdl-navy-200 font-medium">
                      {tipoAtual.icon} {tipoAtual.nome}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-medium text-cdl-navy-700">Uso:</span> {tipoAtual.uso}
                  </div>
                  {processamentoDetalhes.dataFimPeriodo && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-cdl-navy-700">Data fim período:</span>{" "}
                      {formatarData(processamentoDetalhes.dataFimPeriodo)}
                    </div>
                  )}
                  {processamentoDetalhes.descricaoArquivo && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-cdl-navy-700">Descrição:</span> {processamentoDetalhes.descricaoArquivo}
                    </div>
                  )}
                </div>
              )}

              {/* Stat boxes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatBox label="Total Registros" value={processamentoDetalhes.totalRegistros} tone="info" />
                <StatBox label="Notas"           value={processamentoDetalhes.quantidadeNotas || 0} tone="info" />
                <StatBox label="Processados"     value={processamentoDetalhes.registrosProcessados} tone="success" />
                <StatBox label="Com Erro"        value={processamentoDetalhes.registrosComErro} tone="danger" />
                <StatBox label="Valor Total"     value={formatarMoeda(processamentoDetalhes.valorTotal || 0)} tone="accent" />
              </div>

              {/* Resumo Financeiro */}
              {(processamentoDetalhes.totalDebitos !== undefined || processamentoDetalhes.totalCreditos !== undefined) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-cdl-navy-700 mb-3">📊 Resumo Financeiro</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-3 rounded-lg">
                      <div className="text-xs text-cdl-danger-500 mb-0.5">Total Débitos</div>
                      <div className="text-lg font-bold text-cdl-danger-500">
                        {formatarMoeda(processamentoDetalhes.totalDebitos || 0)}
                      </div>
                    </div>
                    <div className="bg-cdl-green-50 border border-cdl-green-100 p-3 rounded-lg">
                      <div className="text-xs text-cdl-green-600 mb-0.5">Total Créditos</div>
                      <div className="text-lg font-bold text-cdl-green-700">
                        {formatarMoeda(processamentoDetalhes.totalCreditos || 0)}
                      </div>
                    </div>
                    <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-3 rounded-lg">
                      <div className="text-xs text-cdl-navy-600 mb-0.5">Valor Cobrado</div>
                      <div className="text-lg font-bold text-cdl-navy-700">
                        {formatarMoeda(processamentoDetalhes.valorCobrado || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleVerificarImportacao(String(processamentoDetalhes.id))}
                className="w-full mt-5 bg-cdl-navy-700 text-white py-3 rounded-lg font-semibold
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]
                           flex items-center justify-center gap-2"
              >
                🔍 Verificar Importação
              </button>
            </div>
          )}
        </div>

        {/* ==================== COLUNA 2 — PAINEL LATERAL ==================== */}
        <div className="space-y-6">
          <SideCard title="📋 Especificações SPC">
            <InfoLine label="Formato"         value=".TXT" />
            <InfoLine label="Consolidado"     value="5501txtp.txt" />
            <InfoLine label="Prévia"          value="5501tmpp.txt" />
            <InfoLine label="Tamanho Máximo"  value="100MB" />
            <InfoLine label="Layout"          value="Oficial SPC Brasil" />
          </SideCard>

          <SideCard title="📋 Tipos de Arquivo">
            <div className="mb-3 p-3 bg-cdl-green-50 border border-cdl-green-100 rounded-lg">
              <p className="text-sm font-semibold text-cdl-green-700">📊 Consolidado</p>
              <p className="text-xs text-cdl-green-600 mt-1">Nome: 5501txtp.txt</p>
              <p className="text-xs text-cdl-green-600">Descrição: ARQUIVO PADRAO CON</p>
              <p className="text-xs text-cdl-green-600">Uso: Faturamento padrão (dia 26)</p>
            </div>
            <div className="p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
              <p className="text-sm font-semibold text-cdl-navy-700">📋 Prévia</p>
              <p className="text-xs text-cdl-navy-600 mt-1">Nome: 5501tmpp.txt</p>
              <p className="text-xs text-cdl-navy-600">Descrição: ARQUIVO PADRAO FAT</p>
              <p className="text-xs text-cdl-navy-600">Uso: Faturamento extemporâneo (dia 16)</p>
            </div>
          </SideCard>

          <SideCard title="💡 Instruções">
            <ul className="text-sm text-cdl-navy-600 space-y-2">
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

      {/* ===== MODAIS ===== */}
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

      <ConfirmModal
        isOpen={showDesfazerModal}
        onClose={() => setShowDesfazerModal(false)}
        onConfirm={handleDesfazerImportacaoAtual}
        title="Confirmar Desfazer Importação"
        message={`ATENÇÃO: Isso irá REMOVER TODOS os dados da importação "${processamentoDetalhes?.nomeArquivo}".\n\nEsta ação não pode ser desfeita.`}
        confirmText="Sim, Remover Tudo"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

/* ============================================================
   COMPONENTES AUXILIARES
   ============================================================ */

type StatTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const STAT_TONE: Record<StatTone, string> = {
  neutral: 'text-cdl-neutral-700',
  info:    'text-cdl-navy-700',
  success: 'text-cdl-green-700',
  warning: 'text-cdl-yellow-700',
  danger:  'text-cdl-danger-500',
  accent:  'text-cdl-yellow-700',
};

const StatBox: React.FC<{ label: string; value: any; tone?: StatTone }> = ({
  label, value, tone = 'neutral',
}) => (
  <div className="bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg p-3 text-center">
    <div className={`text-xl font-bold ${STAT_TONE[tone]}`}>
      {value !== undefined && value !== null ? value : "0"}
    </div>
    <div className="text-xs text-cdl-neutral-500 mt-0.5">{label}</div>
  </div>
);

const SideCard: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
  <div className="bg-white shadow-cdl rounded-xl p-6">
    <h3 className="text-lg font-semibold text-cdl-navy-700 mb-3">{title}</h3>
    {children}
  </div>
);

const InfoLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-sm text-gray-700 mb-1">
    <span className="font-medium text-cdl-navy-700">{label}:</span>
    <span className="text-right">{value}</span>
  </div>
);

const StatusDot: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center space-x-2 text-sm text-cdl-navy-600 mb-1.5">
    <span className="w-2 h-2 bg-cdl-green-500 rounded-full animate-pulse" />
    <span>{label}</span>
  </div>
);

export default ImportacaoSPC;