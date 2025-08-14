import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { UpdateWorkRepository } from 'src/infra/repositories/works/updateWorkRepository';

describe('UpdateWorkRepository', () => {
  let repository: UpdateWorkRepository;

  const mockTx = {
    obras: {
      update: jest.fn(), // ou o método que você espera
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateWorkRepository],
    }).compile();

    repository = module.get<UpdateWorkRepository>(UpdateWorkRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('update', () => {
    it('should call transaction prisma transaction to update works', async () => {
      await repository.update(
        {
          id_status: 1,
          id_turma: 2,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        3,
        mockTx,
      );

      expect(mockTx.obras.update).toHaveBeenCalledWith({
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
