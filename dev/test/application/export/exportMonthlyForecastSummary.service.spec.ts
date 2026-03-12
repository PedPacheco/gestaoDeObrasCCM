import { Response } from 'express';

import * as ExcelJS from 'exceljs';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';

jest.mock('exceljs');

describe('ExportMonthlyForecastSummaryService', () => {
  let service: ExportMonthlyForecastSummaryService;

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

    const worksheetFirst = {
      columns: [],
      addRows: mockAddRowsFirst,
    };

    const worksheetSecond = {
      columns: [],
      addRows: mockAddRowsSecond,
    };

    mockAddWorksheet
      .mockReturnValueOnce(worksheetFirst)
      .mockReturnValueOnce(worksheetSecond);

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => ({
      addWorksheet: mockAddWorksheet,
      xlsx: {
        write: mockWrite,
      },
    }));

    response = {} as Response;

    service = new ExportMonthlyForecastSummaryService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('export', () => {
    it('should create workbook and worksheets', async () => {
      await service.export([], [], response as Response);

      expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);

      expect(mockAddWorksheet).toHaveBeenCalledWith('Resumo Mensal Forecast');

      expect(mockAddWorksheet).toHaveBeenCalledWith(
        'Resumo Mensal Forecast - Grupos',
      );
    });

    it('should add rows to first worksheet with correct transformations', async () => {
      const firstSummaryData = [
        {
          dataProg: '2026-01-01',
          totalQtde: 10,
          teamsTotal: 3,
          financialGoal: 1000,
          diaryGoal: 50,
          serviceMoProg: 1,
          serviceMoPlan: 2,
          serviceMoPend: 3,
          serviceMoExec: 4,
          materialMoProg: 5,
          materialMoPlan: 6,
          materialMoPend: 7,
          materialMoExec: 8,
          diff: 25,
        },
      ];

      await service.export(firstSummaryData, [], response as Response);

      expect(mockAddRowsFirst).toHaveBeenCalledTimes(1);

      const rows = mockAddRowsFirst.mock.calls[0][0];

      expect(rows[0].diaryGoal).toBe(0.5);
      expect(rows[0].diff).toBe(0.25);
    });

    it('should add rows to second worksheet with diff transformation', async () => {
      const secondSummaryData = [
        {
          grupo: 'A',
          turma: 'Parceira',
          qtdeObras: 10,
          totalServiceMoProg: 1,
          totalServiceMoPlan: 2,
          totalServiceMoPend: 3,
          totalServiceMoExec: 4,
          totalServiceMoPrev: 5,
          totalMaterialMoProg: 6,
          totalMaterialMoPlan: 7,
          totalMaterialMoPend: 8,
          totalMaterialMoExec: 9,
          totalMaterialMoPrev: 10,
          diff: 50,
        },
      ];

      await service.export([], secondSummaryData, response as Response);

      expect(mockAddRowsSecond).toHaveBeenCalledTimes(1);

      const rows = mockAddRowsSecond.mock.calls[0][0];

      expect(rows[0].diff).toBe(0.5);
    });

    it('should process batches larger than batchSize', async () => {
      const data = Array.from({ length: 2000 }).map((_, index) => ({
        dataProg: '2026-01-01',
        totalQtde: index,
        teamsTotal: 1,
        financialGoal: 100,
        diaryGoal: 10,
        serviceMoProg: 1,
        serviceMoPlan: 1,
        serviceMoPend: 1,
        serviceMoExec: 1,
        materialMoProg: 1,
        materialMoPlan: 1,
        materialMoPend: 1,
        materialMoExec: 1,
        diff: 10,
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
