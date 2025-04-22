import { GetPendingScheduleValuesService } from 'src/domain/services/schedule/getPendingScheduleValues.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { GET_PENDING_SCHEDULE_VALUES_REPOSITORY } from 'src/domain/repositories/schedule/IGetPendingScheduleValuesRepository';

describe('GetPendingScheduleValues', () => {
  let service: GetPendingScheduleValuesService;

  const mockRepository = {
    getValues: jest.fn(),
  };

  const mockResponse = [
    {
      id: 17856,
      ovnota: '15296621',
      ordemdiagrama: '170000015492',
      diagrama: null,
      mun: 'TAU',
      entrada: '2024-06-25T00:00:00.000Z',
      tipo_obra: 'SPACER CABLE',
      qtde_planejada: 0.49208,
      mo_planejada: 57599.1411,
      turma: 'START-TAU',
      executado: 85,
      data_prog: '2024-09-09T00:00:00.000Z',
      prog: 3,
      exec: null,
      observ_programacao: 'LIVRE',
      mo_prog: 1727.974233,
      mo_exec: 0,
    } as unknown as obras,
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetPendingScheduleValuesService,
        {
          provide: GET_PENDING_SCHEDULE_VALUES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetPendingScheduleValuesService>(
      GetPendingScheduleValuesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct values without filters', async () => {
    const filters = {
      idParceira: undefined,
      idRegional: undefined,
    };

    mockRepository.getValues.mockResolvedValue(mockResponse);

    const result = await service.getValues(filters);

    expect(result).toEqual(mockResponse);
  });
});
