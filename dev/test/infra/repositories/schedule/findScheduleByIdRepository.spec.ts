import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';

describe('FindScheduleByIdRepository', () => {
  let repository: FindScheduleByIdRepository;

  const mockPrisma = {
    programacoes: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindScheduleByIdRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<FindScheduleByIdRepository>(
      FindScheduleByIdRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('findById', () => {
    it('should find schedule by id and return data', async () => {
      mockPrisma.programacoes.findFirst.mockResolvedValue({
        id: 1,
        data_prog: '17-05-2025',
      });

      const result = await repository.findById(1);

      expect(mockPrisma.programacoes.findFirst).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({
        id: 1,
        data_prog: '17-05-2025',
      });
    });
  });
});
