import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportExecutionCapacityService } from 'src/application/services/export/exportExecutionCapacity.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('exceljs');

describe('ExportExecutionCapacityService', () => {
  let service: ExportExecutionCapacityService;

  const mockRepository = {
    exportExecutionCapacity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportExecutionCapacityService,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportExecutionCapacityService>(
      ExportExecutionCapacityService,
    );
  });

  it('Should create an Excel File with the provided data', async () => {
    const mockExportData = [
      {
        ano: 2025,
        regional: 'São Paulo',
        turma: 'Equipe Alpha',
        total_shouldcost: 100000,
        total_qtde_equipes_rfp: 5n,
        jan: 12000,
        financeiro_jan: 11500,
        fev: 8000,
        financeiro_fev: 7800,
        mar: 9500,
        financeiro_mar: 9400,
        abr: 11000,
        financeiro_abr: 10900,
        mai: 10200,
        financeiro_mai: 10100,
        jun: 9800,
        financeiro_jun: 9700,
        jul: 10500,
        financeiro_jul: 10400,
        ago: 8800,
        financeiro_ago: 8700,
        set: 9900,
        financeiro_set: 9800,
        out: 12000,
        financeiro_out: 11900,
        nov: 10800,
        financeiro_nov: 10700,
        dez: 9500,
        financeiro_dez: 9400,
      },
      {
        ano: 2025,
        regional: 'Campinas',
        turma: 'Equipe Beta',
        total_shouldcost: 85000,
        total_qtde_equipes_rfp: 3,
        jan: 10000,
        financeiro_jan: 9500,
        fev: 7000,
        financeiro_fev: 6900,
        mar: 8500,
        financeiro_mar: 8400,
        abr: 9500,
        financeiro_abr: 9400,
        mai: 9000,
        financeiro_mai: 8900,
        jun: 8700,
        financeiro_jun: 8600,
        jul: 9200,
        financeiro_jul: 9100,
        ago: 7600,
        financeiro_ago: 7500,
        set: 8900,
        financeiro_set: 8800,
        out: 11000,
        financeiro_out: 10900,
        nov: 9500,
        financeiro_nov: 9400,
        dez: 9100,
        financeiro_dez: 9000,
      },
    ];

    mockRepository.exportExecutionCapacity.mockResolvedValue(mockExportData);

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

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

    const mockFormatted = [
      { ...mockExportData[0], total_qtde_equipes_rfp: 5 },
      { ...mockExportData[1] },
    ];

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith(
      'Capacidade de execução',
    );
    expect(addRowsMock).toHaveBeenCalledWith(mockFormatted);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
