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
      .then(r => r.json())
      .then(data => {
        setNotas(data.content ? data.content : data); // Page object or list
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }

  function visualizar(notaId) {
    setSelectedNota(notaId);
  }

  function exportCsv(notaId) {
    window.open(`/api/notas/${notaId}/export/csv`, "_blank");
  }

  function exportPdf(notaId) {
    window.open(`/api/notas/${notaId}/export/pdf`, "_blank");
  }

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold">Notas (Importação #{importacaoId})</h3>
          <div className="text-sm text-gray-500">Filtrar / visualizar / exportar</div>
        </div>
        <div className="flex items-center gap-2">
          <input value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtro (nota, código, nome)" className="px-2 py-1 border rounded" />
          <button onClick={() => { setPage(0); load(); }} className="px-3 py-1 bg-blue-600 text-white rounded">Aplicar</button>
        </div>
      </div>

      {loading ? <div>Carregando...</div> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Id Nota</th>
                  <th className="p-2 text-left">Número</th>
                  <th className="p-2 text-left">Código</th>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-right">Total Débitos</th>
                  <th className="p-2 text-right">Total Créditos</th>
                  <th className="p-2 text-right">Valor Faturado</th>
                  <th className="p-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {notas && notas.length>0 ? notas.map(n => (
                  <tr key={n.id} className="border-b">
                    <td className="p-2">{n.id}</td>
                    <td className="p-2">{n.numeroNota}</td>
                    <td className="p-2">{n.codigoSocio}</td>
                    <td className="p-2">{n.nomeAssociado}</td>
                    <td className="p-2 text-right">{(n.totalDebitos || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2 text-right">{(n.totalCreditos || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2 text-right font-semibold">{(n.valorFaturado || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2 text-center">
                      <button onClick={() => visualizar(n.id)} className="px-2 py-1 bg-gray-200 rounded mr-2">Visualizar</button>
                      <button onClick={() => exportCsv(n.id)} className="px-2 py-1 bg-green-600 text-white rounded mr-2">CSV</button>
                      <button onClick={() => exportPdf(n.id)} className="px-2 py-1 bg-indigo-600 text-white rounded">PDF</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={8} className="p-4 text-center text-gray-500">Nenhuma nota encontrada.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">Página {page+1} de {totalPages}</div>
            <div className="flex gap-2">
              <button disabled={page <= 0} onClick={() => setPage(p => Math.max(0, p-1))} className="px-2 py-1 border rounded">Anterior</button>
              <button disabled={page+1 >= totalPages} onClick={() => setPage(p => p+1)} className="px-2 py-1 border rounded">Próxima</button>
            </div>
          </div>
        </>
      )}

      {selectedNota && <NotaModal notaId={selectedNota} onClose={() => setSelectedNota(null)} />}
    </div>
  );
}
