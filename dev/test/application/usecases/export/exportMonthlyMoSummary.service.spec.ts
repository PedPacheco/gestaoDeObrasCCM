import { Response } from 'express';

import * as ExcelJS from 'exceljs';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';

jest.mock('exceljs');

describe('ExportMonthlyMOSummaryService', () => {
  let service: ExportMonthlyMOSummaryService;

  let mockAddWorksheet: jest.Mock;
  let mockAddRowsFirst: jest.Mock;
  let mockAddRowsSecond: jest.Mock;
  let mockWrite: jest.Mock;

  let response: Partial<Response>;

  beforeEach(() => {
    mockAddRowsFirst = jest.fn();
    mockAddRowsSecond = jest.fn();
    mockAddWorksheet = jest.fn();
    mockWrite = jest.fn().mockResolvedValue(undefined);

    const firstWorksheet = {
      columns: [],
      addRows: mockAddRowsFirst,
    };

    const secondWorksheet = {
      columns: [],
      addRows: mockAddRowsSecond,
    };

    mockAddWorksheet
      .mockReturnValueOnce(firstWorksheet)
      .mockReturnValueOnce(secondWorksheet);

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => ({
      addWorksheet: mockAddWorksheet,
      xlsx: {
        write: mockWrite,
      },
    }));

    response = {} as Response;

    service = new ExportMonthlyMOSummaryService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('export', () => {
    it('should create workbook and worksheets', async () => {
      await service.export([], [], response as Response);

      expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);

      expect(mockAddWorksheet).toHaveBeenCalledWith(
        'Resumo Mensal - Mão de Obra',
      );

      expect(mockAddWorksheet).toHaveBeenCalledWith(
        'Resumo Mensal Mão de Obra - Grupos',
      );
    });

    it('should add rows to first worksheet with correct transformations', async () => {
      const firstSummaryData = [
        {
          dataProg: '2026-01-01',
          totalQtde: 10,
          teamsTotal: 2,
          financialGoal: 1000,
          diaryGoal: 50,
          financialGoalWith8: 1080,
          diaryGoalWith8: 60,
          totalMoProg: 500,
          totalMoExec: 300,
        },
      ];

      await service.export(firstSummaryData, [], response as Response);

      expect(mockAddRowsFirst).toHaveBeenCalledTimes(1);

      const rows = mockAddRowsFirst.mock.calls[0][0];

      expect(rows[0].diaryGoal).toBe(0.5);
      expect(rows[0].diaryGoalWith8).toBe(0.6);
    });

    it('should add rows to second worksheet with diff transformation', async () => {
      const secondSummaryData = [
        {
          grupo: 'A',
          turma: 'Parceira',
          qtdeObras: 10,
          totalMoProg: 500,
          totalMoExec: 300,
          totalMoPrev: 400,
          diff: 50,
        },
      ];

      await service.export([], secondSummaryData, response as Response);

      expect(mockAddRowsSecond).toHaveBeenCalledTimes(1);

      const rows = mockAddRowsSecond.mock.calls[0][0];

      expect(rows[0].diff).toBe(0.5);
    });

    it('should process batches greater than batchSize', async () => {
      const data = Array.from({ length: 2000 }).map((_, index) => ({
        dataProg: '2026-01-01',
        totalQtde: index,
        teamsTotal: 1,
        financialGoal: 100,
        diaryGoal: 10,
        financialGoalWith8: 108,
        diaryGoalWith8: 12,
        totalMoProg: 10,
        totalMoExec: 5,
      }));

      await service.export(data, [], response as Response);

      expect(mockAddRowsFirst).toHaveBeenCalledTimes(2);
    });

    it('should call workbook write with response', async () => {
      await service.export([], [], response as Response);

      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenCalledWith(response);
    });
  });
});
