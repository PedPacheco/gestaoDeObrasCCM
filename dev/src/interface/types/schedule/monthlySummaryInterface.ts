import { Partners, Types } from '../common/commonInterface';

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

export interface GetMonthlySummaryInterface {
  obras: {
    ovnota: string;
    ordem_dci: string;
    ordem_dca: string;
    ordem_dcd: string;
    ordem_dcim: string;
    mo_planejada: number | null;
    mo_pend: number | null;
    id_turma?: number;
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
