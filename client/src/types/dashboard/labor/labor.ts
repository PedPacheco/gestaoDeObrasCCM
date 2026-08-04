export interface DailySummaryItem {
  dataProg: string;
  qtdeSchedules: number;
  teamsTotal: number;
  totalMoPlan: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  totalWalletAvaliable: number;
  financialGoal: number;
}

export interface DailySummaryTotals {
  totalWorks: number;
  totalSchedules: number;
  totalTeams: number;
  totalQtdeRfpTeams: number;
  totalExecutionCapacityTeams: number;
  totalFinancialGoal: number;
  totalDiaryGoal: number;
  totalFinancialGoalWith8: number;
  totalDiaryGoalWith8: number;
  totalMoProg: number;
  totalMoExec: number;
  totalDiff: number;
}

export interface DailySummary {
  summary: DailySummaryItem[];
  totals: DailySummaryTotals;
  contractValueByMonth: { monthlyValue: number };
}

export interface GroupSummaryTotals {
  totalSchedules: number;
  totalMoPlanByGrouping: number;
  totalMoPendByGrouping: number;
  totalMoProgByGrouping: number;
  totalMoExecByGrouping: number;
  totalMoPrevByGrouping: number;
  totalWalletRda: number;
  totalProgRda: number;
  totalExecRda: number;
  totalWalletBt0: number;
  totalProgBt0: number;
  totalExecBt0: number;
  totalWalletRecom: number;
  totalProgRecom: number;
  totalExecRecom: number;
  totalWalletMarket: number;
  totalProgMarket: number;
  totalExecMarket: number;
  totalDiff: number;
  totalWallet: number;
}

export interface GroupSummaryItem {
  grupo: string;
  turma: string;
  qtdeSchedules: number;
  totalMoPlan: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
}

export interface GroupSummary {
  summary: GroupSummaryItem[];
  totals: GroupSummaryTotals;
}
