import { Partners, Types } from '../common/commonInterface';

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

export const WORKING_DAYS_PER_MONTH = 24 as const;
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
  // readonly totalFinancial: number;
  // readonly totalFinancialWith8: number;
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
  qtdeWorks: number;
  totalMoProg: number;
  totalMoExec: number;
  totalMoPrev: number;
  diff: number;
}

export interface GetMonthlySummaryInterface {
  obras: {
    ovnota: string;
    ordem_dci: string;
    ordem_dca: string;
    ordem_dcd: string;
    ordem_dcim: string;
    mo_planejada: number | null;
    turmas: Partners;
    tipos: Types;
  };
  prog: number;
  exec: number;
  data_prog: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
}

export interface DailySummaryTotals {
  totalQtdeObras: number;
  totalTeams: number;
  totalFinancialGoal: number;
  totalDiaryGoal: number;
  totalFinancialGoalWith8: number;
  totalDiaryGoalWith8: number;
  totalMoProg: number;
  totalMoExec: number;
  totalDiff: number;
}

export interface GroupSummaryTotals {
  totalWorks: number;
  totalMoProgByGrouping: number;
  totalMoExecByGrouping: number;
  totalMoPrevByGrouping: number;
  totalDiff: number;
}

export interface DailySummaryResult {
  summary: DailySummaryEntry[];
  totals: DailySummaryTotals;
}

export interface GroupSummaryResult {
  summary: GroupTeamSummaryEntry[];
  totals: GroupSummaryTotals;
}
