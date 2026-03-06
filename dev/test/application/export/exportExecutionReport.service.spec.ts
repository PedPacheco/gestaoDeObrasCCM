import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportExecutionReportService } from 'src/application/services/export/exportExecutionReport.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';
import {
  mockFindByWorkIdResponse,
  mockFindByWorkIdResponseFormatted,
  mockFindByWorkIdResponseFormattedNull,
  mockFindByWorkIdResponseNull,
} from '../../mocks/mocksExecutionReport';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('exceljs');

describe('ExportExecutionReportService', () => {
  let service: ExportExecutionReportService;

  const mockRepository = {
    exportExecutionReport: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
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

  afterEach(jest.clearAllMocks);

  it('Should create an Excel File with the provided data', async () => {
    mockRepository.exportExecutionReport.mockResolvedValue(
      mockFindByWorkIdResponse,
    );

    const addRowsMock = jest.fn();
    const writeMock = jest.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = jest.fn().mockReturnValue(workSheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => workBookMock);

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

    const addRowsMock = jest.fn();
    const writeMock = jest.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = jest.fn().mockReturnValue(workSheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => workBookMock);

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
