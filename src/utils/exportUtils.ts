// src/utils/exportUtils.ts

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ============================================================
   📤 GERAR NOME DE ARQUIVO PADRONIZADO
   ============================================================ */

/**
 * Gera nome de arquivo padronizado para exportação RM
 * Formato: exportacao_rm_faturas_YYYY-MM-DD_HH-MM-SS.txt
 */
export function gerarNomeArquivoRm(): string {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10); // YYYY-MM-DD
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH:MM:SS -> HH-MM-SS
  return `exportacao_rm_faturas_${data}_${hora}.txt`;
}

/**
 * Gera nome de arquivo para listagem Excel
 * @param tipo - 'analitico' ou 'sintetico'
 * Formato: analitico_itens_YYYY-MM-DD_HH-MM-SS.xlsx
 */
export function gerarNomeArquivoExcel(tipo: 'analitico' | 'sintetico'): string {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10); // YYYY-MM-DD
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH:MM:SS -> HH-MM-SS
  return `${tipo}_itens_${data}_${hora}.xlsx`;
}

/* ============================================================
   📤 EXPORTAR CSV
   ============================================================ */
export function exportCSV(nome: string, dados: any[]) {
  if (!dados || dados.length === 0) return;

  const header = Object.keys(dados[0]).join(";");
  const rows = dados
    .map((obj) =>
      Object.values(obj)
        .map((v) => (v !== null && v !== undefined ? v : ""))
        .join(";")
    )
    .join("\n");

  const csv = header + "\n" + rows;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, nome);
}

/* ============================================================
   📤 EXPORTAR XLSX
   ============================================================ */
export function exportXLSX(nome: string, dados: any[]) {
  if (!dados || dados.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, nome);
}

/* ============================================================
   📤 EXPORTAR JSON
   ============================================================ */
export function exportJson(nome: string, dados: any) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json;charset=utf-8",
  });

  saveAs(blob, `${nome}.json`);
}

/**
 * Prepara dados para exportação, formatando datas sem timezone
 */
  export function prepararDadosParaExportacao(dados: any[], camposData: string[]): any[] {
  return dados.map(item => {
    const novoItem = { ...item };
    camposData.forEach(campo => {
      if (novoItem[campo]) {
        novoItem[campo] = formatDateWithoutTimezone(novoItem[campo]);
      }
    });
    return novoItem;
  });
}

/* ============================================================
   📤 ALIAS PARA COMPATIBILIDADE (exportExcel)
   ============================================================ */
export const exportExcel = exportXLSX;