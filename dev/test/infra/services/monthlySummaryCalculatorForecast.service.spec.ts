import { MonthlySummaryForecastCalculator } from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { WORKING_DAYS_PER_MONTH } from 'src/interface/types/schedule/monthlySummaryInterface';

describe('MonthlySummaryForecastCalculator', () => {
  let calculator: MonthlySummaryForecastCalculator;

  beforeEach(() => {
    calculator = new MonthlySummaryForecastCalculator();
  });

  describe('aggregateFinancialCapacityByMonth', () => {
    it('should return dailyFinancialGoal=0 when executionCapacity is an empty array', () => {
      const result = calculator.aggregateFinancialCapacityByMonth([], 0);

      expect(result.dailyFinancialGoal).toBe(0);
    });

    it('should return only the dailyFinancialGoal field — no teamsTotal or overhead fields', () => {
      const result = calculator.aggregateFinancialCapacityByMonth([], 0);

      expect(result).toHaveProperty('dailyFinancialGoal');
      expect(result).not.toHaveProperty('teamsTotal');
      expect(result).not.toHaveProperty('dailyFinancialGoalWithOverhead');
    });

    it('should compute dailyFinancialGoal as (teams * should_cost) / WORKING_DAYS_PER_MONTH', () => {
      const capacity = [{ jan: 4, should_cost: 2200 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 0);

      expect(result.dailyFinancialGoal).toBeCloseTo(
        (4 * 2200) / WORKING_DAYS_PER_MONTH,
        10,
      );
    });

    it('should return dailyFinancialGoal=0 when teams value for the month is 0', () => {
      const capacity = [{ jan: 0, should_cost: 5000 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 0);

      expect(result.dailyFinancialGoal).toBe(0);
    });

    it('should use the correct monthKey for nov (monthIndex=10)', () => {
      const capacity = [{ nov: 6, should_cost: 1100, jan: 99 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 10);

      expect(result.dailyFinancialGoal).toBeCloseTo(
        (6 * 1100) / WORKING_DAYS_PER_MONTH,
        10,
      );
    });

    it('should use the correct monthKey for dez (monthIndex=11)', () => {
      const capacity = [{ dez: 2, should_cost: 3000, nov: 99 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 11);

      expect(result.dailyFinancialGoal).toBeCloseTo(
        (2 * 3000) / WORKING_DAYS_PER_MONTH,
        10,
      );
    });

    it('should apply ?? 0 fallback when the monthKey field is absent from an entry', () => {
      const capacity = [{ should_cost: 5000 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 0);

      expect(result.dailyFinancialGoal).toBe(0);
    });

    it('should apply ?? 0 fallback when should_cost is absent from an entry', () => {
      const capacity = [{ jan: 5 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 0);

      expect(result.dailyFinancialGoal).toBe(0);
    });

    it('should accumulate correctly across multiple entries with different should_cost values', () => {
      const capacity = [
        { fev: 2, should_cost: 1000 } as any,
        { fev: 3, should_cost: 2000 } as any,
      ];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 1);

      expect(result.dailyFinancialGoal).toBeCloseTo(
        8000 / WORKING_DAYS_PER_MONTH,
        10,
      );
    });

    it('should return dailyFinancialGoal=0 when should_cost=0 even if teams are non-zero', () => {
      const capacity = [{ mar: 1, should_cost: 0 } as any];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 2);

      expect(result.dailyFinancialGoal).toBe(0);
    });
  });

  describe('calculateWorkOrderMetrics', () => {
    it('should compute all four capex fields proportionally to prog and exec', () => {
      const result = calculator.calculateWorkOrderMetrics(2000, 3000, 100, 50);

      expect(result.serviceCapexProg).toBe(2000);
      expect(result.serviceCapexExec).toBe(1000);
      expect(result.materialCapexProg).toBe(3000);
      expect(result.materialCapexExec).toBe(1500);
    });

    it('should return all zeros when prog and exec are both 0', () => {
      const result = calculator.calculateWorkOrderMetrics(5000, 4000, 0, 0);

      expect(result.serviceCapexProg).toBe(0);
      expect(result.serviceCapexExec).toBe(0);
      expect(result.materialCapexProg).toBe(0);
      expect(result.materialCapexExec).toBe(0);
    });

    it('should return all zeros when both plan values are 0 regardless of percentages', () => {
      const result = calculator.calculateWorkOrderMetrics(0, 0, 100, 100);

      expect(result.serviceCapexProg).toBe(0);
      expect(result.serviceCapexExec).toBe(0);
      expect(result.materialCapexProg).toBe(0);
      expect(result.materialCapexExec).toBe(0);
    });

    it('should compute correctly when only servicePlan is non-zero', () => {
      const result = calculator.calculateWorkOrderMetrics(2000, 0, 50, 25);

      expect(result.serviceCapexProg).toBeCloseTo(1000, 10);
      expect(result.serviceCapexExec).toBeCloseTo(500, 10);
      expect(result.materialCapexProg).toBe(0);
      expect(result.materialCapexExec).toBe(0);
    });

    it('should compute correctly when only materialPlan is non-zero', () => {
      const result = calculator.calculateWorkOrderMetrics(0, 3000, 50, 25);

      expect(result.serviceCapexProg).toBe(0);
      expect(result.serviceCapexExec).toBe(0);
      expect(result.materialCapexProg).toBeCloseTo(1500, 10);
      expect(result.materialCapexExec).toBeCloseTo(750, 10);
    });

    it('should handle fractional percentages correctly', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 1000, 33, 10);

      expect(result.serviceCapexProg).toBeCloseTo(330, 10);
      expect(result.serviceCapexExec).toBeCloseTo(100, 10);
      expect(result.materialCapexProg).toBeCloseTo(330, 10);
      expect(result.materialCapexExec).toBeCloseTo(100, 10);
    });

    it('should allow exec to exceed prog — no upper-bound enforcement', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 1000, 50, 80);

      expect(result.serviceCapexExec).toBeCloseTo(800, 10);
      expect(result.materialCapexExec).toBeCloseTo(800, 10);
    });

    it('should return an object with exactly the four expected fields', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 1000, 100, 100);

      expect(result).toHaveProperty('serviceCapexProg');
      expect(result).toHaveProperty('serviceCapexExec');
      expect(result).toHaveProperty('materialCapexProg');
      expect(result).toHaveProperty('materialCapexExec');
    });
  });

  describe('calculateGoalPercentage', () => {
    it('should return (value / goal) * 100 when goal is greater than 0', () => {
      expect(calculator.calculateGoalPercentage(500, 1000)).toBeCloseTo(50, 10);
    });

    it('should return 100 when value equals goal', () => {
      expect(calculator.calculateGoalPercentage(1000, 1000)).toBe(100);
    });

    it('should return 0 when goal is 0 — guard against division by zero', () => {
      expect(calculator.calculateGoalPercentage(500, 0)).toBe(0);
    });

    it('should return 0 when both value and goal are 0', () => {
      expect(calculator.calculateGoalPercentage(0, 0)).toBe(0);
    });

    it('should return 0 when value is 0 and goal is positive', () => {
      expect(calculator.calculateGoalPercentage(0, 1000)).toBe(0);
    });

    it('should handle values greater than goal — result exceeds 100%', () => {
      expect(calculator.calculateGoalPercentage(1500, 1000)).toBeCloseTo(
        150,
        10,
      );
    });

    it('should handle fractional values correctly', () => {
      expect(calculator.calculateGoalPercentage(1, 3)).toBeCloseTo(
        (1 / 3) * 100,
        10,
      );
    });
  });

  describe('calculateExecutionRate', () => {
    it('should return the combined exec/prog ratio as a percentage', () => {
      const result = calculator.calculateExecutionRate(2000, 3000, 1000, 1500);

      expect(result).toBeCloseTo(50, 10);
    });

    it('should return 100 when exec values equal prog values', () => {
      const result = calculator.calculateExecutionRate(2000, 3000, 2000, 3000);

      expect(result).toBe(100);
    });

    it('should return 0 when both exec values are 0 and prog values are positive', () => {
      const result = calculator.calculateExecutionRate(2000, 3000, 0, 0);

      expect(result).toBe(0);
    });

    it('should handle execution exceeding prog — result over 100%', () => {
      const result = calculator.calculateExecutionRate(1000, 1000, 1500, 1500);

      expect(result).toBeCloseTo(150, 10);
    });

    it('should return 0 when both prog values are 0 — guard against division by zero', () => {
      const result = calculator.calculateExecutionRate(0, 0, 0, 0);

      expect(result).toBe(0);
    });

    it('should compute correctly when only service capex values are non-zero', () => {
      const result = calculator.calculateExecutionRate(2000, 0, 1000, 0);

      expect(result).toBeCloseTo(50, 10);
    });

    it('should compute correctly when only material capex values are non-zero', () => {
      const result = calculator.calculateExecutionRate(0, 3000, 0, 1500);

      expect(result).toBeCloseTo(50, 10);
    });

    it('should handle fractional results correctly', () => {
      const result = calculator.calculateExecutionRate(2, 1, 0.5, 0.5);

      expect(result).toBeCloseTo((1 / 3) * 100, 10);
    });
  });

  describe('calculateMoPrev', () => {
    it('should use exec for both service and material when exec is a non-null number', () => {
      const result = calculator.calculateMoPrev(2000, 3000, 50, 100);

      expect(result.serviceCapexPrev).toBeCloseTo(1000, 10);
      expect(result.materialCapexPrev).toBeCloseTo(1500, 10);
    });

    it('should fall back to prog when exec is null', () => {
      const result = calculator.calculateMoPrev(2000, 3000, null, 80);

      expect(result.serviceCapexPrev).toBeCloseTo(1600, 10);
      expect(result.materialCapexPrev).toBeCloseTo(2400, 10);
    });

    it('should use exec=0 as a valid value and NOT fall back to prog', () => {
      const result = calculator.calculateMoPrev(2000, 3000, 0, 100);

      expect(result.serviceCapexPrev).toBe(0);
      expect(result.materialCapexPrev).toBe(0);
    });

    it('should return both fields as 0 when baseMoPlan and baseMatPlan are 0', () => {
      expect(calculator.calculateMoPrev(0, 0, 50, 100)).toEqual({
        serviceCapexPrev: 0,
        materialCapexPrev: 0,
      });
    });

    it('should return both fields as 0 when plan values are 0 with exec=null', () => {
      expect(calculator.calculateMoPrev(0, 0, null, 100)).toEqual({
        serviceCapexPrev: 0,
        materialCapexPrev: 0,
      });
    });

    it('should return the full plan values when exec is 100', () => {
      const result = calculator.calculateMoPrev(2000, 3000, 100, 50);

      expect(result.serviceCapexPrev).toBe(2000);
      expect(result.materialCapexPrev).toBe(3000);
    });

    it('should return the full plan values when exec is null and prog is 100', () => {
      const result = calculator.calculateMoPrev(2000, 3000, null, 100);

      expect(result.serviceCapexPrev).toBe(2000);
      expect(result.materialCapexPrev).toBe(3000);
    });

    it('should handle prog=0 as fallback when exec is null — result is 0', () => {
      const result = calculator.calculateMoPrev(2000, 3000, null, 0);

      expect(result.serviceCapexPrev).toBe(0);
      expect(result.materialCapexPrev).toBe(0);
    });

    it('should compute service and material independently when plan values differ', () => {
      const result = calculator.calculateMoPrev(1000, 4000, 25, 100);

      expect(result.serviceCapexPrev).toBeCloseTo(250, 10);
      expect(result.materialCapexPrev).toBeCloseTo(1000, 10);
    });

    it('should return an object with exactly serviceCapexPrev and materialCapexPrev', () => {
      const result = calculator.calculateMoPrev(1000, 1000, 50, 100);

      expect(result).toHaveProperty('serviceCapexPrev');
      expect(result).toHaveProperty('materialCapexPrev');
      expect(Object.keys(result)).toHaveLength(2);
    });
  });

  describe('aggregateDailySummaryTotals', () => {
    it('should aggregate totals from all daily entries', () => {
      const data = [
        {
          qtdeWorks: 2,
          teams: 1,
          financialGoal: 1000,
          serviceMoProg: 500,
          serviceMoExec: 250,
          serviceMoForecast: 400,
          materialMoProg: 200,
          materialMoExec: 100,
          materialMoForecast: 150,
        },
        {
          qtdeWorks: 3,
          teams: 2,
          financialGoal: 2000,
          serviceMoProg: 800,
          serviceMoExec: 400,
          serviceMoForecast: 700,
          materialMoProg: 300,
          materialMoExec: 150,
          materialMoForecast: 250,
        },
      ] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 5000,
        totalMaterialMoPlan: 4000,
        totalServiceMoPend: 1000,
        totalMaterialMoPend: 800,
      };

      const result = calculator.aggregateDailySummaryTotals(
        data,
        uniqueWorksFinancial as any,
      );

      expect(result.totalQtdeObras).toBe(5);
      expect(result.totalTeams).toBe(3);
      expect(result.totalFinancialGoal).toBe(3000);

      expect(result.totalServiceMoProg).toBe(1300);
      expect(result.totalServiceMoExec).toBe(650);

      expect(result.totalMaterialMoProg).toBe(500);
      expect(result.totalMaterialMoExec).toBe(250);
    });

    it('should use plan and pend values from uniqueWorksFinancial', () => {
      const data = [] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 1000,
        totalMaterialMoPlan: 2000,
        totalServiceMoPend: 300,
        totalMaterialMoPend: 400,
      };

      const result = calculator.aggregateDailySummaryTotals(
        data,
        uniqueWorksFinancial as any,
      );

      expect(result.totalServiceMoPlan).toBe(1000);
      expect(result.totalMaterialMoPlan).toBe(2000);
      expect(result.totalServiceMoPend).toBe(300);
      expect(result.totalMaterialMoPend).toBe(400);
    });

    it('should compute totalDiaryGoal using calculateGoalPercentage', () => {
      const data = [
        {
          qtdeWorks: 1,
          teams: 1,
          financialGoal: 1000,
          serviceMoProg: 500,
          serviceMoExec: 0,
          serviceMoForecast: 0,
          materialMoProg: 0,
          materialMoExec: 0,
          materialMoForecast: 0,
        },
      ] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 0,
        totalMaterialMoPlan: 0,
        totalServiceMoPend: 0,
        totalMaterialMoPend: 0,
      };

      const result = calculator.aggregateDailySummaryTotals(
        data,
        uniqueWorksFinancial as any,
      );

      expect(result.totalDiaryGoal).toBeCloseTo(50, 10);
    });

    it('should compute totalDiff using execution rate', () => {
      const data = [
        {
          qtdeWorks: 1,
          teams: 1,
          financialGoal: 0,
          serviceMoProg: 1000,
          serviceMoExec: 500,
          serviceMoForecast: 0,
          materialMoProg: 1000,
          materialMoExec: 500,
          materialMoForecast: 0,
        },
      ] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 0,
        totalMaterialMoPlan: 0,
        totalServiceMoPend: 0,
        totalMaterialMoPend: 0,
      };

      const result = calculator.aggregateDailySummaryTotals(
        data,
        uniqueWorksFinancial as any,
      );

      expect(result.totalDiff).toBeCloseTo(50, 10);
    });
  });

  describe('aggregateGroupTotals', () => {
    it('should aggregate all group totals correctly', () => {
      const summaryData = [
        {
          qtdeWorks: 2,
          totalServiceMoProg: 1000,
          totalServiceMoPlan: 2000,
          totalServiceMoPend: 500,
          totalServiceMoExec: 500,
          totalMaterialMoProg: 1000,
          totalMaterialMoPlan: 2000,
          totalMaterialMoPend: 500,
          totalMaterialMoExec: 500,
        },
        {
          qtdeWorks: 3,
          totalServiceMoProg: 2000,
          totalServiceMoPlan: 3000,
          totalServiceMoPend: 600,
          totalServiceMoExec: 1000,
          totalMaterialMoProg: 2000,
          totalMaterialMoPlan: 3000,
          totalMaterialMoPend: 600,
          totalMaterialMoExec: 1000,
        },
      ] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 7000,
        totalMaterialMoPlan: 8000,
        totalServiceMoPend: 900,
        totalMaterialMoPend: 1000,
      };

      const result = calculator.aggregateGroupTotals(
        summaryData,
        uniqueWorksFinancial as any,
      );

      expect(result.totalWorks).toBe(5);

      expect(result.totalServiceMoProgByGrouping).toBe(3000);
      expect(result.totalMaterialMoProgByGrouping).toBe(3000);

      expect(result.totalServiceMoExecByGrouping).toBe(1500);
      expect(result.totalMaterialMoExecByGrouping).toBe(1500);
    });

    it('should override plan and pend values with uniqueWorksFinancial', () => {
      const summaryData = [] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 1000,
        totalMaterialMoPlan: 2000,
        totalServiceMoPend: 300,
        totalMaterialMoPend: 400,
      };

      const result = calculator.aggregateGroupTotals(
        summaryData,
        uniqueWorksFinancial as any,
      );

      expect(result.totalServiceMoPlanByGrouping).toBe(1000);
      expect(result.totalMaterialMoPlanByGrouping).toBe(2000);
      expect(result.totalServiceMoPendByGrouping).toBe(300);
      expect(result.totalMaterialMoPendByGrouping).toBe(400);
    });

    it('should compute totalDiff correctly', () => {
      const summaryData = [
        {
          qtdeWorks: 1,
          totalServiceMoProg: 1000,
          totalServiceMoPlan: 0,
          totalServiceMoPend: 0,
          totalServiceMoExec: 500,
          totalMaterialMoProg: 1000,
          totalMaterialMoPlan: 0,
          totalMaterialMoPend: 0,
          totalMaterialMoExec: 500,
        },
      ] as any;

      const uniqueWorksFinancial = {
        totalServiceMoPlan: 0,
        totalMaterialMoPlan: 0,
        totalServiceMoPend: 0,
        totalMaterialMoPend: 0,
      };

      const result = calculator.aggregateGroupTotals(
        summaryData,
        uniqueWorksFinancial as any,
      );

      expect(result.totalDiff).toBeCloseTo(50, 10);
    });
  });
});
