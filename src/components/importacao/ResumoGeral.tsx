import React from "react";

export default function ResumoGeral({ dados }) {
  if (!dados || dados.length === 0) {
    return <p>⚠ Nenhuma informação no resumo geral.</p>;
  }

  return (
    <div style={{ marginBottom: 25 }}>
      <h2>📌 Resumo Geral</h2>

      <table className="tabela-simples">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Qtd. Arquivo</th>
            <th>Qtd. Banco</th>
            <th>Diferença</th>
            <th>Valor Arquivo</th>
            <th>Valor Banco</th>
            <th>Diferença Valor</th>
          </tr>
        </thead>

        <tbody>
          {dados.map((item, index) => {
            const difQtd = item.diferenca ?? (item.quantidadeArquivo - item.quantidadeBanco);
            const difVal = item.diferencaValor ?? (item.valorArquivo - item.valorBanco);

            const temDivergencia = difQtd !== 0 || difVal !== 0;

            return (
              <tr key={index} style={{ color: temDivergencia ? "red" : "inherit" }}>
                <td>{item.categoria}</td>
                <td>{item.quantidadeArquivo}</td>
                <td>{item.quantidadeBanco}</td>
                <td><b>{difQtd}</b></td>
                <td>R$ {item.valorArquivo?.toFixed(2)}</td>
                <td>R$ {item.valorBanco?.toFixed(2)}</td>
                <td><b>R$ {difVal?.toFixed(2)}</b></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
