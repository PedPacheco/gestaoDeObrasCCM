import { Test } from '@nestjs/testing';
import { ForecastSnapshotService } from 'src/application/usecases/schedule/forecastSnapshot.service';
import { FORECAST_SNAPSHOT } from 'src/domain/repositories/schedule/IForecastSnapshotRepository';
import { createForecastSnapshotMock } from '../../../mocks/mockAddScheduleService';

describe('ForecastSnapshotService', () => {
  let service: ForecastSnapshotService;

  const mockRepository = {
    create: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ForecastSnapshotService,
        {
          provide: FORECAST_SNAPSHOT,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ForecastSnapshotService>(ForecastSnapshotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should call get method and return data', async () => {
      await service.execute(createForecastSnapshotMock);

      expect(mockRepository.create).toHaveBeenCalledWith(
        createForecastSnapshotMock,
      );
    });

    it('should throw error and not call create method if data.diario is empty', async () => {
      await expect(
        service.execute({ ...createForecastSnapshotMock, diario: [] }),
      ).rejects.toThrow('Snapshot diário não pode estar vazio');

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error and not call create if data.grupo is empty', async () => {
      await expect(
        service.execute({ ...createForecastSnapshotMock, grupo: [] }),
      ).rejects.toThrow('Snapshot de grupo não pode estar vazio');

      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should call repository.get and return formatted data', async () => {
      const mockParams = { page: 1 };

      const repositoryResponse = [
        {
          id: 1,
          gerado_em: '2026-03-18T10:00:00Z',
          filtros: {
            dataInicial: '2026-03-01',
            dataFinal: '2026-03-31',
          },
          diario: [
            {
              dataProg: '2026-03-18',
              qtdeWorks: '10',
              teams: '2',
              financialGoal: '1000',
              diaryGoal: '100',
              serviceMoProg: '50',
              serviceMoPlan: '60',
              serviceMoPend: '10',
              serviceMoExec: '40',
              serviceMoForecast: '55',
              materialMoProg: '30',
              materialMoPlan: '35',
              materialMoPend: '5',
              materialMoExec: '25',
              materialMoForecast: '32',
              isServicePendLowerThanProg: 1,
              isMaterialPendLowerThanProg: 0,
              diff: '-10',
            },
          ],
          grupo: [
            {
              grupo: 'Grupo A',
              turma: 'Turma 1',
              qtdeWorks: '20',
              totalServiceMoProg: '100',
              totalServiceMoPlan: '120',
              totalServiceMoPend: '20',
              totalServiceMoPrev: '110',
              totalServiceMoExec: '90',
              totalMaterialMoProg: '80',
              totalMaterialMoPlan: '90',
              totalMaterialMoPend: '10',
              totalMaterialMoPrev: '85',
              totalMaterialMoExec: '70',
              diff: '-30',
            },
          ],
        },
      ];

      mockRepository.get = jest.fn().mockResolvedValue(repositoryResponse);

      const result = await service.get(mockParams as any);

      expect(mockRepository.get).toHaveBeenCalledWith(mockParams);

      expect(result).toHaveLength(1);

      expect(result[0]).toEqual({
        id: 1,
        geradoEm: '2026-03-18T10:00:00Z',
        nomeArquivo: 'forecast_período_2026-03-01-2026-03-31',
        diario: [
          {
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
            isMaterialPendLowerThanProg: false,
            diff: -10,
          },
        ],
        grupo: [
          {
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
          },
        ],
      });
    });

    it('should return empty arrays when diario or grupo are not arrays', async () => {
      const repositoryResponse = [
        {
          id: 2,
          gerado_em: '2026-03-18T10:00:00Z',
          filtros: {
            dataInicial: '2026-03-01',
            dataFinal: '2026-03-31',
          },
          diario: null,
          grupo: undefined,
        },
      ];

      mockRepository.get = jest.fn().mockResolvedValue(repositoryResponse);

      const result = await service.get({} as any);

      expect(result[0].diario).toEqual([]);
      expect(result[0].grupo).toEqual([]);
    });

    it('should handle multiple snapshots correctly', async () => {
      const repositoryResponse = [
        {
          id: 1,
          gerado_em: '2026-03-18T10:00:00Z',
          filtros: {
            dataInicial: '2026-03-01',
            dataFinal: '2026-03-31',
          },
          diario: [],
          grupo: [],
        },
        {
          id: 2,
          gerado_em: '2026-03-19T10:00:00Z',
          filtros: {
            dataInicial: '2026-04-01',
            dataFinal: '2026-04-30',
          },
          diario: [],
          grupo: [],
        },
      ];

      mockRepository.get = jest.fn().mockResolvedValue(repositoryResponse);

      const result = await service.get({} as any);

      expect(result).toHaveLength(2);

      expect(result[0].nomeArquivo).toBe(
        'forecast_período_2026-03-01-2026-03-31',
      );

      expect(result[1].nomeArquivo).toBe(
        'forecast_período_2026-04-01-2026-04-30',
      );
    });

    it('should default numeric fields to 0 and boolean fields to false when values are null or undefined', async () => {
      const repositoryResponse = [
        {
          id: 1,
          gerado_em: '2026-03-18T10:00:00Z',
          filtros: {
            dataInicial: '2026-03-01',
            dataFinal: '2026-03-31',
          },
          diario: [
            {
              dataProg: '2026-03-18',

              qtdeWorks: null,
              teams: undefined,

              financialGoal: null,
              diaryGoal: undefined,

              serviceMoProg: null,
              serviceMoPlan: undefined,
              serviceMoPend: null,
              serviceMoExec: undefined,
              serviceMoForecast: null,

              materialMoProg: undefined,
              materialMoPlan: null,
              materialMoPend: undefined,
              materialMoExec: null,
              materialMoForecast: undefined,

              isServicePendLowerThanProg: null,
              isMaterialPendLowerThanProg: undefined,

              diff: null,
            },
          ],
          grupo: [
            {
              grupo: 'Grupo A',
              turma: 'Turma 1',

              qtdeWorks: null,

              totalServiceMoProg: undefined,
              totalServiceMoPlan: null,
              totalServiceMoPend: undefined,
              totalServiceMoPrev: null,
              totalServiceMoExec: undefined,

              totalMaterialMoProg: null,
              totalMaterialMoPlan: undefined,
              totalMaterialMoPend: null,
              totalMaterialMoPrev: undefined,
              totalMaterialMoExec: null,

              diff: undefined,
            },
          ],
        },
      ];

      mockRepository.get = jest.fn().mockResolvedValue(repositoryResponse);

      const result = await service.get({} as any);

      expect(result[0].diario[0]).toEqual({
        dataProg: '2026-03-18',

        qtdeWorks: 0,
        teams: 0,

        financialGoal: 0,
        diaryGoal: 0,

        serviceMoProg: 0,
        serviceMoPlan: 0,
        serviceMoPend: 0,
        serviceMoExec: 0,
        serviceMoForecast: 0,

        materialMoProg: 0,
        materialMoPlan: 0,
        materialMoPend: 0,
        materialMoExec: 0,
        materialMoForecast: 0,

        isServicePendLowerThanProg: false,
        isMaterialPendLowerThanProg: false,

        diff: 0,
      });

      expect(result[0].grupo[0]).toEqual({
        grupo: 'Grupo A',
        turma: 'Turma 1',

        qtdeWorks: 0,

        totalServiceMoProg: 0,
        totalServiceMoPlan: 0,
        totalServiceMoPend: 0,
        totalServiceMoPrev: 0,
        totalServiceMoExec: 0,

        totalMaterialMoProg: 0,
        totalMaterialMoPlan: 0,
        totalMaterialMoPend: 0,
        totalMaterialMoPrev: 0,
        totalMaterialMoExec: 0,

        diff: 0,
      });
    });
  });
});
