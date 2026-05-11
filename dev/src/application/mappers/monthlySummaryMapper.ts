import {
  DailySummaryEntry,
  DailySummaryTotals,
  GroupSummaryTotals,
  GroupTeamSummaryEntry,
  MonthlyCapacityMetrics,
  WorkOrderMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

import { Injectable } from '@nestjs/common';

@Injectable()
export class MonthlySummaryMapper {
  createDailySummaryEntry(
    formattedDate: string,
    metrics: MonthlyCapacityMetrics,
    teamsTotal: number,
  ): DailySummaryEntry {
    return {
      dataProg: formattedDate,
      totalQtde: 0,
      teamsTotal,
      financialGoal: metrics.dailyFinancialGoal,
      diaryGoal: 0,
      financialGoalWith8: metrics.dailyFinancialGoalWithOverhead,
      diaryGoalWith8: 0,
      totalMoPlan: 0,
      totalMoProg: 0,
      totalMoExec: 0,
      diff: 0,
    };
  }

  accumulateDailySummaryEntry(
    entry: DailySummaryEntry,
    workOrderMetrics: WorkOrderMetrics,
    goalContribution: number,
    goalWith8Contribution: number,
  ): void {
    const { moProg, moExec, moPlan } = workOrderMetrics;

    entry.totalQtde++;

    entry.totalMoPlan += moPlan;
    entry.totalMoProg += moProg;
    entry.totalMoExec += moExec;
    entry.diaryGoal += goalContribution;
    entry.diaryGoalWith8 += goalWith8Contribution;
  }

  createGroupTeamEntry(
    grupo: string,
    turma: string,
    idTurma?: number,
    idGrupo?: number,
  ): GroupTeamSummaryEntry {
    return {
      grupo,
      turma,
      idTurma,
      idGrupo,
      qtdeWorks: 0,
      totalMoPlan: 0,
      totalMoPend: 0,
      totalMoProg: 0,
      totalMoExec: 0,
      totalMoPrev: 0,
      diff: 0,
    };
  }

  accumulateGroupTeamEntry(
    entry: GroupTeamSummaryEntry,
    workOrderMetrics: WorkOrderMetrics,
    moPrev: number,
    workExists: boolean,
  ): void {
    const { moProg, moExec, moPlan, moPend } = workOrderMetrics;

    entry.qtdeWorks++;

    if (!workExists) {
      entry.totalMoPlan += moPlan;
      entry.totalMoPend += moPend;
    }

    entry.totalMoProg += moProg;
    entry.totalMoExec += moExec;
    entry.totalMoPrev += moPrev;
  }
}

export type DailySummaryTotalsShape = ReturnType<typeof createInitialTotals>;
export type GroupSummaryTotalsShape = ReturnType<
  typeof createInitialTotalsByGrouping
>;

export function createInitialTotals(): DailySummaryTotals {
  return {
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
  };
}

export function createInitialTotalsByGrouping(): GroupSummaryTotals {
  return {
    totalWorks: 0,
    totalMoPlanByGrouping: 0,
    totalMoPendByGrouping: 0,
    totalMoProgByGrouping: 0,
    totalMoExecByGrouping: 0,
    totalMoPrevByGrouping: 0,
    totalDiff: 0,
  };
}

export function createUniqueWorksFinancial(): {
  totalMoPlan: number;
  totalMoPend: number;
} {
  return {
    totalMoPlan: 0,
    totalMoPend: 0,
  };
}
