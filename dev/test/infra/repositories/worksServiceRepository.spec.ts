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
      create: jest.fn(),
    },
    programacoes_servicos: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
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

      const result = await repository.getNotScheduledServices(mockParams);

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
          qtde_adicional: true,
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

      const result =
        await repository.getNotScheduledServices(paramsWithoutFilters);

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

      await repository.getNotScheduledServices(params);

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

      await repository.getNotScheduledServices(params);

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

      await repository.getNotScheduledServices(params);

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

      const result = await repository.getNotScheduledServices(mockParams);

      expect(result).toEqual([]);
    });

    it('should only return services with null id_programacao', async () => {
      const params: GetByIdParamsInterface = { id: 1 };

      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      await repository.getNotScheduledServices(params);

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
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
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
          qtde_adicional: true,
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
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
        equipes: { equipe: 'LM 02' },
        prog: 3,
        plan: 1,
        real: 3,
        adicional: 2,
      },
      {
        id: 2,
        servicos: {
          servicos_contratos: { texto_breve: 'Serviço 2' },
          ponto: 'Ponto B',
          operacao: 'Operação 2',
        },
        programacoes: { data_prog: '2024-01-02' },
        equipes: { equipe: 'LM 01' },
        prog: 2,
        plan: 2,
        real: null,
        adicional: null,
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
          equipes: { select: { equipe: true } },
          id_programacao: true,
          id_servico: true,
          prog: true,
          plan: true,
          real: true,
          adicional: true,
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
          id: true,
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
          id_turma: 100,
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

    it('should always use id_turma whinch was sent with parameter', async () => {
      const mockIdParceira = 100;
      mockPrismaService.equipes.findMany.mockResolvedValue([]);

      await repository.getTeamsServices(mockIdParceira);

      const callArgs = mockPrismaService.equipes.findMany.mock.calls[0][0];
      expect(callArgs.where.id_turma).toBe(100);
    });
  });

  describe('getAllServicesOfWork', () => {
    it('should return all services of a work', async () => {
      const mockWorkId = 1;
      const mockServices = [
        { id: 1, qtde_plan: 100 },
        { id: 2, qtde_plan: 200 },
        { id: 3, qtde_plan: 150 },
      ];

      mockPrismaService.servicos.findMany.mockResolvedValue(mockServices);

      const result = await repository.getAllServicesOfWork(mockWorkId);

      expect(result).toEqual(mockServices);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          id_contrato_servico: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_adicional: true,
        },
        where: { id_obra: mockWorkId },
      });
      expect(prisma.servicos.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no services found', async () => {
      const mockWorkId = 999;

      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      const result = await repository.getAllServicesOfWork(mockWorkId);

      expect(result).toEqual([]);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          id_contrato_servico: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_adicional: true,
        },
        where: { id_obra: mockWorkId },
      });
    });

    it('should handle database errors', async () => {
      const mockWorkId = 1;
      const mockError = new Error('Database connection error');

      mockPrismaService.servicos.findMany.mockRejectedValue(mockError);

      await expect(repository.getAllServicesOfWork(mockWorkId)).rejects.toThrow(
        'Database connection error',
      );
    });
  });

  describe('scheduleServices', () => {
    const mockScheduleData: ScheduleServicesDTO[] = [
      {
        id: 1,
        idTeam: 2,
        idSchedule: 5,
        prog: 2,
        additional: null,
      },
      {
        id: 2,
        idTeam: 2,
        idSchedule: 6,
        prog: 2,
        additional: 2,
      },
    ];

    it('should schedule services in a transaction', async () => {
      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await repository.scheduleServices(mockScheduleData, 80);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledTimes(2);
      expect(mockTx.servicos.update).toHaveBeenCalledTimes(2);
    });

    it('should create programacoes_servicos with correct data', async () => {
      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await repository.scheduleServices([mockScheduleData[0]], 100);

      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledWith({
        data: {
          id_programacao: 5,
          id_servico: 1,
          id_equipe: 2,
          plan: 2,
          prog: 2,
          adicional: null,
        },
      });
    });

    it('should update servicos with correct data', async () => {
      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await repository.scheduleServices([mockScheduleData[0]], 60);

      expect(mockTx.servicos.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_programacao: 5,
          id_equipe: 2,
          qtde_prog: 2,
        },
      });
    });

    it('should handle multiple services in sequence', async () => {
      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await repository.scheduleServices(mockScheduleData, 90);

      // Primeira iteração
      expect(mockTx.programacoes_servicos.create).toHaveBeenNthCalledWith(1, {
        data: {
          id_programacao: 5,
          id_servico: 1,
          id_equipe: 2,
          plan: 2,
          prog: 2,
          adicional: null,
        },
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: {
          id_programacao: 5,
          id_equipe: 2,
          qtde_prog: 2,
        },
      });

      // Segunda iteração
      expect(mockTx.programacoes_servicos.create).toHaveBeenNthCalledWith(2, {
        data: {
          id_programacao: 6,
          id_servico: 2,
          id_equipe: 2,
          plan: 2,
          prog: 4,
          adicional: 2,
        },
      });

      expect(mockTx.servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: {
          id_programacao: 6,
          id_equipe: 2,
          qtde_prog: 4,
        },
      });
    });

    it('should handle empty array', async () => {
      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await expect(repository.scheduleServices([], 0)).rejects.toThrow(
        'Programação não enviada.',
      );
    });

    it('should rollback transaction on error', async () => {
      const mockError = new Error('Database error');
      const mockTx = {
        programacoes: { update: jest.fn() },
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
        repository.scheduleServices([mockScheduleData[0]], 0),
      ).rejects.toThrow('Database error');
    });

    it('should handle service without idSchedule', async () => {
      const dataWithoutIdSchedule: ScheduleServicesDTO[] = [
        {
          id: 1,
          idSchedule: undefined,
          idTeam: 10,
          prog: 2,
          additional: 2,
        },
      ];

      const mockTx = {
        programacoes: { update: jest.fn() },
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

      await repository.scheduleServices(dataWithoutIdSchedule, 0);

      expect(mockTx.programacoes_servicos.create).toHaveBeenCalledWith({
        data: {
          id_programacao: undefined,
          id_servico: 1,
          id_equipe: 10,
          plan: 2,
          prog: 4,
          adicional: 2,
        },
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
      };

      await repository.finalizeServices(mockData, mockTx as any);

      expect(mockTx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          prog: 80,
          exec: 75,
          id_restricao_execucao: 2,
          nome_responsavel: 'João Silva',
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
        },
      });
    });
  });

  describe('performServices', () => {
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

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.performServices(mockData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledTimes(2);
      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(2);
    });

    it('should update programacoes_servicos with correct data', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 50,
          idSchedule: 5,
        },
      ];

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

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

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.performServices(mockData);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { qtde_real: 50 },
        where: { id: 1 },
      });
    });

    it('should handle empty data array', async () => {
      const mockData = [];

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn(),
        },
        servicos: {
          updateMany: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).not.toHaveBeenCalled();
      expect(mockTx.servicos.updateMany).not.toHaveBeenCalled();
    });

    it('should process multiple services in order', async () => {
      const mockData = [
        { id: 1, qtdeRealizada: 10, idSchedule: 5 },
        { id: 2, qtdeRealizada: 20, idSchedule: 5 },
        { id: 3, qtdeRealizada: 30, idSchedule: 5 },
      ];

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.performServices(mockData);

      // Verificar primeira execução
      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenNthCalledWith(
        1,
        {
          data: { real: 10 },
          where: { id_servico: 1, id_programacao: 5 },
        },
      );

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(1, {
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

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(2, {
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

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(3, {
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

      const mockError = new Error('Update failed');
      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockRejectedValue(mockError),
        },
        servicos: {
          updateMany: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(repository.performServices(mockData)).rejects.toThrow(
        'Update failed',
      );
      expect(mockTx.servicos.updateMany).not.toHaveBeenCalled();
    });

    it('should handle zero qtdeRealizada', async () => {
      const mockData = [
        {
          id: 1,
          qtdeRealizada: 0,
          idSchedule: 5,
        },
      ];

      const mockTx = {
        programacoes_servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.performServices(mockData);

      expect(mockTx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        data: { real: 0 },
        where: { id_servico: 1, id_programacao: 5 },
      });

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { qtde_real: 0 },
        where: { id: 1 },
      });
    });
  });

  describe('addService', () => {
    it('should add service, where data correctly sent', async () => {
      const mockData = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        qtdePlan: 2,
      };

      await repository.addServices(mockData);

      expect(mockPrismaService.servicos.create).toHaveBeenCalledWith({
        data: {
          id_obra: 1,
          id_contrato_servico: 2,
          operacao: 'INSTALAÇÃO',
          ponto: 'P1',
          qtde_plan: 2,
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

      await repository.applyAdditional(mockData);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { qtde_adicional: 2 },
        where: { id: 1 },
      });
      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('reascheduleServices', () => {
    it('should update multiple services to remove programacao in a transaction', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(mockData);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(3);
    });

    it('should set id_programacao to null for each service', async () => {
      const mockData = [{ id: 1 }];

      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(mockData);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { id_programacao: null },
        where: { id: 1 },
      });
    });

    it('should process multiple services correctly', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(mockData);

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(1, {
        data: { id_programacao: null },
        where: { id: 1 },
      });

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(2, {
        data: { id_programacao: null },
        where: { id: 2 },
      });

      expect(mockTx.servicos.updateMany).toHaveBeenNthCalledWith(3, {
        data: { id_programacao: null },
        where: { id: 3 },
      });
    });

    it('should handle empty data array', async () => {
      const mockData = [];

      const mockTx = {
        servicos: {
          updateMany: jest.fn(),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(mockData);

      expect(mockTx.servicos.updateMany).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      const mockError = new Error('Update failed');

      const mockTx = {
        servicos: {
          updateMany: jest
            .fn()
            .mockResolvedValueOnce({ count: 1 })
            .mockRejectedValueOnce(mockError),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await expect(repository.reascheduleServices(mockData)).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle single service reschedule', async () => {
      const mockData = [{ id: 999 }];

      const mockTx = {
        servicos: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      await repository.reascheduleServices(mockData);

      expect(mockTx.servicos.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTx.servicos.updateMany).toHaveBeenCalledWith({
        data: { id_programacao: null },
        where: { id: 999 },
      });
    });
  });
});
