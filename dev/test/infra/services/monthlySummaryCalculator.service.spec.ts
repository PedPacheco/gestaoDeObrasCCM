import {
  createInitialTotals,
  createInitialTotalsByGrouping,
} from 'src/application/mappers/monthlySummaryMapper';
import { MonthlySummaryCalculator } from 'src/domain/services/monthlySummaryCalculator.service';
import {
  DailySummaryEntry,
  GroupTeamSummaryEntry,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

// ─── Helpers de fixture ───────────────────────────────────────────────────────

function makeDailyEntry(
  overrides: Partial<DailySummaryEntry> = {},
): DailySummaryEntry {
  return {
    dataProg: '01/01/2024',
    totalQtde: 0,
    teamsTotal: 0,
    financialGoal: 0,
    financialGoalWith8: 0,
    diaryGoal: 0,
    diaryGoalWith8: 0,
    totalMoProg: 0,
    totalMoExec: 0,
    diff: 0,
    ...overrides,
  };
}

function makeGroupEntry(
  overrides: Partial<GroupTeamSummaryEntry> = {},
): GroupTeamSummaryEntry {
  return {
    grupo: 'G1',
    turma: 'T1',
    qtdeWorks: 0,
    totalMoPlan: 0,
    totalMoProg: 0,
    totalMoExec: 0,
    totalMoPrev: 0,
    diff: 0,
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('MonthlySummaryCalculator', () => {
  let calculator: MonthlySummaryCalculator;

  beforeEach(() => {
    calculator = new MonthlySummaryCalculator();
  });

  // ─── aggregateFinancialCapacityByMonth ──────────────────────────────────────

  describe('aggregateFinancialCapacityByMonth', () => {
    it('should return zero when executionCapacity is empty', () => {
      const result = calculator.aggregateFinancialCapacityByMonth([], 0);

      expect(result.dailyFinancialGoal).toBe(0);
      expect(result.dailyFinancialGoalWithOverhead).toBe(0);
    });

    it('should calculate totalFinancial as teams * should_cost', () => {
      const capacity = [
        { jan: 2, should_cost: 100 },
        { jan: null, should_cost: 200 },
      ];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 0);

      // total = (2*100) + (3*200) = 200 + 600 = 800
      const expectedDaily = 200 / WORKING_DAYS_PER_MONTH;

      expect(result.dailyFinancialGoal).toBeCloseTo(expectedDaily, 10);
    });

    it('should fallback to 0 when fields are missing', () => {
      const capacity = [{ fev: 10 }]; // sem should_cost

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 1);

      expect(result.dailyFinancialGoal).toBe(0);
    });

    it('should apply overhead only when dailyFinancialGoal > 0', () => {
      const capacity = [{ mar: 2, should_cost: 100 }];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 2);

      expect(result.dailyFinancialGoalWithOverhead).toBeGreaterThan(0);
    });

    it('should not apply overhead when totalFinancial is 0', () => {
      const capacity = [{ mar: 0, should_cost: 100 }];

      const result = calculator.aggregateFinancialCapacityByMonth(capacity, 2);

      expect(result.dailyFinancialGoalWithOverhead).toBe(0);
    });
  });

  // ─── calculateWorkOrderMetrics ──────────────────────────────────────────────

  describe('calculateWorkOrderMetrics', () => {
    it('should compute moProg and moExec proportionally to prog and exec percentages', () => {
      const result = calculator.calculateWorkOrderMetrics(2000, 100, 50);

      expect(result.moProg).toBe(2000);
      expect(result.moExec).toBe(1000);
    });

    it('should return moProg=0 and moExec=0 when prog and exec are both 0', () => {
      const result = calculator.calculateWorkOrderMetrics(5000, 0, 0);

      expect(result.moProg).toBe(0);
      expect(result.moExec).toBe(0);
    });

    it('should return moProg=0 and moExec=0 when moPlan is 0 regardless of percentages', () => {
      const result = calculator.calculateWorkOrderMetrics(0, 100, 100);

      expect(result.moProg).toBe(0);
      expect(result.moExec).toBe(0);
    });

    it('should compute fractional values correctly for partial percentages', () => {
      const result = calculator.calculateWorkOrderMetrics(3000, 50, 25);

      expect(result.moProg).toBeCloseTo(1500, 10);
      expect(result.moExec).toBeCloseTo(750, 10);
    });

    it('should allow exec to exceed prog — no upper-bound enforcement', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 50, 80);

      expect(result.moProg).toBeCloseTo(500, 10);
      expect(result.moExec).toBeCloseTo(800, 10);
    });

    it('should return an object with both moProg and moExec properties', () => {
      const result = calculator.calculateWorkOrderMetrics(1000, 100, 100);

      expect(result).toHaveProperty('moProg');
      expect(result).toHaveProperty('moExec');
    });
  });

  // ─── calculateGoalPercentage ────────────────────────────────────────────────

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

    it('should handle values greater than goal (over 100%)', () => {
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

    it('should not trigger the guard when goal is a small positive number', () => {
      expect(calculator.calculateGoalPercentage(0.001, 0.001)).toBeCloseTo(
        100,
        10,
      );
    });
  });

  // ─── calculateMoPrev ────────────────────────────────────────────────────────

  describe('calculateMoPrev', () => {
    it('should return an object with moPrev property', () => {
      const result = calculator.calculateMoPrev(2000, 50, 100);

      expect(result).toHaveProperty('moPrev');
    });

    it('should use exec when exec is a non-null number', () => {
      const { moPrev } = calculator.calculateMoPrev(2000, 50, 100);

      expect(moPrev).toBeCloseTo(1000, 10);
    });

    it('should fall back to prog when exec is null', () => {
      const { moPrev } = calculator.calculateMoPrev(2000, null, 80);

      expect(moPrev).toBeCloseTo(1600, 10);
    });

    it('should treat exec=0 as a valid value and not fall back to prog', () => {
      const { moPrev } = calculator.calculateMoPrev(2000, 0, 100);

      expect(moPrev).toBe(0);
    });

    it('should return moPrev=0 when baseMoPlan is 0 regardless of exec or prog', () => {
      expect(calculator.calculateMoPrev(0, 50, 100).moPrev).toBe(0);
      expect(calculator.calculateMoPrev(0, null, 100).moPrev).toBe(0);
    });

    it('should return baseMoPlan when exec is 100', () => {
      expect(calculator.calculateMoPrev(3000, 100, 50).moPrev).toBe(3000);
    });

    it('should return baseMoPlan when exec is null and prog is 100', () => {
      expect(calculator.calculateMoPrev(3000, null, 100).moPrev).toBe(3000);
    });

    it('should handle fractional percentages correctly', () => {
      expect(calculator.calculateMoPrev(1000, 33, 0).moPrev).toBeCloseTo(
        330,
        10,
      );
    });

    it('should return moPrev=0 when exec is null and prog is 0', () => {
      expect(calculator.calculateMoPrev(5000, null, 0).moPrev).toBe(0);
    });
  });

  // ─── calculateExecutionRate ─────────────────────────────────────────────────

  describe('calculateExecutionRate', () => {
    it('should return (moExec / moProg) * 100 when moProg is greater than 0', () => {
      expect(calculator.calculateExecutionRate(1000, 500)).toBeCloseTo(50, 10);
    });

    it('should return 100 when moExec equals moProg', () => {
      expect(calculator.calculateExecutionRate(1000, 1000)).toBe(100);
    });

    it('should return 0 when moProg is 0 and moExec is positive (guard applied)', () => {
      expect(calculator.calculateExecutionRate(0, 500)).toBe(0);
    });

    it('should return 0 when both moProg and moExec are 0 (guard applied)', () => {
      expect(calculator.calculateExecutionRate(0, 0)).toBe(0);
    });

    it('should return 0 when moExec is 0 and moProg is positive', () => {
      expect(calculator.calculateExecutionRate(1000, 0)).toBe(0);
    });

    it('should handle execution exceeding programmed (over 100%)', () => {
      expect(calculator.calculateExecutionRate(1000, 1500)).toBeCloseTo(
        150,
        10,
      );
    });

    it('should compute fractional rates correctly', () => {
      expect(calculator.calculateExecutionRate(3, 1)).toBeCloseTo(
        (1 / 3) * 100,
        10,
      );
    });
  });

  // ─── aggregateDailySummaryTotals ────────────────────────────────────────────

  describe('aggregateDailySummaryTotals', () => {
    it('should return zeroed totals when data is empty', () => {
      const result = calculator.aggregateDailySummaryTotals([], {
        totalFinancialGoal: 0,
        totalFinancialGoalWith8: 0,
      });

      expect(result).toEqual(createInitialTotals());
    });

    it('should accumulate financial goals correctly', () => {
      const data = [
        makeDailyEntry({ financialGoal: 1000, financialGoalWith8: 1080 }),
        makeDailyEntry({ financialGoal: 500, financialGoalWith8: 540 }),
      ];

      const result = calculator.aggregateDailySummaryTotals(data, {
        totalFinancialGoal: 2000,
        totalFinancialGoalWith8: 2500,
      });

      expect(result.totalFinancialGoal).toBe(2000);
      expect(result.totalFinancialGoalWith8).toBe(2500);
    });

    it('should calculate totalDiaryGoal correctly', () => {
      const data = [
        makeDailyEntry({
          financialGoal: 1000,
          totalMoProg: 500,
        }),
      ];

      const result = calculator.aggregateDailySummaryTotals(data, {
        totalFinancialGoal: 2000,
        totalFinancialGoalWith8: 2500,
      });

      expect(result.totalDiaryGoal).toBeCloseTo(25, 10);
    });

    it('should return 0 for totalDiaryGoal when financialGoal is 0', () => {
      const data = [makeDailyEntry({ totalMoProg: 500 })];

      const result = calculator.aggregateDailySummaryTotals(data, {
        totalFinancialGoal: 0,
        totalFinancialGoalWith8: 0,
      });

      expect(result.totalDiaryGoal).toBe(0);
    });

    it('should calculate totalDiff correctly', () => {
      const data = [makeDailyEntry({ totalMoProg: 1000, totalMoExec: 800 })];

      const result = calculator.aggregateDailySummaryTotals(data, {
        totalFinancialGoal: 2000,
        totalFinancialGoalWith8: 2500,
      });

      expect(result.totalDiff).toBeCloseTo(80, 10);
    });
  });

  // ─── aggregateGroupTotals ───────────────────────────────────────────────────

  describe('aggregateGroupTotals', () => {
    it('should return zeroed totals when summaryData is empty', () => {
      const result = calculator.aggregateGroupTotals([], 0);

      expect(result).toMatchObject(createInitialTotalsByGrouping());
    });

    it('should accumulate totalWorks from row.qtdeWorks', () => {
      const data = [
        makeGroupEntry({ qtdeWorks: 3 }),
        makeGroupEntry({ qtdeWorks: 7 }),
      ];

      const result = calculator.aggregateGroupTotals(data, 0);

      expect(result.totalWorks).toBe(10);
    });

    it('should accumulate totalMoProgByGrouping from row.totalMoProg', () => {
      const data = [
        makeGroupEntry({ totalMoProg: 400 }),
        makeGroupEntry({ totalMoProg: 600 }),
      ];

      const result = calculator.aggregateGroupTotals(data, 0);

      expect(result.totalMoProgByGrouping).toBe(1000);
    });

    it('should accumulate totalMoExecByGrouping from row.totalMoExec', () => {
      const data = [
        makeGroupEntry({ totalMoExec: 200 }),
        makeGroupEntry({ totalMoExec: 300 }),
      ];

      const result = calculator.aggregateGroupTotals(data, 0);

      expect(result.totalMoExecByGrouping).toBe(500);
    });

    it('should accumulate totalMoPrevByGrouping from row.totalMoPrev', () => {
      const data = [
        makeGroupEntry({ totalMoPrev: 150 }),
        makeGroupEntry({ totalMoPrev: 250 }),
      ];

      const result = calculator.aggregateGroupTotals(data, 0);

      expect(result.totalMoPrevByGrouping).toBe(400);
    });

    it('should compute totalDiff as calculateExecutionRate(totalMoProgByGrouping, totalMoExecByGrouping)', () => {
      const data = [makeGroupEntry({ totalMoProg: 1000, totalMoExec: 600 })];

      const result = calculator.aggregateGroupTotals(data, 0);

      // (600 / 1000) * 100 = 60
      expect(result.totalDiff).toBeCloseTo(60, 10);
    });

    it('should return 0 for totalDiff when totalMoProgByGrouping is 0', () => {
      const result = calculator.aggregateGroupTotals([], 0);

      expect(result.totalDiff).toBe(0);
    });

    it('should handle multiple rows accumulating all fields correctly', () => {
      const data = [
        makeGroupEntry({
          qtdeWorks: 2,
          totalMoProg: 500,
          totalMoExec: 400,
          totalMoPrev: 450,
        }),
        makeGroupEntry({
          qtdeWorks: 3,
          totalMoProg: 500,
          totalMoExec: 300,
          totalMoPrev: 350,
        }),
      ];

      const result = calculator.aggregateGroupTotals(data, 0);

      expect(result.totalWorks).toBe(5);
      expect(result.totalMoProgByGrouping).toBe(1000);
      expect(result.totalMoExecByGrouping).toBe(700);
      expect(result.totalMoPrevByGrouping).toBe(800);
      expect(result.totalDiff).toBeCloseTo(70, 10);
    });
  });
});
