import { Test, TestingModule } from '@nestjs/testing';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import type { Mock, Mocked } from 'vitest';

import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { ExportForecastResponse } from 'src/domain/types';

vi.mock('exceljs');

const { WorkbookMock } = vi.hoisted(() => ({
  WorkbookMock: vi.fn(),
}));

// Expose Workbook both as named and default export (CJS interop)
vi.mock('exceljs', () => ({
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock },
}));

export const mockExportForecastResponse = (
  overrides: Partial<ExportForecastResponse> = {},
): ExportForecastResponse => ({
  row_id: 1n,
  ovnota: '5176447',
  diagrama: 'DG-100200',
  ordem_dci: null,
  ordem_dcd: null,
  ordem_dca: null,
  ordem_dcim: null,
  municipio: 'São José dos Campos',
  regional: 'Vale do Paraíba',
  conjunto: 'Conjunto A',
  circuito: 'SJC-01',
  prazo_fim: new Date('2026-12-31T00:00:00Z'),
  status_ov_sap: 1,
  tipo_obra: 'Expansão',
  grupo: 'Grupo 1',
  qtde_planejada: 10,
  qtde_pend: 4,
  qtde_prog: 6,
  mo_planejada: 15000,
  mo_prog: 9000,
  capex_mat_plan: 20000,
  capex_mat_pend: 8000,
  mat_prog: 12000,
  capex_mo_plan: 15000,
  capex_mo_pend: 6000,
  servico_prog: 9000,
  parceira: 'Parceira X',
  executado: 60,
  status: 'Em execução',
  status_programacao: 'Confirmada',
  criado_em: new Date('2026-10-01T10:00:00Z'),
  usuario_criador: 'João Silva',
  usuario_ultima_atualizacao: 'Maria Souza',
  reprovada: false,
  validada: true,
  confirmada: true,
  data_prog: new Date('2026-10-15T00:00:00Z'),
  prog: 100,
  exec: null,
  chi: 0,
  chave_provisoria: false,
  num_dp: null,
  hora_ini: new Date('1970-01-01T08:00:00Z'),
  hora_ter: new Date('1970-01-01T12:00:00Z'),
  equipe_linha_morta: 2,
  equipe_linha_viva: 1,
  equipe_regularizacao: 0,
  tecnico: 'Técnico 1',
  restricao_execucao: 'Sem restrição',
  nome_responsavel_execucao: null,
  restricao_prog1: 'Sem restrição',
  responsabilidade1: null,
  nome_responsavel: null,
  area_responsavel1: null,
  status_restricao1: null,
  data_resolucao1: null,
  restricao_prog2: 'Sem restrição',
  responsabilidade2: null,
  nome_responsavel2: null,
  area_responsavel2: null,
  status_restricao2: null,
  data_resolucao2: null,
  id_grupo: 1,
  ...overrides,
});

describe('ExportForecastService', () => {
  let service: ExportForecastService;
  let repository: Mocked<IExportRepository>;
  let deadlineService: Mocked<DeadlineStatusService>;

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

    (ExcelJS.Workbook as Mock).mockImplementation(function () {
      return mockWorkbook;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportForecastService,
        {
          provide: EXPORT_REPOSITORY,
          useValue: {
            exportForecast: vi.fn(),
          },
        },
        {
          provide: DeadlineStatusService,
          useValue: {
            calculate: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExportForecastService>(ExportForecastService);
    repository = module.get(EXPORT_REPOSITORY);
    deadlineService = module.get(DeadlineStatusService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('deve exportar dados corretamente com status calculado', async () => {
    const mockData = [
      mockExportForecastResponse(),
      mockExportForecastResponse({ row_id: 2n, ovnota: '5176448' }),
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
      ovnota: '5176447',
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
    const largeData = Array.from({ length: 2500 }, (_, index) =>
      mockExportForecastResponse({
        row_id: BigInt(index + 1),
        ovnota: String(5_000_000 + index),
      }),
    );

    repository.exportForecast.mockResolvedValue(largeData);
    deadlineService.calculate.mockReturnValue('NO PRAZO');

    const response = {} as Response;

    await service.export(response);

    expect(deadlineService.calculate).toHaveBeenCalledTimes(2500);

    // 2500 registos com batchSize 1000 → 3 chamadas
    expect(mockAddRows).toHaveBeenCalledTimes(3);
    expect(mockAddRows.mock.calls[0][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[1][0]).toHaveLength(1000);
    expect(mockAddRows.mock.calls[2][0]).toHaveLength(500);

    // A ordem é preservada entre os batches
    expect(mockAddRows.mock.calls[0][0][0].ovnota).toBe('5000000');
    expect(mockAddRows.mock.calls[2][0][499].ovnota).toBe('5002499');

    expect(mockWrite).toHaveBeenCalledWith(response);
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
