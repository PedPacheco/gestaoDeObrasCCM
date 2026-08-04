import { ExecMonitoringService } from 'src/application/usecases/schedule/execMonitoring.service';
import { EXEC_MONITORING_REPOSITORY } from 'src/domain/contracts/schedule/IExecMonitoringRepository';

import { Test } from '@nestjs/testing';

describe('ExecMonitoringService', () => {
  let service: ExecMonitoringService;

  const mockRepository = {
    getData: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExecMonitoringService,
        {
          provide: EXEC_MONITORING_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ExecMonitoringService>(ExecMonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call get method and return data', async () => {
    const data = [
      {
        mes: 'Jan',
        regional: 'São José',
        id_regional: 1,
        turma: 'ENGELMIG',
        total: 200,
        acompanhado: 80,
        nao_acompanhado: 120,
      },
    ];

    mockRepository.getData.mockResolvedValue(data);

    const result = await service.getData({
      dataFinal: '2026-04-01',
      dataInicial: '2026-05-01',
    });

    expect(result).toEqual([
      {
        ...data[0],
        pct: 40,
        naoAcompanhado: 120,
        parceira: 'ENGELMIG',

        nao_acompanhado: undefined,
        turma: undefined,
      },
    ]);
    expect(mockRepository.getData).toHaveBeenCalledWith({
      dataFinal: '2026-04-01',
      dataInicial: '2026-05-01',
    });
  });

  it('should call get method and return data with total equal 0', async () => {
    const data = [
      {
        mes: 'Jan',
        regional: 'São José',
        id_regional: 1,
        turma: 'ENGELMIG',
        total: 0,
        acompanhado: 0,
        nao_acompanhado: 0,
      },
    ];

    mockRepository.getData.mockResolvedValue(data);

    const result = await service.getData({
      dataFinal: '2026-04-01',
      dataInicial: '2026-05-01',
    });

    expect(result).toEqual([
      {
        ...data[0],
        pct: 0,
        naoAcompanhado: 0,
        parceira: 'ENGELMIG',

        nao_acompanhado: undefined,
        turma: undefined,
      },
    ]);
    expect(mockRepository.getData).toHaveBeenCalledWith({
      dataFinal: '2026-04-01',
      dataInicial: '2026-05-01',
    });
  });
});
