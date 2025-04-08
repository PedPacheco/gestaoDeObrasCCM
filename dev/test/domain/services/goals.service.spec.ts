import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { GoalsService } from 'src/domain/services/goals.service';

describe('GoalsService', () => {
  let service: GoalsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const result = await service.getGoals(baseFilters);

      expect(prismaService.$queryRaw).toHaveBeenCalled();

      expect(result).toEqual([
        {
          id_tipo: 1,
          tipo_obra: 'Obra 1',
          turma: 'Turma 1',
          regional: 'Regional 1',
          empreendimento: 'Empreendimento 1',
          anocalc: 2023,
          carteira: 1000,
          jan: { meta: 100, prog: 90, real: 80 },
          fev: { meta: 100, prog: 90, real: 80 },
          mar: { meta: 100, prog: 90, real: 80 },
          abr: { meta: 100, prog: 90, real: 80 },
          mai: { meta: 100, prog: 90, real: 80 },
          jun: { meta: 100, prog: 90, real: 80 },
          jul: { meta: 100, prog: 90, real: 80 },
          ago: { meta: 100, prog: 90, real: 80 },
          set: { meta: 100, prog: 90, real: 80 },
          out: { meta: 100, prog: 90, real: 80 },
          nov: { meta: 100, prog: 90, real: 80 },
          dez: { meta: 100, prog: 90, real: 80 },
        },
      ]);
    });

    it('should handle btzero filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, btzero: true };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND id_tipo = 48');
    });

    it('should handle rda filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, rda: true };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain(
        'AND id_tipo = 49 AND empreendimento IS NOT NULL',
      );
    });

    it('should handle regional filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, regional: [1, 2] };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_regional IN (');
    });

    it('should handle tipo filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, tipo: [1, 2] };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN (');
    });

    it('should handle parceira filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, parceira: [1, 2] };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN (');
    });

    it('should handle empreendimento filter correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = { ...baseFilters, empreendimento: [1, 2] };
      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN (');
    });

    it('should handle multiple filters simultaneously', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue(mockQueryResult);

      const filters = {
        ...baseFilters,
        regional: [1],
        tipo: [2],
        parceira: [3],
        empreendimento: [4],
        btzero: true,
      };

      await service.getGoals(filters);

      const call = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = call.strings.join('');
      expect(sqlString).toContain('AND id_tipo = 48');
      expect(sqlString).toContain('AND metas_anuais.id_regional IN (');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN (');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN (');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN (');
    });

    it('should handle empty result correctly', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getGoals(baseFilters);

      expect(result).toEqual([]);
    });
  });

  describe('transformData', () => {
    it('should transform data correctly', () => {
      const input = [
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

      const result = service['transformData'](input);

      expect(result).toEqual([
        {
          id_tipo: 1,
          tipo_obra: 'Obra 1',
          turma: 'Turma 1',
          regional: 'Regional 1',
          empreendimento: 'Empreendimento 1',
          anocalc: 2023,
          carteira: 1000,
          jan: { meta: 100, prog: 90, real: 80 },
          fev: { meta: 100, prog: 90, real: 80 },
          mar: { meta: 100, prog: 90, real: 80 },
          abr: { meta: 100, prog: 90, real: 80 },
          mai: { meta: 100, prog: 90, real: 80 },
          jun: { meta: 100, prog: 90, real: 80 },
          jul: { meta: 100, prog: 90, real: 80 },
          ago: { meta: 100, prog: 90, real: 80 },
          set: { meta: 100, prog: 90, real: 80 },
          out: { meta: 100, prog: 90, real: 80 },
          nov: { meta: 100, prog: 90, real: 80 },
          dez: { meta: 100, prog: 90, real: 80 },
        },
      ]);
    });

    it('should handle items without empreendimento field correctly', () => {
      const input = [
        {
          id_tipo: 1,
          tipo_obra: 'Obra 1',
          turma: 'Turma 1',
          regional: 'Regional 1',
          empreendimento: null,
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

      const result = service['transformData'](input);

      expect(result[0]).not.toHaveProperty('empreendimento');
    });

    it('should handle multiple items correctly', () => {
      const input = [
        {
          id_tipo: 1,
          tipo_obra: 'Obra 1',
          turma: 'Turma 1',
          regional: 'Regional 1',
          empreendimento: 'Empreendimento 1',
          anocalc: 2023,
          carteira: 1000,
          janfismeta: 100,
          janfisprog: 90,
          janfisreal: 80,
          fevfismeta: 100,
          fevfisprog: 90,
          fevfisreal: 80,
          marfismeta: 100,
          marfisprog: 90,
          marfisreal: 80,
          abrfismeta: 100,
          abrfisprog: 90,
          abrfisreal: 80,
          maifismeta: 100,
          maifisprog: 90,
          maifisreal: 80,
          junfismeta: 100,
          junfisprog: 90,
          junfisreal: 80,
          julfismeta: 100,
          julfisprog: 90,
          julfisreal: 80,
          agofismeta: 100,
          agofisprog: 90,
          agofisreal: 80,
          setfismeta: 100,
          setfisprog: 90,
          setfisreal: 80,
          outfismeta: 100,
          outfisprog: 90,
          outfisreal: 80,
          novfismeta: 100,
          novfisprog: 90,
          novfisreal: 80,
          dezfismeta: 100,
          dezfisprog: 90,
          dezfisreal: 80,
        },
        {
          id_tipo: 2,
          tipo_obra: 'Obra 2',
          turma: 'Turma 2',
          regional: 'Regional 2',
          empreendimento: 'Empreendimento 2',
          anocalc: 2023,
          carteira: 2000,
          janfismeta: 200,
          janfisprog: 180,
          janfisreal: 160,
          fevfismeta: 200,
          fevfisprog: 180,
          fevfisreal: 160,
          marfismeta: 200,
          marfisprog: 180,
          marfisreal: 160,
          abrfismeta: 200,
          abrfisprog: 180,
          abrfisreal: 160,
          maifismeta: 200,
          maifisprog: 180,
          maifisreal: 160,
          junfismeta: 200,
          junfisprog: 180,
          junfisreal: 160,
          julfismeta: 200,
          julfisprog: 180,
          julfisreal: 160,
          agofismeta: 200,
          agofisprog: 180,
          agofisreal: 160,
          setfismeta: 200,
          setfisprog: 180,
          setfisreal: 160,
          outfismeta: 200,
          outfisprog: 180,
          outfisreal: 160,
          novfismeta: 200,
          novfisprog: 180,
          novfisreal: 160,
          dezfismeta: 200,
          dezfisprog: 180,
          dezfisreal: 160,
        },
      ];

      const result = service['transformData'](input);

      expect(result.length).toBe(2);
      expect(result[0].id_tipo).toBe(1);
      expect(result[1].id_tipo).toBe(2);

      expect(result[0].jan).toEqual({ meta: 100, prog: 90, real: 80 });
      expect(result[1].jan).toEqual({ meta: 200, prog: 180, real: 160 });
    });
  });

  describe('SQL query construction', () => {
    it('should construct correct base SQL query', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2023],
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await service.getGoals(filters);

      const query = mockPrismaService.$queryRaw.mock.calls[0][0];
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
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2022, 2023],
        parceira: [],
        regional: [],
        tipo: [],
        empreendimento: [],
        btzero: false,
        rda: false,
      };

      await service.getGoals(filters);

      const query = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = query.values;

      expect(sqlString).toEqual([2022, 2023]);
    });

    it('should apply all filters simultaneously in the query', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      const filters: GoalsDTO = {
        ano: [2023],
        parceira: [1, 2],
        regional: [3, 4],
        tipo: [5, 6],
        empreendimento: [7, 8],
        btzero: true,
        rda: true,
      };

      await service.getGoals(filters);

      const query = mockPrismaService.$queryRaw.mock.calls[0][0];
      const sqlString = query.strings.join('');

      expect(sqlString).toContain('AND id_tipo = 48');
      expect(sqlString).toContain(
        'AND id_tipo = 49 AND empreendimento IS NOT NULL',
      );
      expect(sqlString).toContain('AND metas_anuais.id_regional IN');
      expect(sqlString).toContain('AND metas_anuais.id_tipo IN');
      expect(sqlString).toContain('AND metas_anuais.id_turma IN');
      expect(sqlString).toContain('AND metas_anuais.id_empreendimento IN');
    });
  });
});
