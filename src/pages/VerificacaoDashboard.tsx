import { useEffect, useState } from "react";
import {
  fetchVerificacao,
  getImportacoesLista,
  exportResumoCSV,
  exportResumoPDF,
  listarNotas,
  visualizarNotaPDF,
} from "../services/api";

import BreadCrumb from "../components/BreadCrumb";
import Loading from "../components/Loading";

export default function VerificacaoDashboardPage() {
  // --------------------------------------------------------------------------
  // Estados principais
  // --------------------------------------------------------------------------
  const [listaImportacoes, setListaImportacoes] = useState<any[]>([]);
  const [importacaoSelecionada, setImportacaoSelecionada] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [resumo, setResumo] = useState<any[]>([]);

  // --------------------------------------------------------------------------
  // Estados do GRID DE NOTAS
  // --------------------------------------------------------------------------
  const [notas, setNotas] = useState<any>({ content: [], totalElements: 0 });
  const [page, setPage] = useState(0);
  const [filtro, setFiltro] = useState("");

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
  // Carrega verificação + notas ao trocar importação
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (importacaoSelecionada) {
      carregarVerificacao();
      carregarNotas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const data = await listarNotas(importacaoSelecionada, page, 10, filtro);
      setNotas(data);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
  }

  useEffect(() => {
    carregarNotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filtro]);

  // --------------------------------------------------------------------------
  // Exportações
  // --------------------------------------------------------------------------
  function exportarCSV() {
    if (importacaoSelecionada) exportResumoCSV(importacaoSelecionada);
  }

  function exportarPDF() {
    if (importacaoSelecionada) exportResumoPDF(importacaoSelecionada);
  }

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
          onChange={(e) => setImportacaoSelecionada(Number(e.target.value))}
        >
          {listaImportacoes.map((imp) => (
            <option key={imp.id} value={imp.id}>
              #{imp.id} — {imp.dataImportacao?.substring(0, 10)}
            </option>
          ))}
        </select>
      </div>

      <h1 className="text-xl font-bold mb-3">
        Painel de Verificação — Importação #{importacaoSelecionada}
      </h1>

      {/* Botões */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={exportarCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          Exportar CSV
        </button>

        <button
          onClick={exportarPDF}
          className="px-4 py-2 bg-red-600 text-white rounded shadow"
        >
          Exportar PDF
        </button>
      </div>

      {/* ================= RESUMO ================= */}
      {resumo.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="w-full border text-sm bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Categoria</th>
                <th className="p-2 border">Qtd Arquivo</th>
                <th className="p-2 border">Qtd Banco</th>
                <th className="p-2 border">Diferença</th>
                <th className="p-2 border">Valor Arquivo</th>
                <th className="p-2 border">Valor Banco</th>
                <th className="p-2 border">Dif. Valor</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((cat, idx) => (
                <tr key={idx}>
                  <td className="p-2 border font-medium">{cat.categoria}</td>
                  <td className="p-2 border text-right">{cat.quantidadeArquivo}</td>
                  <td className="p-2 border text-right">{cat.quantidadeBanco}</td>
                  <td className="p-2 border text-right">{cat.diferenca}</td>
                  <td className="p-2 border text-right">{cat.valorArquivo}</td>
                  <td className="p-2 border text-right">{cat.valorBanco}</td>
                  <td className="p-2 border text-right">{cat.diferencaValor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= GRID DE NOTAS ================= */}
      <div className="mt-10">
        <h2 className="font-semibold text-lg mb-2">Notas Faturadas</h2>

        <input
          className="mb-3 px-3 py-2 border rounded w-64"
          placeholder="Filtrar por código, nome ou documento"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
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
                <tr key={n.id}>
                  <td className="p-2 border">{n.codigoSocio}</td>
                  <td className="p-2 border">{n.nomeAssociado}</td>
                  <td className="p-2 border text-right">{n.totalDebitos}</td>
                  <td className="p-2 border text-right">{n.totalCreditos}</td>
                  <td className="p-2 border text-right font-semibold">{n.valorFaturado}</td>
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => visualizarNotaPDF(n.id)}
                      className="px-2 py-1 text-xs bg-indigo-600 text-white rounded"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
