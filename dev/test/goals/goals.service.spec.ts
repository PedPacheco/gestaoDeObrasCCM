import { PrismaService } from '../../src/config/prisma/prisma.service';
import { GoalsService } from 'src/modules/goals/goals.service';
import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Goals } from 'src/types/goalsInterface';

describe('MetasService', () => {
  let mockCacheManager: Cache;
  let metasService: GoalsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        GoalsService,
        PrismaService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    metasService = module.get<GoalsService>(GoalsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getGoals', () => {
    it('should return goals', async () => {
      const filters = {
        idRegional: [1, 2, 3],
        idParceira: [2],
        idTipo: [15],
        anoCalc: [2024],
      };

      const responsePrisma = [
        {
          id_tipo: 15,
          tipo_obra: 'MELHORIA OPERATIVA',
          turma: 'ENGELMIG',
          regional: 'São José dos Campos',
          anocalc: 2024,
          janfismeta: 1.82,
          fevfismeta: 1.52,
          marfismeta: 1.85,
          abrfismeta: 1.85,
          maifismeta: 1.85,
          junfismeta: 1.85,
          julfismeta: 2.35,
          agofismeta: 2.35,
          setfismeta: 2.35,
          outfismeta: 2.35,
          novfismeta: 2.35,
          dezfismeta: 2.35,
          janfisprog: 0,
          fevfisprog: 0,
          marfisprog: 0,
          abrfisprog: 0,
          maifisprog: 0,
          junfisprog: 0,
          julfisprog: 0,
          agofisprog: 7.935930000000001,
          setfisprog: 0,
          outfisprog: 0,
          novfisprog: 0,
          dezfisprog: 0,
          janfisreal: 0.6072,
          fevfisreal: 2.16165,
          marfisreal: 0.4391,
          abrfisreal: 4.625559999999999,
          maifisreal: 0.573,
          junfisreal: 1.7559999999999998,
          julfisreal: 1.783,
          agofisreal: 0,
          setfisreal: 0,
          outfisreal: 0,
          novfisreal: 0,
          dezfisreal: 0,
          carteira: 0.78803,
        },
      ];

      const response: Goals[] = [
        {
          id_tipo: 15,
          tipo_obra: 'MELHORIA OPERATIVA',
          turma: 'ENGELMIG',
          regional: 'São José dos Campos',
          anocalc: 2024,
          carteira: 0.78803,
          jan: { meta: 1.82, prog: 0, real: 0.6072 },
          fev: { meta: 1.52, prog: 0, real: 2.16165 },
          mar: { meta: 1.85, prog: 0, real: 0.4391 },
          abr: { meta: 1.85, prog: 0, real: 4.625559999999999 },
          mai: { meta: 1.85, prog: 0, real: 0.573 },
          jun: { meta: 1.85, prog: 0, real: 1.7559999999999998 },
          jul: { meta: 2.35, prog: 0, real: 1.783 },
          ago: { meta: 2.35, prog: 7.935930000000001, real: 0 },
          set: { meta: 2.35, prog: 0, real: 0 },
          out: { meta: 2.35, prog: 0, real: 0 },
          nov: { meta: 2.35, prog: 0, real: 0 },
          dez: { meta: 2.35, prog: 0, real: 0 },
        },
      ];

      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(responsePrisma);

      const result = await metasService.getGoals(filters);

      expect(result).toEqual(response);
    });

    it('should handle missing filters and return default response', async () => {
      const responsePrisma = [
        {
          id_tipo: 15,
          tipo_obra: 'MELHORIA OPERATIVA',
          turma: 'ENGELMIG',
          regional: 'São José dos Campos',
          anocalc: 2024,
          janfismeta: 1.82,
          fevfismeta: 1.52,
          marfismeta: 1.85,
          abrfismeta: 1.85,
          maifismeta: 1.85,
          junfismeta: 1.85,
          julfismeta: 2.35,
          agofismeta: 2.35,
          setfismeta: 2.35,
          outfismeta: 2.35,
          novfismeta: 2.35,
          dezfismeta: 2.35,
          janfisprog: 0,
          fevfisprog: 0,
          marfisprog: 0,
          abrfisprog: 0,
          maifisprog: 0,
          junfisprog: 0,
          julfisprog: 0,
          agofisprog: 7.935930000000001,
          setfisprog: 0,
          outfisprog: 0,
          novfisprog: 0,
          dezfisprog: 0,
          janfisreal: 0.6072,
          fevfisreal: 2.16165,
          marfisreal: 0.4391,
          abrfisreal: 4.625559999999999,
          maifisreal: 0.573,
          junfisreal: 1.7559999999999998,
          julfisreal: 1.783,
          agofisreal: 0,
          setfisreal: 0,
          outfisreal: 0,
          novfisreal: 0,
          dezfisreal: 0,
          carteira: 0.78803,
        },
      ];

      const response: Goals[] = [
        {
          id_tipo: 15,
          tipo_obra: 'MELHORIA OPERATIVA',
          turma: 'ENGELMIG',
          regional: 'São José dos Campos',
          anocalc: 2024,
          carteira: 0.78803,
          jan: { meta: 1.82, prog: 0, real: 0.6072 },
          fev: { meta: 1.52, prog: 0, real: 2.16165 },
          mar: { meta: 1.85, prog: 0, real: 0.4391 },
          abr: { meta: 1.85, prog: 0, real: 4.625559999999999 },
          mai: { meta: 1.85, prog: 0, real: 0.573 },
          jun: { meta: 1.85, prog: 0, real: 1.7559999999999998 },
          jul: { meta: 2.35, prog: 0, real: 1.783 },
          ago: { meta: 2.35, prog: 7.935930000000001, real: 0 },
          set: { meta: 2.35, prog: 0, real: 0 },
          out: { meta: 2.35, prog: 0, real: 0 },
          nov: { meta: 2.35, prog: 0, real: 0 },
          dez: { meta: 2.35, prog: 0, real: 0 },
        },
      ];

      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue(responsePrisma);
      const result = await metasService.getGoals({});

      expect(result).toEqual(response);
    });
  });
});
