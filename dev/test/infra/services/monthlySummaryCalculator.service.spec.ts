import {
  aggregateCapacityByMonth,
  calculateExecutionRate,
  calculateGoalPercentage,
  calculateMoPrev,
  calculateWorkOrderMetrics,
} from 'src/domain/services/monthlySummaryCalculator.service';
import {
  FINANCIAL_OVERHEAD_FACTOR,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

describe('aggregateCapacityByMonth', () => {
  it('should return zero metrics when executionCapacity is an empty array', () => {
    const result = aggregateCapacityByMonth([], 0);

    expect(result.teamsTotal).toBe(0);
    expect(result.dailyFinancialGoal).toBe(0);
    expect(result.dailyFinancialGoalWithOverhead).toBe(0);
  });

  it('should accumulate teamsTotal across all entries for the given month', () => {
    const capacity = [
      { jan: 3, should_cost: 1000 },
      { jan: 5, should_cost: 1000 },
    ];

    const result = aggregateCapacityByMonth(capacity, 0);

    expect(result.teamsTotal).toBe(8);
  });

  it('should compute dailyFinancialGoal as totalFinancial / WORKING_DAYS_PER_MONTH', () => {
    const capacity = [{ jan: 4, should_cost: 2200 }];

    const result = aggregateCapacityByMonth(capacity, 0);

    expect(result.dailyFinancialGoal).toBeCloseTo(
      (4 * 2200) / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should compute dailyFinancialGoalWithOverhead as dailyFinancialGoal * FINANCIAL_OVERHEAD_FACTOR when goal > 0', () => {
    const capacity = [{ jan: 4, should_cost: 2200 }];

    const result = aggregateCapacityByMonth(capacity, 0);

    const expectedDaily = (4 * 2200) / WORKING_DAYS_PER_MONTH;
    expect(result.dailyFinancialGoalWithOverhead).toBeCloseTo(
      expectedDaily * FINANCIAL_OVERHEAD_FACTOR,
      10,
    );
  });

  it('should set dailyFinancialGoalWithOverhead to 0 when dailyFinancialGoal is 0', () => {
    const capacity = [{ jan: 0, should_cost: 5000 }];

    const result = aggregateCapacityByMonth(capacity, 0);

    expect(result.dailyFinancialGoal).toBe(0);
    expect(result.dailyFinancialGoalWithOverhead).toBe(0);
  });

  it('should use the correct monthKey for each monthIndex (spot-check nov → index 10)', () => {
    const capacity = [{ nov: 6, should_cost: 1100, jan: 99 }];

    const result = aggregateCapacityByMonth(capacity, 10);

    expect(result.teamsTotal).toBe(6);
    expect(result.dailyFinancialGoal).toBeCloseTo(
      (6 * 1100) / WORKING_DAYS_PER_MONTH,
      10,
    );
  });

  it('should use the correct monthKey for dez (index 11)', () => {
    const capacity = [{ dez: 2, should_cost: 3000, nov: 99 }];

    const result = aggregateCapacityByMonth(capacity, 11);

    expect(result.teamsTotal).toBe(2);
  });

  it('should apply ?? 0 fallback when the monthKey field is missing from an entry', () => {
    const capacity = [{ should_cost: 5000 }];

    const result = aggregateCapacityByMonth(capacity, 0);

    expect(result.teamsTotal).toBe(0);
    expect(result.dailyFinancialGoal).toBe(0);
  });

  it('should apply ?? 0 fallback when should_cost is missing from an entry', () => {
    const capacity = [{ jan: 5 }];

    const result = aggregateCapacityByMonth(capacity, 0);

    expect(result.teamsTotal).toBe(5);
    expect(result.dailyFinancialGoal).toBe(0);
    expect(result.dailyFinancialGoalWithOverhead).toBe(0);
  });

  it('should accumulate correctly across multiple entries with different should_cost values', () => {
    const capacity = [
      { fev: 2, should_cost: 1000 },
      { fev: 3, should_cost: 2000 },
    ];

    const result = aggregateCapacityByMonth(capacity, 1);

    expect(result.teamsTotal).toBe(5);
    expect(result.dailyFinancialGoal).toBeCloseTo(
      8000 / WORKING_DAYS_PER_MONTH,
      10,
    );
    expect(result.dailyFinancialGoalWithOverhead).toBeCloseTo(
      (8000 / WORKING_DAYS_PER_MONTH) * FINANCIAL_OVERHEAD_FACTOR,
      10,
    );
  });

  it('should handle a single entry with teams=1 and should_cost=0 (zero financial, non-zero teams)', () => {
    const capacity = [{ mar: 1, should_cost: 0 }];

    const result = aggregateCapacityByMonth(capacity, 2);

    expect(result.teamsTotal).toBe(1);
    expect(result.dailyFinancialGoal).toBe(0);
    expect(result.dailyFinancialGoalWithOverhead).toBe(0);
  });
});

describe('calculateWorkOrderMetrics', () => {
  it('should compute moProg and moExec proportionally to prog and exec percentages', () => {
    const result = calculateWorkOrderMetrics(2000, 100, 50);

    expect(result.moProg).toBe(2000);
    expect(result.moExec).toBe(1000);
  });

  it('should return moProg=0 and moExec=0 when prog and exec are both 0', () => {
    const result = calculateWorkOrderMetrics(5000, 0, 0);

    expect(result.moProg).toBe(0);
    expect(result.moExec).toBe(0);
  });

  it('should return moProg=0 and moExec=0 when baseMo is 0 regardless of percentages', () => {
    const result = calculateWorkOrderMetrics(0, 100, 100);

    expect(result.moProg).toBe(0);
    expect(result.moExec).toBe(0);
  });

  it('should compute fractional values correctly for partial percentages', () => {
    const result = calculateWorkOrderMetrics(3000, 50, 25);

    expect(result.moProg).toBeCloseTo(1500, 10);
    expect(result.moExec).toBeCloseTo(750, 10);
  });

  it('should allow exec to be greater than prog (no upper-bound enforcement)', () => {
    const result = calculateWorkOrderMetrics(1000, 50, 80);

    expect(result.moProg).toBeCloseTo(500, 10);
    expect(result.moExec).toBeCloseTo(800, 10);
  });

  it('should return readonly result — moProg and moExec are defined on the returned object', () => {
    const result = calculateWorkOrderMetrics(1000, 100, 100);

    expect(result).toHaveProperty('moProg');
    expect(result).toHaveProperty('moExec');
  });
});

describe('calculateGoalPercentage', () => {
  it('should return (value / goal) * 100 when goal is greater than 0', () => {
    expect(calculateGoalPercentage(500, 1000)).toBeCloseTo(50, 10);
  });

  it('should return 100 when value equals goal', () => {
    expect(calculateGoalPercentage(1000, 1000)).toBe(100);
  });

  it('should return 0 when goal is 0 — guard against division by zero', () => {
    expect(calculateGoalPercentage(500, 0)).toBe(0);
  });

  it('should return 0 when both value and goal are 0', () => {
    expect(calculateGoalPercentage(0, 0)).toBe(0);
  });

  it('should return 0 when value is 0 and goal is positive', () => {
    expect(calculateGoalPercentage(0, 1000)).toBe(0);
  });

  it('should handle values greater than goal (over 100%)', () => {
    expect(calculateGoalPercentage(1500, 1000)).toBeCloseTo(150, 10);
  });

  it('should handle fractional values correctly', () => {
    expect(calculateGoalPercentage(1, 3)).toBeCloseTo((1 / 3) * 100, 10);
  });

  it('should not trigger the guard when goal is a small positive number', () => {
    expect(calculateGoalPercentage(0.001, 0.001)).toBeCloseTo(100, 10);
  });
});

describe('calculateExecutionRate', () => {
  it('should return (moExec / moProg) * 100 when moProg is greater than 0', () => {
    expect(calculateExecutionRate(500, 1000)).toBeCloseTo(50, 10);
  });

  it('should return 100 when moExec equals moProg', () => {
    expect(calculateExecutionRate(1000, 1000)).toBe(100);
  });

  it('should return 0 when moProg is 0 — guard against division by zero', () => {
    expect(calculateExecutionRate(500, 0)).toBe(0);
  });

  it('should return 0 when both moExec and moProg are 0', () => {
    expect(calculateExecutionRate(0, 0)).toBe(0);
  });

  it('should return 0 when moExec is 0 and moProg is positive', () => {
    expect(calculateExecutionRate(0, 1000)).toBe(0);
  });

  it('should handle execution exceeding programmed (over 100%)', () => {
    expect(calculateExecutionRate(1500, 1000)).toBeCloseTo(150, 10);
  });

  it('should compute fractional rates correctly', () => {
    expect(calculateExecutionRate(1, 3)).toBeCloseTo((1 / 3) * 100, 10);
  });
});

describe('calculateMoPrev', () => {
  it('should use exec when exec is a non-null number', () => {
    expect(calculateMoPrev(2000, 50, 100)).toBeCloseTo(1000, 10);
  });

  it('should fall back to prog when exec is null', () => {
    expect(calculateMoPrev(2000, null, 80)).toBeCloseTo(1600, 10);
  });

  it('should return 0 when exec is 0 (not null) — 0 is a valid exec value, not a fallback trigger', () => {
    expect(calculateMoPrev(2000, 0, 100)).toBe(0);
  });

  it('should return 0 when baseMo is 0 regardless of exec or prog', () => {
    expect(calculateMoPrev(0, 50, 100)).toBe(0);
    expect(calculateMoPrev(0, null, 100)).toBe(0);
  });

  it('should return baseMo when exec (or fallback prog) is 100', () => {
    expect(calculateMoPrev(3000, 100, 50)).toBe(3000);
    expect(calculateMoPrev(3000, null, 100)).toBe(3000);
  });

  it('should handle fractional percentages correctly', () => {
    expect(calculateMoPrev(1000, 33, 0)).toBeCloseTo(330, 10);
  });

  it('should handle prog=0 as fallback when exec is null — result is 0', () => {
    expect(calculateMoPrev(5000, null, 0)).toBe(0);
  });
});
