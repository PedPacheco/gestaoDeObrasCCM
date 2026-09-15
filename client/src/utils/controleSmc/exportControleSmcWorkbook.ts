import ExcelJS from "exceljs";

import { NucleoSmcRow } from "@/types/controleSmc";

import { CONTROLE_SMC_COLUMNS, SHEET_NAME } from "./columns";

function parseBrDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function exportControleSmcWorkbook(
  rows: NucleoSmcRow[],
  fileName = `Controle SMC - COMPET (${new Date().toISOString().slice(0, 10)}).xlsx`,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  const headerRow = sheet.addRow(CONTROLE_SMC_COLUMNS.map((column) => column.header));
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E2F42" },
  };

  rows.forEach((row) => {
    const values = CONTROLE_SMC_COLUMNS.map((column) => {
      const raw = row[column.key];

      if (column.type === "percent") {
        return typeof raw === "number" ? raw / 100 : null;
      }
      if (column.type === "number") {
        return typeof raw === "number" ? raw : null;
      }
      if (column.type === "date") {
        const text = typeof raw === "string" ? raw : "";
        return parseBrDate(text) ?? text;
      }
      return raw ?? "";
    });

    const excelRow = sheet.addRow(values);

    CONTROLE_SMC_COLUMNS.forEach((column, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      if (column.type === "percent") cell.numFmt = "0%";
      if (column.type === "date" && cell.value instanceof Date) cell.numFmt = "dd/mm/yyyy";
    });
  });

  CONTROLE_SMC_COLUMNS.forEach((column, idx) => {
    sheet.getColumn(idx + 1).width = Math.max(12, Math.round(column.width / 7));
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
