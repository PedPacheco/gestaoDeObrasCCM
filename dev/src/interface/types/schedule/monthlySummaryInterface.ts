// ─── Enums ────────────────────────────────────────────────────────────────────

export enum MonthKey {
  JAN = 'jan',
  FEV = 'fev',
  MAR = 'mar',
  ABR = 'abr',
  MAI = 'mai',
  JUN = 'jun',
  JUL = 'jul',
  AGO = 'ago',
  SET = 'set',
  OUT = 'out',
  NOV = 'nov',
  DEZ = 'dez',
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const WORKING_DAYS_PER_MONTH = 22 as const;
export const FINANCIAL_OVERHEAD_FACTOR = 1.08 as const;

export const MONTH_INDEX_TO_KEY: Readonly<Record<number, MonthKey>> = {
  0: MonthKey.JAN,
  1: MonthKey.FEV,
  2: MonthKey.MAR,
  3: MonthKey.ABR,
  4: MonthKey.MAI,
  5: MonthKey.JUN,
  6: MonthKey.JUL,
  7: MonthKey.AGO,
  8: MonthKey.SET,
  9: MonthKey.OUT,
  10: MonthKey.NOV,
  11: MonthKey.DEZ,
};

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface MonthlyCapacityMetrics {
  readonly dailyFinancialGoal: number;
  readonly dailyFinancialGoalWithOverhead: number;
  readonly teamsTotal: number;
}

export interface WorkOrderMetrics {
  readonly moProg: number;
  readonly moExec: number;
}

export interface DailySummaryEntry {
  dataProg: string;
  totalQtde: number;
  teamsTotal: number;
  financialGoal: number;
  financialGoalWith8: number;
  diaryGoal: number;
  diaryGoalWith8: number;
  totalMoProg: number;
  totalMoExec: number;
  diff: number;
}

export interface GroupTeamSummaryEntry {
  grupo: string;
  turma: string;
  qtdeObras: number;
  _obrasContabilizadas: Set<string>;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  diff: number;
}

export interface GroupTeamSummaryEntryResponse {
  grupo: string;
  turma: string;
  qtdeObras: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  diff: number;
}
