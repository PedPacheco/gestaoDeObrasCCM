import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
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

  describe('reascheduleServices', () => {
    const mockTx = {
      programacoes_servicos: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      programacoes: { update: jest.fn().mockResolvedValue({ count: 1 }) },
    };

    it('should update programacoes_servicos and programacoes in a transaction', async () => {
      const mockData = [
        { id_servico: 1 },
        { id_servico: 2 },
        { id_servico: 3 },
      ];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(
        mockData,
        1,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes.update).toHaveBeenCalledTimes(1);
    });

    it('should zero real for the given services within the schedule, and zero exec on the schedule', async () => {
      const mockData = [{ id_servico: 1 }];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(
        mockData,
        1,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        where: { id_servico: { in: [1] }, id_programacao: 1 },
        data: { real: 0 },
      });
      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { exec: 0 },
      });
    });

    it('should process multiple services correctly', async () => {
      const mockData = [
        { id_servico: 1 },
        { id_servico: 2 },
        { id_servico: 3 },
      ];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(
        mockData,
        1,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenNthCalledWith(
        1,
        {
          where: { id_servico: { in: [1, 2, 3] }, id_programacao: 1 },
          data: { real: 0 },
        },
      );
      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { exec: 0 },
      });
    });

    it('should handle empty data array without opening a transaction', async () => {
      const mockData = [];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(
        mockData,
        1,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(mockTx.programacoes_servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.programacoes.update).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockData = [{ id_servico: 1 }, { id_servico: 2 }];
      const mockError = new Error('Update failed');

      const mockTxWithError = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        programacoes: {
          update: jest.fn().mockRejectedValue(mockError),
        },
      };

      await expect(
        repository.reascheduleServices(
          mockData,
          1,
          mockTxWithError as unknown as Prisma.TransactionClient,
        ),
      ).rejects.toThrow('Update failed');

      expect(
        mockTxWithError.programacoes_servicos.updateMany,
      ).toHaveBeenCalledWith({
        where: { id_servico: { in: [1, 2] }, id_programacao: 1 },
        data: { real: 0 },
      });

      expect(mockTxWithError.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { exec: 0 },
      });
    });

    it('should handle single service reschedule', async () => {
      const mockData = [{ id_servico: 999 }];

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(
        mockData,
        1,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        where: { id_servico: { in: [999] }, id_programacao: 1 },
        data: { real: 0 },
      });
    });

    it('should map service ids correctly and scope by the given scheduleId', async () => {
      const mockData = [
        { id_servico: 10 },
        { id_servico: 20 },
        { id_servico: 30 },
      ];

      mockPrismaService.$transaction.mockImplementation(async (callback) =>
        callback(mockTx),
      );

      await repository.reascheduleServices(
        mockData,
        7,
        mockTx as unknown as Prisma.TransactionClient,
      );

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        where: {
          id_servico: { in: [10, 20, 30] },
          id_programacao: 7,
        },
        data: { real: 0 },
      });
      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { exec: 0 },
      });
    });
  });

  describe('finalizeServices', () => {
    it('should update programacao with finalization data', async () => {
      const mockData = {
        id: 1,
        prog: 80,
        exec: 75,
        idExecutionRestriction: 2,
        responsibility: 'João Silva',
        userId: 42,
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
        servicos: { updateMany: jest.fn().mockResolvedValue({}) },
      };

      await repository.finalizeServices(mockData, mockTx as any);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          prog: 80,
          exec: 75,
          id_restricao_execucao: 2,
          nome_responsavel: 'João Silva',
          id_usuario_ultima_atualizacao: 42,
        },
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
        userId: 42,
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockRejectedValue({ code: 'P2025' }),
        },
      };

      await expect(
        repository.finalizeServices(mockData, mockTx as any),
      ).rejects.toThrow('Agendamento com ID 999 não encontrado');
    });

    it('should propagate other errors', async () => {
      const mockData = {
        id: 1,
        prog: 80,
        exec: 75,
        idExecutionRestriction: 2,
        responsibility: 'João Silva',
        userId: 42,
      };

      const mockError = new Error('Database error');
      const mockTx = {
        programacoes: {
          update: jest.fn().mockRejectedValue(mockError),
        },
      };

      await expect(
        repository.finalizeServices(mockData, mockTx as any),
      ).rejects.toThrow('Database error');
    });

    it('should handle finalization with zero values', async () => {
      const mockData = {
        id: 1,
        prog: 0,
        exec: 0,
        idExecutionRestriction: 1,
        responsibility: 'Maria Santos',
        userId: 7,
      };

      const mockTx = {
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.finalizeServices(mockData, mockTx as any);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          prog: 0,
          exec: 0,
          id_restricao_execucao: 1,
          nome_responsavel: 'Maria Santos',
          id_usuario_ultima_atualizacao: 7,
        },
      });
    });
  });

  describe('performServices', () => {
    const createMockTx = (
      overrides?: Partial<{
        programacoes_servicos: {
          updateMany: jest.Mock;
          aggregate: jest.Mock;
        };
        servicos: {
          update: jest.Mock;
        };
      }>,
    ) => ({
      programacoes_servicos: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        // Mock genérico: retorna ambos os campos, o código só lê o que pediu
        // em cada chamada (_sum.real na 1ª aggregate, _sum.prog na 2ª).
        aggregate: jest.fn().mockResolvedValue({ _sum: { real: 5, prog: 2 } }),
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

    it('should update programacoes_servicos and servicos in a transaction', async () => {
      const mockData = [
        { id: 1, qtdeRealizada: 50, idSchedule: 5 },
        { id: 2, qtdeRealizada: 75, idSchedule: 5 },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(2);
      // 2 serviços únicos x 2 aggregates (total real + prog de outras) = 4
      expect(mockTx.programacoes_servicos.aggregate).toHaveBeenCalledTimes(4);
      expect(mockTx.servicos.update).toHaveBeenCalledTimes(2);
    });

    it('should update programacoes_servicos with the realizada quantity, scoped by servico and schedule', async () => {
      const mockData = [{ id: 1, qtdeRealizada: 50, idSchedule: 5 }];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        data: { real: 50 },
        where: { id_servico: 1, id_programacao: 5 },
      });
    });

    it('should compute qtde_prog as (real informado + prog das outras programações) and qtde_real from the total aggregate', async () => {
      const mockData = [{ id: 1, qtdeRealizada: 50, idSchedule: 5 }];

      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          aggregate: jest
            .fn()
            .mockResolvedValueOnce({ _sum: { real: 120 } }) // total (qtde_real)
            .mockResolvedValueOnce({ _sum: { prog: 8 } }), // outras programações
        },
      });

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      // qtde_prog = realAtual (50, vindo do DTO) + prog das outras (8) = 58
      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_prog: 58, qtde_real: 120 },
        where: { id: 1 },
      });
    });

    it('should query the total aggregate by id_servico and the outras-programações aggregate excluding the current schedules', async () => {
      // Mesmo serviço lançado em 2 programações diferentes no mesmo batch.
      const mockData = [
        { id: 1, qtdeRealizada: 10, idSchedule: 5 },
        { id: 1, qtdeRealizada: 20, idSchedule: 7 },
      ];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.aggregate).toHaveBeenNthCalledWith(
        1,
        {
          where: { id_servico: 1 },
          _sum: { real: true },
        },
      );
      expect(mockTx.programacoes_servicos.aggregate).toHaveBeenNthCalledWith(
        2,
        {
          where: {
            id_servico: 1,
            id_programacao: { notIn: [5, 7] },
          },
          _sum: { prog: true },
        },
      );

      // realAtual = 10 + 20 = 30 (soma dos DTOs deste serviço no batch)
      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_prog: 30 + 2, qtde_real: 5 },
        where: { id: 1 },
      });
    });

    it('should process multiple distinct services independently', async () => {
      const mockData = [
        { id: 1, qtdeRealizada: 10, idSchedule: 5 },
        { id: 2, qtdeRealizada: 20, idSchedule: 5 },
      ];

      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          aggregate: jest.fn().mockImplementation(({ where, _sum }) => {
            if (_sum.real !== undefined) {
              return Promise.resolve({
                _sum: { real: where.id_servico === 1 ? 100 : 200 },
              });
            }
            return Promise.resolve({
              _sum: { prog: where.id_servico === 1 ? 3 : 4 },
            });
          }),
        },
      });

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_prog: 10 + 3, qtde_real: 100 },
        where: { id: 1 },
      });
      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_prog: 20 + 4, qtde_real: 200 },
        where: { id: 2 },
      });
    });

    it('should process items in batches of 50, one batch at a time', async () => {
      const mockData = Array.from({ length: 51 }, (_, i) => ({
        id: i + 1,
        qtdeRealizada: 1,
        idSchedule: 5,
      }));

      const executionOrder: string[] = [];
      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockImplementation(async ({ where }) => {
            executionOrder.push(`updateMany:${where.id_servico}`);
            return { count: 1 };
          }),
          aggregate: jest
            .fn()
            .mockResolvedValue({ _sum: { real: 1, prog: 0 } }),
        },
      });

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(51);
      // Todo o primeiro lote (ids 1..50) roda antes do segundo lote (id 51).
      const indexOfLastFirstBatch = executionOrder.indexOf('updateMany:50');
      const indexOfSecondBatch = executionOrder.indexOf('updateMany:51');
      expect(indexOfLastFirstBatch).toBeGreaterThanOrEqual(0);
      expect(indexOfSecondBatch).toBeGreaterThan(indexOfLastFirstBatch);
    });

    it('should handle empty data array', async () => {
      const mockData = [];

      const mockTx = createMockTx();

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.programacoes_servicos.aggregate).not.toHaveBeenCalled();
      expect(mockTx.servicos.update).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockData = [{ id: 1, qtdeRealizada: 50, idSchedule: 5 }];

      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockRejectedValue(new Error('Update failed')),
          aggregate: jest.fn(),
        },
      });

      mockTransaction(mockTx);

      await expect(repository.performServices(mockData)).rejects.toThrow(
        'Update failed',
      );
      expect(mockTx.servicos.update).not.toHaveBeenCalled();
    });

    it('should handle zero qtdeRealizada, defaulting qtde_real to 0 when the aggregate has no sum', async () => {
      const mockData = [{ id: 1, qtdeRealizada: 0, idSchedule: 5 }];

      const mockTx = createMockTx({
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          aggregate: jest
            .fn()
            .mockResolvedValueOnce({ _sum: { real: null } })
            .mockResolvedValueOnce({ _sum: { prog: null } }),
        },
      });

      mockTransaction(mockTx);

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        data: { real: 0 },
        where: { id_servico: 1, id_programacao: 5 },
      });

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        data: { qtde_prog: 0, qtde_real: 0 },
        where: { id: 1 },
      });
    });
  });
});
