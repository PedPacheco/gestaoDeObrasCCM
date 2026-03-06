// ─── Daily Summary Mapper ─────────────────────────────────────────────────────

import {
  calculateExecutionRateForecast,
  calculateGoalPercentageForecast,
  calculateMoPrevForecast,
  calculateWorkOrderMetricsForecast,
} from 'src/domain/services/monthlySummaryForecastCalculator.service';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

export function createDailySummaryEntryForecast(
  formattedDate: string,
  metrics: MonthlyCapacityMetricsForecast,
): DailySummaryEntryForecast {
  return {
    dataProg: formattedDate,
    totalQtde: 0,
    teamsTotal: metrics.teamsTotal,
    financialGoal: metrics.dailyFinancialGoal,
    diaryGoal: 0,
    serviceMoProg: 0,
    serviceMoPlan: 0,
    serviceMoPend: 0,
    serviceMoExec: 0,
    materialMoProg: 0,
    materialMoPlan: 0,
    materialMoPend: 0,
    materialMoExec: 0,
    diff: 0,
  };
}

export function accumulateDailySummaryEntryForecast(
  entry: DailySummaryEntryForecast,
  servicePlan: number,
  servicePend: number,
  materialPlan: number,
  materialPend: number,
  prog: number,
  exec: number,
  metrics: MonthlyCapacityMetricsForecast,
): void {
  const {
    materialCapexExec,
    materialCapexProg,
    serviceCapexExec,
    serviceCapexProg,
  } = calculateWorkOrderMetricsForecast(servicePlan, materialPlan, prog, exec);

  entry.totalQtde++;
  entry.materialMoPlan += materialPlan;
  entry.materialMoProg += materialCapexProg;
  entry.materialMoPend += materialPend;
  entry.materialMoExec += materialCapexExec;
  entry.serviceMoPlan += servicePlan;
  entry.serviceMoProg += serviceCapexProg;
  entry.serviceMoPend += servicePend;
  entry.serviceMoExec += serviceCapexExec;
  entry.diaryGoal += calculateGoalPercentageForecast(
    serviceCapexProg,
    metrics.dailyFinancialGoal,
  );
}

export function finalizeDailySummaryEntryForecast(
  entry: DailySummaryEntryForecast,
): void {
  entry.diff = calculateExecutionRateForecast(
    entry.serviceMoProg,
    entry.materialMoProg,
    entry.serviceMoExec,
    entry.materialMoExec,
  );
}

// ─── Group Team Summary Mapper ────────────────────────────────────────────────

export function createGroupTeamEntryForecast(
  grupo: string,
  turma: string,
): GroupTeamSummaryEntryForecast {
  return {
    grupo,
    turma,
    qtdeObras: 0,
    _obrasContabilizadas: new Set<string>(),
    totalServiceMoProg: 0,
    totalServiceMoPlan: 0,
    totalServiceMoPend: 0,
    totalServiceMoPrev: 0,
    totalServiceMoExec: 0,
    totalMaterialMoProg: 0,
    totalMaterialMoPlan: 0,
    totalMaterialMoPend: 0,
    totalMaterialMoPrev: 0,
    totalMaterialMoExec: 0,
    diff: 0,
  };
}

export function accumulateGroupTeamEntryForecast(
  entry: GroupTeamSummaryEntryForecast,
  servicePlan: number,
  materialPlan: number,
  prog: number,
  exec: number | null,
): void {
  const {
    materialCapexExec,
    materialCapexProg,
    serviceCapexExec,
    serviceCapexProg,
  } = calculateWorkOrderMetricsForecast(servicePlan, materialPlan, prog, exec);

  const { materialCapexPrev, serviceCapexPrev } = calculateMoPrevForecast(
    servicePlan,
    materialPlan,
    exec,
    prog,
  );

  entry.totalMaterialMoProg += materialCapexProg;
  entry.totalMaterialMoPrev += materialCapexPrev;
  entry.totalMaterialMoExec += materialCapexExec;
  entry.totalServiceMoProg += serviceCapexProg;
  entry.totalServiceMoPrev += serviceCapexPrev;
  entry.totalServiceMoExec += serviceCapexExec;
}
