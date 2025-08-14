import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ValidateAndConfirmSchedulesRepository } from 'src/infra/repositories/schedule/validateAndConfirmSchedulesRepository';

describe('ValidateAndConfirmSchedulesRepository', () => {
  let repository: ValidateAndConfirmSchedulesRepository;

  const mockTransaction = {
    programacoes: {
      updateMany: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateAndConfirmSchedulesRepository],
    }).compile();

    repository = module.get<ValidateAndConfirmSchedulesRepository>(
      ValidateAndConfirmSchedulesRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('validate', () => {
    it('Should call method validate and correctly update the schedules that have been validated', async () => {
      const data = [
        {
          id: 1,
          validate: true,
        },
        {
          id: 2,
          validate: true,
        },
      ];

      await repository.validate(data, mockTransaction);

      expect(mockTransaction.programacoes.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        data: {
          id_status_programacao: 2,
          validada: true,
        },
      });
    });
  });

  describe('confirm', () => {
    it('Should call method confirm and correctly update the schedules that have been confirmed', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
        {
          id: 2,
          confirm: true,
        },
      ];

      await repository.confirm(data, mockTransaction);

      expect(mockTransaction.programacoes.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        data: {
          id_status_programacao: 3,
          confirmada: true,
        },
      });
    });
  });
});
