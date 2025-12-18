import React from "react";
import { exportCSV } from "../../utils/exportUtils";

export default function NotasSomenteArquivo({ dados }) {

  if (!dados || dados.length === 0) {
    return <p>✔ Nenhuma nota exclusiva do arquivo.</p>;
  }

  return (
    <div style={{ marginTop: 25 }}>
      <h2>📄 Notas Somente no Arquivo ({dados.length})</h2>

      <button onClick={() => exportCSV(dados, "notas_somente_arquivo.csv")}>
        ⬇ Exportar CSV
      </button>

      <table className="tabela-simples">
        <thead>
          <tr>
            <th>Número Nota</th>
            <th>Valor</th>
            <th>CPF/CNPJ</th>
          </tr>
        </thead>

        <tbody>
          {dados.map((n, i) => (
            <tr key={i}>
              <td>{n.numeroNota}</td>
              <td>R$ {n.valor?.toFixed(2)}</td>
              <td>{n.documento}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
