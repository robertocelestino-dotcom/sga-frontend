// src/components/NotasGrid.jsx - VERSÃO CDL

import React, { useEffect, useState } from "react";
import NotaModal from "./NotaModal";

export default function NotasGrid({ importacaoId }) {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [filtro, setFiltro] = useState("");
  const [notas, setNotas] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNota, setSelectedNota] = useState(null);

  useEffect(() => {
    if (!importacaoId) return;
    load();
    // eslint-disable-next-line
  }, [importacaoId, page, filtro]);

  function load() {
    setLoading(true);
    const q = new URLSearchParams({ page, size, filtro }).toString();
    fetch(`/api/notas/importacao/${importacaoId}?${q}`)
      .then((r) => r.json())
      .then((data) => {
        setNotas(data.content ? data.content : data);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }

  function exportCsv(notaId) {
    window.open(`/api/notas/${notaId}/export/csv`, "_blank");
  }

  function exportPdf(notaId) {
    window.open(`/api/notas/${notaId}/export/pdf`, "_blank");
  }

  const formatarMoeda = (v) =>
    (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-cdl-navy-50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-cdl-navy-700 flex items-center gap-2">
            📋 Notas da Importação <span className="font-mono">#{importacaoId}</span>
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Filtrar, visualizar e exportar notas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtro (nota, código, nome)"
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm
                focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            />
          </div>
          <button
            onClick={() => {
              setPage(0);
              load();
            }}
            className="px-3 py-2 bg-cdl-navy-700 text-white rounded-md text-sm font-medium
              hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
          >
            🔍 Aplicar
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
            <span className="text-sm font-medium text-cdl-navy-700">Carregando notas...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cdl-navy-50">
                <tr>
                  {["ID", "Número", "Código", "Nome", "Total Débitos", "Total Créditos", "Valor Faturado", "Ações"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider
                        ${["Total Débitos", "Total Créditos", "Valor Faturado"].includes(h) ? "text-right" : ""}
                        ${h === "Ações" ? "text-center" : ""}
                        ${["ID", "Número", "Código", "Nome"].includes(h) ? "text-left" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notas && notas.length > 0 ? (
                  notas.map((n) => (
                    <tr key={n.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{n.id}</td>
                      <td className="px-4 py-3 text-gray-900 font-mono text-xs">{n.numeroNota}</td>
                      <td className="px-4 py-3 text-gray-900 font-mono text-xs">{n.codigoSocio}</td>
                      <td className="px-4 py-3 text-gray-900">{n.nomeAssociado}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatarMoeda(n.totalDebitos)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatarMoeda(n.totalCreditos)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-cdl-navy-800">
                        {formatarMoeda(n.valorFaturado)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          <button
                            onClick={() => setSelectedNota(n.id)}
                            className="p-1.5 text-cdl-navy-700 hover:bg-cdl-navy-50 rounded transition-colors"
                            title="Visualizar"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => exportCsv(n.id)}
                            className="p-1.5 text-cdl-green-700 hover:bg-cdl-green-50 rounded transition-colors"
                            title="Exportar CSV"
                          >
                            📊
                          </button>
                          <button
                            onClick={() => exportPdf(n.id)}
                            className="p-1.5 text-cdl-navy-600 hover:bg-cdl-navy-50 rounded transition-colors"
                            title="Exportar PDF"
                          >
                            📄
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-gray-500">Nenhuma nota encontrada.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="px-4 py-3 border-t border-gray-200 bg-cdl-neutral-50 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página <span className="font-medium">{page + 1}</span> de{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700
                  hover:bg-white hover:border-cdl-navy-300 disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700
                  hover:bg-white hover:border-cdl-navy-300 disabled:opacity-50
                  disabled:cursor-not-allowed transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}

      {selectedNota && (
        <NotaModal notaId={selectedNota} onClose={() => setSelectedNota(null)} />
      )}
    </div>
  );
}