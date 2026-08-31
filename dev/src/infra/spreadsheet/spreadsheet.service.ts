import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Workbook, Worksheet, Row } from 'exceljs';
import { ParsedSpreadsheetItem } from 'src/domain/repositories/worksService/IWorkServicesRepository';

export interface ParseResult {
  items: ParsedSpreadsheetItem[];
  skippedRows: { row: number; reason: string }[];
}

@Injectable()
export class SpreadsheetParserService {
  private readonly logger = new Logger(SpreadsheetParserService.name);

  private readonly ALLOWED_MIMETYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];

  // Linha onde começam os dados (equivalente ao min_row=4 do Python)
  // Público: o service de import usa isso pra apontar a linha real da planilha nos erros.
  readonly dataStartRow = 4;

  // Mínimo de colunas esperadas (equivalente ao len(row) > 10)
  private readonly MIN_COLUMNS = 11;

  // Colunas (1-based, como no ExcelJS)
  private readonly COL = {
    POINT: 2, // row[1]  → Ponto
    OPERATION: 4, // row[3]  → Operação
    OPERATION_NUM: 5, // row[4]  → Número da Operação
    MATERIAL_CODE: 6, // row[5]  → Código Material
    PLANNED_QTY: 9, // row[8]  → Qtde Planejada
    TYPE: 11, // row[10] → Tipo (S/M)
    OPERATION_DESC: 14, // row[13] → Descrição da Operação
  } as const;

  async parse(buffer: Buffer, mimetype: string): Promise<ParseResult> {
    if (!this.ALLOWED_MIMETYPES.includes(mimetype)) {
      throw new BadRequestException(
        `Tipo de arquivo não suportado: ${mimetype}`,
      );
    }

    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as any);

    if (workbook.worksheets.length === 0) {
      throw new BadRequestException('A planilha está vazia');
    }

    const items: ParsedSpreadsheetItem[] = [];
    const skippedRows: { row: number; reason: string }[] = [];

    // Itera todas as abas (equivalente ao for sheet_name in xlBook.sheetnames)
    for (const worksheet of workbook.worksheets) {
      this.validateWorksheetStructure(worksheet);

      this.extractFromSheet(worksheet, items, skippedRows);
    }

    return { items, skippedRows };
  }

  private extractFromSheet(
    worksheet: Worksheet,
    items: ParsedSpreadsheetItem[],
    skippedRows: { row: number; reason: string }[],
  ): void {
    worksheet.eachRow((row: Row, rowNumber: number) => {
      // Pula linhas antes da dataStartRow (cabeçalhos)
      if (rowNumber < this.dataStartRow) return;

      // Valida mínimo de colunas
      if (row.cellCount < this.MIN_COLUMNS) {
        const reason = `Aba '${worksheet.name}': possui apenas ${row.cellCount} colunas.`;
        this.logger.warn(`Linha ${rowNumber} ignorada — ${reason}`);
        skippedRows.push({ row: rowNumber, reason });
        return;
      }

      const type = this.getCellString(row, this.COL.TYPE);

      // Ignora linhas sem tipo — não é erro, é fim de tabela/linha em branco
      if (!type) return;

      // Só aceita "S" (serviço) ou "M" (material)
      if (type !== 'S' && type !== 'M') {
        const reason = `Tipo "${type}" inválido (esperado "S" ou "M").`;
        this.logger.warn(`Linha ${rowNumber} ignorada — ${reason}`);
        skippedRows.push({ row: rowNumber, reason });
        return;
      }

      const item: ParsedSpreadsheetItem = {
        point: this.getCellString(row, this.COL.POINT),
        operation: this.getCellString(row, this.COL.OPERATION),
        operationNumber: this.cleanNumericString(row, this.COL.OPERATION_NUM),
        materialCode: this.cleanNumericString(row, this.COL.MATERIAL_CODE),
        plannedQuantity: this.getCellNumber(row, this.COL.PLANNED_QTY),
        type: type === 'S' ? 'service' : 'material',
        operationDescription: this.getCellString(row, this.COL.OPERATION_DESC),
      };

      items.push(item);
    });
  }

  /**
   * Extrai valor como string (equivalente ao str(row[x]).strip())
   */
  private getCellString(row: Row, col: number): string | null {
    const value = row.getCell(col).value;

    if (value === null || value === undefined) return null;

    // Rich text do ExcelJS
    if (typeof value === 'object' && 'richText' in value) {
      return (
        (value as any).richText
          .map((part: any) => part.text)
          .join('')
          .trim() || null
      );
    }

    // Resultado de fórmula
    if (typeof value === 'object' && 'result' in value) {
      return value.result != null ? String(value.result).trim() : null;
    }

    return String(value).trim() || null;
  }

  /**
   * Extrai valor numérico (para qtde_plan)
   */
  private getCellNumber(row: Row, col: number): number {
    const value = row.getCell(col).value;

    if (value === null || value === undefined) return 0;

    // Resultado de fórmula
    if (typeof value === 'object' && 'result' in value) {
      return Number(value.result) || 0;
    }

    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Equivalente ao str(row[x]).strip().replace(".0", "") do Python
   * Remove o ".0" que aparece quando o Excel trata números como float
   */
  private cleanNumericString(row: Row, col: number): string | null {
    const value = this.getCellString(row, col);

    if (!value) return null;

    // Remove ".0" do final (ex: "12345.0" → "12345")
    return value.replace(/\.0$/, '');
  }

  private validateWorksheetStructure(worksheet: Worksheet): void {
    const headerRow = worksheet.getRow(3);

    const expectedColumns = [
      { col: this.COL.POINT, value: 'ponto' },
      { col: this.COL.OPERATION, value: 'operação' },
      { col: this.COL.OPERATION_NUM, value: 'nº da operação' },
      { col: this.COL.MATERIAL_CODE, value: 'código material' },
      { col: this.COL.PLANNED_QTY, value: 'qtde. planejada' },
      { col: this.COL.TYPE, value: 'tipo' },
      { col: this.COL.OPERATION_DESC, value: 'descrição operação' },
    ];

    const invalidColumns = expectedColumns.filter(({ col, value }) => {
      const cellValue = String(headerRow.getCell(col).value ?? '')
        .trim()
        .toLowerCase();

      return !cellValue.includes(value);
    });

    if (invalidColumns.length > 0) {
      throw new BadRequestException(
        `A aba "${worksheet.name}" não possui o layout esperado.`,
      );
    }
  }
}
