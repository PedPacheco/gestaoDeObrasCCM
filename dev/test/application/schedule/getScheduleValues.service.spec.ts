import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';

import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { GET_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';

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
        { provide: GET_SCHEDULE_VALUES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<GetScheduleValuesService>(GetScheduleValuesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      data: '10/2024',
      tipoFiltro: 'month',
      executado: true,
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idTipo: [1],
      page: 1,
    };

    mockRepository.getValues.mockResolvedValueOnce({
      works: mockQueryResponse,
      resultTotals: mockCount,
    });

    const result = await service.getValues(filters);

    expect(result).toEqual({ works: mockQueryResponse, totals: mockCount[0] });
    expect(mockRepository.getValues).toHaveBeenCalledTimes(1);
  });

  it('should correctly format the data if no data is returned from the database query', async () => {
    const filters = {
      data: '01/10/2024',
      tipoFiltro: 'day',
      executado: false,
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idTipo: undefined,
      page: undefined,
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
        total_obras: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_qtde_planejada: 0,
      },
    });
  });
});
