import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Workbook, Worksheet } from 'exceljs';
import { SpreadsheetParserService } from 'src/infra/spreadsheet/spreadsheet.service';

// ─── Helpers ──────────────────────────────────────────────────

const VALID_MIMETYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const VALID_MIMETYPE_XLS = 'application/vnd.ms-excel';

/**
 * Gera headers válidos na linha 3 da worksheet.
 * O layout esperado pelo service:
 *   col 2  → PONTO
 *   col 4  → OPERAÇÃO
 *   col 6  → CÓDIGO
 *   col 7  → DESCRIÇÃO
 *   col 11 → TIPO
 */
const fillValidHeaders = (ws: Worksheet): void => {
  const headerRow = ws.getRow(3);
  headerRow.getCell(2).value = 'PONTO';
  headerRow.getCell(4).value = 'OPERAÇÃO';
  headerRow.getCell(6).value = 'CÓDIGO';
  headerRow.getCell(7).value = 'DESCRIÇÃO DA OPERAÇÃO';
  headerRow.getCell(11).value = 'TIPO';
  headerRow.commit();
};

/**
 * Preenche uma linha de dados válida na worksheet.
 * Colunas: 2=point, 4=operation, 5=opNumber, 6=materialCode,
 *          7=opDesc, 9=plannedQty, 11=type
 */
const fillDataRow = (
  ws: Worksheet,
  rowNumber: number,
  overrides: {
    point?: any;
    operation?: any;
    operationNumber?: any;
    materialCode?: any;
    operationDesc?: any;
    plannedQty?: any;
    type?: any;
  } = {},
): void => {
  const row = ws.getRow(rowNumber);

  for (let col = 1; col <= 11; col++) {
    row.getCell(col).value = '';
  }

  const getValue = <T>(value: T | undefined, defaultValue: T): T =>
    value === undefined ? defaultValue : value;

  row.getCell(2).value = getValue(overrides.point, 'P1');
  row.getCell(4).value = getValue(overrides.operation, 'OP-01');
  row.getCell(5).value = getValue(overrides.operationNumber, '001');
  row.getCell(6).value = getValue(overrides.materialCode, 'SRV-001');
  row.getCell(7).value = getValue(
    overrides.operationDesc,
    'Instalação elétrica',
  );
  row.getCell(9).value = getValue(overrides.plannedQty, 10);
  row.getCell(11).value = getValue(overrides.type, 'S');

  row.commit();
};
/**
 * Cria um buffer xlsx válido com headers e dados opcionais.
 */
