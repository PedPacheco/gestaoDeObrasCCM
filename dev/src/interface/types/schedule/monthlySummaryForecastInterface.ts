export interface MonthlyCapacityMetricsForecast {
  readonly dailyFinancialGoal: number;
  readonly teamsTotal: number;
}

export interface WorkOrderMetricsForecast {
  readonly serviceCapexProg: number;
  readonly serviceCapexExec: number;
  readonly materialCapexProg: number;
  readonly materialCapexExec: number;
}

export interface DailySummaryEntryForecast {
  dataProg: string;
  totalQtde: number;
  teamsTotal: number;
  financialGoal: number;
  diaryGoal: number;
  serviceMoProg: number;
  serviceMoPlan: number;
  serviceMoPend: number;
  serviceMoExec: number;
  materialMoProg: number;
  materialMoPlan: number;
  materialMoPend: number;
  materialMoExec: number;
  diff: number;
}

export interface GroupTeamSummaryEntryForecast {
  grupo: string;
  turma: string;
  qtdeObras: number;
  _obrasContabilizadas: Set<string>;
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
