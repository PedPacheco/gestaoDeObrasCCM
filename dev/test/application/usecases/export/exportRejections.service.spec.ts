import { Test, TestingModule } from '@nestjs/testing';
import * as Exceljs from 'exceljs';
import { Response } from 'express';
import type { Mock, Mocked } from 'vitest';

import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';
import { ExportRejectionsResponse } from 'src/domain/types';

vi.mock('exceljs');

const { WorkbookMock } = vi.hoisted(() => ({
  WorkbookMock: vi.fn(),
}));

// Expose Workbook both as named and default export (CJS interop)
vi.mock('exceljs', () => ({
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock },
}));

export const mockExportRejectionsResponse = (
  overrides: Partial<ExportRejectionsResponse> = {},
): ExportRejectionsResponse => ({
  obras: { ovnota: '5176447' },
  data_prog: new Date('2026-10-15T00:00:00Z'),
  motivo: 'Material em falta',
  hora_ini: new Date('1970-01-01T08:00:00Z'),
  hora_ter: new Date('1970-01-01T12:00:00Z'),
  prog: 100,
  descricao: 'Poste não disponível no almoxarifado.',
  equip_desligado: 'Chave fusível CF-123',
  equipe_linha_morta: 2,
  equipe_linha_viva: 1,
  equipe_regularizacao: 0,
  tipo_servico: 'Obra livre',
  observacao_programacao: 'Programação reprovada pelo validador.',
  ...overrides,
});

describe('ExportRejectionsService', () => {
  let service: ExportRejectionsService;
  let repository: Mocked<IExportRepository>;

  let mockAddRows: Mock;
  let mockWrite: Mock;
  let mockWorksheet: any;

  beforeEach(async () => {
    mockAddRows = vi.fn();
    mockWrite = vi.fn().mockResolvedValue(undefined);

    mockWorksheet = {
      columns: [],
      addRows: mockAddRows,
    };

    const mockWorkbook = {
      addWorksheet: vi.fn().mockReturnValue(mockWorksheet),
      xlsx: {
        write: mockWrite,
      },
    };

    (Exceljs.Workbook as Mock).mockImplementation(function () {
      return mockWorkbook;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportRejectionsService,
        {
          provide: EXPORT_REPOSITORY,
          useValue: {
            exportRejections: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExportRejectionsService>(ExportRejectionsService);
    repository = module.get(EXPORT_REPOSITORY);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve exportar dados corretamente formatando ovnota', async () => {
    const mockData = [
      mockExportRejectionsResponse(),
      mockExportRejectionsResponse({
        obras: { ovnota: '5176448' },
        motivo: 'Falta de equipa',
      }),
    ];

    repository.exportRejections.mockResolvedValue(mockData);

    const response = {} as Response;

    await service.export(response);

    expect(repository.exportRejections).toHaveBeenCalledTimes(1);
    expect(mockAddRows).toHaveBeenCalledTimes(1);

    const addedRows = mockAddRows.mock.calls[0][0];

    expect(addedRows).toHaveLength(2);
    expect(addedRows[0]).toMatchObject({
      motivo: 'Material em falta',
      ovnota: '5176447',
    });
    expect(addedRows[1]).toMatchObject({
      motivo: 'Falta de equipa',
      ovnota: '5176448',
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
    const largeData = Array.from({ length: 2500 }, (_, index) =>
      mockExportRejectionsResponse({
        obras: { ovnota: `OV-${index}` },
      }),
    );

    repository.exportRejections.mockResolvedValue(largeData);

    const response = {} as Response;

    await service.export(response);

    // 2500 registos → 3 batches (1000, 1000, 500)
    expect(mockAddRows).toHaveBeenCalledTimes(3);
    expect(mockAddRows.mock.calls[0][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[1][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[2][0]).toHaveLength(500);

    // A ordem e a formatação mantêm-se entre batches
    expect(mockAddRows.mock.calls[0][0][0].ovnota).toBe('OV-0');
    expect(mockAddRows.mock.calls[2][0][499].ovnota).toBe('OV-2499');

    expect(mockWrite).toHaveBeenCalledWith(response);
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
