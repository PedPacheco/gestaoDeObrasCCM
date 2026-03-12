import { Injectable } from '@nestjs/common';
import {
  createInitialTotals,
  createInitialTotalsByGrouping,
} from 'src/application/mappers/monthlySummaryForecastMapper';
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
import {
  MONTH_INDEX_TO_KEY,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

// ─── Tipagem explícita das chaves de mês — elimina o index signature genérico ──
// ANTES: [monthKey: string]: number  →  qualquer string era aceita, sem type safety
// AGORA: somente as 12 chaves reais de mês são válidas como campos de capacidade
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

export interface ExecutionCapacityRecord extends Record<MonthKey, number> {
  should_cost: number;
}

export interface IMonthlySummaryForecastCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<ExecutionCapacityRecord>,
    monthIndex: number,
  ): MonthlyCapacityMetricsForecast;

  calculateWorkOrderMetrics(
    servicePlan: number,
    materialPlan: number,
    prog: number,
    exec: number,
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
    uniqueWorksFinancial: UniqueWorksFinancial,
  ): DailySummaryTotals;

  aggregateGroupTotals(
    summaryData: GroupTeamSummaryEntryForecast[],
    uniqueWorksFinancial: UniqueWorksFinancial,
  ): GroupSummaryTotals;
}

export const MONTHLY_SUMMARY_FORECAST_CALCULATOR =
  'MONTHLY_SUMMARY_FORECAST_CALCULATOR';

@Injectable()
export class MonthlySummaryForecastCalculator implements IMonthlySummaryForecastCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<ExecutionCapacityRecord>,
    monthIndex: number,
  ): MonthlyCapacityMetricsForecast {
    const monthKey = MONTH_INDEX_TO_KEY[monthIndex] as MonthKey;

    const totalFinancial = executionCapacity.reduce((sum, entry) => {
      return (
        sum + Number(entry[monthKey] ?? 0) * Number(entry.should_cost ?? 0)
      );
    }, 0);

    return {
      dailyFinancialGoal: totalFinancial / WORKING_DAYS_PER_MONTH,
    };
  }

  calculateWorkOrderMetrics(
    servicePlan: number,
    materialPlan: number,
    prog: number,
    exec: number,
  ): WorkOrderMetricsForecast {
    const progRate = prog / 100;
    const execRate = exec / 100;

    return {
      serviceCapexProg: servicePlan * progRate,
      serviceCapexExec: servicePlan * execRate,
      materialCapexProg: materialPlan * progRate,
      materialCapexExec: materialPlan * execRate,
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
    uniqueWorksFinancial: UniqueWorksFinancial,
  ): DailySummaryTotals {
    // ANTES: { ...initialTotals } com objeto literal exportado — risco de mutação acidental
    // AGORA: factory function garante sempre uma cópia nova e segura
    const totals = data.reduce((acc, row) => {
      acc.totalQtdeObras += row.qtdeWorks;
      acc.totalTeams += row.teams;
      acc.totalFinancialGoal += row.financialGoal;
      acc.totalServiceMoProg += row.serviceMoProg;
      acc.totalServiceMoExec += row.serviceMoExec;
      acc.totalServiceMoForecast += row.serviceMoForecast;
      acc.totalMaterialMoProg += row.materialMoProg;
      acc.totalMaterialMoForecast += row.materialMoForecast;
      acc.totalMaterialMoExec += row.materialMoExec;

      return acc;
    }, createInitialTotals());

    // Valores de plan/pend vêm das obras únicas (sem duplicar por data)
    totals.totalServiceMoPlan = uniqueWorksFinancial.totalServiceMoPlan;
    totals.totalMaterialMoPlan = uniqueWorksFinancial.totalMaterialMoPlan;
    totals.totalServiceMoPend = uniqueWorksFinancial.totalServiceMoPend;
    totals.totalMaterialMoPend = uniqueWorksFinancial.totalMaterialMoPend;

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
    uniqueWorksFinancial: UniqueWorksFinancial,
  ): GroupSummaryTotals {
    const totals = summaryData.reduce((acc, row) => {
      acc.totalWorks += row.qtdeWorks;
      acc.totalServiceMoProgByGrouping += row.totalServiceMoProg;
      acc.totalServiceMoPlanByGrouping += row.totalServiceMoPlan;
      acc.totalServiceMoPendByGrouping += row.totalServiceMoPend;
      acc.totalServiceMoExecByGrouping += row.totalServiceMoExec;
      acc.totalMaterialMoProgByGrouping += row.totalMaterialMoProg;
      acc.totalMaterialMoPlanByGrouping += row.totalMaterialMoPlan;
      acc.totalMaterialMoPendByGrouping += row.totalMaterialMoPend;
      acc.totalMaterialMoExecByGrouping += row.totalMaterialMoExec;

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
