import { GetTotalValuesScheduleService } from 'src/application/usecases/schedule/getTotalValuesSchedule.service';
import { GET_TOTAL_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';

import { Test } from '@nestjs/testing';

describe('GetTotalValuesScheduleService', () => {
  let service: GetTotalValuesScheduleService;

  const mockResponseQuery = [
    {
      turma: 'COMPEL',
      jan_prog: 1391543.3200890007,
      jan_exec: 888399.434949,
      fev_prog: 1055475.1537599994,
      fev_exec: 915527.9687599996,
      mar_prog: 1138471.1047400003,
      mar_exec: 825064.4695300002,
      abr_prog: 920539.8466199996,
      abr_exec: 827996.7924,
      mai_prog: 1221554.39156,
      mai_exec: 705520.8621000001,
      jun_prog: 1098224.7013000003,
      jun_exec: 778519.4827,
      jul_prog: 0,
      jul_exec: 0,
      ago_prog: 0,
      ago_exec: 0,
      set_prog: 0,
      set_exec: 0,
      out_prog: 0,
      out_exec: 0,
      nov_prog: 0,
      nov_exec: 0,
      dez_prog: 0,
      dez_exec: 0,
      total_prog: 6825808.518069001,
      total_exec: 4941029.010438991,
      ano: 2024,
    },
  ];

  const mockResponse = [
    {
      turma: 'COMPEL',
      jan: {
        prog: 1391543.3200890007,
        exec: 888399.434949,
      },
      fev: {
        prog: 1055475.1537599994,
        exec: 915527.9687599996,
      },
      mar: {
        prog: 1138471.1047400003,
        exec: 825064.4695300002,
      },
      abr: {
        prog: 920539.8466199996,
        exec: 827996.7924,
      },
      mai: {
        prog: 1221554.39156,
        exec: 705520.8621000001,
      },
      jun: {
        prog: 1098224.7013000003,
        exec: 778519.4827,
      },
      jul: {
        prog: 0,
        exec: 0,
      },
      ago: {
        prog: 0,
        exec: 0,
      },
      set: {
        prog: 0,
        exec: 0,
      },
      out: {
        prog: 0,
        exec: 0,
      },
      nov: {
        prog: 0,
        exec: 0,
      },
      dez: {
        prog: 0,
        exec: 0,
      },
      total: {
        prog: 6825808.518069001,
        exec: 4941029.010438991,
      },
    },
  ];

  const mockRepository = {
    getTotalValues: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetTotalValuesScheduleService,
        {
          provide: GET_TOTAL_SCHEDULE_VALUES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetTotalValuesScheduleService>(
      GetTotalValuesScheduleService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      idRegional: [1],
      idTipo: [1],
      idParceira: [1],
      idMunicipio: [1],
      idCircuito: [1],
      idGrupo: [1],
      ano: 2024,
    };

    mockRepository.getTotalValues.mockResolvedValue(mockResponseQuery);

    const result = await service.getTotalValues(filters);

    expect(result).toEqual(mockResponse);
  });
});
