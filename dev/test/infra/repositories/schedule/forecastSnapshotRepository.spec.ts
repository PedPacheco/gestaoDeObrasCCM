import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ForecastSnapshotRepository } from 'src/infra/repositories/schedule/forecastSnapshotRepository';
import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';

import { Test, TestingModule } from '@nestjs/testing';

describe('SaveForecastSnapshotRepository', () => {
  let repository: ForecastSnapshotRepository;
  let prismaService: PrismaService;

  const prismaMock = {
    forecast_snapshot: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  // 🔹 Factories
  const makeDailyEntry = (override?: Partial<any>) => ({
    dataProg: '2026-03-18',
    qtdeWorks: 10,
    teams: 2,
    financialGoal: 1000,
    diaryGoal: 100,
    serviceMoProg: 50,
    serviceMoPlan: 60,
    serviceMoPend: 10,
    serviceMoExec: 40,
    serviceMoForecast: 55,
    materialMoProg: 30,
    materialMoPlan: 35,
    materialMoPend: 5,
    materialMoExec: 25,
    materialMoForecast: 32,
    isServicePendLowerThanProg: true,
    isMaterialPendLowerThanProg: true,
    forecastTotal: 50,
    execTotal: 50,
    diff: -10,
    ...override,
  });

  const makeGroupEntry = (override?: Partial<any>) => ({
    grupo: 'Grupo A',
    turma: 'Turma 1',
    qtdeWorks: 20,
    totalServiceMoProg: 100,
    totalServiceMoPlan: 120,
    totalServiceMoPend: 20,
    totalServiceMoPrev: 110,
    totalServiceMoExec: 90,
    totalServiceMoForecast: 100,
    totalMaterialMoProg: 80,
    totalMaterialMoPlan: 90,
    totalMaterialMoPend: 10,
    totalMaterialMoPrev: 85,
    totalMaterialMoExec: 70,
    totalMaterialMoForecast: 90,
    execTotal: 100,
    forecastTotal: 200,
    diff: -30,
    ...override,
  });

  const makeDTO = (
    override?: Partial<CreateForecastSnapshotDTO>,
  ): CreateForecastSnapshotDTO => ({
    diario: {
      summary: [makeDailyEntry()],
      totals: {
        totalQtdeObras: 142,
        totalTeams: 38,
        totalFinancialGoal: 850000,
        totalDiaryGoal: 42000,
        totalServiceMoProg: 600000,
        totalServiceMoPlan: 580000,
        totalServiceMoPend: 90000,
        totalServiceMoExec: 470000,
        totalServiceMoForecast: 560000,
        totalMaterialMoProg: 320000,
        totalMaterialMoPlan: 300000,
        totalMaterialMoPend: 50000,
        totalMaterialMoForecast: 290000,
        totalMaterialMoExec: 250000,
        totalExec: 300000,
        totalForecast: 300000,
        totalDiff: -100000,
      },
    },
    grupo: {
      summary: [makeGroupEntry()],
      totals: {
        totalWorks: 128,
        totalServiceMoProgByGrouping: 520000,
        totalServiceMoPlanByGrouping: 500000,
        totalServiceMoPendByGrouping: 80000,
        totalServiceMoExecByGrouping: 420000,
        totalServiceMoForecastByGrouping: 320000,
        totalMaterialMoProgByGrouping: 310000,
        totalMaterialMoPlanByGrouping: 295000,
        totalMaterialMoPendByGrouping: 45000,
        totalMaterialMoExecByGrouping: 250000,
        totalMaterialMoForecastByGrouping: 200000,
        totalExec: 100000,
        totalForecast: 200000,
        totalDiff: -85000,
      },
    },
    filtros: {
      regional: ['São josé'],
      grupo: ['Mercado'],
      parceira: ['Engelmig'],
      tipo: ['Poste'],
      dataInicial: '2026-01-01',
      dataFinal: '2026-01-31',
    },
    ...override,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForecastSnapshotRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get(ForecastSnapshotRepository);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should persist a forecast snapshot successfully with complete data', async () => {
      const dto = makeDTO();

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledTimes(1);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: {
          filtros: dto.filtros,
          diario: dto.diario,
          grupo: dto.grupo,
        },
      });
    });

    it('should default filtros to an empty object when undefined', async () => {
      const dto = makeDTO({ filtros: undefined });

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: {
          filtros: {},
          diario: dto.diario,
          grupo: dto.grupo,
        },
      });
    });

    it('should handle multiple daily entries correctly', async () => {
      const dto = makeDTO({
        diario: {
          summary: [
            makeDailyEntry(),
            makeDailyEntry({ dataProg: '2026-03-19', qtdeWorks: 15 }),
          ],
          totals: makeDTO().diario.totals,
        },
      });

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diario: expect.objectContaining({
            summary: expect.arrayContaining([
              expect.objectContaining({ dataProg: '2026-03-18' }),
              expect.objectContaining({ dataProg: '2026-03-19' }),
            ]),
          }),
        }),
      });
    });

    it('should handle multiple group entries correctly', async () => {
      const dto = makeDTO({
        grupo: {
          summary: [
            makeGroupEntry(),
            makeGroupEntry({ grupo: 'Grupo B', turma: 'Turma 2' }),
          ],
          totals: makeDTO().grupo.totals,
        },
      });

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          grupo: expect.objectContaining({
            summary: expect.arrayContaining([
              expect.objectContaining({ grupo: 'Grupo A' }),
              expect.objectContaining({ grupo: 'Grupo B' }),
            ]),
          }),
        }),
      });
    });

    it('should propagate Prisma errors', async () => {
      const dto = makeDTO();

      prismaMock.forecast_snapshot.create.mockRejectedValue(
        new Error('Prisma error'),
      );

      await expect(repository.create(dto)).rejects.toThrow('Prisma error');
    });

    it('should ensure the payload structure is valid', async () => {
      const dto = makeDTO();

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      const call = prismaMock.forecast_snapshot.create.mock.calls[0][0];

      expect(call).toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            filtros: expect.any(Object),
            diario: expect.objectContaining({
              summary: expect.any(Array),
              totals: expect.any(Object),
            }),
            grupo: expect.objectContaining({
              summary: expect.any(Array),
              totals: expect.any(Object),
            }),
          }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should call prisma.findMany without filters when no params are provided', async () => {
      const prismaResponse = [{ id: 1 }];

      prismaMock.forecast_snapshot.findUnique.mockResolvedValue(prismaResponse);

      const result = await repository.get(1);

      expect(prismaService.forecast_snapshot.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(result).toEqual(prismaResponse);
    });

    it('should apply date filter when dataInicial and dataFinal are provided', async () => {
      prismaMock.forecast_snapshot.findUnique.mockResolvedValue([]);

      await repository.get(1);

      expect(prismaService.forecast_snapshot.findUnique).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should return raw data from prisma without transformation', async () => {
      const prismaResponse = [
        {
          id: 1,
          filtros: {},
          diario: {},
          grupo: {},
          gerado_em: new Date(),
        },
      ];

      prismaMock.forecast_snapshot.findUnique.mockResolvedValue(prismaResponse);

      const result = await repository.get(1);

      expect(result).toBe(prismaResponse);
    });
  });

  describe('getAll', () => {
    it('should call prisma.findMany with correct select fields', async () => {
      prismaMock.forecast_snapshot.findMany.mockResolvedValue([]);

      const where: any = {};

      where.gerado_em = {};

      where.gerado_em.gte = new Date('2026-04-01');
      where.gerado_em.lte = new Date('2026-04-01');

      await repository.getAll(where);

      expect(prismaService.forecast_snapshot.findMany).toHaveBeenCalledWith({
        where,
        select: {
          id: true,
          gerado_em: true,
          filtros: true,
        },
      });
    });

    it('should return all snapshots with selected fields', async () => {
      const prismaResponse = [
        {
          id: 1,
          gerado_em: new Date('2026-03-01'),
          filtros: { dataInicial: '2026-03-01', dataFinal: '2026-03-31' },
        },
        {
          id: 2,
          gerado_em: new Date('2026-03-02'),
          filtros: { idRegional: [1, 2] },
        },
      ];

      const where: any = {};

      where.gerado_em = {};

      prismaMock.forecast_snapshot.findMany.mockResolvedValue(prismaResponse);

      const result = await repository.getAll(where);

      expect(result).toEqual(prismaResponse);
    });

    it('should return an empty array when no snapshots exist', async () => {
      prismaMock.forecast_snapshot.findMany.mockResolvedValue([]);

      const result = await repository.getAll({});

      expect(result).toEqual([]);
    });

    it('should propagate prisma errors', async () => {
      prismaMock.forecast_snapshot.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      const where: any = {};

      where.gerado_em = {};

      await expect(repository.getAll(where)).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should call delete method with sent id', async () => {
      prismaMock.forecast_snapshot.delete.mockResolvedValue({});

      await repository.delete(1);

      expect(prismaService.forecast_snapshot.delete).toHaveBeenCalledTimes(1);

      expect(prismaService.forecast_snapshot.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
