import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';

describe('GetScheduleValues', () => {
  let service: GetScheduleValuesService;

  const mockQueryResponse = [
    {
      id: 9045,
      ovnota: '12398586',
      ordemdiagrama: '170000002955',
      diagrama: null,
      mun: 'MCR',
      prazo_fim: '2024-03-30T00:00:00.000Z',
      tipo_obra: 'POSTE',
      qtde_planejada: 1,
      mo_planejada: 3262.21,
      turma: 'LIG',
      executado: 0,
      entrada: '2024-08-01T00:00:00.000Z',
      data_prog: '2024-10-01T00:00:00.000Z',
      prog: 100,
      exec: null,
      observ_programacao: 'DESLIGAR BF-524904',
      mo_prog: 3262.21,
      mo_exec: 3262.21,
      num_dp: '15563352',
      hora_ini: '1970-01-01T14:30:00.000Z',
      hora_ter: '1970-01-01T17:30:00.000Z',
      equipe_linha_morta: 1,
      equipe_linha_viva: 1,
      equipe_regularizacao: 0,
      id_tecnico: 1,
      restricao_aberta: true,
    } as unknown as obras,
  ];

  const mockCount = [
    {
      total_obras: 1,
      total_mo_planejada: 3262.21,
      total_mo_exec: 0,
      total_qtde_planejada: 1,
    },
  ];

  const mockRepository = {
    getValues: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleValuesService,
        DeadlineStatusService,
        { provide: GET_SCHEDULE_VALUES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<GetScheduleValuesService>(GetScheduleValuesService);

    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct values with filters', async () => {
    const filters: GetScheduleValuesDTO = {
      dataInicial: '01/10/2024',
      dataFinal: '02/10/2024',
      executado: true,
      pendente: false,
      page: 0,
      idGrupo: [1],
      idStatus: [1],
      idStatusProgramacao: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idTipo: [1],
      ovnota: '1343',
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: mockQueryResponse,
      resultTotals: mockCount,
    });

    const result = await service.getValues(filters);

    expect(result).toEqual({
      works: mockQueryResponse,
      totals: { ...mockCount[0], total_exec: 0 },
    });
    expect(mockRepository.getValues).toHaveBeenCalledTimes(1);
  });

  it('should correctly format the data if no data is returned from the database query', async () => {
    const filters: GetScheduleValuesDTO = {
      dataInicial: '01/10/2024',
      dataFinal: '02/10/2024',
      executado: false,
      pendente: false,
      page: 0,
      idGrupo: undefined,
      idStatus: undefined,
      idStatusProgramacao: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idTipo: undefined,
      ovnota: undefined,
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [],
      resultTotals: [
        {
          total_obras: 0,
          total_mo_planejada: null,
          total_mo_exec: null,
          total_qtde_planejada: null,
        },
      ],
    });

    const result = await service.getValues(filters);

    expect(result).toEqual({
      works: [],
      totals: {
        total_exec: 0,
        total_obras: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_qtde_planejada: 0,
      },
    });
  });

  it('should set restricao_aberta = false when restriction IDs are 1 (restriction bypass rule)', async () => {
    const mockWork = {
      id: 1,
      id_restricao_prog1: 1,
      id_restricao_prog2: 1,
      status_restricao1: 'Qualquer',
      status_restricao2: 'Qualquer',
      data_resolucao1: null,
      data_resolucao2: null,
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: [
        {
          total_obras: 1,
          total_mo_planejada: 0,
          total_mo_exec: 0,
          total_qtde_planejada: 0,
        },
      ],
    });

    const result = await service.getValues({} as any);

    expect(result.works[0].restricao_aberta).toBe(false);
  });

  it('should set restricao_aberta = false when restriction IDs != 1 and statuses are resolved and dates exist', async () => {
    const mockWork = {
      id: 1,
      id_restricao_prog1: 5,
      id_restricao_prog2: 8,
      status_restricao1: 'Resolvido',
      status_restricao2: 'Resolvido',
      data_resolucao1: new Date(),
      data_resolucao2: new Date(),
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: [
        {
          total_obras: 1,
          total_mo_planejada: 0,
          total_mo_exec: 0,
          total_qtde_planejada: 0,
        },
      ],
    });

    const result = await service.getValues({} as any);

    expect(result.works[0].restricao_aberta).toBe(false);
  });

  it('should set restricao_aberta = true when restriction IDs != 1 but status_restricao1 resolved and data_resolucao1 exist', async () => {
    const mockWork = {
      id: 1,
      id_restricao_prog1: 7,
      status_restricao1: 'Resolvido',
      data_resolucao1: new Date(),
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: [
        {
          total_obras: 1,
          total_mo_planejada: 0,
          total_mo_exec: 0,
          total_qtde_planejada: 0,
        },
      ],
    });

    const result = await service.getValues({} as any);

    expect(result.works[0].restricao_aberta).toBe(true);
  });

  it('should set restricao_aberta = true when restriction IDs != 1 but status_restricao2 resolved and data_resolucao2 exist', async () => {
    const mockWork = {
      id: 1,
      id_restricao_prog2: 3,
      status_restricao2: 'Resolvido',
      data_resolucao2: new Date(),
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: [
        {
          total_obras: 1,
          total_mo_planejada: 0,
          total_mo_exec: 0,
          total_qtde_planejada: 0,
        },
      ],
    });

    const result = await service.getValues({} as any);

    expect(result.works[0].restricao_aberta).toBe(true);
  });

  it('should return "Prazo vencido" when prazo_fim is in the past', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2023-12-20T00:00:00.000Z', // 11 dias no passado
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);

    expect(works[0].status_prazo).toBe('Prazo vencido');
  });

  it('should return "Crítico" when 0 <= daysRemaining <= 16', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-01-10T00:00:00.000Z', // 9 dias restantes
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);

    expect(works[0].status_prazo).toBe('Crítico: 9 dia(s) restante(s)');
  });

  it('should return "Atenção" when 17 <= daysRemaining <= 30', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-01-25T00:00:00.000Z', // 24 dias restantes
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);

    expect(works[0].status_prazo).toBe('Atenção: 24 dias restantes');
  });

  it('should return "No prazo" when daysRemaining > 30', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-03-01T00:00:00.000Z', // 60 dias restantes
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);

    expect(works[0].status_prazo).toBe('No prazo: (60 dias restantes)');
  });

  it('should not set status_prazo if id_grupo !== 1', async () => {
    const mockWork = {
      id_grupo: 2, // Não deve calcular status_prazo
      prazo_fim: '2024-02-01T00:00:00.000Z',
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);

    expect(works[0].status_prazo).toBeUndefined();
  });
});
