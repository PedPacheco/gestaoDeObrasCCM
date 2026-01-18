import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GoalsRepository } from 'src/infra/repositories/goalsRepository';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';

import { Test, TestingModule } from '@nestjs/testing';

describe('GoalsRepository', () => {
  let goalsRepository: GoalsRepository;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    goalsRepository = module.get<GoalsRepository>(GoalsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoals', () => {
    const mockQueryResult = [
      {
        id_tipo: 1,
        tipo_obra: 'Obra 1',
        turma: 'Turma 1',
        regional: 'Regional 1',
        empreendimento: 'Empreendimento 1',
        anocalc: 2023,
        carteira: 1000,
        janfismeta: 100,
        fevfismeta: 100,
        marfismeta: 100,
        abrfismeta: 100,
        maifismeta: 100,
        junfismeta: 100,
        julfismeta: 100,
        agofismeta: 100,
        setfismeta: 100,
        outfismeta: 100,
        novfismeta: 100,
        dezfismeta: 100,
        janfisprog: 90,
        fevfisprog: 90,
        marfisprog: 90,
        abrfisprog: 90,
        maifisprog: 90,
        junfisprog: 90,
        julfisprog: 90,
        agofisprog: 90,
        setfisprog: 90,
        outfisprog: 90,
        novfisprog: 90,
        dezfisprog: 90,
        janfisreal: 80,
        fevfisreal: 80,
        marfisreal: 80,
        abrfisreal: 80,
        maifisreal: 80,
        junfisreal: 80,
        julfisreal: 80,
        agofisreal: 80,
        setfisreal: 80,
        outfisreal: 80,
        novfisreal: 80,
        dezfisreal: 80,
      },
    ];

    const baseFilters: GoalsDTO = {
      ano: [2023],
      parceira: [],
      regional: [],
      tipo: [],
      empreendimento: [],
      btzero: false,
      rda: false,
    };

    it('should return transformed data from the database', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const result = await goalsRepository.getGoals(baseFilters);

      expect(result).toEqual(mockQueryResult);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    it('should handle btzero filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, btzero: true };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND id_tipo = 48');
    });

    it('should handle rda filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, rda: true };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain(
        'AND id_tipo = 54 AND id_tipo = 55 AND id_tipo = 35 AND empreendimento IS NOT NULL',
      );
    });

    it('should handle regional filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, regional: [1, 2] };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_regional IN (');
    });

    it('should handle tipo filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, tipo: [1, 2] };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN (');
    });

    it('should handle parceira filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, parceira: [1, 2] };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN (');
    });

    it('should handle empreendimento filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, empreendimento: [1, 2] };
      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN (');
    });

    it('should handle multiple filters simultaneously', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = {
        ...baseFilters,
        regional: [1],
        tipo: [2],
        parceira: [3],
        empreendimento: [4],
        btzero: true,
      };

      await goalsRepository.getGoals(filters);

      const call = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND id_tipo = 48');
      expect(sqlString).toContain('AND metas_anuais.id_regional IN (');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN (');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN (');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN (');
    });

    it('should handle empty result correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const result = await goalsRepository.getGoals(baseFilters);

      expect(result).toEqual([]);
    });
  });

  describe('SQL query construction', () => {
    it('should construct correct base SQL query', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2023],
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await goalsRepository.getGoals(filters);

      const query = mockPrisma.$queryRaw.mock.calls[0][0];
      expect(query).toBeDefined();
      expect(query.strings.join('')).toContain('SELECT');
      expect(query.strings.join('')).toContain(
        'FROM construcao_sp.get_view_data(NULL)',
      );
      expect(query.strings.join('')).toContain('WHERE anocalc IN');
      expect(query.strings.join('')).toContain(
        'GROUP BY tipo_obra, turma, regional, empreendimento, anocalc, id_tipo',
      );
    });

    it('should construct query with multiple anos', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2022, 2023],
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await goalsRepository.getGoals(filters);

      const query = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = query.values;

      expect(sqlString).toEqual([2022, 2023]);
    });

    it('should apply all filters simultaneously in the query', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2023],
        parceira: [1, 2],
        regional: [3, 4],
        tipo: [5, 6],
        empreendimento: [7, 8],
        btzero: true,
        rda: true,
      };

      await goalsRepository.getGoals(filters);

      const query = mockPrisma.$queryRaw.mock.calls[0][0];
      const sqlString = query.strings.join('');

      expect(sqlString).toContain('AND id_tipo = 48');
      expect(sqlString).toContain(
        'AND id_tipo = 54 AND id_tipo = 55 AND id_tipo = 35 AND empreendimento IS NOT NULL',
      );
      expect(sqlString).toContain('AND metas_anuais.id_regional IN');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN');
    });
  });
});
