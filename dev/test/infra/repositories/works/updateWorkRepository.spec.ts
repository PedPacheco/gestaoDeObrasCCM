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
          data_empreitamento: new Date('05-17-2025'),
        },
        3,
        mockTx,
      );

      expect(mockTx.obras.update as jest.Mock).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          id_status: 1,
          id_turma: 2,
          data_empreitamento: new Date('05-17-2025'),
        },
      });
    });

    it('should throw an error and log it if prisma fails', async () => {
      const error = new Error('Prisma failure');

      (mockTx.obras.update as jest.Mock).mockRejectedValueOnce(error);

      const loggerSpy = jest.spyOn(repository['logger'], 'error');

      await expect(
        repository.update(
          {
            id_status: 1,
            id_turma: 2,
            data_empreitamento: new Date('05-17-2025'),
          },
          3,
          mockTx,
        ),
      ).rejects.toThrow(error);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Erro ao editar obra: ',
        error.stack,
      );
    });
  });
});
