import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';

describe('StatusFlowRepository', () => {
  let repository: StatusFlowRepository;

  const mockTransaction = {
    programacoes: {
      update: jest.fn(),
    },
    obras: {
      update: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StatusFlowRepository],
    }).compile();

    repository = module.get<StatusFlowRepository>(StatusFlowRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('updateScheduleStatus', () => {
    it('should change the schedule status to the value that was sent', async () => {
      await repository.updateScheduleStatus(3, 1, mockTransaction);

      expect(mockTransaction.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { id_status_programacao: 3 },
      });
    });
  });

  describe('updateStatusWorks', () => {
    it('should change the status work to the value that was sent', async () => {
      await repository.updateStatusWorks(3, 1, mockTransaction, {
        data_conclusao: new Date('2025-08-17'),
        totalExecuted: 80,
      });

      expect(mockTransaction.obras.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_status: 3,
          data_conclusao: new Date('2025-08-17'),
          executado: 80,
        },
      });
    });

    it('should throw error if  error occurs', async () => {
      const error = new Error('DB connection failed');
      (mockTransaction.obras.update as jest.Mock).mockRejectedValue(error);

      await expect(
        repository.updateStatusWorks(3, 5, mockTransaction),
      ).rejects.toThrow('DB connection failed');
    });
  });
});
