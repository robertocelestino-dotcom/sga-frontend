import React, { useEffect, useState } from "react";

export default function NotaModal({ notaId, onClose }) {
  const [nota, setNota] = useState(null);
  useEffect(() => {
    fetch(`/api/notas/${notaId}`).then(r => r.json()).then(setNota).catch(console.error);
  }, [notaId]);

  if (!nota) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow">Carregando...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded p-4 w-11/12 max-w-3xl">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Nota {nota.numeroNota} — {nota.codigoSocio} - {nota.nomeAssociado}</h4>
          <div className="flex gap-2">
            <a className="px-2 py-1 bg-green-600 text-white rounded" href={`/api/notas/${notaId}/export/csv`} target="_blank" rel="noreferrer">CSV</a>
            <a className="px-2 py-1 bg-indigo-600 text-white rounded" href={`/api/notas/${notaId}/export/pdf`} target="_blank" rel="noreferrer">PDF</a>
            <button onClick={onClose} className="px-2 py-1 bg-gray-200 rounded">Fechar</button>
          </div>
        </div>

        <div className="mb-2">
          <div>Total Débitos: {nota.totalDebitos?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div>Total Créditos: {nota.totalCreditos?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
          <div className="font-semibold">Valor Faturado: {nota.valorFaturado?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr><th className="p-1">#</th><th>Descrição</th><th>Qtd</th><th className="text-right">V.Unit</th><th className="text-right">V.Total</th><th>C/D</th></tr>
            </thead>
            <tbody>
              {nota.itens && nota.itens.map((it, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1">{i+1}</td>
                  <td className="p-1">{it.descricaoServico}</td>
                  <td className="p-1">{it.quantidadeServicos}</td>
                  <td className="p-1 text-right">{it.valorUnitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-1 text-right">{it.valorTotal?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="p-1 text-center">{it.creditoDebito}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
