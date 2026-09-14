// ─── Enums ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

export const WORKING_DAYS_PER_MONTH = 22 as const;
export const FINANCIAL_OVERHEAD_FACTOR = 1.08 as const;
export const SUMMARY_DATE_FORMAT = 'DD/MM/YYYY' as const;

/**
 * Identificadores de grupo de tipo de obra (tipos.id_grupo).
 * Extraído para evitar números mágicos espalhados pelos serviços.
 */
export const GRUPO_ID = {
  MARKET: 1,
  RECOM: 2,
  RDA: 3,
  BT0: 4,
} as const;

export const MONTH_INDEX_TO_KEY: Readonly<Record<number, MonthKey>> = {
  0: 'jan',
  1: 'fev',
  2: 'mar',
  3: 'abr',
  4: 'mai',
  5: 'jun',
  6: 'jul',
  7: 'ago',
  8: 'set',
  9: 'out',
  10: 'nov',
  11: 'dez',
};

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface MonthlyCapacityMetrics {
  dailyFinancialGoal: number;
  dailyFinancialGoalWithOverhead: number;
  totalFinancial: number;
  totalFinancialWith8: number;
}

export interface WorkOrderMetrics {
  readonly moPlan: number;
  readonly moPend: number;
  readonly moProg: number;
  readonly moExec: number;
}

export interface DailySummaryEntry {
  dataProg: string;
  qtdeSchedules: number;
  teamsTotal: number;
  financialGoal: number;
  financialGoalWith8: number;
  diaryGoal: number;
  diaryGoalWith8: number;
  totalMoPlan: number;
  totalMoProg: number;
  totalMoExec: number;
  diff: number;
}

export interface GroupTeamSummaryEntry {
  grupo: string;
  turma: string;
  idTurma?: number;
  idGrupo?: number;
  qtdeSchedules: number;
  totalMoPlan: number;
  totalMoPend: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  diff: number;
}

/**
 * Valores financeiros de uma obra (mão de obra planejada/pendente),
 * já normalizados (sem null) para uso nos cálculos do domínio.
 */
export interface WorkFinancials {
  readonly moPlan: number;
  readonly moPend: number;
}

export interface DailySummaryTotals {
  totalWorks: number;
  totalSchedules: number;
  totalTeams: number;
  totalQtdeRfpTeams: number;
  totalExecutionCapacityTeams: number;
  totalFinancialGoalWith8: number;
  totalFinancialGoal: number;
  totalDiaryGoal: number;
  totalDiaryGoalWith8: number;
  totalMoProg: number;
  totalMoExec: number;
  totalDiff: number;
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

export interface DailySummaryResult {
  summary: DailySummaryEntry[];
  totals: DailySummaryTotals;
  contractValueByMonth: { monthlyValue: number };
}

export interface GroupSummaryResult {
  summary: GroupTeamSummaryEntry[];
  totals: GroupSummaryTotals;
}
