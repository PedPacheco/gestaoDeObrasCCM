import type { Mock } from 'vitest';
import * as ExcelJS from 'exceljs';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';

vi.mock('exceljs', () => {
  const addRowsMock = vi.fn();
  const addWorksheetMock = vi.fn(() => ({
    columns: [],
    addRows: addRowsMock,
    getRow: vi.fn(() => ({ font: {} })),
  }));

  const writeMock = vi.fn();

  return {
    Workbook: vi.fn().mockImplementation(function () { return ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    }); }),
  };
});

describe('ExportGoalsService', () => {
  let service: ExportGoalsService;

  // mocks
  let addWorksheetMock: Mock;
  let addRowsMock: Mock;
  let writeMock: Mock;

  beforeEach(() => {
    addRowsMock = vi.fn();
    writeMock = vi.fn().mockResolvedValue(undefined);

    addWorksheetMock = vi.fn().mockReturnValue({
      columns: [],
      addRows: addRowsMock,
    });

    (ExcelJS.Workbook as unknown as Mock).mockImplementation(function () { return ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    }); });

    service = new ExportGoalsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // export
  // ─────────────────────────────────────────────────────────────

  describe('export', () => {
    it('should create workbook and worksheet', async () => {
      await service.export([], {} as any);

      expect(addWorksheetMock).toHaveBeenCalledWith('Metas');
    });

    it('should define columns correctly (fixed + months)', async () => {
      const worksheetMock: any = {
        columns: [],
        addRows: vi.fn(),
      };

      addWorksheetMock.mockReturnValue(worksheetMock);

      await service.export([], {} as any);

      expect(worksheetMock.columns.length).toBeGreaterThan(6); // fixed + months
    });

    it('should map goalsData into rows correctly', async () => {
      const data = [
        {
          tipo_obra: 'Construção',
          turma: 'T1',
          regional: 'Sul',
          anocalc: 2024,
          carteira: 100,
          empreendimento: 'Emp A',
          jan: { meta: 10, prog: 5, real: 3 },
        },
      ];

      await service.export(data, {} as any);

      expect(addRowsMock).toHaveBeenCalled();

      const rows = addRowsMock.mock.calls[0][0];

      expect(rows[0]).toMatchObject({
        tipo_obra: 'Construção',
        turma: 'T1',
        regional: 'Sul',
        anocalc: 2024,
        carteira: 100,
        empreendimento: 'Emp A',
        jan_meta: 10,
        jan_prog: 5,
        jan_real: 3,
      });
    });

    it('should fallback to 0 when month values are missing', async () => {
      const data = [
        {
          tipo_obra: 'Teste',
          turma: 'T1',
          regional: 'Sul',
          anocalc: 2024,
          carteira: 0,
        },
      ];

      await service.export(data, {} as any);

      const rows = addRowsMock.mock.calls[0][0];
      const row = rows[0];

      expect(row.jan_meta).toBe(0);
      expect(row.jan_prog).toBe(0);
      expect(row.jan_real).toBe(0);
    });

    it('should fallback empreendimento to empty string when null or undefined', async () => {
      const data = [
        {
          tipo_obra: 'Teste',
          turma: 'T1',
          regional: 'Sul',
          anocalc: 2024,
          carteira: 0,
          empreendimento: null,
        },
      ];

      await service.export(data, {} as any);

      const rows = addRowsMock.mock.calls[0][0];
      expect(rows[0].empreendimento).toBe('');
    });

    it('should batch rows in chunks of 1000', async () => {
      const data = Array.from({ length: 2500 }).map((_, i) => ({
        tipo_obra: 'Teste',
        turma: 'T1',
        regional: 'Sul',
        anocalc: 2024,
        carteira: i,
      }));

      await service.export(data, {} as any);

      // 2500 / 1000 = 3 batches
      expect(addRowsMock).toHaveBeenCalledTimes(3);
    });

    it('should handle empty data without calling addRows', async () => {
      await service.export([], {} as any);

      expect(addRowsMock).not.toHaveBeenCalled();
    });

    it('should call workbook.xlsx.write with response', async () => {
      const responseMock = {};

      await service.export([], responseMock as any);

      expect(writeMock).toHaveBeenCalledWith(responseMock);
    });
  });
});
