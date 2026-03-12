import * as moment from 'moment';
import { Test } from '@nestjs/testing';

import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';
import { MonthlySummaryForecastMapper } from 'src/application/mappers/monthlySummaryForecastMapper';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { MONTHLY_SUMMARY_FORECAST_CALCULATOR } from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  DailySummaryForecastResult,
  GroupSummaryForecastResult,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

describe('GetMonthlySummaryForecastService', () => {
  let service: GetMonthlySummaryForecastService;

  const filters: GetMonthlySummaryDTO = {
    dataFinal: '01/11/2024',
    dataInicial: '30/11/2024',
    idGrupo: [1],
    idParceira: [2],
    idRegional: [3],
    idTipo: [4],
  };

  const mockExecutionCapacity: unknown[] = [];

  const mockRepository = {
    getSummary: jest.fn(),
  };

  const mockExecutionCapacityRepository = {
    getFinancialValue: jest.fn(),
  };

  const mockSummaryForecastCalculator = {
    aggregateFinancialCapacityByMonth: jest.fn().mockReturnValue({
      dailyFinancialGoal: 0,
    }),
    calculateWorkOrderMetrics: jest
      .fn()
      .mockImplementation((servicePlan, materialPlan, prog, exec) => ({
        serviceCapexProg: servicePlan * (prog / 100),
        serviceCapexExec: servicePlan * (exec / 100),
        materialCapexProg: materialPlan * (prog / 100),
        materialCapexExec: materialPlan * (exec / 100),
      })),
    calculateGoalPercentage: jest.fn().mockReturnValue(0),
    calculateExecutionRate: jest
      .fn()
      .mockImplementation((svcProg, matProg, svcExec, matExec) => {
        const totalProg = svcProg + matProg;
        return totalProg > 0 ? ((svcExec + matExec) / totalProg) * 100 : 0;
      }),
    calculateMoPrev: jest.fn().mockReturnValue({
      serviceCapexPrev: 0,
      materialCapexPrev: 0,
    }),
    aggregateDailySummaryTotals: jest.fn().mockReturnValue({}),
    aggregateGroupTotals: jest.fn().mockReturnValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSummaryForecastCalculator.aggregateFinancialCapacityByMonth.mockReturnValue(
      { dailyFinancialGoal: 0 },
    );
    mockSummaryForecastCalculator.calculateWorkOrderMetrics.mockImplementation(
      (
        servicePlan: number,
        materialPlan: number,
        prog: number,
        exec: number,
      ) => ({
        serviceCapexProg: servicePlan * (prog / 100),
        serviceCapexExec: servicePlan * (exec / 100),
        materialCapexProg: materialPlan * (prog / 100),
        materialCapexExec: materialPlan * (exec / 100),
      }),
    );
    mockSummaryForecastCalculator.calculateGoalPercentage.mockReturnValue(0);
    mockSummaryForecastCalculator.calculateExecutionRate.mockImplementation(
      (svcProg: number, matProg: number, svcExec: number, matExec: number) => {
        const totalProg = svcProg + matProg;
        return totalProg > 0 ? ((svcExec + matExec) / totalProg) * 100 : 0;
      },
    );
    mockSummaryForecastCalculator.calculateMoPrev.mockReturnValue({
      serviceCapexPrev: 0,
      materialCapexPrev: 0,
    });
    mockSummaryForecastCalculator.aggregateDailySummaryTotals.mockReturnValue(
      {},
    );
    mockSummaryForecastCalculator.aggregateGroupTotals.mockReturnValue({});

    mockExecutionCapacityRepository.getFinancialValue.mockResolvedValue(
      mockExecutionCapacity,
    );

    const module = await Test.createTestingModule({
      providers: [
        GetMonthlySummaryForecastService,
        MonthlySummaryForecastMapper,
        {
          provide: GET_MONTHLY_SUMMARY_FORECAST_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: EXECUTION_CAPACITY_REPOSITORY,
          useValue: mockExecutionCapacityRepository,
        },
        {
          provide: MONTHLY_SUMMARY_FORECAST_CALCULATOR,
          useValue: mockSummaryForecastCalculator,
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
        equipe_linha_morta: 1,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        obras: {
          ovnota: 'OV001',
          ordem_dci: '0',
          ordem_dca: '0',
          ordem_dcd: '0',
          ordem_dcim: '0',
          capex_mat_pend: 3000,
          capex_mat_plan: 3000,
          capex_mo_pend: 2000,
          capex_mo_plan: 2000,
        },
      },
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        equipe_linha_morta: 2,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        obras: {
          ovnota: 'OV002',
          ordem_dci: '0',
          ordem_dca: '0',
          ordem_dcd: '0',
          ordem_dcim: '0',
          capex_mat_pend: 0,
          capex_mat_plan: 3000,
          capex_mo_pend: 0,
          capex_mo_plan: 2000,
        },
      },
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        equipe_linha_morta: null,
        equipe_linha_viva: null,
        equipe_regularizacao: null,
        obras: {
          ovnota: 'OV003',
          ordem_dci: '0',
          ordem_dca: '0',
          ordem_dcd: '0',
          ordem_dcim: '0',
          capex_mat_pend: 0,
          capex_mat_plan: 2000,
          capex_mo_pend: 0,
          capex_mo_plan: 2000,
        },
      },
    ];

    it('should call getSummary on the forecast repository with the correct filters', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(filters);
    });

    it('should call getFinancialValue with the year derived from dataFinal and idParceira', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(
        mockExecutionCapacityRepository.getFinancialValue,
      ).toHaveBeenCalledWith('2024', filters.idParceira);
    });

    it('should group records by date and return one entry per distinct date', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      expect(result.summary).toHaveLength(2);
    });

    it('should format dataProg as DD/MM/YYYY', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      const dates = result.summary.map((e) => e.dataProg);
      expect(dates).toContain('01/11/2024');
      expect(dates).toContain('02/11/2024');
    });

    it('should accumulate qtdeWorks correctly (1 record on 01/11, 2 records on 02/11)', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      const nov01 = result.summary.find((e) => e.dataProg === '01/11/2024')!;
      const nov02 = result.summary.find((e) => e.dataProg === '02/11/2024')!;

      expect(nov01.qtdeWorks).toBe(1);
      expect(nov02.qtdeWorks).toBe(2);
    });

    it('should accumulate materialMoPlan and materialMoProg correctly', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      const nov01 = result.summary.find((e) => e.dataProg === '01/11/2024')!;
      const nov02 = result.summary.find((e) => e.dataProg === '02/11/2024')!;

      expect(nov01.materialMoPlan).toBe(3000);
      expect(nov01.materialMoProg).toBe(3000);

      expect(nov02.materialMoPlan).toBe(5000);
      expect(nov02.materialMoProg).toBe(5000);
    });

    it('should apply exec ?? 0 — null exec on 01/11 results in zero exec values', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      const nov01 = result.summary.find((e) => e.dataProg === '01/11/2024')!;
      const nov02 = result.summary.find((e) => e.dataProg === '02/11/2024')!;

      expect(nov01.materialMoPend).toBe(3000);
      expect(nov01.materialMoExec).toBe(0);

      expect(nov02.materialMoPend).toBe(0);
      expect(nov02.materialMoExec).toBe(2500);
    });

    it('should accumulate serviceMoPlan, serviceMoProg, serviceMoPend and serviceMoExec correctly', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      const nov01 = result.summary.find((e) => e.dataProg === '01/11/2024')!;
      const nov02 = result.summary.find((e) => e.dataProg === '02/11/2024')!;

      expect(nov01.serviceMoPlan).toBe(2000);
      expect(nov01.serviceMoProg).toBe(2000);
      expect(nov01.serviceMoPend).toBe(2000);
      expect(nov01.serviceMoExec).toBe(0);

      expect(nov02.serviceMoPlan).toBe(4000);
      expect(nov02.serviceMoProg).toBe(4000);
      expect(nov02.serviceMoPend).toBe(0);
      expect(nov02.serviceMoExec).toBe(2000);
    });

    it('should produce zero prog values when prog is 0', async () => {
      const withZeroProg = [
        {
          data_prog: moment.utc('2024-11-05').toDate(),
          prog: 0,
          exec: null,
          equipe_linha_morta: 0,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          obras: {
            ovnota: 'OV999',
            ordem_dci: '0',
            ordem_dca: '0',
            ordem_dcd: '0',
            ordem_dcim: '0',
            capex_mat_pend: 1000,
            capex_mat_plan: 1000,
            capex_mo_pend: 500,
            capex_mo_plan: 500,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(withZeroProg);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      expect(result.summary).toHaveLength(1);
      expect(result.summary[0].materialMoProg).toBe(0);
      expect(result.summary[0].serviceMoProg).toBe(0);
    });

    it('should reuse the financial capacity cache — records in the same month must call aggregateFinancialCapacityByMonth only once', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(
        mockSummaryForecastCalculator.aggregateFinancialCapacityByMonth,
      ).toHaveBeenCalledTimes(1);
    });

    it('should call calculateExecutionRate once per distinct date to finalize diff', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(
        mockSummaryForecastCalculator.calculateExecutionRate,
      ).toHaveBeenCalledTimes(2);
    });

    it('should set diff on each entry after finalization', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      result.summary.forEach((entry) => {
        expect(entry).toHaveProperty('dataProg');
        expect(entry).toHaveProperty('diff');
        expect(typeof entry.diff).toBe('number');
      });
    });

    it('should return empty summary and call aggregateDailySummaryTotals with empty array when repository returns no data', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      expect(result.summary).toEqual([]);
      expect(
        mockSummaryForecastCalculator.aggregateDailySummaryTotals,
      ).toHaveBeenCalledWith([], expect.any(Object));
    });

    it('should deduplicate obras — same work key must not double-count plan/pend in uniqueWorksFinancial', async () => {
      const withDuplicateWork = [
        {
          data_prog: moment.utc('2024-11-01').toDate(),
          prog: 100,
          exec: null,
          equipe_linha_morta: 0,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          obras: {
            ovnota: 'OV-SAME',
            ordem_dci: '1',
            ordem_dca: '1',
            ordem_dcd: '1',
            ordem_dcim: '1',
            capex_mat_pend: 1000,
            capex_mat_plan: 1000,
            capex_mo_pend: 500,
            capex_mo_plan: 500,
          },
        },
        {
          data_prog: moment.utc('2024-11-02').toDate(),
          prog: 100,
          exec: null,
          equipe_linha_morta: 0,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          obras: {
            ovnota: 'OV-SAME',
            ordem_dci: '1',
            ordem_dca: '1',
            ordem_dcd: '1',
            ordem_dcim: '1',
            capex_mat_pend: 1000,
            capex_mat_plan: 1000,
            capex_mo_pend: 500,
            capex_mo_plan: 500,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(withDuplicateWork);

      await service.getSummary(filters);

      expect(
        mockSummaryForecastCalculator.aggregateDailySummaryTotals,
      ).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          totalServiceMoPlan: 500,
          totalMaterialMoPlan: 1000,
          totalServiceMoPend: 500,
          totalMaterialMoPend: 1000,
        }),
      );
    });

    it('should return the result of aggregateDailySummaryTotals as totals', async () => {
      const mockTotals = { totalQtdeObras: 3, totalDiff: 50 };
      mockSummaryForecastCalculator.aggregateDailySummaryTotals.mockReturnValue(
        mockTotals,
      );
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: DailySummaryForecastResult =
        await service.getSummary(filters);

      expect(result.totals).toEqual(mockTotals);
    });
  });

  describe('getSecondSummary', () => {
    const mockPrismaResponse = [
      {
        ovnota: '13906734',
        prog: 100,
        exec: 0,
        equipe_linha_morta: 0,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        data_prog: moment.utc('2024-11-18').toDate(),
        obras: {
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
        },
      },
      {
        ovnota: '14032497',
        prog: 100,
        exec: null,
        equipe_linha_morta: 0,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        data_prog: moment.utc('2024-11-29').toDate(),
        obras: {
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
        },
      },
      {
        ovnota: '14490588',
        prog: 100,
        exec: 50,
        equipe_linha_morta: 0,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        data_prog: moment.utc('2024-11-29').toDate(),
        obras: {
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
        },
      },
    ];

    it('should call getSummary on the repository with the correct filters', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSecondSummary(filters);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(filters);
    });

    it('should group records by grupo+turma composite key and return one entry per distinct pair', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.summary).toHaveLength(2);
    });

    it('should set grupo and turma fields correctly on each grouped entry', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const btZero = result.summary.find((e) => e.grupo === 'BT ZERO');
      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      );

      expect(btZero).toBeDefined();
      expect(btZero!.turma).toBe('START-TAU');
      expect(recomposicao).toBeDefined();
      expect(recomposicao!.turma).toBe('ENGELMIG');
    });

    it('should count qtdeWorks correctly per group', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const btZero = result.summary.find((e) => e.grupo === 'BT ZERO')!;
      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      )!;

      expect(btZero.qtdeWorks).toBe(1);
      expect(recomposicao.qtdeWorks).toBe(2);
    });

    it('should deduplicate the same obra (same keyWork) when it appears twice in the dataset', async () => {
      const withDuplicate = [mockPrismaResponse[0], mockPrismaResponse[0]];

      mockRepository.getSummary.mockResolvedValue(withDuplicate);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.summary).toHaveLength(1);
      expect(result.summary[0].qtdeWorks).toBe(2);
    });

    it('should accumulate plan/pend totals only once per unique obra', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      )!;

      expect(recomposicao.totalServiceMoPlan).toBe(4000);
      expect(recomposicao.totalMaterialMoPlan).toBe(5000);
      expect(recomposicao.totalServiceMoPend).toBe(2000);
      expect(recomposicao.totalMaterialMoPend).toBe(3000);
    });

    it('should NOT double-count plan/pend for a duplicated obra', async () => {
      const withDuplicate = [mockPrismaResponse[0], mockPrismaResponse[0]];

      mockRepository.getSummary.mockResolvedValue(withDuplicate);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.summary[0].totalServiceMoPlan).toBe(4000);
      expect(result.summary[0].totalMaterialMoPlan).toBe(4000);
    });

    it('should accumulate totalServiceMoProg and totalMaterialMoProg across all records in the group', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      )!;

      expect(recomposicao.totalServiceMoProg).toBe(4000);
      expect(recomposicao.totalMaterialMoProg).toBe(5000);
    });

    it('should accumulate totalServiceMoExec and totalMaterialMoExec correctly — null exec treated as 0', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      )!;

      expect(recomposicao.totalServiceMoExec).toBe(1000);
      expect(recomposicao.totalMaterialMoExec).toBe(1500);
    });

    it('should calculate diff using calculateExecutionRate — not inline formula', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      const recomposicao = result.summary.find(
        (e) => e.grupo === 'RECOMPOSIÇÃO',
      )!;

      expect(recomposicao.diff).toBeCloseTo((2500 / 9000) * 100, 5);
    });

    it('should set diff to 0 when totalProg equals 0 — guard against division by zero', async () => {
      const zeroProg = [
        {
          ...mockPrismaResponse[0],
          prog: 0,
          exec: 0,
          obras: {
            ...mockPrismaResponse[0].obras,
            capex_mat_plan: 0,
            capex_mo_plan: 0,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(zeroProg);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.summary[0].diff).toBe(0);
    });

    it('should return empty summary when the repository returns no data', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.summary).toEqual([]);
    });

    it('should return the result of aggregateGroupTotals as totals', async () => {
      const mockTotals = { totalWorks: 3, totalDiff: 27.7 };
      mockSummaryForecastCalculator.aggregateGroupTotals.mockReturnValue(
        mockTotals,
      );
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result: GroupSummaryForecastResult =
        await service.getSecondSummary(filters);

      expect(result.totals).toEqual(mockTotals);
    });
  });
});
