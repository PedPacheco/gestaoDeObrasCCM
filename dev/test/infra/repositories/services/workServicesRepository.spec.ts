import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';
import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';

import { Test, TestingModule } from '@nestjs/testing';
import { ImportServiceItem } from 'src/domain/repositories/worksService/IWorkServicesRepository';

describe('WorksServicesRepository', () => {
  let repository: WorkServicesRepository;
  let prisma: PrismaService;

  const mockPrismaService = {
    servicos: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    obras: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkServicesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<WorkServicesRepository>(WorkServicesRepository);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('scheduleServices', () => {
    const mockScheduleData: ScheduleServicesDTO[] = [
      {
        id: 1,
        idTeam: 2,
        idSchedule: 1,
        prog: 2,
        operation: 'instalação',
        point: 'p1',
        additional: null,
        type: 'M',
      },
      {
        id: 2,
        idTeam: 2,
        idSchedule: 1,
        prog: 2,
        operation: 'instalação',
        point: 'p1',
        additional: 2,
        type: 'S',
      },
    ];

    let mockTx: {
      programacoes: { update: jest.Mock };
      programacoes_servicos: {
        createMany: jest.Mock;
      };
      servicos: { update: jest.Mock };
    };

    beforeEach(() => {
      mockTx = {
        programacoes: { update: jest.fn() },
        programacoes_servicos: {
          createMany: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });
    });

    it('should schedule services in a transaction', async () => {
      await repository.scheduleServices(mockScheduleData, 80, 1);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.createMany).toHaveBeenCalledTimes(1);
      expect(mockTx.servicos.update).toHaveBeenCalledTimes(2);
    });

    it('should create programacoes_servicos with correct data', async () => {
      await repository.scheduleServices([mockScheduleData[0]], 100, 1);

      expect(mockTx.programacoes_servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_programacao: 1,
            id_servico: 1,
            id_equipe: 2,
            prog: 2,
            adicional: null,
          },
        ],
      });
    });

    it('should update servicos with correct data', async () => {
      await repository.scheduleServices([mockScheduleData[0]], 60, 1);

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_programacao: 1,
          id_equipe: 2,
          qtde_prog: 2,
          qtde_adicional: null,
        },
      });
    });

    it('should handle multiple services in sequence', async () => {
      await repository.scheduleServices(mockScheduleData, 90, 1);

      expect(mockTx.programacoes_servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_programacao: 1,
            id_servico: 1,
            id_equipe: 2,
            prog: 2,
            adicional: null,
          },
          {
            id_programacao: 1,
            id_servico: 2,
            id_equipe: 2,
            prog: 2,
            adicional: 2,
          },
        ],
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: {
          id_programacao: 1,
          id_equipe: 2,
          qtde_prog: 2,
          qtde_adicional: null,
        },
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: {
          id_programacao: 1,
          id_equipe: 2,
          qtde_prog: 2,
          qtde_adicional: 2,
        },
      });
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      mockTx.programacoes_servicos.createMany.mockRejectedValue(mockError);

      await expect(
        repository.scheduleServices([mockScheduleData[0]], 0, 1),
      ).rejects.toThrow('Database error');
    });

    it('should handle service without idSchedule', async () => {
      const dataWithoutIdSchedule: ScheduleServicesDTO[] = [
        {
          id: 1,
          idSchedule: undefined,
          idTeam: 10,
          operation: 'instalação',
          point: 'p1',
          prog: 2,
          additional: 2,
          type: 'S',
        },
      ];

      await repository.scheduleServices(dataWithoutIdSchedule, 0, undefined);

      expect(mockTx.programacoes_servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_programacao: undefined,
            id_servico: 1,
            id_equipe: 10,
            prog: 2,
            adicional: 2,
          },
        ],
      });
    });

    it('should update schedule progress', async () => {
      await repository.scheduleServices(mockScheduleData, 80, 1);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          prog: 80,
        },
      });
    });

    it('should execute transaction with timeout options', async () => {
      await repository.scheduleServices(mockScheduleData, 80, 1);

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 10000,
        timeout: 30000,
      });
    });
  });

  describe('cancelServices', () => {
    it('should cancel schedule in a transaction', async () => {
      const mockId = 1;
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.cancelServices(mockId);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes.update).toHaveBeenCalledTimes(1);
    });

    it('should delete programacoes_servicos with correct where clause', async () => {
      const mockId = 5;
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.cancelServices(mockId);

      expect(mockTx.programacoes_servicos.deleteMany).toHaveBeenCalledWith({
        where: { id_programacao: 5 },
      });
    });

    it('should update servicos setting id_programacao to null', async () => {
      const mockId = 5;
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.cancelServices(mockId);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: {
          id_programacao: null,
          qtde_prog: null,
          qtde_real: null,
        },
        where: { id_programacao: 5 },
      });
    });

    it('should update programacoes setting prog to 0', async () => {
      const mockId = 5;
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        programacoes: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.cancelServices(mockId);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        data: { prog: 0 },
        where: { id: 5 },
      });
    });

    it('should execute all operations in correct order', async () => {
      const mockId = 1;
      const executionOrder: string[] = [];
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockImplementation(async () => {
            executionOrder.push('deleteMany');
            return { count: 0 };
          }),
        },
        servicos: {
          updateMany: jest.fn().mockImplementation(async () => {
            executionOrder.push('updateMany');
            return { count: 0 };
          }),
        },
        programacoes: {
          update: jest.fn().mockImplementation(async () => {
            executionOrder.push('update');
            return {};
          }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.cancelServices(mockId);

      expect(executionOrder).toEqual(['deleteMany', 'updateMany', 'update']);
    });

    it('should rollback transaction on error', async () => {
      const mockId = 1;
      const mockError = new Error('Delete failed');
      const mockTx = {
        programacoes_servicos: {
          deleteMany: jest.fn().mockRejectedValue(mockError),
        },
        servicos: {
          updateMany: jest.fn(),
        },
        programacoes: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(repository.cancelServices(mockId)).rejects.toThrow(
        'Delete failed',
      );
      expect(mockTx.servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.programacoes.update).not.toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    it('should add material, where data correctly sent', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 4,
      };

      const mockTx = {
        servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.addItem(mockData, 'material', mockTx as any);

      expect(mockTx.servicos.create).toHaveBeenCalledWith({
        data: {
          id_obra: 1,
          id_material: 2,
          id_contrato_servico: null,
          operacao: 'INSTALAÇÃO',
          ponto: 'P1',
          descricao_operacao: 'POSTE - ODI',
          qtde_plan: 0,
          qtde_adicional: 4,
        },
      });
    });

    it('should add service, where data correctly sent', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 2,
      };

      const mockTx = {
        servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.addItem(mockData, 'service', mockTx as any);

      expect(mockTx.servicos.create).toHaveBeenCalledWith({
        data: {
          id_obra: 1,
          id_contrato_servico: 2,
          id_material: null,
          operacao: 'INSTALAÇÃO',
          ponto: 'P1',
          descricao_operacao: 'POSTE - ODI',
          qtde_plan: 0,
          qtde_adicional: 2,
        },
      });
    });
  });

  describe('applyAdditional', () => {
    it('should apply additional in service, where data correctly sent', async () => {
      const mockData = [
        {
          id: 1,
          additional: 2,
        },
      ];

      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.applyAdditional(mockData, mockTx as any);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { qtde_adicional: 2 },
        where: { id: 1 },
      });
      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(1);
    });

    it('should update multiple additionals', async () => {
      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.applyAdditional(
        [
          {
            id: 1,
            additional: 2,
          },
          {
            id: 2,
            additional: 5,
          },
        ],
        mockTx as any,
      );

      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('should throw when delete fails', async () => {
      const mockTx = {
        servicos: {
          delete: jest.fn().mockRejectedValue(new Error('DB error')),
        },
      };

      await expect(repository.delete(1, mockTx as any)).rejects.toThrow(
        'DB error',
      );
    });

    it('Should call method delete with correct id', async () => {
      const mockTx = {
        servicos: {
          delete: jest.fn(),
        },
      };

      await repository.delete(1, mockTx as any);

      expect(mockTx.servicos.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('deleteAll', () => {
    it('should delete servicos and relatorio within a transaction', async () => {
      const mockTx = {
        servicos: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
        relatorio: { delete: jest.fn() },
      };

      // Faz o prisma.$transaction executar o callback com o mockTx
      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb(mockTx),
      );

      await repository.deleteAll(1);

      expect(mockTx.servicos.deleteMany).toHaveBeenCalledWith({
        where: { id_obra: 1 },
      });
      expect(mockTx.relatorio.delete).toHaveBeenCalledWith({
        where: { id_obra: 1 },
      });
    });

    it('should throw when the transaction fails', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('DB error'));

      await expect(repository.deleteAll(1)).rejects.toThrow('DB error');
    });

    it('should propagate error when servicos.deleteMany fails', async () => {
      const mockTx = {
        servicos: {
          deleteMany: jest.fn().mockRejectedValue(new Error('FK constraint')),
        },
        relatorio: { delete: jest.fn() },
      };

      mockPrismaService.$transaction.mockImplementation(async (cb) =>
        cb(mockTx),
      );

      await expect(repository.deleteAll(1)).rejects.toThrow('FK constraint');
      // relatorio não deve ter sido chamado se servicos falhou antes
      expect(mockTx.relatorio.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateWorkExecuted', () => {
    it('should update work executed percentage', async () => {
      const mockTx = {
        obras: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.updateWorkExecuted(10, 80, mockTx as any);

      expect(mockTx.obras.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          executado: 80,
        },
      });
    });

    it('should allow executed null', async () => {
      const mockTx = {
        obras: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      await repository.updateWorkExecuted(10, null, mockTx as any);

      expect(mockTx.obras.update).toHaveBeenCalledWith({
        where: {
          id: 10,
        },
        data: {
          executado: null,
        },
      });
    });
  });

  describe('bulkImportItems', () => {
    let mockTx: any;

    beforeEach(() => {
      mockTx = {
        servicos: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        relatorio: {
          upsert: jest.fn().mockResolvedValue({}),
        },
      };
    });

    it('should return without executing queries when items is empty', async () => {
      await repository.bulkImportItems(1, [], mockTx);

      expect(mockTx.servicos.createMany).not.toHaveBeenCalled();
      expect(mockTx.relatorio.upsert).not.toHaveBeenCalled();
    });

    it('should create many service items', async () => {
      const items: ImportServiceItem[] = [
        {
          idService: 10,
          type: 'service',
          operation: 'INSTALAÇÃO',
          point: 'P1',
          operationNumber: '001',
          operationDescription: 'POSTE',
          plannedQuantity: 5,
        },
      ];

      await repository.bulkImportItems(1, items, mockTx);

      expect(mockTx.servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_obra: 1,
            id_contrato_servico: 10,
            id_material: null,
            operacao: 'INSTALAÇÃO',
            ponto: 'P1',
            numero_operacao: '001',
            descricao_operacao: 'POSTE',
            qtde_plan: 5,
            qtde_adicional: 0,
          },
        ],
      });
    });

    it('should create many material items', async () => {
      const items: ImportServiceItem[] = [
        {
          idService: 20,
          type: 'material',
          operation: 'LANÇAMENTO',
          point: 'P2',
          operationNumber: '002',
          operationDescription: 'CABO',
          plannedQuantity: 8,
        },
      ];

      await repository.bulkImportItems(5, items, mockTx);

      expect(mockTx.servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_obra: 5,
            id_contrato_servico: null,
            id_material: 20,
            operacao: 'LANÇAMENTO',
            ponto: 'P2',
            numero_operacao: '002',
            descricao_operacao: 'CABO',
            qtde_plan: 8,
            qtde_adicional: 0,
          },
        ],
      });
    });

    it('should create report using upsert', async () => {
      const items: ImportServiceItem[] = [
        {
          idService: 10,
          type: 'service',
          operation: 'INSTALAÇÃO',
          point: 'P1',
          operationNumber: '001',
          operationDescription: 'POSTE',
          plannedQuantity: 5,
        },
      ];

      await repository.bulkImportItems(1, items, mockTx);

      expect(mockTx.relatorio.upsert).toHaveBeenCalledWith({
        where: { id_obra: 1 },
        create: {
          id_obra: 1,
          encontrado: true,
        },
        update: {
          encontrado: true,
        },
      });
    });

    it('should process multiple items in createMany', async () => {
      const items: ImportServiceItem[] = [
        {
          idService: 10,
          type: 'service',
          operation: 'INSTALAÇÃO',
          point: 'P1',
          operationNumber: '001',
          operationDescription: 'POSTE',
          plannedQuantity: 5,
        },
        {
          idService: 20,
          type: 'material',
          operation: 'LANÇAMENTO',
          point: 'P2',
          operationNumber: '002',
          operationDescription: 'CABO',
          plannedQuantity: 8,
        },
      ];

      await repository.bulkImportItems(1, items, mockTx);

      expect(mockTx.servicos.createMany).toHaveBeenCalledTimes(1);

      expect(mockTx.servicos.createMany.mock.calls[0][0].data).toHaveLength(2);
    });

    it('should propagate createMany errors', async () => {
      const error = new Error('Database error');

      mockTx.servicos.createMany.mockRejectedValue(error);

      const items: ImportServiceItem[] = [
        {
          idService: 10,
          type: 'service',
          operation: 'INSTALAÇÃO',
          point: 'P1',
          operationNumber: '001',
          operationDescription: 'POSTE',
          plannedQuantity: 5,
        },
      ];

      await expect(
        repository.bulkImportItems(1, items, mockTx),
      ).rejects.toThrow('Database error');

      expect(mockTx.relatorio.upsert).not.toHaveBeenCalled();
    });

    it('should propagate upsert errors', async () => {
      const error = new Error('Upsert error');

      mockTx.relatorio.upsert.mockRejectedValue(error);

      const items: ImportServiceItem[] = [
        {
          idService: 10,
          type: 'service',
          operation: 'INSTALAÇÃO',
          point: 'P1',
          operationNumber: '001',
          operationDescription: 'POSTE',
          plannedQuantity: 5,
        },
      ];

      await expect(
        repository.bulkImportItems(1, items, mockTx),
      ).rejects.toThrow('Upsert error');
    });
  });

  it('should return without executing query when data is empty', async () => {
    const mockTx = {
      $executeRaw: jest.fn(),
    };

    await repository.updateSchedulesProgress([], mockTx as any);

    expect(mockTx.$executeRaw).not.toHaveBeenCalled();
  });

  it('should execute raw update', async () => {
    const mockTx = {
      $executeRaw: jest.fn().mockResolvedValue(undefined),
    };

    await repository.updateSchedulesProgress(
      [
        {
          idProgramacao: 1,
          prog: 50,
          exec: 40,
        },
        {
          idProgramacao: 2,
          prog: 70,
          exec: null,
        },
      ],
      mockTx as any,
    );

    expect(mockTx.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
