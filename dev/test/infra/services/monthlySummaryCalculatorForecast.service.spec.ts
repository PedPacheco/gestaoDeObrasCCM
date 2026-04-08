import { MonthlySummaryForecastCalculator } from 'src/domain/services/monthlySummaryForecastCalculator.service';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

describe('MonthlySummaryForecastCalculator', () => {
  let calculator: MonthlySummaryForecastCalculator;

  beforeEach(() => {
    calculator = new MonthlySummaryForecastCalculator();
  });

  // -----------------------------
  // calculateExecutionRate
  // -----------------------------
  describe('calculateExecutionRate', () => {
    it('should calculate execution rate correctly', () => {
      const result = calculator.calculateExecutionRate(100, 100, 50, 50);

      expect(result).toBe(50);
    });

    it('should return 0 when totalProg is 0', () => {
      const result = calculator.calculateExecutionRate(0, 0, 100, 100);

      expect(result).toBe(0);
    });

    it('should handle execution greater than programmed', () => {
      const result = calculator.calculateExecutionRate(100, 100, 200, 200);

      expect(result).toBe(200);
    });
  });

  // -----------------------------
  // calculateGoalPercentage
  // -----------------------------
  describe('calculateGoalPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculator.calculateGoalPercentage(50, 100)).toBe(50);
    });

    it('should return 0 when goal is 0', () => {
      expect(calculator.calculateGoalPercentage(100, 0)).toBe(0);
    });
  });

  // -----------------------------
  // calculateMoPrev
  // -----------------------------
  describe('calculateMoPrev', () => {
    it('should use exec when provided', () => {
      const result = calculator.calculateMoPrev(1000, 500, 50, 30);

      expect(result).toEqual({
        serviceCapexPrev: 500,
        materialCapexPrev: 250,
      });
    });

    it('should fallback to prog when exec is null', () => {
      const result = calculator.calculateMoPrev(1000, 500, null, 40);

      expect(result).toEqual({
        serviceCapexPrev: 400,
        materialCapexPrev: 200,
      });
    });
  });

  // -----------------------------
  // calculateWorkOrderMetrics
  // -----------------------------
  describe('calculateWorkOrderMetrics', () => {
    it('should calculate metrics correctly', () => {
      const result = calculator.calculateWorkOrderMetrics(
        1000,
        500,
        50,
        40,
        200,
        100,
        80,
      );

      expect(result).toMatchObject({
        serviceCapexProg: 500,
        serviceCapexExec: 400,
        materialCapexProg: 250,
        materialCapexExec: 200,
      });
    });

    it('should cap forecast at 100%', () => {
      const result = calculator.calculateWorkOrderMetrics(
        1000,
        500,
        80,
        50,
        200,
        100,
        150,
      );

      expect(result.serviceCapexForecast).toBeLessThanOrEqual(200);
      expect(result.materialCapexForecast).toBeLessThanOrEqual(100);
    });

    it('should cap forecast equal 100%', () => {
      const result = calculator.calculateWorkOrderMetrics(
        1000,
        500,
        80,
        50,
        200,
        100,
        100,
      );

      expect(result.serviceCapexForecast).toBeLessThanOrEqual(200);
      expect(result.materialCapexForecast).toBeLessThanOrEqual(100);
    });

    it('should cap forecast by prog', () => {
      const result = calculator.calculateWorkOrderMetrics(
        1000,
        500,
        80,
        null,
        200,
        100,
        null,
      );

      expect(result.serviceCapexForecast).toBeLessThanOrEqual(160);
      expect(result.materialCapexForecast).toBeLessThanOrEqual(80);
    });
  });

  // -----------------------------
  // aggregateFinancialCapacityByMonth
  // -----------------------------
  describe('aggregateFinancialCapacityByMonth', () => {
    it('should sum values correctly', () => {
      const data = [{ valor_jan: 100 }, { valor_jan: null }];

      const result = calculator.aggregateFinancialCapacityByMonth(data, 0);

      expect(result.totalFinancial).toBe(100);
    });

    it('should return 0 when array is empty', () => {
      const result = calculator.aggregateFinancialCapacityByMonth([], 0);

      expect(result.totalFinancial).toBe(0);
      expect(result.dailyFinancialGoal).toBe(0);
    });
  });

  // -----------------------------
  // aggregateDailySummaryTotals
  // -----------------------------
  describe('aggregateDailySummaryTotals', () => {
    const baseFinancial = {
      totalServiceMoPlan: 1000,
      totalMaterialMoPlan: 500,
      totalServiceMoPend: 200,
      totalMaterialMoPend: 100,
    };

    it('should return zeroed totals when data is empty', () => {
      const result = calculator.aggregateDailySummaryTotals(
        [],
        baseFinancial,
        0,
      );

      expect(result).toMatchObject({
        totalQtdeObras: 0,
        totalTeams: 0,
        totalServiceMoProg: 0,
        totalServiceMoExec: 0,
        totalMaterialMoProg: 0,
        totalMaterialMoExec: 0,
        totalDiaryGoal: 0,
        totalDiff: 0,
      });
    });

    it('should aggregate values correctly', () => {
      const data: DailySummaryEntryForecast[] = [
        {
          dataProg: '2026-01-01',
          qtdeWorks: 2,
          teams: 3,
          financialGoal: 0,
          diaryGoal: 0,

          serviceMoProg: 100,
          serviceMoPlan: 0,
          serviceMoPend: 0,
          serviceMoExec: 50,
          serviceMoForecast: 80,

          materialMoProg: 50,
          materialMoPlan: 0,
          materialMoPend: 0,
          materialMoExec: 25,
          materialMoForecast: 40,

          execTotal: 75,
          forecastTotal: 120,

          isServicePendLowerThanProg: false,
          isMaterialPendLowerThanProg: false,
          diff: 0,
        },
      ];

      const result = calculator.aggregateDailySummaryTotals(
        data,
        baseFinancial,
        200,
      );

      expect(result.totalQtdeObras).toBe(2);
      expect(result.totalTeams).toBe(3);
      expect(result.totalDiff).toBeGreaterThan(0);
    });
  });

  // -----------------------------
  // aggregateGroupTotals
  // -----------------------------
  describe('aggregateGroupTotals', () => {
    const baseFinancial = {
      totalServiceMoPlan: 1000,
      totalMaterialMoPlan: 500,
      totalServiceMoPend: 200,
      totalMaterialMoPend: 100,
    };

    it('should return zeroed totals when empty', () => {
      const result = calculator.aggregateGroupTotals([], baseFinancial);

      expect(result.totalDiff).toBe(0);
    });

    it('should aggregate values correctly', () => {
      const data: GroupTeamSummaryEntryForecast[] = [
        {
          grupo: 'RDA',
          turma: 'Turma A',
          qtdeWorks: 2,
          totalServiceMoProg: 100,
          totalServiceMoPlan: 150,
          totalServiceMoPend: 50,
          totalServiceMoPrev: 80,
          totalServiceMoExec: 60,
          totalServiceMoForecast: 60,
          totalMaterialMoProg: 50,
          totalMaterialMoPlan: 80,
          totalMaterialMoPend: 30,
          totalMaterialMoPrev: 40,
          totalMaterialMoExec: 25,
          totalMaterialMoForecast: 30,
          execTotal: 85,
          forecastTotal: 90,
          diff: 0,
        },
      ];

      const result = calculator.aggregateGroupTotals(data, baseFinancial);

      expect(result.totalWorks).toBe(2);
      expect(result.totalDiff).toBeGreaterThan(0);
    });
  });
});
