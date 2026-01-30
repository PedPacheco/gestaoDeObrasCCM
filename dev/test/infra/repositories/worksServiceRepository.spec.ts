import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorksServicesRepository } from 'src/infra/repositories/worksServicesRepository';
import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';
import {
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
} from 'src/interface/types/servicesInterface';

describe('WorksServicesRepository', () => {
  let repository: WorksServicesRepository;
  let prisma: PrismaService;

  const mockPrismaService = {
    servicos: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    programacoes_servicos: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    servicos_contratos: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    equipes: {
      findMany: jest.fn(),
    },
    programacoes: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksServicesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<WorksServicesRepository>(WorksServicesRepository);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getServices', () => {
    const mockParams: GetByIdParamsInterface = {
      id: 1,
      operation: 'Operação 1',
      service: 'Serviço 1',
      point: 'Ponto A',
    };

    const mockServicesResponse = [
      {
        id: 1,
        id_obra: 1,
        operacao: 'Operação 1',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        obras: { ovnota: 'OV-001' },
        programacoes: { data_prog: '2024-01-01' },
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
          medida: 'UN',
          contrato: 'CONT-001',
          preco: 100,
        },
      },
    ];

    it('should return services with all filters', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      const result = await repository.getServices(mockParams);

      expect(result).toEqual(mockServicesResponse);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          id_obra: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          obras: { select: { ovnota: true } },
          programacoes: { select: { data_prog: true } },
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              medida: true,
              contrato: true,
              preco: true,
            },
          },
        },
        where: {
          id_obra: 1,
          id_programacao: null,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          servicos_contratos: {
            texto_breve: { contains: 'Serviço 1', mode: 'insensitive' },
          },
        },
      });
      expect(prisma.servicos.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return services without optional filters', async () => {
      const paramsWithoutFilters: GetByIdParamsInterface = {
        id: 1,
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      const result = await repository.getServices(paramsWithoutFilters);

      expect(result).toEqual(mockServicesResponse);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          id_obra: 1,
          id_programacao: null,
        },
      });
    });

    it('should return services with only operation filter', async () => {
      const params: GetByIdParamsInterface = {
        id: 1,
        operation: 'Operação 1',
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      await repository.getServices(params);

      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          id_obra: 1,
          id_programacao: null,
          operacao: 'Operação 1',
        },
      });
    });

    it('should return services with only point filter', async () => {
      const params: GetByIdParamsInterface = {
        id: 1,
        point: 'Ponto A',
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      await repository.getServices(params);

      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          id_obra: 1,
          id_programacao: null,
          ponto: 'Ponto A',
        },
      });
    });

    it('should return services with only service filter (case insensitive)', async () => {
      const params: GetByIdParamsInterface = {
        id: 1,
        service: 'serviço',
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      await repository.getServices(params);

      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          id_obra: 1,
          id_programacao: null,
          servicos_contratos: {
            texto_breve: { contains: 'serviço', mode: 'insensitive' },
          },
        },
      });
    });

    it('should return empty array when no services found', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      const result = await repository.getServices(mockParams);

      expect(result).toEqual([]);
    });

    it('should only return services with null id_programacao', async () => {
      const params: GetByIdParamsInterface = { id: 1 };

      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      await repository.getServices(params);

      const callArgs = mockPrismaService.servicos.findMany.mock.calls[0][0];
      expect(callArgs.where.id_programacao).toBeNull();
    });
  });

  describe('getSelectedServices', () => {
    const mockParams: GetSelectedServicesParamsInterface = {
      id: 1,
      idProgramacao: 10,
      operation: 'Operação 1',
      service: 'Serviço 1',
      point: 'Ponto A',
    };

    const mockSelectedServicesResponse = [
      {
        id: 1,
        id_obra: 1,
        operacao: 'Operação 1',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        obras: { ovnota: 'OV-001' },
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
          medida: 'UN',
          contrato: 'CONT-001',
          preco: 100,
        },
        programacoes: { data_prog: '2024-01-01' },
        equipes: {
          equipe: 'Equipe A',
          encarregado: 'João Silva',
          perfil: 'Pedreiro',
        },
      },
    ];

    it('should return selected services with all filters', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockSelectedServicesResponse,
      );

      const result = await repository.getSelectedServices(mockParams);

      expect(result).toEqual(mockSelectedServicesResponse);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          id_obra: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          obras: { select: { ovnota: true } },
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              medida: true,
              contrato: true,
              preco: true,
            },
          },
          programacoes: { select: { data_prog: true } },
          equipes: {
            select: { equipe: true, encarregado: true, perfil: true },
          },
        },
        where: {
          id_obra: 1,
          id_programacao: 10,
          operacao: 'Operação 1',
          ponto: 'Ponto A',
          servicos_contratos: {
            texto_breve: { contains: 'Serviço 1', mode: 'insensitive' },
          },
        },
      });
    });

    it('should return selected services without optional filters', async () => {
      const paramsWithoutFilters: GetSelectedServicesParamsInterface = {
        id: 1,
        idProgramacao: 10,
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockSelectedServicesResponse,
      );

      const result = await repository.getSelectedServices(paramsWithoutFilters);

      expect(result).toEqual(mockSelectedServicesResponse);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {
          id_obra: 1,
          id_programacao: 10,
        },
      });
    });

    it('should include equipes data in select', async () => {
      const params: GetSelectedServicesParamsInterface = {
        id: 1,
        idProgramacao: 10,
      };

      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockSelectedServicesResponse,
      );

      await repository.getSelectedServices(params);

      const callArgs = mockPrismaService.servicos.findMany.mock.calls[0][0];
      expect(callArgs.select.equipes).toEqual({
        select: { equipe: true, encarregado: true, perfil: true },
      });
    });

    it('should return empty array when no selected services found', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      const result = await repository.getSelectedServices(mockParams);

      expect(result).toEqual([]);
    });

    it('should filter by idProgramacao', async () => {
      const params: GetSelectedServicesParamsInterface = {
        id: 1,
        idProgramacao: 99,
      };

      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      await repository.getSelectedServices(params);

      const callArgs = mockPrismaService.servicos.findMany.mock.calls[0][0];
      expect(callArgs.where.id_programacao).toBe(99);
    });
  });

  describe('getServiceScheduleHistory', () => {
    const mockHistoryResponse = [
      {
        id: 1,
        servicos: {
          servicos_contratos: { texto_breve: 'Serviço 1' },
          ponto: 'Ponto A',
          operacao: 'Operação 1',
        },
        programacoes: { data_prog: '2024-01-01' },
        prog: 100,
        plan: 100,
        real: 50,
      },
      {
        id: 2,
        servicos: {
          servicos_contratos: { texto_breve: 'Serviço 2' },
          ponto: 'Ponto B',
          operacao: 'Operação 2',
        },
        programacoes: { data_prog: '2024-01-02' },
        prog: 200,
        plan: 200,
        real: 100,
      },
    ];

    it('should return service schedule history', async () => {
      const mockId = 1;
      mockPrismaService.programacoes_servicos.findMany.mockResolvedValue(
        mockHistoryResponse,
      );

      const result = await repository.getServiceScheduleHistory(mockId);

      expect(result).toEqual(mockHistoryResponse);
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          servicos: {
            select: {
              servicos_contratos: { select: { texto_breve: true } },
              ponto: true,
              operacao: true,
            },
          },
          programacoes: { select: { data_prog: true } },
          prog: true,
          plan: true,
          real: true,
        },
        where: { programacoes: { id_obra: 1 } },
      });
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no history found', async () => {
      const mockId = 999;
      mockPrismaService.programacoes_servicos.findMany.mockResolvedValue([]);

      const result = await repository.getServiceScheduleHistory(mockId);

      expect(result).toEqual([]);
    });

    it('should filter by id_obra in programacoes', async () => {
      const mockId = 42;
      mockPrismaService.programacoes_servicos.findMany.mockResolvedValue([]);

      await repository.getServiceScheduleHistory(mockId);

      const callArgs =
        mockPrismaService.programacoes_servicos.findMany.mock.calls[0][0];
      expect(callArgs.where.programacoes.id_obra).toBe(42);
    });
  });

  describe('getServicesFilters', () => {
    const mockServicesGroup = [
      { texto_breve: 'Serviço 1' },
      { texto_breve: 'Serviço 2' },
    ];

    const mockOperationsGroup = [
      { operacao: 'Operação 1' },
      { operacao: 'Operação 2' },
    ];

    const mockPointsGroup = [{ ponto: 'Ponto A' }, { ponto: 'Ponto B' }];

    it('should return all filters using Promise.all', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue(
        mockServicesGroup,
      );
      mockPrismaService.servicos.groupBy
        .mockResolvedValueOnce(mockOperationsGroup)
        .mockResolvedValueOnce(mockPointsGroup);

      const result = await repository.getServicesFilters(mockId);

      expect(result).toEqual({
        services: mockServicesGroup,
        operations: mockOperationsGroup,
        points: mockPointsGroup,
      });
    });

    it('should call groupBy for services with correct parameters', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue([]);
      mockPrismaService.servicos.groupBy.mockResolvedValue([]);

      await repository.getServicesFilters(mockId);

      expect(prisma.servicos_contratos.groupBy).toHaveBeenCalledWith({
        by: ['texto_breve'],
        where: { servicos: { some: { id_obra: 1 } } },
      });
    });

    it('should call groupBy for operations with correct parameters', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue([]);
      mockPrismaService.servicos.groupBy.mockResolvedValue([]);

      await repository.getServicesFilters(mockId);

      expect(prisma.servicos.groupBy).toHaveBeenCalledWith({
        by: ['operacao'],
        where: { id_obra: 1 },
      });
    });

    it('should call groupBy for points with correct parameters', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue([]);
      mockPrismaService.servicos.groupBy.mockResolvedValue([]);

      await repository.getServicesFilters(mockId);

      const calls = mockPrismaService.servicos.groupBy.mock.calls;
      const pointsCall = calls.find((call) => call[0].by[0] === 'ponto');
      expect(pointsCall[0]).toEqual({
        by: ['ponto'],
        where: { id_obra: 1 },
      });
    });

    it('should return empty arrays when no filters found', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue([]);
      mockPrismaService.servicos.groupBy.mockResolvedValue([]);

      const result = await repository.getServicesFilters(mockId);

      expect(result).toEqual({
        services: [],
        operations: [],
        points: [],
      });
    });

    it('should execute all queries in parallel', async () => {
      const mockId = 1;

      mockPrismaService.servicos_contratos.groupBy.mockResolvedValue(
        mockServicesGroup,
      );
      mockPrismaService.servicos.groupBy
        .mockResolvedValueOnce(mockOperationsGroup)
        .mockResolvedValueOnce(mockPointsGroup);

      await repository.getServicesFilters(mockId);

      // Todas as chamadas devem ter sido feitas
      expect(prisma.servicos_contratos.groupBy).toHaveBeenCalledTimes(1);
      expect(prisma.servicos.groupBy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getServicesContracts', () => {
    const mockContractsResponse = [
      {
        texto_breve: 'Serviço 1',
        material: 'Material 1',
        preco: 100,
        contrato: 'CONT-001',
        medida: 'UN',
        turmas: { turma: 'Turma A' },
      },
      {
        texto_breve: 'Serviço 2',
        material: 'Material 2',
        preco: 200,
        contrato: 'CONT-002',
        medida: 'M2',
        turmas: { turma: 'Turma B' },
      },
    ];

    it('should return service contracts', async () => {
      const mockIdParceira = 100;
      mockPrismaService.servicos_contratos.findMany.mockResolvedValue(
        mockContractsResponse,
      );

      const result = await repository.getServicesContracts(mockIdParceira);

      expect(result).toEqual(mockContractsResponse);
      expect(prisma.servicos_contratos.findMany).toHaveBeenCalledWith({
        select: {
          texto_breve: true,
          material: true,
          preco: true,
          contrato: true,
          medida: true,
          turmas: { select: { turma: true } },
        },
        where: {
          id_turma: 100,
        },
      });
      expect(prisma.servicos_contratos.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no contracts found', async () => {
      const mockIdParceira = 999;
      mockPrismaService.servicos_contratos.findMany.mockResolvedValue([]);

      const result = await repository.getServicesContracts(mockIdParceira);

      expect(result).toEqual([]);
    });

    it('should filter by id_turma', async () => {
      const mockIdParceira = 42;
      mockPrismaService.servicos_contratos.findMany.mockResolvedValue([]);

      await repository.getServicesContracts(mockIdParceira);

      const callArgs =
        mockPrismaService.servicos_contratos.findMany.mock.calls[0][0];
      expect(callArgs.where.id_turma).toBe(42);
    });
  });

  describe('getTeamsServices', () => {
    const mockTeamsResponse = [
      {
        id: 1,
        equipe: 'Equipe A',
        encarregado: 'João Silva',
        perfil: 'Pedreiro',
      },
      {
        id: 2,
        equipe: 'Equipe B',
        encarregado: 'Maria Santos',
        perfil: 'Eletricista',
      },
    ];

    it('should return teams services', async () => {
      const mockIdParceira = 100;
      mockPrismaService.equipes.findMany.mockResolvedValue(mockTeamsResponse);

      const result = await repository.getTeamsServices(mockIdParceira);

      expect(result).toEqual(mockTeamsResponse);
      expect(prisma.equipes.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          equipe: true,
          encarregado: true,
          perfil: true,
        },
        where: {
          id_turma: 2,
        },
      });
      expect(prisma.equipes.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no teams found', async () => {
      const mockIdParceira = 999;
      mockPrismaService.equipes.findMany.mockResolvedValue([]);

      const result = await repository.getTeamsServices(mockIdParceira);

      expect(result).toEqual([]);
    });

    it('should always use id_turma: 2 (hardcoded)', async () => {
      const mockIdParceira = 100;
      mockPrismaService.equipes.findMany.mockResolvedValue([]);

      await repository.getTeamsServices(mockIdParceira);

      const callArgs = mockPrismaService.equipes.findMany.mock.calls[0][0];
      expect(callArgs.where.id_turma).toBe(2);
    });

    it('should log idParceira parameter', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockIdParceira = 100;
      mockPrismaService.equipes.findMany.mockResolvedValue([]);

      await repository.getTeamsServices(mockIdParceira);

      expect(consoleSpy).toHaveBeenCalledWith(100);
      consoleSpy.mockRestore();
    });
  });

  describe('scheduleServices', () => {
    const mockScheduleData: ScheduleServicesDTO[] = [
      {
        id: 1,
        idTeam: 10,
        idSchedule: 5,
        prog: 100,
      },
      {
        id: 2,
        idTeam: 20,
        idSchedule: 6,
        prog: 200,
      },
    ];

    it('should schedule services in a transaction', async () => {
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices(mockScheduleData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledTimes(2);
      expect(mockTx.servicos.update).toHaveBeenCalledTimes(2);
    });

    it('should create programacoes_servicos with correct data', async () => {
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices([mockScheduleData[0]]);

      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledWith({
        data: {
          id_programacao: 5,
          id_servico: 1,
          plan: 100,
          prog: 100,
        },
      });
    });

    it('should update servicos with correct data', async () => {
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices([mockScheduleData[0]]);

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_programacao: 5,
          id_equipe: 10,
          qtde_prog: 100,
        },
      });
    });

    it('should handle multiple services in sequence', async () => {
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices(mockScheduleData);

      // Primeira iteração
      expect(mockTx.programacoes_servicos.create).toHaveBeenNthCalledWith(1, {
        data: {
          id_programacao: 5,
          id_servico: 1,
          plan: 100,
          prog: 100,
        },
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: {
          id_programacao: 5,
          id_equipe: 10,
          qtde_prog: 100,
        },
      });

      // Segunda iteração
      expect(mockTx.programacoes_servicos.create).toHaveBeenNthCalledWith(2, {
        data: {
          id_programacao: 6,
          id_servico: 2,
          plan: 200,
          prog: 200,
        },
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: {
          id_programacao: 6,
          id_equipe: 20,
          qtde_prog: 200,
        },
      });
    });

    it('should handle empty array', async () => {
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices([]);

      expect(mockTx.programacoes_servicos.create).not.toHaveBeenCalled();
      expect(mockTx.servicos.update).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockRejectedValue(mockError),
        },
        servicos: {
          update: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(
        repository.scheduleServices([mockScheduleData[0]]),
      ).rejects.toThrow('Database error');
    });

    it('should handle service without idSchedule', async () => {
      const dataWithoutIdSchedule: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
        },
      ];

      const mockTx = {
        programacoes_servicos: {
          create: jest.fn().mockResolvedValue({}),
        },
        servicos: {
          update: jest.fn().mockResolvedValue({}),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.scheduleServices(dataWithoutIdSchedule);

      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledWith({
        data: {
          id_programacao: undefined,
          id_servico: 1,
          plan: 100,
          prog: 100,
        },
      });
    });
  });

  describe('cancel', () => {
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

      await repository.cancel(mockId);

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

      await repository.cancel(mockId);

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

      await repository.cancel(mockId);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: {
          id_programacao: null,
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

      await repository.cancel(mockId);

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

      await repository.cancel(mockId);

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

      await expect(repository.cancel(mockId)).rejects.toThrow('Delete failed');
      expect(mockTx.servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.programacoes.update).not.toHaveBeenCalled();
    });
  });
});
