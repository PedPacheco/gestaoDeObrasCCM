import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GoalsRepository } from 'src/infra/repositories/goalsRepository';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';

describe('GoalsRepository', () => {
  let goalsRepository: GoalsRepository;

  // Schema "falso": garante que o repositório não tem construcao_sp fixo
  const SCHEMA = 'schema_teste';

  // Tipos tratados à parte no repositório
  const BTZERO_TIPOS = [48, 25, 50];
  const RDA_TIPOS = [54, 55, 35];
  const EXCLUDED_TIPOS = [48, 49, 54, 55, 35, 25, 50];

  const mockPrisma = {
    $queryRaw: vi.fn(),
  };

  const mockConfigService = {
    getOrThrow: vi.fn().mockReturnValue(SCHEMA),
  };

  /** Normaliza espaços para comparar SQL multi-linha */
  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  /** Query enviada na n-ésima chamada ao $queryRaw */
  function sentQuery(callIndex = 0): Prisma.Sql {
    return mockPrisma.$queryRaw.mock.calls[callIndex][0];
  }

  function sqlText(query: Prisma.Sql): string {
    return normalizeSQL(query.strings.join(''));
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsRepository,
        DbSchema,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    goalsRepository = module.get<GoalsRepository>(GoalsRepository);
  });

  afterEach(() => {
    // clearAllMocks mantém o mockReturnValue do getOrThrow
    vi.clearAllMocks();
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

    it('should use the schema from DB_SCHEMA and never the hardcoded one', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await goalsRepository.getGoals(baseFilters);

      const sql = sqlText(sentQuery());
      expect(sql).toContain(`FROM ${SCHEMA}.get_view_data(`);
      expect(sql).toContain(`INNER JOIN ${SCHEMA}.tipos`);
      expect(sql).toContain(`INNER JOIN ${SCHEMA}.turmas`);
      expect(sql).toContain(`INNER JOIN ${SCHEMA}.regionais`);
      expect(sql).toContain(`LEFT JOIN ${SCHEMA}.empreendimento`);
      expect(sql).not.toContain('construcao_sp.');
    });

    it('should exclude btzero and rda tipos when neither filter is active', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals(baseFilters);

      const query = sentQuery();
      expect(sqlText(query)).toContain('AND metas_anuais.id_tipo NOT IN (');
      // [anoPlan (null), ano, ...tipos excluídos]
      expect(query.values).toEqual([null, 2023, ...EXCLUDED_TIPOS]);
    });

    it('should handle btzero filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({ ...baseFilters, btzero: true });

      const query = sentQuery();
      const sql = sqlText(query);
      expect(sql).toContain('AND metas_anuais.id_tipo IN (');
      expect(sql).not.toContain('NOT IN');
      expect(query.values).toEqual([null, 2023, ...BTZERO_TIPOS]);
    });

    it('should handle rda filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({ ...baseFilters, rda: true });

      const query = sentQuery();
      const sql = sqlText(query);
      expect(sql).toContain('AND metas_anuais.id_tipo IN (');
      expect(sql).toContain('AND empreendimento IS NOT NULL');
      expect(sql).not.toContain('NOT IN');
      expect(query.values).toEqual([null, 2023, ...RDA_TIPOS]);
    });

    it('should handle regional filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({ ...baseFilters, regional: [1, 2] });

      const query = sentQuery();
      expect(sqlText(query)).toContain('AND metas_anuais.id_regional IN (');
      expect(query.values).toEqual([null, 2023, ...EXCLUDED_TIPOS, 1, 2]);
    });

    it('should handle tipo filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({ ...baseFilters, tipo: [1, 2] });

      const query = sentQuery();
      expect(sqlText(query)).toContain('AND metas_anuais.id_tipo IN (');
      expect(query.values).toEqual([null, 2023, ...EXCLUDED_TIPOS, 1, 2]);
    });

    it('should handle parceira filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({ ...baseFilters, parceira: [1, 2] });

      const query = sentQuery();
      expect(sqlText(query)).toContain('AND metas_anuais.id_turma IN (');
      expect(query.values).toEqual([null, 2023, ...EXCLUDED_TIPOS, 1, 2]);
    });

    it('should handle empreendimento filter correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({
        ...baseFilters,
        empreendimento: [1, 2],
      });

      const query = sentQuery();
      expect(sqlText(query)).toContain(
        'AND metas_anuais.id_empreendimento IN (',
      );
      expect(query.values).toEqual([null, 2023, ...EXCLUDED_TIPOS, 1, 2]);
    });

    it('should handle multiple filters simultaneously', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

      await goalsRepository.getGoals({
        ...baseFilters,
        regional: [1],
        tipo: [2],
        parceira: [3],
        empreendimento: [4],
        btzero: true,
      });

      const query = sentQuery();
      const sql = sqlText(query);
      expect(sql).toContain('AND metas_anuais.id_regional IN (');
      expect(sql).toContain('AND metas_anuais.id_tipo IN (');
      expect(sql).toContain('AND metas_anuais.id_turma IN (');
      expect(sql).toContain('AND metas_anuais.id_empreendimento IN (');
      // ordem: anoPlan, ano, btzero, regional, tipo, parceira, empreendimento
      expect(query.values).toEqual([null, 2023, ...BTZERO_TIPOS, 1, 2, 3, 4]);
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
        anoPlan: null,
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await goalsRepository.getGoals(filters);

      const query = sentQuery();
      const sql = sqlText(query);

      expect(query).toBeDefined();
      expect(sql).toContain('SELECT');
      // O parâmetro (null) sai de strings, por isso fica "get_view_data()"
      expect(sql).toContain(`FROM ${SCHEMA}.get_view_data()`);
      expect(sql).toContain('WHERE anocalc IN');
      expect(sql).toContain(
        'GROUP BY tipo_obra, turma, regional, empreendimento, anocalc, id_tipo',
      );
    });

    it('should construct query with multiple anos', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2022, 2023],
        anoPlan: 2026,
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await goalsRepository.getGoals(filters);

      expect(sentQuery().values).toEqual([2026, 2022, 2023, ...EXCLUDED_TIPOS]);
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

      const query = sentQuery();
      const sql = sqlText(query);

      expect(sql).toContain('AND empreendimento IS NOT NULL');
      expect(sql).toContain('AND metas_anuais.id_regional IN');
      expect(sql).toContain('AND metas_anuais.id_tipo IN');
      expect(sql).toContain('AND metas_anuais.id_turma IN');
      expect(sql).toContain('AND metas_anuais.id_empreendimento IN');
      expect(sql).not.toContain('NOT IN');
      // anoPlan, ano, btzero, rda, regional, tipo, parceira, empreendimento
      expect(query.values).toEqual([
        null,
        2023,
        ...BTZERO_TIPOS,
        ...RDA_TIPOS,
        3,
        4,
        5,
        6,
        1,
        2,
        7,
        8,
      ]);
    });
  });
});
