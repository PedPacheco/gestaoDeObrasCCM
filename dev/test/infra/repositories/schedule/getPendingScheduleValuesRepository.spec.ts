import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetPendingScheduleValuesRepository } from 'src/infra/repositories/schedule/getPendingScheduleValuesRepository';

describe('GetPendingScheduleValuesRepository', () => {
  let repository: GetPendingScheduleValuesRepository;

  const prismaMock = {
    $queryRaw: jest.fn(),
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
        GetPendingScheduleValuesRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<GetPendingScheduleValuesRepository>(
      GetPendingScheduleValuesRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getValues', () => {
    it('should return the correct values without filters', async () => {
      const filters = {
        idParceira: undefined,
        idRegional: undefined,
      };

      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      const result = await repository.getValues(filters);

      const querySent = prismaMock.$queryRaw.mock.calls[0][0];

      expect(result).toEqual(mockResponse);
      expect(querySent.strings[0]).not.toContain('AND id_turma IN');
      expect(querySent.strings[0]).not.toContain(
        'AND municipios.id_regional IN',
      );
    });

    it('should return the correct values with filters', async () => {
      const filters = {
        idParceira: [1],
        idRegional: [1],
      };

      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getValues(filters);

      const querySent = prismaMock.$queryRaw.mock.calls[0][0];

      expect(querySent.values).toEqual([1, 1]);
    });
  });
});
