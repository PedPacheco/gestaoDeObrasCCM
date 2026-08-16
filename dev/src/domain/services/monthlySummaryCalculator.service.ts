import {
  createInitialTotals,
  createInitialTotalsByGrouping,
} from 'src/application/mappers/monthlySummaryMapper';
import {
  DailySummaryEntry,
  DailySummaryTotals,
  FINANCIAL_OVERHEAD_FACTOR,
  GroupSummaryTotals,
  GroupTeamSummaryEntry,
  MONTH_INDEX_TO_KEY,
  MonthlyCapacityMetrics,
  WORKING_DAYS_PER_MONTH,
  WorkOrderMetrics,
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

export interface IMonthlySummaryCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<any>,
    monthIndex: number,
  ): MonthlyCapacityMetrics;

  calculateWorkOrderMetrics(
    moPlan: number,
    moPend: number,
    prog: number,
    exec: number,
  ): WorkOrderMetrics;

  calculateGoalPercentage(value: number, goal: number): number;

  calculateMoPrev(
    baseMoPlan: number,
    exec: number | null,
    prog: number,
  ): { moPrev: number };

  calculateExecutionRate(moProg: number, moExec: number): number;

  aggregateDailySummaryTotals(
    data: DailySummaryEntry[],
    total: {
      totalFinancialGoal: number;
      totalFinancialGoalWith8: number;
    },
    portofolioData: { portfolioSap: number; portfolioExec: number },
    executionTeams: {
      rfpTeams: number | null;
      executionCapacityTeams: number | null;
    },
  ): DailySummaryTotals;

  aggregateGroupTotals(
    summaryData: GroupTeamSummaryEntry[],
    portfolioData: {
      portfolioRda: number;
      portfolioBt0: number;
      portfolioRecom: number;
      portfolioMarket: number;
    },
    totalPlan: { totalMoPlan: number; totalMoPend: number },
  ): GroupSummaryTotals;
}

export const MONTHLY_SUMMARY_CALCULATOR = 'MONTHLY_SUMMARY_CALCULATOR';

@Injectable()
export class MonthlySummaryCalculator implements IMonthlySummaryCalculator {
  aggregateFinancialCapacityByMonth(
    executionCapacity: ReadonlyArray<any>,
    monthIndex: number,
  ): MonthlyCapacityMetrics {
    const monthKey: MonthKey = MONTH_INDEX_TO_KEY[monthIndex];

    let totalFinancial = 0;

    for (const entry of executionCapacity) {
      const teams = Number(entry[monthKey] ?? 0);
      const shouldCost = Number(entry.should_cost ?? 0);

      totalFinancial += teams * shouldCost;
    }

    const dailyFinancialGoal = totalFinancial / WORKING_DAYS_PER_MONTH;
    const dailyFinancialGoalWithOverhead =
      dailyFinancialGoal > 0
        ? dailyFinancialGoal * FINANCIAL_OVERHEAD_FACTOR
        : 0;

    return {
      dailyFinancialGoal,
      dailyFinancialGoalWithOverhead,
      totalFinancial,
      totalFinancialWith8: totalFinancial * 1.085,
    };
  }

  calculateWorkOrderMetrics(
    moPlan: number,
    moPend: number,
    prog: number,
    exec: number,
  ): WorkOrderMetrics {
    const progRate = prog / 100;
    const execRate = exec / 100;

    return {
      moPlan,
      moPend,
      moProg: moPlan * progRate,
      moExec: moPlan * execRate,
    };
  }

  calculateGoalPercentage(value: number, goal: number): number {
    return goal > 0 ? (value / goal) * 100 : 0;
  }

  calculateMoPrev(
    baseMoPlan: number,
    exec: number | null,
    prog: number,
  ): { moPrev: number } {
    const effectiveRate = (exec ?? prog) / 100;

    return {
      moPrev: baseMoPlan * effectiveRate,
    };
  }

