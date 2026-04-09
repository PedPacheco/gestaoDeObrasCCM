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
    executado: number;
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

export interface GetCapexPlanInterface {
  grupos: { grupo: string };
  regionais: { regional: string };
  ano_plano: number;
  valor_jan: number;
  valor_fev: number;
  valor_mar: number;
  valor_abr: number;
  valor_mai: number;
  valor_jun: number;
  valor_jul: number;
  valor_ago: number;
  valor_set: number;
  valor_out: number;
  valor_nov: number;
  valor_dez: number;
}

export interface MonthlyCapacityMetricsForecast {
  readonly dailyFinancialGoal: number;
  readonly totalFinancial: number;
}

export interface WorkOrderMetricsForecast {
  readonly serviceCapexProg: number;
  readonly serviceCapexExec: number;
  readonly serviceCapexForecast: number;
  readonly materialCapexProg: number;
  readonly materialCapexExec: number;
  readonly materialCapexForecast: number;
  readonly forecastTotal: number;
  readonly execTotal: number;
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
  forecastTotal: number;
  execTotal: number;
  isServicePendLowerThanProg: boolean;
  isMaterialPendLowerThanProg: boolean;
  diff: number;
}

export interface DailyForecastSummaryTotals {
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
  totalForecast: number;
  totalExec: number;
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
  totalServiceMoForecast: number;
  totalMaterialMoProg: number;
  totalMaterialMoPlan: number;
  totalMaterialMoPend: number;
  totalMaterialMoPrev: number;
  totalMaterialMoExec: number;
  totalMaterialMoForecast: number;
  forecastTotal: number;
  execTotal: number;
  diff: number;
}

export interface GroupForecastSummaryTotals {
  totalWorks: number;
  totalServiceMoProgByGrouping: number;
  totalServiceMoPlanByGrouping: number;
  totalServiceMoPendByGrouping: number;
  totalServiceMoExecByGrouping: number;
  totalServiceMoForecastByGrouping: number;
  totalMaterialMoProgByGrouping: number;
  totalMaterialMoPlanByGrouping: number;
  totalMaterialMoPendByGrouping: number;
  totalMaterialMoExecByGrouping: number;
  totalMaterialMoForecastByGrouping: number;
  totalForecast: number;
  totalExec: number;
  totalDiff: number;
}

export interface UniqueWorksFinancialForecast {
  totalServiceMoPlan: number;
  totalMaterialMoPlan: number;
  totalServiceMoPend: number;
  totalMaterialMoPend: number;
}

export interface WorkItemFinancialsForecast {
  servicePlan: number;
  servicePend: number;
  materialPlan: number;
  materialPend: number;
}

export interface DailySummaryForecastResult {
  summary: DailySummaryEntryForecast[];
  totals: DailyForecastSummaryTotals;
}

export interface GroupSummaryForecastResult {
  summary: GroupTeamSummaryEntryForecast[];
  totals: GroupForecastSummaryTotals;
}
