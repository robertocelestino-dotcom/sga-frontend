import React, { useState } from "react";
import { exportCSV, exportExcel } from "../../utils/exportUtils";

interface Props {
  dados: any[];
}

const AssociadosDivergentes: React.FC<Props> = ({ dados }) => {
  const [page, setPage] = useState(1);
  const porPagina = 20;

  const totalPaginas = Math.ceil(dados.length / porPagina);

  const lista = dados.slice((page - 1) * porPagina, page * porPagina);

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        ⚠ Associados com Divergências ({dados.length})
      </h2>

      {/* Botões */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => exportCSV("associados_divergentes", dados)}
          className="px-3 py-2 bg-gray-700 text-white rounded"
        >
          📥 Exportar CSV
        </button>

        <button
          onClick={() => exportExcel("associados_divergentes", dados)}
          className="px-3 py-2 bg-green-600 text-white rounded"
        >
          📗 Exportar Excel
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th>Nº Nota</th>
              <th>Código</th>
              <th>Nome (Arquivo)</th>
              <th>Nome (Banco)</th>
              <th>Valor Arq</th>
              <th>Valor Bco</th>
              <th>Itens Arq</th>
              <th>Itens Bco</th>
              <th>Itens Faltantes</th>
              <th>Itens Extras</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((a: any) => (
              <tr key={a.numeroNota} className="border-b">
                <td>{a.numeroNota}</td>
                <td>{a.codigoSocio}</td>
                <td>{a.nomeArquivo}</td>
                <td>{a.nomeBanco}</td>
                <td>R$ {a.valorArquivo}</td>
                <td>R$ {a.valorBanco}</td>
                <td>{a.itensArquivo}</td>
                <td>{a.itensBanco}</td>
                <td>{a.itensFaltantes?.join(", ")}</td>
                <td>{a.itensExtras?.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-40"
        >
          ◀
        </button>

        <div>Página {page} de {totalPaginas}</div>

        <button
          disabled={page === totalPaginas}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-40"
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default AssociadosDivergentes;
