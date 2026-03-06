import {
  aggregateCapacityByMonthForecast,
  calculateExecutionRateForecast,
  calculateGoalPercentageForecast,
  calculateMoPrevForecast,
  calculateWorkOrderMetricsForecast,
} from 'src/domain/services/monthlySummaryForecastCalculator.service';
import { WORKING_DAYS_PER_MONTH } from 'src/interface/types/schedule/monthlySummaryInterface';

describe('aggregateCapacityByMonthForecast', () => {
  it('should return zero metrics when executionCapacity is an empty array', () => {
    const result = aggregateCapacityByMonthForecast([], 0);

    expect(result.teamsTotal).toBe(0);
    expect(result.dailyFinancialGoal).toBe(0);
  });

  it('should NOT expose a dailyFinancialGoalWithOverhead field (forecast omits overhead)', () => {
    const result = aggregateCapacityByMonthForecast([], 0);

    expect(result).not.toHaveProperty('dailyFinancialGoalWithOverhead');
  });

  it('should accumulate teamsTotal across all entries for the given month', () => {
    const capacity = [
      { jan: 3, should_cost: 1000 },
      { jan: 5, should_cost: 1000 },
    ];

    const result = aggregateCapacityByMonthForecast(capacity, 0);

    expect(result.teamsTotal).toBe(8);
  });

  it('should compute dailyFinancialGoal as totalFinancial / WORKING_DAYS_PER_MONTH', () => {
    const capacity = [{ jan: 4, should_cost: 2200 }];

    const result = aggregateCapacityByMonthForecast(capacity, 0);

    expect(result.dailyFinancialGoal).toBeCloseTo(
      (4 * 2200) / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should return dailyFinancialGoal=0 when teams are 0 (no overhead logic to guard)', () => {
    const capacity = [{ jan: 0, should_cost: 5000 }];

    const result = aggregateCapacityByMonthForecast(capacity, 0);

    expect(result.dailyFinancialGoal).toBe(0);
    expect(result.teamsTotal).toBe(0);
  });

  it('should use the correct monthKey for nov (monthIndex=10)', () => {
    const capacity = [{ nov: 6, should_cost: 1100, jan: 99 }];

    const result = aggregateCapacityByMonthForecast(capacity, 10);

    expect(result.teamsTotal).toBe(6);
    expect(result.dailyFinancialGoal).toBeCloseTo(
      (6 * 1100) / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should use the correct monthKey for dez (monthIndex=11)', () => {
    const capacity = [{ dez: 2, should_cost: 3000, nov: 99 }];

    const result = aggregateCapacityByMonthForecast(capacity, 11);

    expect(result.teamsTotal).toBe(2);
    expect(result.dailyFinancialGoal).toBeCloseTo(
      (2 * 3000) / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should apply ?? 0 fallback when the monthKey field is absent from an entry', () => {
    const capacity = [{ should_cost: 5000 }];

    const result = aggregateCapacityByMonthForecast(capacity, 0);

    expect(result.teamsTotal).toBe(0);
    expect(result.dailyFinancialGoal).toBe(0);
  });

  it('should apply ?? 0 fallback when should_cost is absent from an entry', () => {
    const capacity = [{ jan: 5 }];

    const result = aggregateCapacityByMonthForecast(capacity, 0);

    expect(result.teamsTotal).toBe(5);
    expect(result.dailyFinancialGoal).toBe(0);
  });

  it('should accumulate correctly across multiple entries with different should_cost values', () => {
    const capacity = [
      { fev: 2, should_cost: 1000 },
      { fev: 3, should_cost: 2000 },
    ];

    const result = aggregateCapacityByMonthForecast(capacity, 1);

    expect(result.teamsTotal).toBe(5);
    expect(result.dailyFinancialGoal).toBeCloseTo(
      8000 / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should handle teams=1 and should_cost=0 — non-zero teams but zero financial', () => {
    const capacity = [{ mar: 1, should_cost: 0 }];

    const result = aggregateCapacityByMonthForecast(capacity, 2);

    expect(result.teamsTotal).toBe(1);
    expect(result.dailyFinancialGoal).toBe(0);
  });
});

describe('calculateWorkOrderMetricsForecast', () => {
  it('should compute all four capex fields proportionally to prog and exec', () => {
    const result = calculateWorkOrderMetricsForecast(2000, 3000, 100, 50);

    expect(result.serviceCapexProg).toBe(2000);
    expect(result.serviceCapexExec).toBe(1000);
    expect(result.materialCapexProg).toBe(3000);
    expect(result.materialCapexExec).toBe(1500);
  });

  it('should return all zeros when prog and exec are both 0', () => {
    const result = calculateWorkOrderMetricsForecast(5000, 4000, 0, 0);

    expect(result.serviceCapexProg).toBe(0);
    expect(result.serviceCapexExec).toBe(0);
    expect(result.materialCapexProg).toBe(0);
    expect(result.materialCapexExec).toBe(0);
  });

  it('should return all zeros when both plan values are 0 regardless of percentages', () => {
    const result = calculateWorkOrderMetricsForecast(0, 0, 100, 100);

    expect(result.serviceCapexProg).toBe(0);
    expect(result.serviceCapexExec).toBe(0);
    expect(result.materialCapexProg).toBe(0);
    expect(result.materialCapexExec).toBe(0);
  });

  it('should compute correctly when only servicePlan is non-zero', () => {
    const result = calculateWorkOrderMetricsForecast(2000, 0, 50, 25);

    expect(result.serviceCapexProg).toBeCloseTo(1000, 10);
    expect(result.serviceCapexExec).toBeCloseTo(500, 10);
    expect(result.materialCapexProg).toBe(0);
    expect(result.materialCapexExec).toBe(0);
  });

  it('should compute correctly when only materialPlan is non-zero', () => {
    const result = calculateWorkOrderMetricsForecast(0, 3000, 50, 25);

    expect(result.serviceCapexProg).toBe(0);
    expect(result.serviceCapexExec).toBe(0);
    expect(result.materialCapexProg).toBeCloseTo(1500, 10);
    expect(result.materialCapexExec).toBeCloseTo(750, 10);
  });

  it('should handle fractional percentages correctly', () => {
    const result = calculateWorkOrderMetricsForecast(1000, 1000, 33, 10);

    expect(result.serviceCapexProg).toBeCloseTo(330, 10);
    expect(result.serviceCapexExec).toBeCloseTo(100, 10);
    expect(result.materialCapexProg).toBeCloseTo(330, 10);
    expect(result.materialCapexExec).toBeCloseTo(100, 10);
  });

  it('should allow exec to exceed prog (no upper-bound enforcement)', () => {
    const result = calculateWorkOrderMetricsForecast(1000, 1000, 50, 80);

    expect(result.serviceCapexExec).toBeCloseTo(800, 10);
    expect(result.materialCapexExec).toBeCloseTo(800, 10);
  });

  it('should return the four expected fields on the result object', () => {
    const result = calculateWorkOrderMetricsForecast(1000, 1000, 100, 100);

    expect(result).toHaveProperty('serviceCapexProg');
    expect(result).toHaveProperty('serviceCapexExec');
    expect(result).toHaveProperty('materialCapexProg');
    expect(result).toHaveProperty('materialCapexExec');
  });
});

describe('calculateGoalPercentageForecast', () => {
  it('should return (value / goal) * 100 when goal is greater than 0', () => {
    expect(calculateGoalPercentageForecast(500, 1000)).toBeCloseTo(50, 10);
  });

  it('should return 100 when value equals goal', () => {
    expect(calculateGoalPercentageForecast(1000, 1000)).toBe(100);
  });

  it('should return 0 when goal is 0 — guard against division by zero', () => {
    expect(calculateGoalPercentageForecast(500, 0)).toBe(0);
  });

  it('should return 0 when both value and goal are 0', () => {
    expect(calculateGoalPercentageForecast(0, 0)).toBe(0);
  });

  it('should return 0 when value is 0 and goal is positive', () => {
    expect(calculateGoalPercentageForecast(0, 1000)).toBe(0);
  });

  it('should handle values greater than goal (over 100%)', () => {
    expect(calculateGoalPercentageForecast(1500, 1000)).toBeCloseTo(150, 10);
  });

  it('should handle fractional values correctly', () => {
    expect(calculateGoalPercentageForecast(1, 3)).toBeCloseTo(
      (1 / 3) * 100,
      10,
    );
  });
});

describe('calculateExecutionRateForecast', () => {
  it('should return the combined exec/prog ratio as a percentage', () => {
    const result = calculateExecutionRateForecast(2000, 3000, 1000, 1500);

    expect(result).toBeCloseTo(50, 10);
  });

  it('should return 100 when exec values equal prog values', () => {
    const result = calculateExecutionRateForecast(2000, 3000, 2000, 3000);

    expect(result).toBe(100);
  });

  it('should return 0 when both exec values are 0 and prog values are positive', () => {
    const result = calculateExecutionRateForecast(2000, 3000, 0, 0);

    expect(result).toBe(0);
  });

  it('should handle execution exceeding prog (result over 100%)', () => {
    const result = calculateExecutionRateForecast(1000, 1000, 1500, 1500);

    expect(result).toBeCloseTo(150, 10);
  });

  it('should return NaN when both prog values are 0 — no division-by-zero guard present', () => {
    const result = calculateExecutionRateForecast(0, 0, 0, 0);

    expect(result).toBeNaN();
  });

  it('should compute correctly when only service capex values are non-zero', () => {
    const result = calculateExecutionRateForecast(2000, 0, 1000, 0);

    expect(result).toBeCloseTo(50, 10);
  });

  it('should compute correctly when only material capex values are non-zero', () => {
    const result = calculateExecutionRateForecast(0, 3000, 0, 1500);

    expect(result).toBeCloseTo(50, 10);
  });

  it('should handle fractional results correctly', () => {
    const result = calculateExecutionRateForecast(2, 1, 0.5, 0.5);

    expect(result).toBeCloseTo((1 / 3) * 100, 10);
  });
});

describe('calculateMoPrevForecast', () => {
  it('should use exec for both service and material when exec is a non-null number', () => {
    const result = calculateMoPrevForecast(2000, 3000, 50, 100);

    expect(result.serviceCapexPrev).toBeCloseTo(1000, 10);
    expect(result.materialCapexPrev).toBeCloseTo(1500, 10);
  });

  it('should fall back to prog when exec is null', () => {
    const result = calculateMoPrevForecast(2000, 3000, null, 80);

    expect(result.serviceCapexPrev).toBeCloseTo(1600, 10);
    expect(result.materialCapexPrev).toBeCloseTo(2400, 10);
  });

  it('should use exec=0 as a valid value and NOT fall back to prog', () => {
    const result = calculateMoPrevForecast(2000, 3000, 0, 100);

    expect(result.serviceCapexPrev).toBe(0);
    expect(result.materialCapexPrev).toBe(0);
  });

  it('should return both fields as 0 when baseMoPlan and baseMatPlan are 0', () => {
    expect(calculateMoPrevForecast(0, 0, 50, 100)).toEqual({
      serviceCapexPrev: 0,
      materialCapexPrev: 0,
    });
  });

  it('should return both fields as 0 when baseMoPlan and baseMatPlan are 0 with exec=null', () => {
    expect(calculateMoPrevForecast(0, 0, null, 100)).toEqual({
      serviceCapexPrev: 0,
      materialCapexPrev: 0,
    });
  });

  it('should return the full plan values when exec (or fallback prog) is 100', () => {
    const result = calculateMoPrevForecast(2000, 3000, 100, 50);

    expect(result.serviceCapexPrev).toBe(2000);
    expect(result.materialCapexPrev).toBe(3000);
  });

  it('should return the full plan values when exec is null and prog is 100', () => {
    const result = calculateMoPrevForecast(2000, 3000, null, 100);

    expect(result.serviceCapexPrev).toBe(2000);
    expect(result.materialCapexPrev).toBe(3000);
  });

  it('should handle prog=0 as fallback when exec is null — result is 0', () => {
    const result = calculateMoPrevForecast(2000, 3000, null, 0);

    expect(result.serviceCapexPrev).toBe(0);
    expect(result.materialCapexPrev).toBe(0);
  });

  it('should compute service and material independently when plan values differ', () => {
    const result = calculateMoPrevForecast(1000, 4000, 25, 100);

    expect(result.serviceCapexPrev).toBeCloseTo(250, 10);
    expect(result.materialCapexPrev).toBeCloseTo(1000, 10);
  });

  it('should return an object with exactly serviceCapexPrev and materialCapexPrev', () => {
    const result = calculateMoPrevForecast(1000, 1000, 50, 100);

    expect(result).toHaveProperty('serviceCapexPrev');
    expect(result).toHaveProperty('materialCapexPrev');
    expect(Object.keys(result)).toHaveLength(2);
  });
});
