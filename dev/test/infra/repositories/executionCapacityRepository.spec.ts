import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecutionCapacityRepository } from 'src/infra/repositories/executionCapacityRepository';
import { mockResponseDataExecutionCapacityRepository } from '../../../test/mocks/mockExecutionCapacityService';

describe('ExecutionCapacityRepository', () => {
  let repository: ExecutionCapacityRepository;

  const mockPrisma = {
    capacidade_execucao: { findMany: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionCapacityRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ExecutionCapacityRepository>(
      ExecutionCapacityRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('get', () => {
    it('should call findMany method of the capacidade_execucao table from prisma with filters', async () => {
      mockPrisma.capacidade_execucao.findMany.mockResolvedValue(
        mockResponseDataExecutionCapacityRepository,
      );

      const filters = {
        ano: '2025',
        id_turma: 1,
        id_regional: 1,
        equipe: 'LM',
      };

      const response = await repository.get(filters);

      expect(response).toEqual(mockResponseDataExecutionCapacityRepository);
      expect(mockPrisma.capacidade_execucao.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          ano: true,
          regionais: { select: { regional: true } },
          turmas: { select: { turma: true } },
          id_regional: true,
          tipo: true,
          qtd_equipes_rfp: true,
          equipe: true,
          jan: true,
          fev: true,
          mar: true,
          abr: true,
          mai: true,
          jun: true,
          jul: true,
          ago: true,
          set: true,
          out: true,
          nov: true,
          dez: true,
        },
        where: filters,
        orderBy: [{ regionais: { id: 'asc' } }, { equipe: { sort: 'asc' } }],
      });
    });
  });

  describe('getFinancialValues', () => {
    it('should call findMany method of the capacidade_execucao table ', async () => {
      mockPrisma.capacidade_execucao.findMany.mockResolvedValue(
        mockResponseDataExecutionCapacityRepository,
      );

      const response = await repository.getFinancialValue();

      expect(response).toEqual(mockResponseDataExecutionCapacityRepository);
      expect(mockPrisma.capacidade_execucao.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          ano: true,
          regionais: { select: { regional: true } },
          turmas: { select: { turma: true } },
          should_cost: true,
          jan: true,
          fev: true,
          mar: true,
          abr: true,
          mai: true,
          jun: true,
          jul: true,
          ago: true,
          set: true,
          out: true,
          nov: true,
          dez: true,
        },
      });
    });
  });

  describe('update', () => {
    it('should create a transaction and in of transaction, should call updateMany method of capacidade_execucao with updated data', async () => {
      mockPrisma.$transaction.mockResolvedValueOnce(undefined);

      await repository.update([
        { id: 1, jan: 4 },
        { id: 2, fev: 5 },
      ]);

      expect(mockPrisma.capacidade_execucao.updateMany).toHaveBeenCalledTimes(
        2,
      );
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

      expect(mockPrisma.capacidade_execucao.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: { jan: 4 },
      });
    });
  });
});
