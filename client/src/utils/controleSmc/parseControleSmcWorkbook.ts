import ExcelJS from "exceljs";

import { NucleoSmcRow } from "@/types/controleSmc";

import { CONTROLE_SMC_COLUMNS, SHEET_NAME } from "./columns";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

// Fórmulas quebradas (#VALUE!, #N/A) aparecem em algumas colunas de CHI da
// planilha original — tratamos como célula vazia em vez de propagar o erro.
function resolveFormula(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object" && "result" in (value as object)) {
    const result = (value as { result: unknown }).result;
    if (result && typeof result === "object" && "error" in (result as object)) {
      return null;
    }
    return result;
  }
  return value;
}

function cellText(cell: ExcelJS.Cell): string {
  const value = resolveFormula(cell.value);
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string") return value.trim();

  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.richText)) {
    return (obj.richText as { text: string }[])
      .map((part) => part.text)
      .join("")
      .trim();
  }
  if (typeof obj.text === "string") return obj.text.trim();

  return String(value).trim();
}

function cellNumberOrNull(cell: ExcelJS.Cell): number | null {
  const value = resolveFormula(cell.value);
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.includes(",")
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Na planilha, "%" é formato de exibição sobre uma fração (0-1). O
// dashboard trabalha com 0-100, então convertemos quando o formato indica
// percentual — assim o valor exportado de volta bate com o original.
function cellPercentOrNull(cell: ExcelJS.Cell): number | null {
  const raw = cellNumberOrNull(cell);
  if (raw === null) return null;
  const isPercentFormat = typeof cell.numFmt === "string" && cell.numFmt.includes("%");
  const pct = isPercentFormat ? raw * 100 : raw;
  return Math.round(pct * 10) / 10;
}

function cellDateOrText(cell: ExcelJS.Cell): string {
  const value = resolveFormula(cell.value);
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  return cellText(cell);
}

function findSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return (
    workbook.getWorksheet(SHEET_NAME) ??
    workbook.worksheets.find((sheet) => normalize(sheet.name).includes(normalize(SHEET_NAME))) ??
    workbook.worksheets[0]
  );
}

export interface ParsedControleSmcWorkbook {
  rows: NucleoSmcRow[];
  sheetName: string;
}

export async function parseControleSmcWorkbook(
  file: File,
): Promise<ParsedControleSmcWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = findSheet(workbook);
  if (!sheet) {
    throw new Error(`"${file.name}" não contém nenhuma aba de dados.`);
  }

  const headerRow = sheet.getRow(1);
  const regionalHeader = normalize(cellText(headerRow.getCell(1)));
  const nucleoHeader = normalize(cellText(headerRow.getCell(3)));

  if (regionalHeader !== "regional" || nucleoHeader !== "nucleo") {
    throw new Error(
      `"${file.name}" não parece ser a planilha "Controle SMC - COMPET": a aba "${sheet.name}" não tem as colunas "Regional" e "Núcleo" nas posições esperadas.`,
    );
  }

  const rows: NucleoSmcRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, index) => {
    if (index === 1) return;

    const nucleo = cellText(row.getCell(3));
    if (!nucleo) return;

    const record = { id: `${nucleo}__${index}` } as NucleoSmcRow;

    CONTROLE_SMC_COLUMNS.forEach((column, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      if (column.type === "number") {
        (record as any)[column.key] = cellNumberOrNull(cell);
      } else if (column.type === "percent") {
        (record as any)[column.key] = cellPercentOrNull(cell);
      } else if (column.type === "date") {
        (record as any)[column.key] = cellDateOrText(cell);
      } else {
        (record as any)[column.key] = cellText(cell);
      }
    });

    rows.push(record);
  });

  if (!rows.length) {
    throw new Error(
      `"${file.name}" não contém linhas de núcleos na aba "${sheet.name}".`,
    );
  }

  return { rows, sheetName: sheet.name };
}
