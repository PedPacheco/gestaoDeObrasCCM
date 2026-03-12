export interface MonthlyCapacityMetricsForecast {
  readonly dailyFinancialGoal: number;
}

export interface WorkOrderMetricsForecast {
  readonly serviceCapexProg: number;
  readonly serviceCapexExec: number;
  readonly materialCapexProg: number;
  readonly materialCapexExec: number;
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
  isServicePendLowerThanProg: boolean;
  isMaterialPendLowerThanProg: boolean;
  diff: number;
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
