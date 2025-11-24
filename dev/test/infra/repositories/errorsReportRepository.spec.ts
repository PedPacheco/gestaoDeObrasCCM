import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { ErrorsReportRepository } from 'src/infra/repositories/errorsReportRepository';

describe('ErrorsReportRepository', () => {
  let repository: ErrorsReportRepository;

  const mockPrisma = {
    obras: {
      findMany: jest.fn() as jest.Mock,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorsReportRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get(ErrorsReportRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUndefinedItems', () => {
    it('deve buscar obras sem idRegional', async () => {
      const mockData = [
        {
          id: 1,
          ovnota: '123',
          data_conclusao: null,
          municipios: { municipio: 'Cidade A', id_regional: 1 },
          tipos: { tipo_obra: 'Rede' },
          turmas: { turma: 'Equipe 1' },
          circuitos: { circuito: 'C1' },
        },
      ];

      mockPrisma.obras.findMany.mockResolvedValue(mockData);

      const result = await repository.findUndefinedItems(undefined);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([]);
      await repository.findUndefinedItems(5);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            municipios: { id_regional: 5 },
          }),
        }),
      );
    });
  });

  describe('findScheduleError', () => {
    it('deve retornar os dados de obras com erro de programação quando idRegional é informado', async () => {
      const mockResponseDataFinancialValuesExecutionCapacityRepository = [
        {
          id: 1,
          ovnota: 'OV123',
          turmas: { turma: 'T01' },
          executado: false,
          programacoes: [{ prog: 10 }],
        },
      ];

      mockPrisma.obras.findMany.mockResolvedValue(
        mockResponseDataFinancialValuesExecutionCapacityRepository,
      );

      const result = await repository.findScheduleError(3);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          ovnota: true,
          turmas: { select: { turma: true } },
          executado: true,
          programacoes: { select: { prog: true }, where: { exec: null } },
        },
        where: {
          data_conclusao: null,
          programacoes: { some: { exec: null } },
          municipios: { id_regional: 3 },
        },
        orderBy: { id: 'asc' },
      });

      expect(result).toEqual(
        mockResponseDataFinancialValuesExecutionCapacityRepository,
      );
    });

    it('deve retornar os dados de obras com erro de programação sem filtrar por idRegional', async () => {
      const mockResponseDataFinancialValuesExecutionCapacityRepository = [
        {
          id: 2,
          ovnota: 'OV999',
          turmas: { turma: 'T02' },
          executado: false,
          programacoes: [{ prog: 5 }],
        },
      ];

      mockPrisma.obras.findMany.mockResolvedValue(
        mockResponseDataFinancialValuesExecutionCapacityRepository,
      );

      // Passando undefined ou 0 — o filtro de regionais não deve ser incluído
      const result = await repository.findScheduleError(undefined as any);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          ovnota: true,
          turmas: { select: { turma: true } },
          executado: true,
          programacoes: { select: { prog: true }, where: { exec: null } },
        },
        where: {
          data_conclusao: null,
          programacoes: { some: { exec: null } },
        },
        orderBy: { id: 'asc' },
      });

      expect(result).toEqual(
        mockResponseDataFinancialValuesExecutionCapacityRepository,
      );
    });
  });

  describe('findZeroCapex', () => {
    it('deve buscar obras sem idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 1 } as any]);
      const result = await repository.findZeroCapex();
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        }),
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 2 } as any]);
      await repository.findZeroCapex(3);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findExecutionDifferential', () => {
    it('deve buscar todas as obras', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 10 } as any]);
      const result = await repository.findExecutionDifferential();
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: {},
      });
      expect(result).toEqual([{ id: 10 }]);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 10 } as any]);
      await repository.findExecutionDifferential(99);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        where: { municipios: { id_regional: 99 } },
      });
    });
  });

  describe('findDivergentConclusion', () => {
    it('deve buscar obras sem idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 1 } as any]);
      const result = await repository.findDivergentConclusion();
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: { data_conclusao: null },
          }),
        }),
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 2 } as any]);
      await repository.findDivergentConclusion(7);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            municipios: { id_regional: 7 },
          }),
        }),
      );
    });
  });

  describe('findWorksWithoutYearPlan', () => {
    it('deve buscar obras sem idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 1 } as any]);
      const result = await repository.findWorksWithoutYearPlan();
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            data_conclusao: null,
            tipos: { id_grupo: 2 },
          }),
        }),
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 2 } as any]);
      await repository.findWorksWithoutYearPlan(10);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            municipios: { id_regional: 10 },
          }),
        }),
      );
    });
  });

  describe('findRepeatedWorks', () => {
    it('deve buscar obras sem idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 1 } as any]);
      const result = await repository.findRepeatedWorks();
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('deve buscar obras com idRegional', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ id: 3 } as any]);
      await repository.findRepeatedWorks(9);
      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            municipios: { id_regional: 9 },
          }),
        }),
      );
    });

    it('deve lançar erro caso o prisma falhe', async () => {
      const error = new Error('DB Error');
      mockPrisma.obras.findMany.mockRejectedValue(error);
      await expect(repository.findRepeatedWorks()).rejects.toThrow('DB Error');
    });
  });
});
