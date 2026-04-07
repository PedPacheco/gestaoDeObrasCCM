import {
  createInitialTotals,
  createInitialTotalsByGrouping,
} from 'src/application/mappers/monthlySummaryForecastMapper';
import {
  DailyForecastSummaryTotals,
  DailySummaryEntryForecast,
  GroupForecastSummaryTotals,
  GroupTeamSummaryEntryForecast,
  MonthlyCapacityMetricsForecast,
  UniqueWorksFinancialForecast,
  WorkOrderMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';
import {
  MONTH_INDEX_TO_KEY,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

import { Injectable } from '@nestjs/common';

export type MonthKey =
  | 'jan'
  | 'fev'
  | 'mar'
  | 'abr'
  | 'mai'
  | 'jun'
  | 'jul'
  | 'ago'
  | 'set'
  | 'out'
  | 'nov'
  | 'dez';

export interface IMonthlySummaryForecastCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<any>,
    monthIndex: number,
  ): MonthlyCapacityMetricsForecast;

  calculateWorkOrderMetrics(
    servicePlan: number,
    materialPlan: number,
    prog: number,
    exec: number,
    servicePend: number,
    materialPend: number,
    totalExec: number,
  ): WorkOrderMetricsForecast;

  calculateGoalPercentage(value: number, goal: number): number;

  calculateMoPrev(
    baseMoPlan: number,
    baseMatPlan: number,
    exec: number | null,
    prog: number,
  ): { serviceCapexPrev: number; materialCapexPrev: number };

  calculateExecutionRate(
    serviceCapexProg: number,
    materialCapexProg: number,
    serviceCapexExec: number,
    materialCapexExec: number,
  ): number;

  aggregateDailySummaryTotals(
    data: DailySummaryEntryForecast[],
    uniqueWorksFinancial: UniqueWorksFinancialForecast,
    totalFinancial: number,
  ): DailyForecastSummaryTotals;

  aggregateGroupTotals(
    summaryData: GroupTeamSummaryEntryForecast[],
    uniqueWorksFinancial: UniqueWorksFinancialForecast,
  ): GroupForecastSummaryTotals;
}

export const MONTHLY_SUMMARY_FORECAST_CALCULATOR =
  'MONTHLY_SUMMARY_FORECAST_CALCULATOR';

