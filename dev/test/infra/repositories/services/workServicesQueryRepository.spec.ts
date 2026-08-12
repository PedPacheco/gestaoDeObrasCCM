import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorkServicesQueryRepository } from 'src/infra/repositories/worksServices/workServicesQueryRepository';
import { GetSelectedServicesParamsInterface } from 'src/interface/types/servicesInterface';

describe('WorkServicesQueryRepository', () => {
  let repository: WorkServicesQueryRepository;
  let prisma: PrismaService;

  const mockPrismaService = {
    servicos: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
      create: jest.fn(),
    },
    materiais: { findMany: jest.fn() },
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
        WorkServicesQueryRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<WorkServicesQueryRepository>(
      WorkServicesQueryRepository,
    );
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getServices', () => {
    const mockServicesResponse = [
      {
        id: 1,
        id_obra: 1,
        operacao: 'Operação 1',
        ponto: 'Ponto A',
        qtde_plan: 10,
        qtde_prog: 8,
        qtde_real: 5,
        programacoes: { data_prog: '2024-01-01' },
        servicos_contratos: {
          material: 'Material 1',
          texto_breve: 'Serviço 1',
          preco: 100,
        },
      },
    ];

    it('should return services with all filters', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue(
        mockServicesResponse,
      );

      const result = await repository.getNotScheduledServices(1);

      expect(result).toEqual(mockServicesResponse);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          id_obra: true,
          id_contrato_servico: true,
          id_material: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          qtde_adicional: true,
          viabilizado: true,
          descricao_operacao: true,
          numero_operacao: true,
          programacoes: { select: { data_prog: true } },
          materiais: { select: { descricao: true, codigo: true, preco: true } },
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              preco: true,
            },
          },
        },
        where: {
          id_obra: 1,
          id_programacao: {
            equals: null,
          },
          AND: [
            {
              OR: [
                {
                  qtde_real: null,
                },

                {
                  qtde_real: {
                    not: 0,
                  },
                },
              ],
            },
            { OR: [{ viabilizado: null }, { viabilizado: { not: 0 } }] },
          ],
        },
      });
      expect(prisma.servicos.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no services found', async () => {
      mockPrismaService.servicos.findMany.mockResolvedValue([]);

      const result = await repository.getNotScheduledServices(1);

      expect(result).toEqual([]);
    });
  });

  describe('getSelectedServices', () => {
    const mockParams: GetSelectedServicesParamsInterface = {
      id: 1,
      idProgramacao: 10,
    };

    const mockSelectedServicesResponse = [
      {
        id: 1,
        id_obra: 1,
        id_contrato_servico: 2,
        id_material: null,
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
          id_contrato_servico: true,
          id_material: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          qtde_adicional: true,
          viabilizado: true,
          descricao_operacao: true,
          numero_operacao: true,
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              preco: true,
            },
          },
          materiais: { select: { descricao: true, codigo: true, preco: true } },
          programacoes: { select: { data_prog: true } },
          equipes: {
            select: { equipe: true, encarregado: true, perfil: true },
          },
        },
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
          qtde_plan: 2,
          viabilizado: 3,
        },
        programacoes: { data_prog: '2024-01-01' },
        equipes: { equipe: 'LM 02' },
        prog: 3,
        real: 3,
        adicional: 2,
      },
      {
        id: 2,
        servicos: {
          servicos_contratos: { texto_breve: 'Serviço 2' },
          ponto: 'Ponto B',
          operacao: 'Operação 2',
          qtde_plan: 2,
          viabilizado: 3,
        },
        programacoes: { data_prog: '2024-01-02' },
        equipes: { equipe: 'LM 01' },
        prog: 2,
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
              materiais: { select: { descricao: true, codigo: true } },
              servicos_contratos: {
                select: { texto_breve: true, material: true },
              },
              ponto: true,
              numero_operacao: true,
              descricao_operacao: true,
              operacao: true,
              qtde_plan: true,
              viabilizado: true,
            },
          },
          programacoes: { select: { data_prog: true } },
          equipes: { select: { equipe: true, perfil: true } },
          id_programacao: true,
          id_servico: true,
          prog: true,
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

  describe('getMaterialsContract', () => {
    const mockContractsResponse = [
      {
        texto_breve: 'Serviço 1',
        material: 'Material 1',
        preco: 100,
        contrato: 'CONT-001',
        medida: 'UN',
      },
      {
        texto_breve: 'Serviço 2',
        material: 'Material 2',
        preco: 200,
        contrato: 'CONT-002',
        medida: 'M2',
      },
    ];

    it('should return service contracts', async () => {
      mockPrismaService.materiais.findMany.mockResolvedValue(
        mockContractsResponse,
      );

      const result = await repository.getMaterialsContract();

      expect(result).toEqual(mockContractsResponse);
      expect(prisma.materiais.findMany).toHaveBeenCalledTimes(1);
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
          id_obra: true,
          id_contrato_servico: true,
          id_material: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          qtde_adicional: true,
          viabilizado: true,
          descricao_operacao: true,
          numero_operacao: true,
          programacoes: { select: { data_prog: true } },
          materiais: { select: { codigo: true, descricao: true, preco: true } },
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              preco: true,
            },
          },
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
          id_obra: true,
          id_contrato_servico: true,
          id_material: true,
          operacao: true,
          ponto: true,
          qtde_plan: true,
          qtde_prog: true,
          qtde_real: true,
          qtde_adicional: true,
          viabilizado: true,
          descricao_operacao: true,
          numero_operacao: true,
          programacoes: { select: { data_prog: true } },
          materiais: { select: { codigo: true, descricao: true, preco: true } },
          servicos_contratos: {
            select: {
              material: true,
              texto_breve: true,
              preco: true,
            },
          },
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

  describe('getServiceOptions', () => {
    it('should return service options', async () => {
      const mockId = 100;

      const descriptionMock = [
        { descricao_operacao: 'Instalação de poste' },
        { descricao_operacao: 'Troca de cruzeta' },
        { descricao_operacao: 'Poda de árvore' },
      ];

      const numberMock = [
        { numero_operacao: 'OP001' },
        { numero_operacao: 'OP002' },
        { numero_operacao: 'OP003' },
      ];

      const pointsMock = [{ ponto: 'A' }, { ponto: 'B' }, { ponto: 'C' }];

      mockPrismaService.servicos.groupBy
        .mockResolvedValueOnce(descriptionMock)
        .mockResolvedValueOnce(numberMock)
        .mockResolvedValueOnce(pointsMock);

      const result = await repository.getServiceOptions(mockId);

      // Resultado esperado deve corresponder aos mocks
      expect(result).toEqual({
        operation_description: [
          'Instalação de poste',
          'Troca de cruzeta',
          'Poda de árvore',
        ],
        operation_number: ['OP001', 'OP002', 'OP003'],
        points: ['A', 'B', 'C'],
      });

      // Verificar que as 3 chamadas foram feitas com os parâmetros correctos
      expect(mockPrismaService.servicos.groupBy).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.servicos.groupBy).toHaveBeenCalledWith({
        by: ['descricao_operacao'],
        where: { id_obra: mockId },
      });
      expect(mockPrismaService.servicos.groupBy).toHaveBeenCalledWith({
        by: ['numero_operacao'],
        where: { id_obra: mockId },
      });
      expect(mockPrismaService.servicos.groupBy).toHaveBeenCalledWith({
        by: ['ponto'],
        where: { id_obra: mockId },
      });
    });
  });
});
