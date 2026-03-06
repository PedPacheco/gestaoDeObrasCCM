import * as moment from 'moment';
import { GetMonthlySummaryForecastService } from 'src/application/services/schedule/getMonthlySummaryForecast.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { obras, programacoes } from '@prisma/client';

describe('GetMonthlySummaryForecastService', () => {
  let service: GetMonthlySummaryForecastService;

  const filters: GetMonthlySummaryDTO = {
    date: '11/2024',
    idGrupo: [1],
    idParceira: [2],
    idRegional: [3],
    idTipo: [4],
  };

  const mockExecutionCapacity: unknown[] = [];

  const mockRepository = {
    getSummary: jest.fn(),
    getSecondSummary: jest.fn(),
  };

  const mockExecutionCapacityRepository = {
    getFinancialValue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockExecutionCapacityRepository.getFinancialValue.mockResolvedValue(
      mockExecutionCapacity,
    );

    const module = await Test.createTestingModule({
      providers: [
        GetMonthlySummaryForecastService,
        {
          provide: GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EXECUTION_CAPACITY_REPOSITORY,
          useValue: mockExecutionCapacityRepository,
        },
      ],
    }).compile();

    service = module.get<GetMonthlySummaryForecastService>(
      GetMonthlySummaryForecastService,
    );
  });

  describe('getSummary', () => {
    const mockPrismaResponse = [
      {
        data_prog: moment.utc('2024-11-01').toDate(),
        prog: 100,
        exec: null,
        obras: {
          capex_mat_pend: 3000,
          capex_mat_plan: 3000,
          capex_mo_pend: 2000,
          capex_mo_plan: 2000,
        },
      } as unknown as programacoes,
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        obras: {
          capex_mat_pend: 0,
          capex_mat_plan: 3000,
          capex_mo_pend: 0,
          capex_mo_plan: 2000,
        },
      } as unknown as programacoes,
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        obras: {
          capex_mat_pend: 0,
          capex_mat_plan: 2000,
          capex_mo_pend: 0,
          capex_mo_plan: 2000,
        },
      } as unknown as programacoes,
    ];

    it('should call getSummary on the forecast repository with the correct filters', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(filters);
    });

    it('should call getFinancialValue on the execution-capacity repository with hardcoded year "2026"', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(
        mockExecutionCapacityRepository.getFinancialValue,
      ).toHaveBeenCalledWith('2026');
    });

    it('should group records by date and return one entry per distinct date', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      expect(result).toHaveLength(2);
    });

    it('should format dataProg as DD/MM/YYYY', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const dates = result.map((e: any) => e.dataProg);
      expect(dates).toContain('01/11/2024');
      expect(dates).toContain('02/11/2024');
    });

    it('should accumulate totalQtde correctly (1 record on 01/11, 2 records on 02/11)', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const nov01 = result.find((e: any) => e.dataProg === '01/11/2024');
      const nov02 = result.find((e: any) => e.dataProg === '02/11/2024');

      expect(nov01!.totalQtde).toBe(1);
      expect(nov02!.totalQtde).toBe(2);
    });

    it('should accumulate materialMoPlan and materialMoProg correctly', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const nov01 = result.find((e: any) => e.dataProg === '01/11/2024');
      const nov02 = result.find((e: any) => e.dataProg === '02/11/2024');

      expect(nov01!.materialMoPlan).toBe(3000);
      expect(nov01!.materialMoProg).toBe(3000);
      expect(nov02!.materialMoPlan).toBe(5000);
      expect(nov02!.materialMoProg).toBe(5000);
    });

    it('should apply exec ?? 0 fallback — null exec on 01/11 results in zero exec and full pend', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const nov01 = result.find((e: any) => e.dataProg === '01/11/2024');
      const nov02 = result.find((e: any) => e.dataProg === '02/11/2024');

      expect(nov01!.materialMoPend).toBe(3000);
      expect(nov01!.materialMoExec).toBe(0);

      expect(nov02!.materialMoPend).toBe(0);
      expect(nov02!.materialMoExec).toBe(2500);
    });

    it('should accumulate serviceMoPlan, serviceMoProg, serviceMoPend and serviceMoExec correctly', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const nov01 = result.find((e: any) => e.dataProg === '01/11/2024');
      const nov02 = result.find((e: any) => e.dataProg === '02/11/2024');

      expect(nov01!.serviceMoPlan).toBe(2000);
      expect(nov01!.serviceMoProg).toBe(2000);
      expect(nov01!.serviceMoPend).toBe(2000);
      expect(nov01!.serviceMoExec).toBe(0);

      // 2000 + 2000
      expect(nov02!.serviceMoPlan).toBe(4000);
      expect(nov02!.serviceMoProg).toBe(4000);
      expect(nov02!.serviceMoPend).toBe(0);
      expect(nov02!.serviceMoExec).toBe(2000);
    });

    it('should apply prog ?? 0 fallback when prog is null', async () => {
      const withNullProg = [
        {
          data_prog: moment.utc('2024-11-05').toDate(),
          prog: null,
          exec: null,
          obras: {
            capex_mat_pend: 1000,
            capex_mat_plan: 1000,
            capex_mo_pend: 500,
            capex_mo_plan: 500,
          },
        },
      ] as unknown as programacoes[];

      mockRepository.getSummary.mockResolvedValue(withNullProg);

      const result = await service.getSummary(filters);

      expect(result).toHaveLength(1);
      expect(result[0].materialMoProg).toBe(0);
      expect(result[0].serviceMoProg).toBe(0);
    });

    it('should reuse the capacity cache — two records on the same month must not recompute metrics', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      const nov02 = result.find((e: any) => e.dataProg === '02/11/2024');
      expect(nov02!.serviceMoProg).toBe(4000);
      expect(nov02!.materialMoProg).toBe(5000);
    });

    it('should call finalizeDailySummaryEntryForecast for every grouped entry', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      expect(result).toHaveLength(2);
      result.forEach((entry: any) => {
        expect(entry).toHaveProperty('dataProg');
        expect(entry).toHaveProperty('diff');
      });
    });

    it('should return an empty array when the repository returns no data', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary(filters);

      expect(result).toEqual([]);
    });
  });

  describe('getSecondSummary', () => {
    const mockPrismaResponse = [
      {
        ovnota: '13906734',
        ordem_dci: '0',
        ordem_dca: '0',
        ordem_dcd: '0',
        ordem_dcim: '0',
        capex_mat_pend: 0,
        capex_mat_plan: 2000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
        turmas: { turma: 'START-TAU' },
        tipos: { grupos: { grupo: 'BT ZERO' } },
        programacoes: [
          { data_prog: moment.utc('2024-11-18').toDate(), prog: 100, exec: 0 },
        ],
      } as unknown as obras,
      {
        ovnota: '14032497',
        ordem_dci: '0',
        ordem_dca: '0',
        ordem_dcd: '0',
        ordem_dcim: '0',
        capex_mat_pend: 0,
        capex_mat_plan: 2000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
        turmas: { turma: 'ENGELMIG' },
        tipos: { grupos: { grupo: 'RECOMPOSIÇÃO' } },
        programacoes: [
          {
            data_prog: moment.utc('2024-11-29').toDate(),
            prog: 100,
            exec: null,
          },
        ],
      } as unknown as obras,
      {
        ovnota: '14490588',
        ordem_dci: '0',
        ordem_dca: '0',
        ordem_dcd: '0',
        ordem_dcim: '0',
        capex_mat_pend: 3000,
        capex_mat_plan: 3000,
        capex_mo_pend: 2000,
        capex_mo_plan: 2000,
        turmas: { turma: 'ENGELMIG' },
        tipos: { grupos: { grupo: 'RECOMPOSIÇÃO' } },
        programacoes: [
          { data_prog: moment.utc('2024-11-29').toDate(), prog: 100, exec: 50 },
        ],
      } as unknown as obras,
    ];

    it('should call getSecondSummary on the repository with the correct filters', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSecondSummary(filters);

      expect(mockRepository.getSecondSummary).toHaveBeenCalledWith(filters);
    });

    it('should group records by grupo+turma composite key and return one entry per distinct pair', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      expect(result).toHaveLength(2);
    });

    it('should set grupo and turma fields correctly on each grouped entry', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const btZero = result.find((e: any) => e.grupo === 'BT ZERO');
      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO');

      expect(btZero).toBeDefined();
      expect(btZero!.turma).toBe('START-TAU');
      expect(recomposicao).toBeDefined();
      expect(recomposicao!.turma).toBe('ENGELMIG');
    });

    it('should count unique work orders (qtdeObras) correctly per group', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const btZero = result.find((e: any) => e.grupo === 'BT ZERO')!;
      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(btZero.qtdeObras).toBe(1);
      expect(recomposicao.qtdeObras).toBe(2);
    });

    it('should deduplicate the same obra (same keyWork) when it appears twice in the dataset', async () => {
      const withDuplicate = [
        mockPrismaResponse[0],
        mockPrismaResponse[0],
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(withDuplicate);

      const result = await service.getSecondSummary(filters);

      expect(result).toHaveLength(1);
      expect(result[0].qtdeObras).toBe(1);
    });

    it('should accumulate plan/pend totals only once per unique obra (isNewWork = true branch)', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(recomposicao.totalMaterialMoPlan).toBe(5000);
      expect(recomposicao.totalServiceMoPlan).toBe(4000);
      expect(recomposicao.totalServiceMoPend).toBe(2000);
      expect(recomposicao.totalMaterialMoPend).toBe(3000);
    });

    it('should NOT accumulate plan/pend totals for a duplicated obra (isNewWork = false branch)', async () => {
      const withDuplicate = [
        mockPrismaResponse[0],
        mockPrismaResponse[0],
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(withDuplicate);

      const result = await service.getSecondSummary(filters);

      expect(result[0].totalMaterialMoPlan).toBe(2000);
      expect(result[0].totalServiceMoPlan).toBe(2000);
    });

    it('should accumulate totalServiceMoProg and totalMaterialMoProg across all programacoes of all obras in the group', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(recomposicao.totalServiceMoProg).toBe(4000);
      expect(recomposicao.totalMaterialMoProg).toBe(5000);
    });

    it('should accumulate totalServiceMoExec and totalMaterialMoExec correctly — null exec is treated as 0', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(recomposicao.totalServiceMoExec).toBe(1000);
      expect(recomposicao.totalMaterialMoExec).toBe(1500);
    });

    it('should calculate diff as ((totalServiceMoExec + totalMaterialMoExec) / (totalServiceMoProg + totalMaterialMoProg)) * 100', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e: any) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(recomposicao.diff).toBeCloseTo((2500 / 9000) * 100, 5);
    });

    it('should set diff to 0 when totalServiceMoProg + totalMaterialMoProg equals 0 — guard against NaN', async () => {
      const zeroProg = [
        {
          ...mockPrismaResponse[0],
          capex_mat_plan: 0,
          capex_mo_plan: 0,
          programacoes: [
            { data_prog: moment.utc('2024-11-18').toDate(), prog: 0, exec: 0 },
          ],
        },
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(zeroProg);

      const result = await service.getSecondSummary(filters);

      expect(result[0].diff).toBe(0);
    });

    it('should strip _obrasContabilizadas from every returned object', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      result.forEach((entry: any) => {
        expect(entry).not.toHaveProperty('_obrasContabilizadas');
      });
    });

    it('should iterate the inner programacoes loop for every obra in the group', async () => {
      const twoObras = [
        mockPrismaResponse[1],
        mockPrismaResponse[2],
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(twoObras);

      const result = await service.getSecondSummary(filters);

      expect(result).toHaveLength(1);
      expect(result[0].totalServiceMoProg).toBe(4000);
      expect(result[0].totalMaterialMoProg).toBe(5000);
    });

    it('should return an empty array when the repository returns no data', async () => {
      mockRepository.getSecondSummary.mockResolvedValue([]);

      const result = await service.getSecondSummary(filters);

      expect(result).toEqual([]);
    });
  });
});
