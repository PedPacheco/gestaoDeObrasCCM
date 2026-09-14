import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';

import { Test, TestingModule } from '@nestjs/testing';
import { EXPORT_REPOSITORY } from 'src/domain/contracts/IExportRepository';

jest.mock('exceljs');

describe('ExportOrdersSrrvice', () => {
  let service: ExportOrdersService;

  const mockRepository = {
    exportOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportOrdersService,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportOrdersService>(ExportOrdersService);
  });

  it('Should create an Excel File with the provided data', async () => {
    const mockData = [
      {
        ovnota: '123',
        grupo: 'mercado',
        tipo_obra: 'Ligação',
        status: 'Programado',
        ordemdiagrama: '23453',
        regional: 'São José',
        turma: 'Engelmig',
      },
    ];

    mockRepository.exportOrders.mockResolvedValue(mockData);

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

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith(
      'Exportação Ordens e Diagramas',
    );
    expect(addRowsMock).toHaveBeenCalledWith(mockData);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
