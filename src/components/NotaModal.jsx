// src/components/NotaModal.jsx - VERSÃO CDL

import React, { useEffect, useState } from "react";

export default function NotaModal({ notaId, onClose }) {
  const [nota, setNota] = useState(null);

  useEffect(() => {
    fetch(`/api/notas/${notaId}`)
      .then((r) => r.json())
      .then(setNota)
      .catch(console.error);
  }, [notaId]);

  const formatarMoeda = (v) =>
    (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (!nota) {
    return (
      <div className="fixed inset-0 bg-cdl-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-cdl flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
          <span className="text-sm font-medium text-cdl-navy-700">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-cdl-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-cdl w-11/12 max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-cdl-navy-50 flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-cdl-navy-700">
              📄 Nota {nota.numeroNota}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              <span className="font-mono">{nota.codigoSocio}</span> — {nota.nomeAssociado}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/notas/${notaId}/export/csv`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-cdl-green-50 text-cdl-green-700 border border-cdl-green-100
                rounded-md text-xs font-medium hover:bg-cdl-green-100 transition-colors"
            >
              📊 CSV
            </a>
            <a
              href={`/api/notas/${notaId}/export/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                rounded-md text-xs font-medium hover:bg-cdl-navy-100 transition-colors"
            >
              📄 PDF
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-gray-400 hover:text-cdl-navy-700 hover:bg-cdl-navy-100 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Totais */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-cdl-neutral-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Débitos</p>
              <p className="text-sm font-semibold text-gray-900">{formatarMoeda(nota.totalDebitos)}</p>
            </div>
            <div className="bg-cdl-neutral-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Créditos</p>
              <p className="text-sm font-semibold text-gray-900">{formatarMoeda(nota.totalCreditos)}</p>
            </div>
            <div className="bg-cdl-navy-50 p-3 rounded-lg border border-cdl-navy-100">
              <p className="text-xs text-cdl-navy-600 uppercase tracking-wide mb-1">Valor Faturado</p>
              <p className="text-sm font-bold text-cdl-navy-800">{formatarMoeda(nota.valorFaturado)}</p>
            </div>
          </div>

          {/* Itens */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-cdl-navy-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">#</th>
                    <th className="p-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">Descrição</th>
                    <th className="p-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">Qtd</th>
                    <th className="p-2 text-right text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">V. Unit</th>
                    <th className="p-2 text-right text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">V. Total</th>
                    <th className="p-2 text-center text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">C/D</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nota.itens && nota.itens.length > 0 ? (
                    nota.itens.map((it, i) => (
                      <tr key={i} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="p-2 text-gray-500">{i + 1}</td>
                        <td className="p-2 text-gray-900">{it.descricaoServico}</td>
                        <td className="p-2 text-center text-gray-700">{it.quantidadeServicos}</td>
                        <td className="p-2 text-right text-gray-700">{formatarMoeda(it.valorUnitario)}</td>
                        <td className="p-2 text-right font-medium text-gray-900">
                          {formatarMoeda(it.valorTotal)}
                        </td>
                        <td className="p-2 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              it.creditoDebito === "D"
                                ? "bg-cdl-danger-50 text-cdl-danger-600"
                                : "bg-cdl-green-50 text-cdl-green-700"
                            }`}
                          >
                            {it.creditoDebito === "D" ? "Débito" : "Crédito"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        <div className="text-3xl mb-2">📭</div>
                        Nenhum item encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-cdl-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg font-medium
              hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}