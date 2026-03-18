import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ForecastSnapshotRepository } from 'src/infra/repositories/schedule/forecastSnapshotRepository';
import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

import { Test, TestingModule } from '@nestjs/testing';

describe('SaveForecastSnapshotRepository', () => {
  let repository: ForecastSnapshotRepository;
  let prismaService: PrismaService;

  const prismaMock = {
    forecast_snapshot: {
      create: jest.fn(),
    },
  };

  // 🔹 Factories (ESSENCIAL para clean test)
  const makeDailyEntry = (
    override?: Partial<DailySummaryEntryForecast>,
  ): DailySummaryEntryForecast => ({
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
    diff: -10,
    ...override,
  });

  const makeGroupEntry = (
    override?: Partial<GroupTeamSummaryEntryForecast>,
  ): GroupTeamSummaryEntryForecast => ({
    grupo: 'Grupo A',
    turma: 'Turma 1',
    qtdeWorks: 20,
    totalServiceMoProg: 100,
    totalServiceMoPlan: 120,
    totalServiceMoPend: 20,
    totalServiceMoPrev: 110,
    totalServiceMoExec: 90,
    totalMaterialMoProg: 80,
    totalMaterialMoPlan: 90,
    totalMaterialMoPend: 10,
    totalMaterialMoPrev: 85,
    totalMaterialMoExec: 70,
    diff: -30,
    ...override,
  });

  const makeDTO = (
    override?: Partial<CreateForecastSnapshotDTO>,
  ): CreateForecastSnapshotDTO => ({
    diario: [makeDailyEntry()],
    grupo: [makeGroupEntry()],
    filtros: {
      idRegional: [1],
      idGrupo: [1],
      idParceira: [2],
      idTipo: [3],
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
        diario: [
          makeDailyEntry(),
          makeDailyEntry({ dataProg: '2026-03-19', qtdeWorks: 15 }),
        ],
      });

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          diario: expect.arrayContaining([
            expect.objectContaining({ dataProg: '2026-03-18' }),
            expect.objectContaining({ dataProg: '2026-03-19' }),
          ]),
        }),
      });
    });

    it('should handle multiple group entries correctly', async () => {
      const dto = makeDTO({
        grupo: [
          makeGroupEntry(),
          makeGroupEntry({ grupo: 'Grupo B', turma: 'Turma 2' }),
        ],
      });

      prismaMock.forecast_snapshot.create.mockResolvedValue({});

      await repository.create(dto);

      expect(prismaService.forecast_snapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          grupo: expect.arrayContaining([
            expect.objectContaining({ grupo: 'Grupo A' }),
            expect.objectContaining({ grupo: 'Grupo B' }),
          ]),
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
            diario: expect.any(Array),
            grupo: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should call prisma.findMany without date filter when no params are provided', async () => {
      const params = {} as any;

      const prismaResponse = [{ id: 1 }];

      prismaService.forecast_snapshot.findMany = jest
        .fn()
        .mockResolvedValue(prismaResponse);

      const result = await repository.get(params);

      expect(prismaService.forecast_snapshot.findMany).toHaveBeenCalledWith({
        where: {},
      });

      expect(result).toEqual(prismaResponse);
    });

    it('should apply date filter when dataInicial and dataFinal are provided', async () => {
      const params = {
        dataInicial: '2026-03-01',
        dataFinal: '2026-03-31',
      };

      prismaService.forecast_snapshot.findMany = jest
        .fn()
        .mockResolvedValue([]);

      await repository.get(params);

      expect(prismaService.forecast_snapshot.findMany).toHaveBeenCalledWith({
        where: {
          gerado_em: {
            gte: new Date('2026-03-01'),
            lte: new Date('2026-03-31'),
          },
        },
      });
    });

    it('should not apply date filter when only dataInicial is provided', async () => {
      const params = {
        dataInicial: '2026-03-01',
      };

      prismaService.forecast_snapshot.findMany = jest
        .fn()
        .mockResolvedValue([]);

      await repository.get(params);

      expect(prismaService.forecast_snapshot.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should not apply date filter when only dataFinal is provided', async () => {
      const params = {
        dataFinal: '2026-03-31',
      };

      prismaService.forecast_snapshot.findMany = jest
        .fn()
        .mockResolvedValue([]);

      await repository.get(params);

      expect(prismaService.forecast_snapshot.findMany).toHaveBeenCalledWith({
        where: {},
      });
    });

    it('should return the raw data from prisma without transformation', async () => {
      const prismaResponse = [
        {
          id: 1,
          filtros: {},
          diario: [],
          grupo: [],
          gerado_em: new Date(),
        },
      ];

      prismaService.forecast_snapshot.findMany = jest
        .fn()
        .mockResolvedValue(prismaResponse);

      const result = await repository.get({} as any);

      expect(result).toBe(prismaResponse);
    });
  });
});
