import { GetValuesWeeklyScheduleService } from 'src/application/schedule/getValuesWeeklySchedule.service';

import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY } from 'src/domain/repositories/schedule/IGetValuesWeeklyScheduleRepository';

describe('GetValuesWeeklyScheduleService', () => {
  let service: GetValuesWeeklyScheduleService;

  const mockQueryResponse = [
    {
      id: 5839,
      ovnota: '14417407',
      tipos: {
        tipo_abrev: 'SPACER',
      },
      programacoes: [
        {
          data_prog: '2024-10-11T00:00:00.000Z',
          hora_ini: '1970-01-01T08:00:00.000Z',
          hora_ter: '1970-01-01T17:00:00.000Z',
        },
      ],
      turmas: {
        turma: 'ENGELMIG',
      },
    } as unknown as obras,
  ];

  const mockResponse = [
    {
      id: 5839,
      ovnota: '14417407',

      tipo_abrev: 'SPACER',
      programacoes: [
        {
          data_prog: '2024-10-11T00:00:00.000Z',
          hora_ini: '1970-01-01T08:00:00.000Z',
          hora_ter: '1970-01-01T17:00:00.000Z',
        },
      ],

      parceira: 'ENGELMIG',
    },
  ];

  const mockRepository = {
    getValues: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetValuesWeeklyScheduleService,
        {
          provide: GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetValuesWeeklyScheduleService>(
      GetValuesWeeklyScheduleService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct values with filters', async () => {
    const filters: GetValueWeeklyScheduleDTO = {
      dataInicial: '01/09/2024',
      dataFinal: '10/09/2024',
      executado: true,
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idTipo: [1],
    };

    mockRepository.getValues.mockResolvedValue(mockQueryResponse);

    const result = await service.getValues(filters);

    expect(result).toEqual(mockResponse);
  });
});
