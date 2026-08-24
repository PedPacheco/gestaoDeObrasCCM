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
