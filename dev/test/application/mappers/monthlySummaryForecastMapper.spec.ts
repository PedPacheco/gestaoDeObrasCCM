import {
  createInitialTotals,
  createInitialTotalsByGrouping,
  createUniqueWorksFinancialForecast,
  MonthlySummaryForecastMapper,
} from 'src/application/mappers/monthlySummaryForecastMapper';

describe('MonthlySummaryForecastMapper', () => {
  let mapper: MonthlySummaryForecastMapper;

  beforeEach(() => {
    mapper = new MonthlySummaryForecastMapper();
  });

  // ─────────────────────────────────────────────────────────────
  // createDailySummaryEntry
  // ─────────────────────────────────────────────────────────────

  describe('createDailySummaryEntry', () => {
    it('should create a default entry with provided date, metrics and teams', () => {
      const result = mapper.createDailySummaryEntry(
        '01/01/2024',
        { dailyFinancialGoal: 1000, totalFinancial: 2000 },
        5,
      );

      expect(result).toMatchObject({
        dataProg: '01/01/2024',
        teams: 5,
        financialGoal: 1000,
        qtdeWorks: 0,
        diaryGoal: 0,
        diff: 0,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // accumulateDailySummaryEntry
  // ─────────────────────────────────────────────────────────────

  describe('accumulateDailySummaryEntry', () => {
    it('should accumulate all financial and work order values correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        { dailyFinancialGoal: 1000, totalFinancial: 2000 },
        2,
      );

      const financials = {
        materialPlan: 100,
        materialPend: 50,
        servicePlan: 200,
        servicePend: 80,
      };

      const workOrderMetrics = {
        materialCapexProg: 40,
        materialCapexExec: 20,
        materialCapexForecast: 30,
        serviceCapexProg: 100,
        serviceCapexExec: 60,
        serviceCapexForecast: 90,
      };

      mapper.accumulateDailySummaryEntry(
        entry,
        financials as any,
        workOrderMetrics as any,
        10,
      );

      expect(entry.qtdeWorks).toBe(1);

      expect(entry.materialMoPlan).toBe(100);
      expect(entry.materialMoProg).toBe(40);
      expect(entry.materialMoPend).toBe(50);
      expect(entry.materialMoExec).toBe(20);
      expect(entry.materialMoForecast).toBe(30);

      expect(entry.serviceMoPlan).toBe(200);
      expect(entry.serviceMoProg).toBe(100);
      expect(entry.serviceMoPend).toBe(80);
      expect(entry.serviceMoExec).toBe(60);
      expect(entry.serviceMoForecast).toBe(90);

      expect(entry.diaryGoal).toBe(10);
    });

    it('should update boolean flags correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        { dailyFinancialGoal: 1000, totalFinancial: 2000 },
        1,
      );

      const financials = {
        materialPlan: 0,
        materialPend: 10,
        servicePlan: 0,
        servicePend: 20,
      };

      const workOrderMetrics = {
        materialCapexProg: 50,
        materialCapexExec: 0,
        materialCapexForecast: 0,
        serviceCapexProg: 30,
        serviceCapexExec: 0,
        serviceCapexForecast: 0,
      };

      mapper.accumulateDailySummaryEntry(
        entry,
        financials as any,
        workOrderMetrics as any,
        0,
      );

      expect(entry.isMaterialPendLowerThanProg).toBe(true);
      expect(entry.isServicePendLowerThanProg).toBe(true);
    });

    it('should accumulate multiple calls correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        { dailyFinancialGoal: 1000, totalFinancial: 2000 },
        1,
      );

      const financials = {
        materialPlan: 10,
        materialPend: 5,
        servicePlan: 20,
        servicePend: 10,
      };

      const metrics = {
        materialCapexProg: 2,
        materialCapexExec: 1,
        materialCapexForecast: 3,
        serviceCapexProg: 4,
        serviceCapexExec: 2,
        serviceCapexForecast: 5,
      };

      mapper.accumulateDailySummaryEntry(
        entry,
        financials as any,
        metrics as any,
        5,
      );
      mapper.accumulateDailySummaryEntry(
        entry,
        financials as any,
        metrics as any,
        5,
      );

      expect(entry.qtdeWorks).toBe(2);
      expect(entry.materialMoPlan).toBe(20);
      expect(entry.serviceMoPlan).toBe(40);
      expect(entry.diaryGoal).toBe(10);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // finalizeDailySummaryEntry
  // ─────────────────────────────────────────────────────────────

  describe('finalizeDailySummaryEntry', () => {
    it('should set diff correctly', () => {
      const entry = mapper.createDailySummaryEntry(
        '01/01/2024',
        { dailyFinancialGoal: 1000, totalFinancial: 2000 },
        1,
      );

      mapper.finalizeDailySummaryEntry(entry, 75);

      expect(entry.diff).toBe(75);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // createGroupTeamEntry
  // ─────────────────────────────────────────────────────────────

  describe('createGroupTeamEntry', () => {
    it('should create a default group entry', () => {
      const result = mapper.createGroupTeamEntry('G1', 'T1');

      expect(result).toMatchObject({
        grupo: 'G1',
        turma: 'T1',
        qtdeWorks: 0,
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

      const financials = {
        materialPlan: 100,
        materialPend: 50,
        servicePlan: 200,
        servicePend: 80,
      };

      const metrics = {
        materialCapexProg: 40,
        materialCapexExec: 20,
        serviceCapexProg: 100,
        serviceCapexExec: 60,
      };

      const prev = {
        materialCapexPrev: 30,
        serviceCapexPrev: 70,
      };

      mapper.accumulateGroupTeamEntry(
        entry,
        financials as any,
        metrics as any,
        prev,
      );

      expect(entry.qtdeWorks).toBe(1);

      expect(entry.totalMaterialMoPlan).toBe(100);
      expect(entry.totalMaterialMoProg).toBe(40);
      expect(entry.totalMaterialMoPrev).toBe(30);
      expect(entry.totalMaterialMoPend).toBe(50);
      expect(entry.totalMaterialMoExec).toBe(20);

      expect(entry.totalServiceMoPlan).toBe(200);
      expect(entry.totalServiceMoProg).toBe(100);
      expect(entry.totalServiceMoPrev).toBe(70);
      expect(entry.totalServiceMoPend).toBe(80);
      expect(entry.totalServiceMoExec).toBe(60);
    });

    it('should accumulate multiple times correctly', () => {
      const entry = mapper.createGroupTeamEntry('G1', 'T1');

      const financials = {
        materialPlan: 10,
        materialPend: 5,
        servicePlan: 20,
        servicePend: 10,
      };

      const metrics = {
        materialCapexProg: 2,
        materialCapexExec: 1,
        serviceCapexProg: 4,
        serviceCapexExec: 2,
      };

      const prev = {
        materialCapexPrev: 3,
        serviceCapexPrev: 5,
      };

      mapper.accumulateGroupTeamEntry(
        entry,
        financials as any,
        metrics as any,
        prev,
      );
      mapper.accumulateGroupTeamEntry(
        entry,
        financials as any,
        metrics as any,
        prev,
      );

      expect(entry.qtdeWorks).toBe(2);
      expect(entry.totalMaterialMoPlan).toBe(20);
      expect(entry.totalServiceMoPlan).toBe(40);
      expect(entry.totalMaterialMoPrev).toBe(6);
      expect(entry.totalServiceMoPrev).toBe(10);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────

  describe('helpers', () => {
    it('createInitialTotals should return zeroed structure', () => {
      const result = createInitialTotals();

      expect(result).toEqual({
        totalQtdeObras: 0,
        totalTeams: 0,
        totalFinancialGoal: 0,
        totalDiaryGoal: 0,
        totalServiceMoProg: 0,
        totalServiceMoPlan: 0,
        totalServiceMoPend: 0,
        totalServiceMoExec: 0,
        totalServiceMoForecast: 0,
        totalMaterialMoProg: 0,
        totalMaterialMoPlan: 0,
        totalMaterialMoPend: 0,
        totalMaterialMoForecast: 0,
        totalMaterialMoExec: 0,
        totalDiff: 0,
      });
    });

    it('createInitialTotalsByGrouping should return zeroed structure', () => {
      const result = createInitialTotalsByGrouping();

      expect(result).toEqual({
        totalWorks: 0,
        totalServiceMoProgByGrouping: 0,
        totalServiceMoPlanByGrouping: 0,
        totalServiceMoPendByGrouping: 0,
        totalServiceMoExecByGrouping: 0,
        totalMaterialMoProgByGrouping: 0,
        totalMaterialMoPlanByGrouping: 0,
        totalMaterialMoPendByGrouping: 0,
        totalMaterialMoExecByGrouping: 0,
        totalDiff: 0,
      });
    });

    it('createUniqueWorksFinancialForecast should return zeroed structure', () => {
      const result = createUniqueWorksFinancialForecast();

      expect(result).toEqual({
        totalServiceMoPlan: 0,
        totalMaterialMoPlan: 0,
        totalServiceMoPend: 0,
        totalMaterialMoPend: 0,
      });
    });
  });
});
