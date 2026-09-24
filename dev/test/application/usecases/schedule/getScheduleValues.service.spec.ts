import { GetScheduleValuesService } from 'src/application/usecases/works/schedule/getScheduleValues.service';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';

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

  const mockServiceScheduleHistory = [
    {
      id: 1,
      id_programacao: 100,
      id_servico: 200,
      adicional: 2,
      real: 8,
      prog: 10,
      servicos: {
        operacao: 'OP01',
        numero_operacao: '001',
        descricao_operacao: 'Instalação de poste',
        ponto: 'P16',
        qtde_plan: 12,
        viabilizado: 10,
        servicos_contratos: {
          texto_breve: 'Serviço de instalação',
          material: 'SER001',
          preco: 150.5,
        },
        materiais: null,
      },
      programacoes: {
        data_prog: new Date('2026-09-10'),
      },
      equipes: {
        equipe: 'Equipe A',
        perfil: 'Eletricista',
      },
    },
    {
      id: 2,
      id_programacao: 101,
      id_servico: 201,
      adicional: 1,
      real: 5,
      prog: 6,
      servicos: {
        operacao: 'OP02',
        numero_operacao: '002',
        descricao_operacao: 'Fornecimento de material',
        ponto: 'V02',
        qtde_plan: 8,
        viabilizado: 6,
        servicos_contratos: null,
        materiais: {
          codigo: 'MAT001',
          descricao: 'Cabo de Alumínio',
          preco: {
            toNumber: jest.fn().mockReturnValue(45.9),
          },
        },
      },
      programacoes: {
        data_prog: new Date('2026-09-11'),
      },
      equipes: {
        equipe: 'Equipe B',
        perfil: 'Técnico',
      },
    },
  ];

  const mockCount = {
    total_obras: 1,
    total_mo_planejada: 3262.21,
    total_mo_exec: 0,
    total_qtde_planejada: 1,
  };

  const mockRepository = {
    getValues: jest.fn(),
  };

  const mockQueriesServicesService = {
    getServiceScheduleHistoryByIdSchedule: jest.fn(),
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
        {
          provide: QueriesServicesService,
          useValue: mockQueriesServicesService,
        },
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
      idTecnico: [1],
      ovnota: '1343',
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: mockQueryResponse,
      resultTotals: mockCount,
    });

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

    const result = await service.getValues(filters);

    expect(result).toEqual({
      works: expect.any(Array),
      totals: {
        total_exec: 0,
        total_mo_exec: 0,
        total_mo_planejada: 3262.21,
        total_obras: 1,
        total_qtde_planejada: 1,
      },
    });

    expect(mockRepository.getValues).toHaveBeenCalledTimes(1);
  });

  it('should correctly format empty data', async () => {
    mockRepository.getValues.mockResolvedValueOnce({
      works: [],
      resultTotals: null,
    });

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

    const result = await service.getValues({} as any);

    expect(result).toEqual({
      works: [],
      totals: {
        total_obras: 0,
        total_exec: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_qtde_planejada: 0,
      },
    });
  });

  it('should return with not services', async () => {
    mockRepository.getValues.mockResolvedValueOnce({
      works: mockQueryResponse.map((item) => ({ ...item, servicos: null })),
      resultTotals: mockCount,
    });

    // Return empty array so calculateCostPointByPointSchedule receives []
    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      [],
    );

    const result = await service.getValues({} as any);

    expect(result).toEqual({
      works: expect.any(Array),
      totals: {
        total_exec: 0,
        total_mo_exec: 0,
        total_mo_planejada: 3262.21,
        total_obras: 1,
        total_qtde_planejada: 1,
      },
    });

    result.works.forEach((work) => {
      expect(work).toEqual(
        expect.objectContaining({
          moPlanejadaPontoAPonto: 0,
          moExecutadoPontoAPonto: 0,
        }),
      );
    });

    expect(mockRepository.getValues).toHaveBeenCalledTimes(1);
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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

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

    mockQueriesServicesService.getServiceScheduleHistoryByIdSchedule.mockResolvedValue(
      mockServiceScheduleHistory,
    );

    const { works } = await service.getValues({} as any);
    const result = works[0] as any;

    expect(result.forecast_total).toBe(0);
  });
});
