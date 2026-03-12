import { Injectable } from '@nestjs/common';
import {
  DailySummaryTotals,
  GroupSummaryTotals,
  UniqueWorksFinancial,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';
import {
  DailySummaryEntryForecast,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
  WorkOrderMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

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
      isMaterialPendLowerThanProg: false,
      isServicePendLowerThanProg: false,
      diff: 0,
    };
  }

  accumulateDailySummaryEntry(
    entry: DailySummaryEntryForecast,
    financials: WorkItemFinancials,
    workOrderMetrics: WorkOrderMetricsForecast,
    goalContribution: number,
  ): void {
    const {
      serviceCapexProg,
      serviceCapexExec,
      materialCapexProg,
      materialCapexExec,
    } = workOrderMetrics;

    entry.qtdeWorks++;

    entry.materialMoPlan += financials.materialPlan;
    entry.materialMoProg += materialCapexProg;
    entry.materialMoPend += financials.materialPend;
    entry.materialMoExec += materialCapexExec;
    entry.materialMoForecast = Math.min(
      entry.materialMoProg,
      entry.materialMoPend,
    );

    entry.serviceMoPlan += financials.servicePlan;
    entry.serviceMoProg += serviceCapexProg;
    entry.serviceMoPend += financials.servicePend;
    entry.serviceMoExec += serviceCapexExec;
    entry.serviceMoForecast = Math.min(
      entry.serviceMoProg,
      entry.serviceMoPend,
    );

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
      totalMaterialMoProg: 0,
      totalMaterialMoPlan: 0,
      totalMaterialMoPend: 0,
      totalMaterialMoPrev: 0,
      totalMaterialMoExec: 0,
      diff: 0,
    };
  }

  accumulateGroupTeamEntry(
    entry: GroupTeamSummaryEntryForecast,
    financials: WorkItemFinancials,
    workOrderMetrics: WorkOrderMetricsForecast,
    prevMetrics: { serviceCapexPrev: number; materialCapexPrev: number },
  ): void {
    const {
      serviceCapexProg,
      serviceCapexExec,
      materialCapexProg,
      materialCapexExec,
    } = workOrderMetrics;

    entry.qtdeWorks++;

    entry.totalMaterialMoPlan += financials.materialPlan;
    entry.totalMaterialMoProg += materialCapexProg;
    entry.totalMaterialMoPrev += prevMetrics.materialCapexPrev;
    entry.totalMaterialMoPend += financials.materialPend;
    entry.totalMaterialMoExec += materialCapexExec;

    entry.totalServiceMoPlan += financials.servicePlan;
    entry.totalServiceMoProg += serviceCapexProg;
    entry.totalServiceMoPend += financials.servicePend;
    entry.totalServiceMoPrev += prevMetrics.serviceCapexPrev;
    entry.totalServiceMoExec += serviceCapexExec;
  }
}

export interface WorkItemFinancials {
  servicePlan: number;
  servicePend: number;
  materialPlan: number;
  materialPend: number;
}

// ─── Factory functions para totais iniciais ───────────────────────────────────
//
// ANTES: objetos literais exportados (initialTotals, initialTotalsByGrouping)
//        eram usados com spread { ...initialTotals }. O spread funciona, mas
//        exportar um objeto mutável é uma armadilha: qualquer módulo que
//        importar e esquecer o spread corrompe o estado compartilhado.
// AGORA: factory functions garantem sempre uma cópia isolada e nova. O mesmo
//        padrão que já existia em createUniqueWorksFinancial() foi aplicado
//        consistentemente aos outros dois.

export type DailySummaryTotalsShape = ReturnType<typeof createInitialTotals>;
export type GroupSummaryTotalsShape = ReturnType<
  typeof createInitialTotalsByGrouping
>;

export function createInitialTotals(): DailySummaryTotals {
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
    totalDiff: 0,
  };
}

export function createInitialTotalsByGrouping(): GroupSummaryTotals {
  return {
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
  };
}

export function createUniqueWorksFinancial(): UniqueWorksFinancial {
  return {
    totalServiceMoPlan: 0,
    totalMaterialMoPlan: 0,
    totalServiceMoPend: 0,
    totalMaterialMoPend: 0,
  };
}
