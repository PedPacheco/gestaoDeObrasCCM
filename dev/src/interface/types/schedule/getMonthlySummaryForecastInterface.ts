import { Partners, Types } from '../common/commonInterface';

export interface GetMonthlySummaryForecastInterface {
  obras: {
    ovnota: string;
    ordem_dci: string;
    ordem_dca: string;
    ordem_dcd: string;
    ordem_dcim: string;
    capex_mat_plan: number;
    capex_mat_pend: number;
    capex_mo_plan: number;
    capex_mo_pend: number;
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

export interface MonthlyCapacityMetricsForecast {
  dailyFinancialGoal: number;
}

export interface WorkOrderMetricsForecast {
  serviceCapexProg: number;
  serviceCapexExec: number;
  materialCapexProg: number;
  materialCapexExec: number;
}

export interface DailySummaryEntryForecast {
  dataProg: string;
  qtdeWorks: number;
  teams: number;
  financialGoal: number;
  diaryGoal: number;
  serviceMoProg: number;
  serviceMoPlan: number;
  serviceMoPend: number;
  serviceMoExec: number;
  serviceMoForecast: number;
  materialMoProg: number;
  materialMoPlan: number;
  materialMoPend: number;
  materialMoExec: number;
  materialMoForecast: number;
  isMaterialPendLowerThanProg: boolean;
  isServicePendLowerThanProg: boolean;
  diff: number;
}

export interface DailySummaryTotals {
  totalQtdeObras: number;
  totalTeams: number;
  totalFinancialGoal: number;
  totalDiaryGoal: number;
  totalServiceMoProg: number;
  totalServiceMoPlan: number;
  totalServiceMoPend: number;
  totalServiceMoExec: number;
  totalServiceMoForecast: number;
  totalMaterialMoProg: number;
  totalMaterialMoPlan: number;
  totalMaterialMoPend: number;
  totalMaterialMoForecast: number;
  totalMaterialMoExec: number;
  totalDiff: number;
}

export interface GroupTeamSummaryEntryForecast {
  grupo: string;
  turma: string;
  qtdeWorks: number;
  totalServiceMoProg: number;
  totalServiceMoPlan: number;
  totalServiceMoPend: number;
  totalServiceMoPrev: number;
  totalServiceMoExec: number;
  totalMaterialMoProg: number;
  totalMaterialMoPlan: number;
  totalMaterialMoPend: number;
  totalMaterialMoPrev: number;
  totalMaterialMoExec: number;
  diff: number;
}

export interface GroupSummaryTotals {
  totalWorks: number;
  totalServiceMoProgByGrouping: number;
  totalServiceMoPlanByGrouping: number;
  totalServiceMoPendByGrouping: number;
  totalServiceMoExecByGrouping: number;
  totalMaterialMoProgByGrouping: number;
  totalMaterialMoPlanByGrouping: number;
  totalMaterialMoPendByGrouping: number;
  totalMaterialMoExecByGrouping: number;
  totalDiff: number;
}

export interface UniqueWorksFinancial {
  totalServiceMoPlan: number;
  totalMaterialMoPlan: number;
  totalServiceMoPend: number;
  totalMaterialMoPend: number;
}

export interface DailySummaryForecastResult {
  summary: DailySummaryEntryForecast[];
  totals: DailySummaryTotals;
}

export interface GroupSummaryForecastResult {
  summary: GroupTeamSummaryEntryForecast[];
  totals: GroupSummaryTotals;
}
