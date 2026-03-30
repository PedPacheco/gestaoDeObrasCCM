import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';

describe('GetMonthlySummaryForecastService', () => {
  let service: GetMonthlySummaryForecastService;

  const mockRepository = {
    getSummary: jest.fn(),
    getCapexPlan: jest.fn(),
  };

  const mockCalculator = {
    aggregateFinancialCapacityByMonth: jest.fn(),
    calculateWorkOrderMetrics: jest.fn(),
    calculateGoalPercentage: jest.fn(),
    calculateExecutionRate: jest.fn(),
    aggregateDailySummaryTotals: jest.fn(),
    calculateMoPrev: jest.fn(),
    aggregateGroupTotals: jest.fn(),
  };

  const mockMapper = {
    createDailySummaryEntry: jest.fn(),
    accumulateDailySummaryEntry: jest.fn(),
    finalizeDailySummaryEntry: jest.fn(),
    createGroupTeamEntry: jest.fn(),
    accumulateGroupTeamEntry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new GetMonthlySummaryForecastService(
      mockRepository as any,
      mockCalculator as any,
      mockMapper as any,
    );
  });

  // =============================
  // ✅ getSummary
  // =============================
  describe('getSummary', () => {
    it('should return empty summary and zero totals when no data', async () => {
      mockRepository.getSummary.mockResolvedValue([]);
      mockRepository.getCapexPlan.mockResolvedValue([]);

      mockCalculator.aggregateDailySummaryTotals.mockReturnValue({
        totalQtdeObras: 0,
        totalTeams: 0,
        totalFinancialGoal: 0,
        totalDiaryGoal: 0,
        totalFinancialGoalWith8: 0,
        totalDiaryGoalWith8: 0,
        totalMoProg: 0,
        totalMoExec: 0,
        totalDiff: 0,
      });

      const result = await service.getSummary({
        dataInicial: '01/01/2026',
        dataFinal: '01/01/2026',
      } as any);

      expect(result).toEqual({
        summary: [],
        totals: expect.any(Object),
      });

      expect(mockCalculator.aggregateDailySummaryTotals).toHaveBeenCalled();
    });

    it('should aggregate data correctly', async () => {
      const mockData = [
        {
          data_prog: '2026-01-01',
          exec: null,
          prog: 100,
          obras: {
            capex_mo_plan: 100,
            capex_mat_plan: 50,
            capex_mo_pend: 20,
            capex_mat_pend: 10,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(mockData);
      mockRepository.getCapexPlan.mockResolvedValue([{}]);

      mockCalculator.aggregateFinancialCapacityByMonth.mockReturnValue({
        totalFinancial: 1000,
        dailyFinancialGoal: 100,
      });

      mockCalculator.calculateWorkOrderMetrics.mockReturnValue({
        serviceCapexProg: 50,
      });

      mockCalculator.calculateGoalPercentage.mockReturnValue(10);

      mockCalculator.calculateExecutionRate.mockReturnValue(80);

      mockCalculator.aggregateDailySummaryTotals.mockReturnValue({
        totalQtdeObras: 1,
      });

      mockMapper.createDailySummaryEntry.mockReturnValue({
        serviceMoProg: 100,
        materialMoProg: 50,
        serviceMoExec: 0,
        materialMoExec: 0,
      });

      const result = await service.getSummary({
        dataInicial: '01/01/2026',
        dataFinal: '01/01/2026',
      } as any);

      expect(result.summary.length).toBe(1);

      expect(mockMapper.accumulateDailySummaryEntry).toHaveBeenCalled();
      expect(mockMapper.finalizeDailySummaryEntry).toHaveBeenCalled();
    });

    it('should not double count duplicated works', async () => {
      const mockData = [
        {
          data_prog: '2026-01-01',
          exec: 10,
          prog: 20,
          obras: {
            capex_mo_plan: 100,
            capex_mat_plan: 50,
            capex_mo_pend: 20,
            capex_mat_pend: 10,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
        {
          data_prog: '2026-01-01',
          exec: 10,
          prog: 20,
          obras: {
            capex_mo_plan: 100,
            capex_mat_plan: 50,
            capex_mo_pend: 20,
            capex_mat_pend: 10,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(mockData);
      mockRepository.getCapexPlan.mockResolvedValue([{}]);

      mockCalculator.aggregateFinancialCapacityByMonth.mockReturnValue({
        totalFinancial: null,
        dailyFinancialGoal: 100,
      });

      mockCalculator.calculateWorkOrderMetrics.mockReturnValue({
        serviceCapexProg: 50,
      });

      mockCalculator.calculateGoalPercentage.mockReturnValue(10);
      mockCalculator.calculateExecutionRate.mockReturnValue(80);

      mockCalculator.aggregateDailySummaryTotals.mockReturnValue({});

      mockMapper.createDailySummaryEntry.mockReturnValue({
        serviceMoProg: 0,
        materialMoProg: 0,
        serviceMoExec: 0,
        materialMoExec: 0,
      });

      await service.getSummary({
        dataInicial: '01/01/2026',
        dataFinal: '01/01/2026',
      } as any);

      expect(mockMapper.accumulateDailySummaryEntry).toHaveBeenCalledTimes(2);
    });
  });

  describe('getSecondSummary', () => {
    it('should return empty summary', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      mockCalculator.aggregateGroupTotals.mockReturnValue({
        totalQtdeObras: 0,
      });

      const result = await service.getSecondSummary({} as any);

      expect(result.summary).toEqual([]);
    });

    it('should group by grupo and turma correctly', async () => {
      const mockData = [
        {
          exec: null,
          prog: 100,
          obras: {
            tipos: { grupos: { grupo: 'RDA' } },
            turmas: { turma: 'A' },
            capex_mo_plan: 100,
            capex_mat_plan: 50,
            capex_mo_pend: 20,
            capex_mat_pend: 10,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(mockData);

      mockMapper.createGroupTeamEntry.mockReturnValue({
        totalServiceMoProg: 100,
        totalMaterialMoProg: 50,
        totalServiceMoExec: 0,
        totalMaterialMoExec: 0,
      });

      mockCalculator.calculateWorkOrderMetrics.mockReturnValue({});
      mockCalculator.calculateMoPrev.mockReturnValue({});
      mockCalculator.calculateExecutionRate.mockReturnValue(80);

      mockCalculator.aggregateGroupTotals.mockReturnValue({});

      const result = await service.getSecondSummary({} as any);

      expect(result.summary.length).toBe(1);
      expect(result.summary[0].diff).toBe(80);
    });

    it('should not duplicate group entries', async () => {
      const mockData = [
        {
          exec: 10,
          prog: 20,
          obras: {
            tipos: { grupos: { grupo: 'RDA' } },
            turmas: { turma: 'A' },
            capex_mo_plan: 10,
            capex_mat_plan: 10,
            capex_mo_pend: 5,
            capex_mat_pend: 5,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
        {
          exec: 20,
          prog: 40,
          obras: {
            tipos: { grupos: { grupo: 'RDA' } },
            turmas: { turma: 'A' },
            capex_mo_plan: 10,
            capex_mat_plan: 10,
            capex_mo_pend: 5,
            capex_mat_pend: 5,
            ordem_dca: '1',
            ordem_dcd: '2',
            ordem_dci: '3',
            ordem_dcim: '4',
            ovnota: 'ABC',
            executado: false,
          },
        },
      ];

      mockRepository.getSummary.mockResolvedValue(mockData);

      mockMapper.createGroupTeamEntry.mockReturnValue({
        totalServiceMoProg: 0,
        totalMaterialMoProg: 0,
        totalServiceMoExec: 0,
        totalMaterialMoExec: 0,
      });

      mockCalculator.calculateWorkOrderMetrics.mockReturnValue({});
      mockCalculator.calculateMoPrev.mockReturnValue({});
      mockCalculator.calculateExecutionRate.mockReturnValue(50);
      mockCalculator.aggregateGroupTotals.mockReturnValue({});

      const result = await service.getSecondSummary({} as any);

      expect(result.summary.length).toBe(1);
    });
  });
});