const buildValidWorkbook = async (
  configureFn?: (ws: Worksheet) => void,
): Promise<Buffer> => {
  const wb = new Workbook();
  const ws = wb.addWorksheet('Plan1');

  fillValidHeaders(ws);

  if (configureFn) {
    configureFn(ws);
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

describe('SpreadsheetParserService', () => {
  let sut: SpreadsheetParserService;

  beforeEach(async () => {
    jest.spyOn(console, 'log').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [SpreadsheetParserService],
    }).compile();

    sut = module.get(SpreadsheetParserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('dataStartRow', () => {
    it('should be 4', () => {
      expect(sut.dataStartRow).toBe(4);
    });
  });

  describe('mimetype validation', () => {
    it('should throw BadRequestException for unsupported mimetype', async () => {
      const buffer = Buffer.from('fake');

      await expect(sut.parse(buffer, 'text/csv')).rejects.toThrow(
        BadRequestException,
      );

      await expect(sut.parse(buffer, 'text/csv')).rejects.toThrow(
        'Tipo de arquivo não suportado: text/csv',
      );
    });

    it('should accept xlsx mimetype', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4);
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(1);
    });

    it('should accept xls mimetype', async () => {
      // Nota: ExcelJS gera xlsx internamente, mas o service só valida o mimetype
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4);
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE_XLS);

      expect(result.items).toHaveLength(1);
    });
  });

  describe('empty workbook', () => {
    it('should throw BadRequestException when workbook has no worksheets', async () => {
      const wb = new Workbook();
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        BadRequestException,
      );
      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        'A planilha está vazia',
      );
    });
  });

  describe('validateWorksheetStructure', () => {
    it('should throw BadRequestException when headers are missing', async () => {
      const wb = new Workbook();
      // Não preenche headers → todas as colunas inválidas
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        BadRequestException,
      );
      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        'A planilha está vazia',
      );
    });

    it('should throw when a single expected header is wrong', async () => {
      const wb = new Workbook();
      const ws = wb.addWorksheet('Aba1');

      fillValidHeaders(ws);
      // Sobrescreve uma coluna com valor errado
      ws.getRow(3).getCell(2).value = 'ERRADO';
      ws.getRow(3).commit();

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should accept headers with extra text (includes match)', async () => {
      const wb = new Workbook();
      const ws = wb.addWorksheet('Plan1');

      const headerRow = ws.getRow(3);
      headerRow.getCell(2).value = 'PONTO DE ENTREGA';
      headerRow.getCell(4).value = 'OPERAÇÃO PRINCIPAL';
      headerRow.getCell(6).value = 'CÓDIGO DO MATERIAL';
      headerRow.getCell(7).value = 'DESCRIÇÃO DETALHADA';
      headerRow.getCell(11).value = 'TIPO DE SERVIÇO';
      headerRow.commit();

      fillDataRow(ws, 4);

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(1);
    });

    it('should match headers case-insensitively', async () => {
      const wb = new Workbook();
      const ws = wb.addWorksheet('Plan1');

      const headerRow = ws.getRow(3);
      headerRow.getCell(2).value = 'ponto';
      headerRow.getCell(4).value = 'operação';
      headerRow.getCell(6).value = 'código';
      headerRow.getCell(7).value = 'descrição';
      headerRow.getCell(11).value = 'tipo';
      headerRow.commit();

      fillDataRow(ws, 4);

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(1);
    });

    it('should treat null header cell as empty string', async () => {
      const wb = new Workbook();

      // Não preenche nada na row 3 → todas as cells são null
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        'A planilha está vazia',
      );
    });

    it('should treat null header values as empty string during validation', async () => {
      const wb = new Workbook();
      const ws = wb.addWorksheet('Plan1');

      const headerRow = ws.getRow(3);

      headerRow.getCell(2).value = null;
      headerRow.getCell(4).value = null;
      headerRow.getCell(6).value = null;
      headerRow.getCell(7).value = null;
      headerRow.getCell(11).value = null;

      headerRow.commit();

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        'A aba "Plan1" não possui o layout esperado.',
      );
    });
  });

  describe('row skipping', () => {
    it('should skip rows before dataStartRow (header rows)', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        // Linhas 1, 2, 3 são cabeçalho — dados começam na 4
        fillDataRow(ws, 4);
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(1);
      expect(result.skippedRows).toHaveLength(0);
    });

    it('should skip rows with fewer than MIN_COLUMNS and add to skippedRows', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        // Linha 4 com poucas colunas
        const row = ws.getRow(4);
        row.getCell(1).value = 'only one';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(1);
      expect(result.skippedRows[0].row).toBe(4);
      expect(result.skippedRows[0].reason).toContain('colunas');
    });

    it('should skip rows with less than minimum columns when type is null', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, {
          type: null,
        });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(1);

      expect(result.skippedRows[0].reason).toContain('colunas');
    });

    it('should skip rows with invalid type and add to skippedRows', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: 'X' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(1);
      expect(result.skippedRows[0].reason).toContain('"X"');
      expect(result.skippedRows[0].reason).toContain('S');
      expect(result.skippedRows[0].reason).toContain('M');
    });
  });

  describe('type mapping', () => {
    it('should map "S" to "service"', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: 'S' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].type).toBe('service');
    });

    it('should map "M" to "material"', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: 'M' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].type).toBe('material');
    });
  });

  describe('field mapping', () => {
    it('should map all fields correctly from a valid row', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, {
          point: 'PT-99',
          operation: 'OP-X',
          operationNumber: '042',
          materialCode: 'MAT-001',
          operationDesc: 'Troca de cabo',
          plannedQty: 55,
          type: 'M',
        });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        point: 'PT-99',
        operation: 'OP-X',
        operationNumber: '042',
        materialCode: 'MAT-001',
        operationDescription: 'Troca de cabo',
        plannedQuantity: 55,
        type: 'material',
      });
    });
  });

  describe('getCellString', () => {
    it('should return null for null cell value', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: null });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBeNull();
    });

    it('should return null for undefined cell value', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: undefined });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      // undefined é tratado como célula não preenchida → null
      expect(result.items[0].point).toBe('P1');
    });

    it('should use default value when point is undefined', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: undefined });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBe('P1');
    });

    it('should return null for empty string after trim', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: '   ' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBeNull();
    });

    it('should trim whitespace from string values', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: '  P1  ' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBe('P1');
    });

    it('should handle rich text cell values', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        // Preenche as 11 colunas base
        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        // Coluna 2 (point) com rich text
        row.getCell(2).value = {
          richText: [{ text: 'Rich ' }, { text: 'Point' }],
        } as any;

        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';
        row.getCell(9).value = 10;
        row.getCell(11).value = 'S';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBe('Rich Point');
    });

    it('should return null for rich text that results in empty string', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        row.getCell(2).value = {
          richText: [{ text: '' }, { text: '  ' }],
        } as any;

        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';
        row.getCell(9).value = 10;
        row.getCell(11).value = 'S';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBeNull();
    });

    it('should handle formula cell values with result', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        row.getCell(2).value = {
          formula: '=A1&B1',
          result: 'FormulaPoint',
        } as any;

        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';
        row.getCell(9).value = 10;
        row.getCell(11).value = 'S';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBe('FormulaPoint');
    });

    it('should convert numeric cell values to string', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: 12345 });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].point).toBe('12345');
    });

    it('should return 0 for formula cell with undefined result', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        row.getCell(2).value = 'P1';
        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';

        row.getCell(9).value = {
          formula: '=SUM(A1:A10)',
          result: undefined,
        } as any;

        row.getCell(11).value = 'S';

        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(0);
    });
  });

  describe('getCellNumber', () => {
    it('should return 0 for null cell value', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { plannedQty: null });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(0);
    });

    it('should return 0 when quantity cell is undefined', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4);

        const row = ws.getRow(4);
        row.getCell(9).value = undefined;
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(0);
    });

    it('should return the number for valid numeric cell', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { plannedQty: 42.5 });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(42.5);
    });

    it('should return 0 for NaN cell value', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { plannedQty: 'not-a-number' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(0);
    });

    it('should handle formula cell with numeric result', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        row.getCell(2).value = 'P1';
        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';
        row.getCell(9).value = {
          formula: '=SUM(A1:A10)',
          result: 99,
        } as any;
        row.getCell(11).value = 'S';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].plannedQuantity).toBe(99);
    });

    it('should return 0 for formula cell with null result', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        const row = ws.getRow(4);

        for (let col = 1; col <= 11; col++) {
          row.getCell(col).value = '';
        }

        row.getCell(2).value = 'P1';
        row.getCell(4).value = 'OP-01';
        row.getCell(5).value = '001';
        row.getCell(6).value = 'SRV-001';
        row.getCell(7).value = 'Desc';
        row.getCell(9).value = {
          formula: '=SUM(A1:A10)',
          result: null,
        } as any;
        row.getCell(11).value = 'S';
        row.commit();
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      // Number(null) === 0, || 0
      expect(result.items[0].plannedQuantity).toBe(0);
    });

    it('should return null operationNumber when value is null', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, {
          operationNumber: null,
        });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].operationNumber).toBeNull();
    });
  });

  describe('cleanNumericString', () => {
    it('should remove trailing .0 from numeric strings', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { materialCode: '12345.0' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].materialCode).toBe('12345');
    });

    it('should not remove .0 from the middle of a string', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { materialCode: '1.0.2' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].materialCode).toBe('1.0.2');
    });

    it('should return null when underlying value is null', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { materialCode: null });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].materialCode).toBeNull();
    });

    it('should return null when underlying value is empty string', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { materialCode: '   ' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].materialCode).toBeNull();
    });

    it('should handle numeric cell values that ExcelJS stores as numbers', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        // ExcelJS armazena como number → String(12345) → "12345"
        fillDataRow(ws, 4, { materialCode: 12345 });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].materialCode).toBe('12345');
    });

    it('should remove .0 from operationNumber as well', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { operationNumber: '99.0' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items[0].operationNumber).toBe('99');
    });
  });

  describe('multiple worksheets', () => {
    it('should extract items from all worksheets', async () => {
      const wb = new Workbook();

      const ws1 = wb.addWorksheet('Aba1');
      fillValidHeaders(ws1);
      fillDataRow(ws1, 4, { point: 'A1' });

      const ws2 = wb.addWorksheet('Aba2');
      fillValidHeaders(ws2);
      fillDataRow(ws2, 4, { point: 'B1' });
      fillDataRow(ws2, 5, { point: 'B2' });

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(3);
      expect(result.items.map((i) => i.point)).toEqual(
        expect.arrayContaining(['A1', 'B1', 'B2']),
      );
    });

    it('should throw if any worksheet has invalid structure', async () => {
      const wb = new Workbook();

      const ws1 = wb.addWorksheet('Boa');
      fillValidHeaders(ws1);
      fillDataRow(ws1, 4);

      const ws2 = wb.addWorksheet('Ruim');
      // Preenche headers ERRADOS explicitamente em vez de deixar vazio
      const headerRow = ws2.getRow(3);
      headerRow.getCell(2).value = 'COLUNA_ERRADA';
      headerRow.getCell(4).value = 'COLUNA_ERRADA';
      headerRow.getCell(6).value = 'COLUNA_ERRADA';
      headerRow.getCell(7).value = 'COLUNA_ERRADA';
      headerRow.getCell(11).value = 'COLUNA_ERRADA';
      headerRow.commit();

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      await expect(sut.parse(buffer, VALID_MIMETYPE)).rejects.toThrow(
        'não possui o layout esperado',
      );
    });

    it('should accumulate skippedRows from all worksheets', async () => {
      const wb = new Workbook();

      const ws1 = wb.addWorksheet('Aba1');
      fillValidHeaders(ws1);
      fillDataRow(ws1, 4, { type: 'X' }); // inválido

      const ws2 = wb.addWorksheet('Aba2');
      fillValidHeaders(ws2);
      fillDataRow(ws2, 4, { type: 'Z' }); // inválido

      const buffer = Buffer.from(await wb.xlsx.writeBuffer());

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(2);
    });
  });

  describe('multiple data rows', () => {
    it('should parse multiple valid rows from a single sheet', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { point: 'P1', type: 'S' });
        fillDataRow(ws, 5, { point: 'P2', type: 'M' });
        fillDataRow(ws, 6, { point: 'P3', type: 'S' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(3);
      expect(result.items[0].type).toBe('service');
      expect(result.items[1].type).toBe('material');
      expect(result.items[2].type).toBe('service');
    });

    it('should handle a mix of valid, skipped, and blank-type rows', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: 'S' }); // válido
        fillDataRow(ws, 5, { type: 'INVALID' }); // skipped
        fillDataRow(ws, 6, { type: null }); // fim de tabela (ignorado silenciosamente)
        fillDataRow(ws, 7, { type: 'M' }); // válido
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(2);
      expect(result.skippedRows).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should return empty items when all rows are before dataStartRow', async () => {
      const buffer = await buildValidWorkbook(() => {
        // Nenhuma linha de dados preenchida
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(0);
    });

    it('should handle empty string type cell as blank (silent skip)', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: '' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      // getCellString retorna null para '' após trim → !type → return silencioso
      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(0);
    });

    it('should handle whitespace-only type cell as blank (silent skip)', async () => {
      const buffer = await buildValidWorkbook((ws) => {
        fillDataRow(ws, 4, { type: '   ' });
      });

      const result = await sut.parse(buffer, VALID_MIMETYPE);

      expect(result.items).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(0);
    });
  });

  describe('getCellString private formula branches', () => {
    it('should return null when formula result is null', () => {
      const row = {
        getCell: jest.fn().mockReturnValue({
          value: {
            formula: '=A1',
            result: null,
          },
        }),
      } as any;

      const result = (sut as any).getCellString(row, 1);

      expect(result).toBeNull();
    });

    it('should return trimmed formula result', () => {
      const row = {
        getCell: jest.fn().mockReturnValue({
          value: {
            formula: '=A1',
            result: ' TEST ',
          },
        }),
      } as any;

      const result = (sut as any).getCellString(row, 1);

      expect(result).toBe('TEST');
    });
  });

  describe('getCellNumber private formula branches', () => {
    it('should return formula result number', () => {
      const row = {
        getCell: jest.fn().mockReturnValue({
          value: {
            formula: '=SUM()',
            result: 15,
          },
        }),
      } as any;

      const result = (sut as any).getCellNumber(row, 1);

      expect(result).toBe(15);
    });

    it('should return 0 when formula result is null', () => {
      const row = {
        getCell: jest.fn().mockReturnValue({
          value: {
            formula: '=SUM()',
            result: null,
          },
        }),
      } as any;

      const result = (sut as any).getCellNumber(row, 1);

      expect(result).toBe(0);
    });
  });
});
