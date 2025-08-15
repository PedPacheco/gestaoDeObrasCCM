import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { GOALS_REPOSITORY } from 'src/domain/repositories/IGoalsRepository';
import { GoalsService } from 'src/application/goals.service';

describe('GoalsService', () => {
  let service: GoalsService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockRepository = {
    getGoals: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: GOALS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);

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

    it('Should call goalsRepository and return the formatted data', async () => {
      mockRepository.getGoals.mockResolvedValue(mockQueryResult);

      const result = await service.getGoals(baseFilters);

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
      expect(mockRepository.getGoals).toHaveBeenCalledWith(baseFilters);
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
});
