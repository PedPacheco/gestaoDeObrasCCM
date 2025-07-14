import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateWorkRepository } from 'src/infra/repositories/works/updateWorkRepository';

describe('UpdateWorkRepository', () => {
  let repository: UpdateWorkRepository;

  const mockPrisma = {
    obras: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWorkRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateWorkRepository>(UpdateWorkRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('insertMarketWorks', () => {
    it('should call prisma.obras.createMany with mapped market works', async () => {
      await repository.update(
        {
          id_status: 1,
          id_turma: 2,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        3,
      );

      expect(mockPrisma.obras.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          id_status: 1,
          id_turma: 2,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
      });
    });
  });
});
