import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/contracts/schedule/IGetScheduleValuesRepository';
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

  /**
   * 🔧 Builder padrão para evitar duplicação e manter consistência
   */
  const buildWork = (overrides: Partial<any> = {}) => ({
    ...mockQueryResponse[0],
    capex_mo_pend: 100,
    capex_mat_pend: 100,
    prog: 50,
    executado: 50,
    exec: null,
    ...overrides,
  });

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
      works: expect.any(Array),
      totals: { ...mockCount[0], total_exec: 0 },
    });

    expect(mockRepository.getValues).toHaveBeenCalledTimes(1);
  });

  it('should correctly format empty data', async () => {
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

    const result = await service.getValues({} as any);

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

  /**
   * ========================
   *  RESTRICTIONS TESTS
   * ========================
   */

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

  /**
   * ========================
   * 🚀 FORECAST TESTS
   * ========================
   */

  it('should calculate forecast when exec is null', async () => {
    const mockWork = buildWork({
      prog: 50,
      executado: 20,
      capex_mo_pend: 100,
      capex_mat_pend: 200,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.mo_forecast).toBe(50);
    expect(result.mat_forecast).toBe(100);
    expect(result.forecast_total).toBe(150);
  });

  it('should use progRate when exec exists and executado < 100%', async () => {
    const mockWork = buildWork({
      prog: 40,
      executado: 30,
      exec: 10,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.mo_forecast).toBe(40);
    expect(result.mat_forecast).toBe(40);
    expect(result.forecast_total).toBe(80);
  });

  it('should use factor = 1 when executado >= 100%', async () => {
    const mockWork = buildWork({
      executado: 100,
      exec: 100,
      capex_mo_pend: 300,
      capex_mat_pend: 200,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.mo_forecast).toBe(300);
    expect(result.mat_forecast).toBe(200);
    expect(result.forecast_total).toBe(500);
  });

  it('should clamp execTotal to 1', async () => {
    const mockWork = buildWork({
      prog: 80,
      executado: 50,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.mo_forecast).toBe(100);
    expect(result.mat_forecast).toBe(100);
    expect(result.forecast_total).toBe(200);
  });

  it('should return zero forecast when capex is zero', async () => {
    const mockWork = buildWork({
      capex_mo_pend: 0,
      capex_mat_pend: 0,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.forecast_total).toBe(0);
  });

  it('should handle null capex safely', async () => {
    const mockWork = buildWork({
      capex_mo_pend: null,
      capex_mat_pend: null,
    });

    mockRepository.getValues.mockResolvedValueOnce({
      works: [mockWork],
      resultTotals: mockCount,
    });

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.forecast_total).toBe(0);
  });
});
