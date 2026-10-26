import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';
import type { Mock } from 'vitest';
import {
  mockFindByWorkIdResponse,
  mockFindByWorkIdResponseFormatted,
  mockFindByWorkIdResponseFormattedNull,
  mockFindByWorkIdResponseNull,
} from '../../../mocks/mocksExecutionReport';

import { Test, TestingModule } from '@nestjs/testing';

vi.mock('exceljs');

const { WorkbookMock } = vi.hoisted(() => ({
  WorkbookMock: vi.fn(),
}));

// Expose Workbook both as named and default export (CJS interop)
vi.mock('exceljs', () => ({
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock },
}));

describe('ExportExecutionReportService', () => {
  let service: ExportExecutionReportService;

  const mockRepository = {
    exportExecutionReport: vi.fn(),
  };

  const mockResponse = {
    setHeader: vi.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportExecutionReportService,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportExecutionReportService>(
      ExportExecutionReportService,
    );
  });

  afterEach(vi.clearAllMocks);

  it('Should create an Excel File with the provided data', async () => {
    mockRepository.exportExecutionReport.mockResolvedValue(
      mockFindByWorkIdResponse,
    );

    const addRowsMock = vi.fn();
    const writeMock = vi.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = vi.fn().mockReturnValue(workSheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (ExcelJS.Workbook as Mock).mockImplementation(function () {
      return workBookMock;
    });

    await service.export(mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith(
      'Relatórios de execução',
    );
    expect(addRowsMock).toHaveBeenCalledWith(mockFindByWorkIdResponseFormatted);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });

  it('Should create an Excel File with the provided data with null values', async () => {
    mockRepository.exportExecutionReport.mockResolvedValue(
      mockFindByWorkIdResponseNull,
    );

    const addRowsMock = vi.fn();
    const writeMock = vi.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = vi.fn().mockReturnValue(workSheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (ExcelJS.Workbook as Mock).mockImplementation(function () {
      return workBookMock;
    });

    await service.export(mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith(
      'Relatórios de execução',
    );
    expect(addRowsMock).toHaveBeenCalledWith(
      mockFindByWorkIdResponseFormattedNull,
    );
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });

  it('deve lançar erro caso exportRepository.exportExecutionReport() falhe', async () => {
    const expectedError = new Error('Erro ao buscar dados do relatório');

    mockRepository.exportExecutionReport.mockRejectedValue(expectedError);

    await expect(service.export(mockResponse)).rejects.toThrow(expectedError);
  });
});
