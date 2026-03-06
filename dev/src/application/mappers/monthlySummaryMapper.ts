// ─── Daily Summary Mapper ─────────────────────────────────────────────────────

import {
  calculateExecutionRate,
  calculateGoalPercentage,
  calculateMoPrev,
  calculateWorkOrderMetrics,
} from 'src/domain/services/monthlySummaryCalculator.service';
import {
  DailySummaryEntry,
  GroupTeamSummaryEntry,
  MonthlyCapacityMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

export function createDailySummaryEntry(
  formattedDate: string,
  metrics: MonthlyCapacityMetrics,
): DailySummaryEntry {
  return {
    dataProg: formattedDate,
    totalQtde: 0,
    teamsTotal: metrics.teamsTotal,
    financialGoal: metrics.dailyFinancialGoal,
    financialGoalWith8: metrics.dailyFinancialGoalWithOverhead,
    diaryGoal: 0,
    diaryGoalWith8: 0,
    totalMoProg: 0,
    totalMoExec: 0,
    diff: 0,
  };
}

export function accumulateDailySummaryEntry(
  entry: DailySummaryEntry,
  baseMo: number,
  prog: number,
  exec: number,
  metrics: MonthlyCapacityMetrics,
): void {
  const { moProg, moExec } = calculateWorkOrderMetrics(baseMo, prog, exec);

  entry.totalQtde++;
  entry.totalMoProg += moProg;
  entry.totalMoExec += moExec;
  entry.diaryGoal += calculateGoalPercentage(
    moProg,
    metrics.dailyFinancialGoal,
  );
  entry.diaryGoalWith8 += calculateGoalPercentage(
    moProg,
    metrics.dailyFinancialGoalWithOverhead,
  );
}

export function finalizeDailySummaryEntry(entry: DailySummaryEntry): void {
  entry.diff = calculateExecutionRate(entry.totalMoExec, entry.totalMoProg);
}

// ─── Group Team Summary Mapper ────────────────────────────────────────────────

export function createGroupTeamEntry(
  grupo: string,
  turma: string,
): GroupTeamSummaryEntry {
  return {
    grupo,
    turma,
    qtdeObras: 0,
    _obrasContabilizadas: new Set<string>(),
    totalMoProg: 0,
    totalMoExec: 0,
    totalMoPrev: 0,
    diff: 0,
  };
}

export function accumulateGroupTeamEntry(
  entry: GroupTeamSummaryEntry,
  baseMo: number,
  prog: number,
  exec: number | null,
): void {
  const { moProg, moExec } = calculateWorkOrderMetrics(baseMo, prog, exec ?? 0);
  const moPrev = calculateMoPrev(baseMo, exec, prog);

  entry.totalMoProg += moProg;
  entry.totalMoExec += moExec;
  entry.totalMoPrev += moPrev;
}