@Injectable()
export class MonthlySummaryForecastCalculator implements IMonthlySummaryForecastCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<any>,
    monthIndex: number,
  ): MonthlyCapacityMetricsForecast {
    const monthKey = MONTH_INDEX_TO_KEY[monthIndex] as MonthKey;

    const field = `valor_${monthKey}`;

    const totalFinancial = executionCapacity.reduce((sum, entry) => {
      return sum + Number(entry[field] ?? 0);
    }, 0);

    return {
      dailyFinancialGoal: totalFinancial / WORKING_DAYS_PER_MONTH,
      totalFinancial,
    };
  }

  calculateWorkOrderMetrics(
    servicePlan: number,
    materialPlan: number,
    prog: number,
    exec: number,
    servicePend: number,
    materialPend: number,
    totalExec: number,
  ): WorkOrderMetricsForecast {
    const progRate = prog / 100;
    const execRate = exec / 100;

    const execTotal = totalExec !== 100 ? (totalExec + prog) / 100 : 1;

    const serviceCapexForecast = servicePend * (execTotal >= 1 ? 1 : progRate);
    const materialCapexForecast =
      materialPend * (execTotal >= 1 ? 1 : progRate);

    return {
      serviceCapexProg: servicePlan * progRate,
      serviceCapexExec: servicePlan * execRate,
      serviceCapexForecast,
      materialCapexProg: materialPlan * progRate,
      materialCapexExec: materialPlan * execRate,
      materialCapexForecast,
      forecastTotal: serviceCapexForecast + materialCapexForecast,
      execTotal: (servicePlan + materialPlan) * execRate,
    };
  }

  calculateGoalPercentage(value: number, goal: number): number {
    return goal > 0 ? (value / goal) * 100 : 0;
  }

  calculateMoPrev(
    baseMoPlan: number,
    baseMatPlan: number,
    exec: number | null,
    prog: number,
  ): { serviceCapexPrev: number; materialCapexPrev: number } {
    const effectiveRate = (exec ?? prog) / 100;

    return {
      serviceCapexPrev: baseMoPlan * effectiveRate,
      materialCapexPrev: baseMatPlan * effectiveRate,
    };
  }

  calculateExecutionRate(
    serviceCapexProg: number,
    materialCapexProg: number,
    serviceCapexExec: number,
    materialCapexExec: number,
  ): number {
    const totalProg = serviceCapexProg + materialCapexProg;

    if (totalProg === 0) return 0;

    return ((serviceCapexExec + materialCapexExec) / totalProg) * 100;
  }

  aggregateDailySummaryTotals(
    data: DailySummaryEntryForecast[],
    uniqueWorksFinancial: UniqueWorksFinancialForecast,
    totalFinancial: number,
  ): DailyForecastSummaryTotals {
    const totals = data.reduce((acc, row) => {
      acc.totalQtdeObras += row.qtdeWorks;
      acc.totalTeams += row.teams;
      acc.totalServiceMoProg += row.serviceMoProg;
      acc.totalServiceMoExec += row.serviceMoExec;
      acc.totalServiceMoForecast += row.serviceMoForecast;
      acc.totalMaterialMoProg += row.materialMoProg;
      acc.totalMaterialMoForecast += row.materialMoForecast;
      acc.totalMaterialMoExec += row.materialMoExec;
      acc.totalForecast += row.forecastTotal;
      acc.totalExec += row.execTotal;

      return acc;
    }, createInitialTotals());

    totals.totalServiceMoPlan = uniqueWorksFinancial.totalServiceMoPlan;
    totals.totalMaterialMoPlan = uniqueWorksFinancial.totalMaterialMoPlan;
    totals.totalServiceMoPend = uniqueWorksFinancial.totalServiceMoPend;
    totals.totalMaterialMoPend = uniqueWorksFinancial.totalMaterialMoPend;

    totals.totalFinancialGoal = totalFinancial;

    totals.totalDiaryGoal = this.calculateGoalPercentage(
      totals.totalServiceMoProg,
      totals.totalFinancialGoal,
    );

    totals.totalDiff = this.calculateExecutionRate(
      totals.totalServiceMoProg,
      totals.totalMaterialMoProg,
      totals.totalServiceMoExec,
      totals.totalMaterialMoExec,
    );

    return totals;
  }

  aggregateGroupTotals(
    summaryData: GroupTeamSummaryEntryForecast[],
    uniqueWorksFinancial: UniqueWorksFinancialForecast,
  ): GroupForecastSummaryTotals {
    const totals = summaryData.reduce((acc, row) => {
      acc.totalWorks += row.qtdeWorks;
      acc.totalServiceMoProgByGrouping += row.totalServiceMoProg;
      acc.totalServiceMoPlanByGrouping += row.totalServiceMoPlan;
      acc.totalServiceMoPendByGrouping += row.totalServiceMoPend;
      acc.totalServiceMoExecByGrouping += row.totalServiceMoExec;
      acc.totalServiceMoForecastByGrouping += row.totalServiceMoForecast;
      acc.totalMaterialMoProgByGrouping += row.totalMaterialMoProg;
      acc.totalMaterialMoPlanByGrouping += row.totalMaterialMoPlan;
      acc.totalMaterialMoPendByGrouping += row.totalMaterialMoPend;
      acc.totalMaterialMoExecByGrouping += row.totalMaterialMoExec;
      acc.totalMaterialMoForecastByGrouping += row.totalMaterialMoForecast;

      acc.totalForecast += row.forecastTotal;
      acc.totalExec += row.execTotal;

      return acc;
    }, createInitialTotalsByGrouping());

    totals.totalServiceMoPlanByGrouping =
      uniqueWorksFinancial.totalServiceMoPlan;
    totals.totalMaterialMoPlanByGrouping =
      uniqueWorksFinancial.totalMaterialMoPlan;
    totals.totalServiceMoPendByGrouping =
      uniqueWorksFinancial.totalServiceMoPend;
    totals.totalMaterialMoPendByGrouping =
      uniqueWorksFinancial.totalMaterialMoPend;

    totals.totalDiff = this.calculateExecutionRate(
      totals.totalServiceMoProgByGrouping,
      totals.totalMaterialMoProgByGrouping,
      totals.totalServiceMoExecByGrouping,
      totals.totalMaterialMoExecByGrouping,
    );

    return totals;
  }
}
