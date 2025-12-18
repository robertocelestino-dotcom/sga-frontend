import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

/* ============================================================
   📤 ALIAS PARA COMPATIBILIDADE (exportExcel)
   ============================================================ */
export const exportExcel = exportXLSX;