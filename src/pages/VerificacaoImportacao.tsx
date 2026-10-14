// src/pages/VerificacaoImportacao.tsx - VERSÃO CDL
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { importacaoSPCService, errorHandler } from "../services/api";
import BreadCrumb from "../components/BreadCrumb";
import EmptyState from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";

import ResumoGeral from "../components/importacao/ResumoGeral";
import AssociadosDivergentes from "../components/importacao/AssociadosDivergentes";
import NotasSomenteArquivo from "../components/importacao/NotasSomenteArquivo";
import NotasSomenteBanco from "../components/importacao/NotasSomenteBanco";

/* ============================================================
   TIPOS (locais, sem alterar contrato da API)
   ============================================================ */
interface DadosVerificacao {
  resumoGeral: any[];
  associadosDivergentes: any[];
  notasSomenteArquivo: any[];
  notasSomenteBanco: any[];
}

/* ============================================================
   COMPONENTE
   ============================================================ */
export default function VerificacaoImportacao() {
  const { importacaoId } = useParams();
  const navigate = useNavigate();

  const id = importacaoId ? Number(importacaoId) : NaN;

  const [dados, setDados] = useState<DadosVerificacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarTudo() {
    if (!importacaoId || isNaN(id)) {
      console.error("❌ ID inválido:", importacaoId);
      setErro("ID inválido na rota.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resposta = await importacaoSPCService.verificarImportacao(id);
      const normalizado: DadosVerificacao = {
        resumoGeral: resposta.resumoGeral ?? [],
        associadosDivergentes: resposta.associadosDivergentes ?? [],
        notasSomenteArquivo: resposta.notasSomenteArquivo ?? [],
        notasSomenteBanco: resposta.notasSomenteBanco ?? [],
      };
      setDados(normalizado);
    } catch (e) {
      console.error("❌ Erro ao carregar:", e);
      setErro(errorHandler.getErrorMessage(e));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importacaoId]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <BreadCrumb
        items={[
          { label: "Importação SPC", path: "/importacao-spc" },
          { label: "Verificação" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Verificação da Importação</h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada da importação
            {importacaoId && (
              <>
                {" "}
                <span className="font-mono text-cdl-navy-700 bg-cdl-navy-50 px-2 py-0.5 rounded">
                  #{importacaoId}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate("/importacao-spc")}
          className="px-4 py-2 border border-cdl-navy-200 text-cdl-navy-700 bg-white
                     rounded-lg hover:bg-cdl-navy-50 transition-colors flex items-center gap-2
                     font-medium shrink-0"
        >
          ← Voltar
        </button>
      </div>

      {/* ============ ESTADOS ============ */}

      {/* Loading — Skeleton estruturado */}
      {carregando && (
        <div className="space-y-6">
          {/* Card Resumo Geral */}
          <div className="bg-white rounded-xl shadow-cdl p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>

          {/* Cards inferiores (3 blocos de tabela) */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-cdl p-6">
              <Skeleton className="h-5 w-64 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, r) => (
                  <Skeleton key={r} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {!carregando && erro && (
        <div className="bg-white rounded-xl shadow-cdl p-6">
          <EmptyState
            icon="⚠️"
            title="Não foi possível carregar a verificação"
            description={erro}
            action={
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={carregarTudo}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  🔄 Tentar novamente
                </button>
                <button
                  onClick={() => navigate("/importacao-spc")}
                  className="px-5 py-2.5 border border-cdl-navy-200 text-cdl-navy-700 bg-white
                             rounded-lg font-medium hover:bg-cdl-navy-50 transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            }
          />
        </div>
      )}

      {/* Sem dados */}
      {!carregando && !erro && !dados && (
        <div className="bg-white rounded-xl shadow-cdl p-6">
          <EmptyState
            icon="📭"
            title="Nenhuma informação encontrada"
            description="Não há dados de verificação para esta importação."
            action={
              <button
                onClick={() => navigate("/importacao-spc")}
                className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                           hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
              >
                ← Voltar para Importação SPC
              </button>
            }
          />
        </div>
      )}

      {/* Conteúdo — sub-componentes */}
      {!carregando && !erro && dados && (
        <div className="space-y-6">
          <ResumoGeral dados={dados.resumoGeral} />
          <AssociadosDivergentes dados={dados.associadosDivergentes} />
          <NotasSomenteArquivo dados={dados.notasSomenteArquivo} />
          <NotasSomenteBanco dados={dados.notasSomenteBanco} />
        </div>
      )}
    </div>
  );
}