import {
  createInitialTotals,
  createInitialTotalsByGrouping,
  createUniqueWorksFinancial,
  MonthlySummaryMapper,
} from 'src/application/mappers/monthlySummaryMapper';

describe('MonthlySummaryMapper', () => {
  let mapper: MonthlySummaryMapper;

  beforeEach(() => {
    mapper = new MonthlySummaryMapper();
  });

  // ─────────────────────────────────────────────────────────────
  // createDailySummaryEntry
  // ─────────────────────────────────────────────────────────────

  describe('createDailySummaryEntry', () => {
    it('should create a default daily summary entry with correct values', () => {
      const result = mapper.createDailySummaryEntry(
        '01/01/2024',
        {
          dailyFinancialGoal: 1000,
          dailyFinancialGoalWithOverhead: 1080,
          totalFinancial: 2000,
          totalFinancialWith8: 2500,
        },
        5,
      );

      expect(result).toEqual({
        dataProg: '01/01/2024',
        totalQtde: 0,
        teamsTotal: 5,
        financialGoal: 1000,
        diaryGoal: 0,
        financialGoalWith8: 1080,
        diaryGoalWith8: 0,
        totalMoPlan: 0,
        totalMoProg: 0,
        totalMoExec: 0,
        diff: 0,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // accumulateDailySummaryEntry
  // ─────────────────────────────────────────────────────────────

  describe('accumulateDailySummaryEntry', () => {
    it('should accumulate values correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        {
          dailyFinancialGoal: 1000,
          dailyFinancialGoalWithOverhead: 1080,
          totalFinancial: 2000,
          totalFinancialWith8: 2500,
        },
        2,
      );

      const metrics = { moPlan: 500, moProg: 500, moExec: 300, moPend: 0 };

      mapper.accumulateDailySummaryEntry(entry, metrics, 10, 12);

      expect(entry.totalQtde).toBe(1);
      expect(entry.totalMoProg).toBe(500);
      expect(entry.totalMoExec).toBe(300);
      expect(entry.diaryGoal).toBe(10);
      expect(entry.diaryGoalWith8).toBe(12);
    });

    it('should accumulate multiple calls correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        {
          dailyFinancialGoal: 1000,
          dailyFinancialGoalWithOverhead: 1080,
          totalFinancial: 2000,
          totalFinancialWith8: 2500,
        },
        1,
      );

      const metrics = { moPlan: 500, moProg: 100, moExec: 50, moPend: 0 };

      mapper.accumulateDailySummaryEntry(entry, metrics, 5, 6);
      mapper.accumulateDailySummaryEntry(entry, metrics, 5, 6);

      expect(entry.totalQtde).toBe(2);
      expect(entry.totalMoProg).toBe(200);
      expect(entry.totalMoExec).toBe(100);
      expect(entry.diaryGoal).toBe(10);
      expect(entry.diaryGoalWith8).toBe(12);
    });

    it('should handle zero values correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        {
          dailyFinancialGoal: 0,
          dailyFinancialGoalWithOverhead: 0,
          totalFinancial: 0,
          totalFinancialWith8: 0,
        },
        0,
      );

      mapper.accumulateDailySummaryEntry(
        entry,
        { moPlan: 0, moProg: 0, moExec: 0, moPend: 0 },
        0,
        0,
      );

      expect(entry.totalQtde).toBe(1);
      expect(entry.totalMoProg).toBe(0);
      expect(entry.totalMoExec).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // createGroupTeamEntry
  // ─────────────────────────────────────────────────────────────

  describe('createGroupTeamEntry', () => {
    it('should create a default group entry', () => {
      const result = mapper.createGroupTeamEntry('G1', 'T1');

      expect(result).toEqual({
        grupo: 'G1',
        turma: 'T1',
        qtdeWorks: 0,
        totalMoPlan: 0,
        totalMoProg: 0,
        totalMoPend: 0,
        totalMoExec: 0,
        totalMoPrev: 0,
        diff: 0,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // accumulateGroupTeamEntry
  // ─────────────────────────────────────────────────────────────

  describe('accumulateGroupTeamEntry', () => {
    it('should accumulate group values correctly', () => {
      const entry = mapper.createGroupTeamEntry('G1', 'T1');

      mapper.accumulateGroupTeamEntry(
        entry,
        { moPlan: 500, moProg: 500, moExec: 300, moPend: 0 },
        200,
        false,
      );

      expect(entry.qtdeWorks).toBe(1);
      expect(entry.totalMoProg).toBe(500);
      expect(entry.totalMoExec).toBe(300);
      expect(entry.totalMoPrev).toBe(200);
    });

    it('should accumulate multiple calls correctly', () => {
      const entry = mapper.createGroupTeamEntry('G1', 'T1');

      mapper.accumulateGroupTeamEntry(
        entry,
        { moPlan: 500, moProg: 100, moExec: 50, moPend: 0 },
        30,
        true,
      );

      mapper.accumulateGroupTeamEntry(
        entry,
        { moPlan: 500, moProg: 200, moExec: 150, moPend: 0 },
        70,
        false,
      );

      expect(entry.qtdeWorks).toBe(2);
      expect(entry.totalMoProg).toBe(300);
      expect(entry.totalMoExec).toBe(200);
      expect(entry.totalMoPrev).toBe(100);
    });

    it('should handle zero values correctly', () => {
      const entry = mapper.createGroupTeamEntry('G1', 'T1');

      mapper.accumulateGroupTeamEntry(
        entry,
        { moPlan: 500, moProg: 0, moExec: 0, moPend: 0 },
        0,
        false,
      );

      expect(entry.qtdeWorks).toBe(1);
      expect(entry.totalMoProg).toBe(0);
      expect(entry.totalMoExec).toBe(0);
      expect(entry.totalMoPrev).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────

  describe('helpers', () => {
    it('createInitialTotals should return zeroed totals', () => {
      expect(createInitialTotals()).toEqual({
        totalWalletAvaliable: 0,
        totalWalletExec: 0,
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
    });

    it('createInitialTotalsByGrouping should return zeroed totals', () => {
      expect(createInitialTotalsByGrouping()).toEqual({
        totalWorks: 0,
        totalMoPlanByGrouping: 0,
        totalMoProgByGrouping: 0,
        totalMoPendByGrouping: 0,
        totalMoExecByGrouping: 0,
        totalMoPrevByGrouping: 0,
        totalDiff: 0,
      });
    });

    it('createUniqueWorksFinancial should return default structure', () => {
      expect(createUniqueWorksFinancial()).toEqual({
        totalMoPlan: 0,
        totalMoPend: 0,
      });
    });
  });
});
