import {
  DailyForecastSummaryTotals,
  DailySummaryEntryForecast,
  GroupForecastSummaryTotals,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
  UniqueWorksFinancialForecast,
  WorkItemFinancialsForecast,
  WorkOrderMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

import { Injectable } from '@nestjs/common';

@Injectable()
export class MonthlySummaryForecastMapper {
  createDailySummaryEntry(
    formattedDate: string,
    metrics: MonthlyCapacityMetricsForecast,
    teams: number,
  ): DailySummaryEntryForecast {
    return {
      dataProg: formattedDate,
      qtdeWorks: 0,
      teams,
      financialGoal: metrics.dailyFinancialGoal,
      diaryGoal: 0,
      serviceMoProg: 0,
      serviceMoPlan: 0,
      serviceMoPend: 0,
      serviceMoExec: 0,
      serviceMoForecast: 0,
      materialMoProg: 0,
      materialMoPlan: 0,
      materialMoPend: 0,
      materialMoExec: 0,
      materialMoForecast: 0,
      forecastTotal: 0,
      execTotal: 0,
      isMaterialPendLowerThanProg: false,
      isServicePendLowerThanProg: false,
      diff: 0,
    };
  }

  accumulateDailySummaryEntry(
    entry: DailySummaryEntryForecast,
    financials: WorkItemFinancialsForecast,
    workOrderMetrics: WorkOrderMetricsForecast,
    goalContribution: number,
  ): void {
    const {
      serviceCapexProg,
      serviceCapexExec,
      materialCapexProg,
      materialCapexExec,
      materialCapexForecast,
      serviceCapexForecast,
      execTotal,
      forecastTotal,
    } = workOrderMetrics;

    entry.qtdeWorks++;

    entry.materialMoPlan += financials.materialPlan;
    entry.materialMoProg += materialCapexProg;
    entry.materialMoPend += financials.materialPend;
    entry.materialMoExec += materialCapexExec;
    entry.materialMoForecast += materialCapexForecast;

    entry.serviceMoPlan += financials.servicePlan;
    entry.serviceMoProg += serviceCapexProg;
    entry.serviceMoPend += financials.servicePend;
    entry.serviceMoExec += serviceCapexExec;
    entry.serviceMoForecast += serviceCapexForecast;

    entry.forecastTotal += forecastTotal;
    entry.execTotal += execTotal;

    entry.isServicePendLowerThanProg =
      entry.serviceMoProg > entry.serviceMoPend;
    entry.isMaterialPendLowerThanProg =
      entry.materialMoProg > entry.materialMoPend;

    entry.diaryGoal += goalContribution;
  }

  finalizeDailySummaryEntry(
    entry: DailySummaryEntryForecast,
    executionRate: number,
  ): void {
    entry.diff = executionRate;
  }

  createGroupTeamEntry(
    grupo: string,
    turma: string,
  ): GroupTeamSummaryEntryForecast {
    return {
      grupo,
      turma,
      qtdeWorks: 0,
      totalServiceMoProg: 0,
      totalServiceMoPlan: 0,
      totalServiceMoPend: 0,
      totalServiceMoPrev: 0,
      totalServiceMoExec: 0,
      totalServiceMoForecast: 0,
      totalMaterialMoProg: 0,
      totalMaterialMoPlan: 0,
      totalMaterialMoPend: 0,
      totalMaterialMoPrev: 0,
      totalMaterialMoExec: 0,
      totalMaterialMoForecast: 0,
      forecastTotal: 0,
      execTotal: 0,
      diff: 0,
    };
  }

  accumulateGroupTeamEntry(
    entry: GroupTeamSummaryEntryForecast,
    financials: WorkItemFinancialsForecast,
    workOrderMetrics: WorkOrderMetricsForecast,
    prevMetrics: { serviceCapexPrev: number; materialCapexPrev: number },
  ): void {
    const {
      serviceCapexProg,
      serviceCapexExec,
      materialCapexProg,
      materialCapexExec,
      materialCapexForecast,
      serviceCapexForecast,
      execTotal,
      forecastTotal,
    } = workOrderMetrics;

    entry.qtdeWorks++;

    entry.totalMaterialMoPlan += financials.materialPlan;
    entry.totalMaterialMoProg += materialCapexProg;
    entry.totalMaterialMoPrev += prevMetrics.materialCapexPrev;
    entry.totalMaterialMoPend += financials.materialPend;
    entry.totalMaterialMoExec += materialCapexExec;
    entry.totalMaterialMoForecast += materialCapexForecast;

    entry.totalServiceMoPlan += financials.servicePlan;
    entry.totalServiceMoProg += serviceCapexProg;
    entry.totalServiceMoPend += financials.servicePend;
    entry.totalServiceMoPrev += prevMetrics.serviceCapexPrev;
    entry.totalServiceMoExec += serviceCapexExec;
    entry.totalServiceMoForecast += serviceCapexForecast;

    entry.forecastTotal += forecastTotal;
    entry.execTotal += execTotal;
  }
}

export type DailySummaryTotalsShape = ReturnType<typeof createInitialTotals>;
export type GroupSummaryTotalsShape = ReturnType<
  typeof createInitialTotalsByGrouping
>;

export function createInitialTotals(): DailyForecastSummaryTotals {
  return {
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
    totalForecast: 0,
    totalExec: 0,
    totalDiff: 0,
  };
}

export function createInitialTotalsByGrouping(): GroupForecastSummaryTotals {
  return {
    totalWorks: 0,
    totalServiceMoProgByGrouping: 0,
    totalServiceMoPlanByGrouping: 0,
    totalServiceMoPendByGrouping: 0,
    totalServiceMoExecByGrouping: 0,
    totalServiceMoForecastByGrouping: 0,
    totalMaterialMoProgByGrouping: 0,
    totalMaterialMoPlanByGrouping: 0,
    totalMaterialMoPendByGrouping: 0,
    totalMaterialMoExecByGrouping: 0,
    totalMaterialMoForecastByGrouping: 0,
    totalForecast: 0,
    totalExec: 0,
    totalDiff: 0,
  };
}

export function createUniqueWorksFinancialForecast(): UniqueWorksFinancialForecast {
  return {
    totalServiceMoPlan: 0,
    totalMaterialMoPlan: 0,
    totalServiceMoPend: 0,
    totalMaterialMoPend: 0,
  };
}
