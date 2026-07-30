import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorkServicesExeutionRepository } from 'src/infra/repositories/worksServices/workServicesExecutionRepository';

describe('WorkServicesExecutionRepository', () => {
  let repository: WorkServicesExeutionRepository;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkServicesExeutionRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<WorkServicesExeutionRepository>(
      WorkServicesExeutionRepository,
    );
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('finalizeServices', () => {
    it('should update programacao with finalization data', async () => {
      const mockData = {
        id: 1,
        prog: 80,
        exec: 75,
        idExecutionRestriction: 2,
        responsibility: 'João Silva',
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
        servicos: { updateMany: jest.fn().mockResolvedValue({}) },
      };

      await repository.finalizeServices(mockData, [1], mockTx as any);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          prog: 80,
          exec: 75,
          id_restricao_execucao: 2,
          nome_responsavel: 'João Silva',
        },
      });
      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        data: { id_programacao: null },
      });
      expect(mockTx.programacoes.update).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when schedule not found', async () => {
      const mockData = {
        id: 999,
        prog: 80,
        exec: 75,
        idExecutionRestriction: 2,
        responsibility: 'João Silva',
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockRejectedValue({ code: 'P2025' }),
        },
      };

      await expect(
        repository.finalizeServices(mockData, [], mockTx as any),
      ).rejects.toThrow('Agendamento com ID 999 não encontrado');
    });

    it('should propagate other errors', async () => {
      const mockData = {
        id: 1,
        prog: 80,
        exec: 75,
        idExecutionRestriction: 2,
        responsibility: 'João Silva',
      };

      const mockError = new Error('Database error');
      const mockTx = {
        programacoes: {
          update: jest.fn().mockRejectedValue(mockError),
        },
      };

      await expect(
        repository.finalizeServices(mockData, [], mockTx as any),
      ).rejects.toThrow('Database error');
    });

    it('should handle finalization with zero values', async () => {
      const mockData = {
        id: 1,
        prog: 0,
        exec: 0,
        idExecutionRestriction: 1,
        responsibility: 'Maria Santos',
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.finalizeServices(mockData, [], mockTx as any);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          prog: 0,
          exec: 0,
          id_restricao_execucao: 1,
          nome_responsavel: 'Maria Santos',
        },
      });
    });
  });

  describe('performServices', () => {
    const createMockTx = (
      overrides?: Partial<{
        programacoes_servicos: {
          updateMany: jest.Mock;
        };
        servicos: {
          update: jest.Mock;
        };
      }>,
    ) => ({
      programacoes_servicos: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        ...overrides?.programacoes_servicos,
      },
      servicos: {
        update: jest.fn().mockResolvedValue({ id: 1 }),
        ...overrides?.servicos,
      },
    });

    const mockTransaction = (mockTx: ReturnType<typeof createMockTx>) => {
      mockPrismaService.$transaction.mockImplementation(async (callback) =>
        callback(mockTx),
      );
    };

    it('should update services and programacoes_servicos in a transaction', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 50,
          idSchedule: 5,
        },
        {
          id: 2,
          qtdeRealizada: 75,
          idSchedule: 5,
        },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(2);
      expect(mockTx.servicos.update).toHaveBeenCalledTimes(2);
    });

    it('should update programacoes_servicos with correct data', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 50,
          idSchedule: 5,
        },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        data: { real: 50 },
        where: { id_servico: 1, id_programacao: 5 },
      });
    });

    it('should update servicos with correct data', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 50,
          idSchedule: 5,
        },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_real: 50 },
        where: { id: 1 },
      });
    });

    it('should handle empty data array', async () => {
      const mockData = [];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.servicos.update).not.toHaveBeenCalled();
    });

    it('should process multiple services in order', async () => {
      const mockData = [
        { id: 1, qtdeRealizada: 10, idSchedule: 5 },
        { id: 2, qtdeRealizada: 20, idSchedule: 5 },
        { id: 3, qtdeRealizada: 30, idSchedule: 5 },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      // Verificar primeira execução
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenNthCalledWith(
        1,
        {
          data: { real: 10 },
          where: { id_servico: 1, id_programacao: 5 },
        },
      );

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(1, {
        data: { qtde_real: 10 },
        where: { id: 1 },
      });

      // Verificar segunda execução
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenNthCalledWith(
        2,
        {
          data: { real: 20 },
          where: { id_servico: 2, id_programacao: 5 },
        },
      );

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(2, {
        data: { qtde_real: 20 },
        where: { id: 2 },
      });

      // Verificar terceira execução
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenNthCalledWith(
        3,
        {
          data: { real: 30 },
          where: { id_servico: 3, id_programacao: 5 },
        },
      );

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(3, {
        data: { qtde_real: 30 },
        where: { id: 3 },
      });
    });

    it('should rollback transaction on error', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 50,
          idSchedule: 5,
        },
      ];

      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockRejectedValue(new Error('Update failed')),
        },
      });

      mockTransaction(mockTx);

      await expect(repository.performServices(mockData)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle zero qtdeRealizada', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 0,
          idSchedule: 5,
        },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        data: { real: 0 },
        where: { id_servico: 1, id_programacao: 5 },
      });

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_real: 0 },
        where: { id: 1 },
      });
    });
  });
});
