import ExcelJS from "exceljs";

import { ReclamacaoRow } from "@/types/reclamacoesOuvidoria";

import {
  normalizeOrText,
  normalizeResultado,
  normalizeSimNao,
  normalizeStatusPrazo,
} from "./normalize";

const SHEET_NAME_HINT = "reclama";

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

// Colunas quebradas (#REF!, fórmulas compartilhadas sem cache) aparecem em
// algumas linhas da planilha original — tratamos como célula vazia em vez
// de propagar o erro para a tela.
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
  if (value instanceof Date) return value.toISOString().slice(0, 10);
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

  return "";
}

function cellDateIso(cell: ExcelJS.Cell): string | null {
  const value = resolveFormula(cell.value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return null;
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

// Índices de coluna (1-based) conforme a planilha "Reclam_Ouvidoria CIP.xlsx",
// aba "Reclamação_MT|BT". O layout é fixo (exportação recorrente do SharePoint).
const COL = {
  nota: 2,
  concluidoPor: 3,
  status: 4,
  area: 5,
  empreiteira: 6,
  notaOv: 7,
  canalEntrada: 8,
  categoria: 9,
  observacao: 10,
  dataAbertura: 13,
  dataVencimento: 14,
  dataConclusao: 15,
  dataMedida: 16,
  tipoReclamacao: 21,
  causaRaiz: 22,
  siglaResultado: 24,
  regiao: 25,
  regional: 26,
  municipio: 27,
  instalacao: 29,
  valorMulta: 34,
  transgressao: 36,
  statusPrazo: 38,
  tempoReport: 39,
  origem: 40,
  go: 41,
} as const;

function findSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
  return (
    workbook.worksheets.find((sheet) => normalizeHeader(sheet.name).includes(SHEET_NAME_HINT)) ??
    workbook.worksheets[0]
  );
}

export interface ParsedReclamacoesWorkbook {
  rows: ReclamacaoRow[];
  sheetName: string;
}

export async function parseReclamacoesWorkbook(file: File): Promise<ParsedReclamacoesWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheet = findSheet(workbook);
  if (!sheet) {
    throw new Error(`"${file.name}" não contém nenhuma aba de dados.`);
  }

  const headerRow = sheet.getRow(1);
  const notaHeader = normalizeHeader(cellText(headerRow.getCell(COL.nota)));
  const statusHeader = normalizeHeader(cellText(headerRow.getCell(COL.status)));

  if (notaHeader !== "nota" || statusHeader !== "status") {
    throw new Error(
      `"${file.name}" não parece ser a planilha "Reclam_Ouvidoria CIP": a aba "${sheet.name}" não tem as colunas "Nota" e "Status" nas posições esperadas.`,
    );
  }

  const rows: ReclamacaoRow[] = [];

  sheet.eachRow({ includeEmpty: false }, (row, index) => {
    if (index === 1) return;

    const nota = cellText(row.getCell(COL.nota));
    if (!nota) return;

    const sigla = cellText(row.getCell(COL.siglaResultado));
    const { label: resultadoLabel, bucket: resultadoBucket } = normalizeResultado(sigla);

    rows.push({
      id: `${nota}__${index}`,
      nota,
      concluidoPor: cellText(row.getCell(COL.concluidoPor)),
      status: normalizeOrText(cellText(row.getCell(COL.status)), "Não informado"),
      area: cellText(row.getCell(COL.area)),
      empreiteira: normalizeOrText(cellText(row.getCell(COL.empreiteira)), "Não informado"),
      notaOv: cellText(row.getCell(COL.notaOv)),
      canalEntrada: normalizeOrText(cellText(row.getCell(COL.canalEntrada)), "Não informado"),
      categoria: cellText(row.getCell(COL.categoria)),
      observacao: cellText(row.getCell(COL.observacao)),
      tipoReclamacao: normalizeOrText(cellText(row.getCell(COL.tipoReclamacao)), "Não classificado"),
      causaRaiz: cellText(row.getCell(COL.causaRaiz)),
      siglaResultado: sigla,
      resultadoLabel,
      resultadoBucket,
      regiao: normalizeOrText(cellText(row.getCell(COL.regiao))),
      regional: normalizeOrText(cellText(row.getCell(COL.regional))),
      municipio: normalizeOrText(cellText(row.getCell(COL.municipio))),
      instalacao: cellText(row.getCell(COL.instalacao)),
      dataAbertura: cellDateIso(row.getCell(COL.dataAbertura)),
      dataVencimento: cellDateIso(row.getCell(COL.dataVencimento)),
      dataConclusao: cellDateIso(row.getCell(COL.dataConclusao)),
      dataMedida: cellDateIso(row.getCell(COL.dataMedida)),
      valorMulta: cellNumberOrNull(row.getCell(COL.valorMulta)),
      transgressao: normalizeSimNao(cellText(row.getCell(COL.transgressao))),
      statusPrazo: normalizeStatusPrazo(cellText(row.getCell(COL.statusPrazo))),
      tempoReport: cellNumberOrNull(row.getCell(COL.tempoReport)),
      origem: normalizeOrText(cellText(row.getCell(COL.origem)), "Não informado"),
      go: normalizeOrText(cellText(row.getCell(COL.go)), "Não informado"),
    });
  });

  if (!rows.length) {
    throw new Error(`"${file.name}" não contém linhas de reclamações na aba "${sheet.name}".`);
  }

  return { rows, sheetName: sheet.name };
}
