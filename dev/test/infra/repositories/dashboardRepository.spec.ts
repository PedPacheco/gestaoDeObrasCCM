import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { DashboardFiltersBuilder } from 'src/utils/dashboardFilters.builder';
import { DashboardRepository } from 'src/infra/repositories/dashboardRepository';

jest.mock('src/utils/dashboardFilters.builder', () => ({
  DashboardFiltersBuilder: {
    buildObrasWhere: jest.fn(),
    buildSQLWhere: jest.fn(),
  },
}));

const getSqlString = (query: any): string => {
  if (typeof query === 'string') return query;
  if (query?.sql) return query.sql;
  if (query?.text) return query.text;

  return String(query);
};

describe('DashboardRepository', () => {
  let repository: DashboardRepository;

  const mockPrismaService = {
    obras: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<DashboardRepository>(DashboardRepository);

    (DashboardFiltersBuilder.buildObrasWhere as jest.Mock).mockReturnValue({});

    (DashboardFiltersBuilder.buildSQLWhere as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('countTotalWorks', () => {
    it('should count total works', async () => {
      mockPrismaService.obras.count.mockResolvedValueOnce(100);

      const result = await repository.countTotalWorks({} as any);

      expect(result).toBe(100);

      expect(mockPrismaService.obras.count).toHaveBeenCalledWith({
        where: {},
      });

      expect(DashboardFiltersBuilder.buildObrasWhere).toHaveBeenCalledWith({});
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockPrismaService.obras.count.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.countTotalWorks({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar total de obras'),
      );
    });
  });

  describe('countConcludedThisMonth', () => {
    it('should count concluded works this month', async () => {
      mockPrismaService.obras.count.mockResolvedValueOnce(50);

      const result = await repository.countConcludedThisMonth({} as any);

      expect(result).toBe(50);

      expect(DashboardFiltersBuilder.buildObrasWhere).toHaveBeenCalledWith(
        {},
        'data_conclusao',
      );
    });

    it('should throw exception on error', async () => {
      mockPrismaService.obras.count.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(
        repository.countConcludedThisMonth({} as any),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'Erro ao buscar obras concluídas no período',
        ),
      );
    });
  });

  describe('countWithoutSchedule', () => {
    it('should count works without schedule', async () => {
      mockPrismaService.obras.count.mockResolvedValueOnce(15);

      const result = await repository.countWithoutSchedule({} as any);

      expect(result).toBe(15);

      expect(mockPrismaService.obras.count).toHaveBeenCalledWith({
        where: {
          programacoes: {
            none: {},
          },
        },
      });
    });

    it('should throw exception on error', async () => {
      mockPrismaService.obras.count.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.countWithoutSchedule({} as any)).rejects.toThrow(
        new InternalServerErrorException(
          'Erro ao buscar obras sem programação',
        ),
      );
    });
  });

  describe('countTotalConcluded', () => {
    it('should count total concluded works', async () => {
      mockPrismaService.obras.count.mockResolvedValueOnce(80);

      const result = await repository.countTotalConcluded({} as any);

      expect(result).toBe(80);

      expect(mockPrismaService.obras.count).toHaveBeenCalledWith({
        where: {
          data_conclusao: {
            not: null,
          },
        },
      });
    });

    it('should throw exception on error', async () => {
      mockPrismaService.obras.count.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.countTotalConcluded({} as any)).rejects.toThrow(
        new InternalServerErrorException(
          'Erro ao buscar total de obras concluídas',
        ),
      );
    });
  });

  describe('countPortfolio', () => {
    it('should return portfolio value', async () => {
      mockPrismaService.obras.aggregate.mockResolvedValueOnce({
        _sum: {
          mo_pend: 1000,
        },
      } as any);

      const result = await repository.countPortfolio({} as any);

      expect(result).toBe(1000);

      expect(mockPrismaService.obras.aggregate).toHaveBeenCalledWith({
        where: {
          programacoes: {
            none: {},
          },
        },
        _sum: {
          mo_pend: true,
        },
      });
    });

    it('should return 0 when mo_pend is null', async () => {
      mockPrismaService.obras.aggregate.mockResolvedValueOnce({
        _sum: {
          mo_pend: null,
        },
      } as any);

      const result = await repository.countPortfolio({} as any);

      expect(result).toBe(0);
    });

    it('should throw exception on error', async () => {
      mockPrismaService.obras.aggregate.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.countPortfolio({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar valor do portfólio'),
      );
    });
  });

  describe('countExecutedValue', () => {
    it('should return executed value', async () => {
      mockPrismaService.obras.aggregate.mockResolvedValueOnce({
        _sum: {
          mo_planejada: 5000,
        },
      } as any);

      const result = await repository.countExecutedValue({} as any);

      expect(result).toBe(5000);

      expect(mockPrismaService.obras.aggregate).toHaveBeenCalledWith({
        where: {},
        _sum: {
          mo_planejada: true,
        },
      });
    });

    it('should return 0 when mo_planejada is null', async () => {
      mockPrismaService.obras.aggregate.mockResolvedValueOnce({
        _sum: {
          mo_planejada: null,
        },
      } as any);

      const result = await repository.countExecutedValue({} as any);

      expect(result).toBe(0);
    });

    it('should throw exception on error', async () => {
      mockPrismaService.obras.aggregate.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.countExecutedValue({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar valor executado'),
      );
    });
  });

  describe('findWorksByStatus', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findWorksByStatus({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('FROM construcao_sp.obras o');

      expect(query).toContain('GROUP BY s.id, s.status');

      expect(query).toContain('ORDER BY count DESC');
    });

    it('should return query result', async () => {
      const mockResponse = [
        {
          status: 'Concluído',
          count: 10,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.findWorksByStatus({} as any);

      expect(result).toEqual(mockResponse);
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findWorksByStatus({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar obras por status'),
      );
    });
  });

  describe('findWorksByRegional', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findWorksByRegional({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('r.regional');

      expect(query).toContain('AS concluded');

      expect(query).toContain('GROUP BY r.id, r.regional');
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findWorksByRegional({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar obras por regional'),
      );
    });
  });

  describe('findMonthlyTrend', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findMonthlyTrend({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain("DATE_TRUNC('month', o.entrada)");

      expect(query).toContain('AS month');

      expect(query).toContain('GROUP BY DATE_TRUNC');
    });

    it('should call buildSQLWhere with o.entrada', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findMonthlyTrend({} as any);

      expect(DashboardFiltersBuilder.buildSQLWhere).toHaveBeenCalledWith(
        {},
        'o.entrada',
      );
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findMonthlyTrend({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar tendência mensal'),
      );
    });
  });

  describe('findTopPartners', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findTopPartners({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('t.turma AS partner');

      expect(query).toContain('LIMIT 5');
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findTopPartners({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar principais parceiras'),
      );
    });
  });

  describe('findRecentWorks', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findRecentWorks({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('ORDER BY o.id DESC');

      expect(query).toContain('LIMIT 10');

      expect(query).toContain('o.ovnota');
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findRecentWorks({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar obras recentes'),
      );
    });
  });

  describe('findPartnerStatus', () => {
    it('should execute query correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.findPartnerStatus({} as any);

      const query = getSqlString(mockPrismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('t.turma AS partner');

      expect(query).toContain('COUNT(o.id)::int AS count');

      expect(query).toContain('GROUP BY');

      expect(query).toContain('ORDER BY');
    });

    it('should return query result', async () => {
      const mockResponse = [
        {
          partner: 'Parceira X',
          status: 'Concluído',
          count: 10,
        },
      ];

      mockPrismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.findPartnerStatus({} as any);

      expect(result).toEqual(mockResponse);
    });

    it('should throw exception on error', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('database error'),
      );

      await expect(repository.findPartnerStatus({} as any)).rejects.toThrow(
        new InternalServerErrorException('Erro ao buscar status das parceiras'),
      );
    });
  });
});
