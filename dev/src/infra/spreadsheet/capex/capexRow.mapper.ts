/**
 * Normalização e validação de uma linha da planilha CN52N.
 *
 * Arquivo SEM dependências do Nest nem de imports "src/...": é executado
 * dentro de um worker_thread, onde o alias de paths não existe.
 */

export interface CapexRowValues {
  diagrama_rede: string | null;
  def_proj: string | null;
  material: string | null;
  texto_breve: string | null;
  centro: string | null;
  dep: string | null;
  cti: string | null;
  elemento_pep: string | null;
  und: string | null;
  preco: number | null;
  qtd_necessaria: number | null;
  qtd_retirada: number | null;
  qtd_recebida: number | null;
  qtd_falta: number | null;
  reserva: string | null;
}

export interface CapexRowError {
  row: number;
  column: string;
  message: string;
}

interface ColumnDef {
  key: keyof CapexRowValues;
  /** Índice da coluna no exceljs (base 1: A = 1). */
  index: number;
  kind: 'string' | 'number';
  /** Limite do VarChar da coluna em cn52n. */
  maxLength?: number;
}

/** Linhas de cabeçalho ignoradas em cada planilha. */
export const CAPEX_HEADER_ROWS = 2;

export const CAPEX_COLUMNS: readonly ColumnDef[] = [
  { key: 'diagrama_rede', index: 2, kind: 'string', maxLength: 20 },
  { key: 'def_proj', index: 3, kind: 'string', maxLength: 20 },
  { key: 'material', index: 4, kind: 'string', maxLength: 8 },
  { key: 'texto_breve', index: 5, kind: 'string', maxLength: 100 },
  { key: 'centro', index: 6, kind: 'string', maxLength: 4 },
  { key: 'dep', index: 7, kind: 'string', maxLength: 4 },
  { key: 'cti', index: 8, kind: 'string', maxLength: 2 },
  { key: 'elemento_pep', index: 9, kind: 'string', maxLength: 20 },
  { key: 'und', index: 10, kind: 'string', maxLength: 10 },
  { key: 'preco', index: 11, kind: 'number' },
  { key: 'qtd_necessaria', index: 12, kind: 'number' },
  { key: 'qtd_retirada', index: 13, kind: 'number' },
  { key: 'qtd_recebida', index: 14, kind: 'number' },
  { key: 'qtd_falta', index: 15, kind: 'number' },
  { key: 'reserva', index: 17, kind: 'string', maxLength: 5 },
];

export function columnLetter(index: number): string {
  let n = index;
  let letters = '';
  while (n > 0) {
    const rest = (n - 1) % 26;
    letters = String.fromCharCode(65 + rest) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

class CellError extends Error {}

/** Resolve fórmulas, rich text e hyperlinks do exceljs para o valor simples. */
function unwrapCell(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;

  if (typeof value === 'object') {
    const cell = value as Record<string, unknown>;

    // Não devia acontecer após resolveSharedStrings; protege contra regressões
    if ('sharedString' in cell) {
      throw new CellError(
        `texto não resolvido (índice ${String(cell.sharedString)})`,
      );
    }
    if ('error' in cell) {
      throw new CellError(`célula com erro (${String(cell.error)})`);
    }
    if ('result' in cell) return unwrapCell(cell.result);
    if (Array.isArray(cell.richText)) {
      return (cell.richText as { text?: string }[])
        .map((part) => part.text ?? '')
        .join('');
    }
    if ('text' in cell) return unwrapCell(cell.text);

    throw new CellError(
      `tipo de célula não suportado (${JSON.stringify(cell).slice(0, 60)})`,
    );
  }

  return value;
}

function preview(value: unknown): string {
  const text = String(value);
  return text.length > 20 ? `${text.slice(0, 20)}...` : text;
}

function toStringValue(value: unknown, maxLength?: number): string | null {
  if (value === null) return null;

  if (typeof value === 'boolean' || value instanceof Date) {
    throw new CellError(`valor "${preview(value)}" não é texto`);
  }

  const text = String(value).trim();
  if (text === '') return null;

  if (maxLength !== undefined && text.length > maxLength) {
    throw new CellError(
      `valor "${preview(text)}" excede ${maxLength} caracteres`,
    );
  }

  return text;
}

function toNumberValue(value: unknown): number | null {
  if (value === null) return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new CellError(`valor "${preview(value)}" não é numérico`);
    }
    return value;
  }

  if (typeof value === 'string') {
    let text = value.trim();
    if (text === '') return null;

    // Formato brasileiro: 1.234,56
    if (text.includes(',')) {
      text = text.replace(/\./g, '').replace(',', '.');
    }

    const parsed = Number(text);
    if (!Number.isFinite(parsed)) {
      throw new CellError(`valor "${preview(value)}" não é numérico`);
    }
    return parsed;
  }

  throw new CellError(`valor "${preview(value)}" não é numérico`);
}

export interface MappedCapexRow {
  /** null quando a linha tem erro ou está totalmente vazia. */
  item: CapexRowValues | null;
  errors: CapexRowError[];
  empty: boolean;
}

export function mapCapexRow(
  values: readonly unknown[],
  rowNumber: number,
): MappedCapexRow {
  const item = {} as Record<keyof CapexRowValues, string | number | null>;
  const errors: CapexRowError[] = [];

  for (const column of CAPEX_COLUMNS) {
    try {
      const cell = unwrapCell(values?.[column.index]);

      item[column.key] =
        column.kind === 'number'
          ? toNumberValue(cell)
          : toStringValue(cell, column.maxLength);
    } catch (error) {
      if (!(error instanceof CellError)) throw error;

      item[column.key] = null;
      errors.push({
        row: rowNumber,
        column: `${columnLetter(column.index)} (${column.key})`,
        message: error.message,
      });
    }
  }

  const empty = Object.values(item).every((value) => value === null);

  if (errors.length > 0) return { item: null, errors, empty: false };
  if (empty) return { item: null, errors: [], empty: true };

  return { item: item as unknown as CapexRowValues, errors: [], empty: false };
}
