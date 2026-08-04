import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

jest.mock('exceljs');

describe('ExportForecastService', () => {
  let service: ExportForecastService;
  let repository: jest.Mocked<IExportRepository>;
  let deadlineService: jest.Mocked<DeadlineStatusService>;

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

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportForecastService,
        {
          provide: EXPORT_REPOSITORY,
          useValue: {
            exportForecast: jest.fn(),
          },
        },
        {
          provide: DeadlineStatusService,
          useValue: {
            calculate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExportForecastService>(ExportForecastService);
    repository = module.get(EXPORT_REPOSITORY);
    deadlineService = module.get(DeadlineStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve exportar dados corretamente com status calculado', async () => {
    const mockData = [
      { id: 1, nome: 'Obra 1' },
      { id: 2, nome: 'Obra 2' },
    ];

    repository.exportForecast.mockResolvedValue(mockData);
    deadlineService.calculate.mockReturnValue('NO PRAZO');

    const response = {} as Response;

    await service.export(response);

    // Repository chamado
    expect(repository.exportForecast).toHaveBeenCalledTimes(1);

    // Deadline chamado para cada item
    expect(deadlineService.calculate).toHaveBeenCalledTimes(2);
    expect(deadlineService.calculate).toHaveBeenNthCalledWith(1, mockData[0]);
    expect(deadlineService.calculate).toHaveBeenNthCalledWith(2, mockData[1]);

    // addRows chamado com dados enriquecidos
    expect(mockAddRows).toHaveBeenCalledTimes(1);

    const addedRows = mockAddRows.mock.calls[0][0];

    expect(addedRows[0]).toMatchObject({
      id: 1,
      nome: 'Obra 1',
      status_prazo: 'NO PRAZO',
    });

    expect(mockWrite).toHaveBeenCalledWith(response);
  });

  it('deve funcionar corretamente com lista vazia', async () => {
    repository.exportForecast.mockResolvedValue([]);

    const response = {} as Response;

    await service.export(response);

    expect(repository.exportForecast).toHaveBeenCalledTimes(1);
    expect(deadlineService.calculate).not.toHaveBeenCalled();
    expect(mockAddRows).not.toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalledWith(response);
  });

  it('deve dividir em múltiplos batches quando ultrapassar 1000 registros', async () => {
    const largeData = Array.from({ length: 2500 }).map((_, index) => ({
      id: index,
    }));

    repository.exportForecast.mockResolvedValue(largeData);
    deadlineService.calculate.mockReturnValue('OK');

    const response = {} as Response;

    await service.export(response);

    // 2500 registros com batchSize 1000 → 3 chamadas
    expect(mockAddRows).toHaveBeenCalledTimes(3);

    expect(mockAddRows.mock.calls[0][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[1][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[2][0]).toHaveLength(500);
  });

  it('deve configurar worksheet corretamente', async () => {
    repository.exportForecast.mockResolvedValue([]);

    const response = {} as Response;

    await service.export(response);

    expect(mockWorksheet.columns).toBeDefined();
    expect(Array.isArray(mockWorksheet.columns)).toBe(true);
    expect(mockWorksheet.columns.length).toBeGreaterThan(0);

    const prazoColumn = mockWorksheet.columns.find(
      (col: any) => col.key === 'prazo_fim',
    );

    expect(prazoColumn).toBeDefined();
  });
});