  calculateExecutionRate(moProg: number, moExec: number): number {
    if (!moProg) return 0;

    return (moExec / moProg) * 100;
  }

  aggregateDailySummaryTotals(
    data: DailySummaryEntry[],
    total: {
      totalFinancialGoal: number;
      totalFinancialGoalWith8: number;
    },
    portofolioData: {
      qtdeWorks: number;
      portfolioSap: number;
      portfolioExec: number;
    },
    executionTeams: {
      rfpTeams: number | null;
      executionCapacityTeams: number | null;
    },
  ): DailySummaryTotals {
    const totals = data.reduce((acc, row) => {
      acc.totalSchedules += row.qtdeSchedules;
      acc.totalTeams += row.teamsTotal;

      acc.totalMoProg += row.totalMoProg;
      acc.totalMoExec += row.totalMoExec;

      return acc;
    }, createInitialTotals());

    totals.totalFinancialGoal = total.totalFinancialGoal;
    totals.totalFinancialGoalWith8 = total.totalFinancialGoalWith8;

    totals.totalDiaryGoal += this.calculateExecutionRate(
      total.totalFinancialGoal,
      totals.totalMoProg,
    );
    totals.totalDiaryGoalWith8 += this.calculateExecutionRate(
      total.totalFinancialGoalWith8,
      totals.totalMoProg,
    );

    totals.totalDiff = this.calculateExecutionRate(
      totals.totalMoProg,
      totals.totalMoExec,
    );

    totals.totalWorks = portofolioData.qtdeWorks;

    totals.totalQtdeRfpTeams = executionTeams.rfpTeams;
    totals.totalExecutionCapacityTeams = executionTeams.executionCapacityTeams;

    return totals;
  }

  aggregateGroupTotals(
    summaryData: GroupTeamSummaryEntry[],
    portfolioData: {
      portfolioRda: number;
      portfolioBt0: number;
      portfolioRecom: number;
      portfolioMarket: number;
      portfolioTotal: number;
    },
    uniqueWorksFinancial: { totalMoPlan: number; totalMoPend: number },
  ): GroupSummaryTotals {
    const { totalMoPend, totalMoPlan } = uniqueWorksFinancial;

    const totals = summaryData.reduce((acc, row) => {
      acc.totalSchedules += row.qtdeSchedules;
      acc.totalMoProgByGrouping += row.totalMoProg;
      acc.totalMoExecByGrouping += row.totalMoExec;
      acc.totalMoPrevByGrouping += row.totalMoPrev;

      if (row.idGrupo === 1) {
        acc.totalProgMarket += row.totalMoProg;
        acc.totalExecMarket += row.totalMoExec;
      }

      if (row.idGrupo === 2) {
        acc.totalProgRecom += row.totalMoProg;
        acc.totalExecRecom += row.totalMoExec;
      }

      if (row.idGrupo === 3) {
        acc.totalProgRda += row.totalMoProg;
        acc.totalExecRda += row.totalMoExec;
      }

      if (row.idGrupo === 4) {
        acc.totalProgBt0 += row.totalMoProg;
        acc.totalExecBt0 += row.totalMoExec;
      }

      return acc;
    }, createInitialTotalsByGrouping());

    totals.totalWalletBt0 = portfolioData.portfolioBt0;
    totals.totalWalletMarket = portfolioData.portfolioMarket;
    totals.totalWalletRecom = portfolioData.portfolioRecom;
    totals.totalWalletRda = portfolioData.portfolioRda;

    totals.totalWallet = portfolioData.portfolioTotal;

    totals.totalMoPlanByGrouping = totalMoPlan;
    totals.totalMoPendByGrouping = totalMoPend;

    totals.totalDiff = this.calculateExecutionRate(
      totals.totalMoProgByGrouping,
      totals.totalMoExecByGrouping,
    );

    return totals;
  }
}
