import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as Exceljs from 'exceljs';

import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';
import { ExportRejectionsService } from 'src/application/export/exportRejections.service';

jest.mock('exceljs');

describe('ExportRejectionsService', () => {
  let service: ExportRejectionsService;
  let repository: jest.Mocked<IExportRepository>;

  let mockAddRows: jest.Mock;
  let mockWrite: jest.Mock;
  let mockWorksheet: any;

  beforeEach(async () => {
    mockAddRows = jest.fn();
    mockWrite = jest.fn().mockResolvedValue(undefined);

    mockWorksheet = {
      columns: [],
      addRows: mockAddRows,
    };

    const mockWorkbook = {
      addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      xlsx: {
        write: mockWrite,
      },
    };

    (Exceljs.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportRejectionsService,
        {
          provide: EXPORT_REPOSITORY,
          useValue: {
            exportRejections: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExportRejectionsService>(ExportRejectionsService);
    repository = module.get(EXPORT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve exportar dados corretamente formatando ovnota', async () => {
    const mockData = [
      {
        id: 1,
        motivo: 'Teste',
        obras: { ovnota: '12345' },
      },
      {
        id: 2,
        motivo: 'Outro',
        obras: { ovnota: '67890' },
      },
    ];

    repository.exportRejections.mockResolvedValue(mockData);

    const response = {} as Response;

    await service.export(response);

    expect(repository.exportRejections).toHaveBeenCalledTimes(1);

    expect(mockAddRows).toHaveBeenCalledTimes(1);

    const addedRows = mockAddRows.mock.calls[0][0];

    expect(addedRows[0]).toMatchObject({
      id: 1,
      motivo: 'Teste',
      ovnota: '12345',
    });

    expect(addedRows[1]).toMatchObject({
      id: 2,
      motivo: 'Outro',
      ovnota: '67890',
    });

    expect(mockWrite).toHaveBeenCalledWith(response);
  });

  it('deve funcionar corretamente com lista vazia', async () => {
    repository.exportRejections.mockResolvedValue([]);

    const response = {} as Response;

    await service.export(response);

    expect(repository.exportRejections).toHaveBeenCalledTimes(1);
    expect(mockAddRows).not.toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalledWith(response);
  });

  it('deve dividir em múltiplos batches quando ultrapassar 1000 registros', async () => {
    const largeData = Array.from({ length: 2500 }).map((_, index) => ({
      id: index,
      obras: { ovnota: `OV-${index}` },
    }));

    repository.exportRejections.mockResolvedValue(largeData);

    const response = {} as Response;

    await service.export(response);

    // 2500 registros → 3 batches (1000, 1000, 500)
    expect(mockAddRows).toHaveBeenCalledTimes(3);

    expect(mockAddRows.mock.calls[0][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[1][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[2][0]).toHaveLength(500);
  });

  it('deve configurar worksheet corretamente', async () => {
    repository.exportRejections.mockResolvedValue([]);

    const response = {} as Response;

    await service.export(response);

    expect(mockWorksheet.columns).toBeDefined();
    expect(Array.isArray(mockWorksheet.columns)).toBe(true);
    expect(mockWorksheet.columns.length).toBeGreaterThan(0);

    const ovColumn = mockWorksheet.columns.find(
      (col: any) => col.key === 'ovnota',
    );

    const dataProgColumn = mockWorksheet.columns.find(
      (col: any) => col.key === 'data_prog',
    );

    expect(ovColumn).toBeDefined();
    expect(dataProgColumn).toBeDefined();
    expect(dataProgColumn.style).toEqual({ numFmt: 'dd/mm/yyyy' });
  });
});
