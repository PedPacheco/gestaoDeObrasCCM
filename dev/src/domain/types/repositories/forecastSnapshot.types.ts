type ForecastSnapshotDailyItem = {
  dataProg: string | Date;
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
  forecastTotal: number;
  execTotal: number;
  diff: number;
};

type ForecastSnapshotGroupItem = {
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
  totalForecast: number;
  totalExec: number;
  diff: number;
};

export type ForecastSnapshotFilters = {
  dataInicial: Date;
  dataFinal: Date;
};

export type ForecastDailyTotalsResponse = {
  totalDiff: number;
  totalExec: number;
  totalTeams: number;
  totalForecast: number;
  totalDiaryGoal: number;
  totalQtdeObras: number;
  totalFinancialGoal: number;
  totalServiceMoExec: number;
  totalServiceMoPend: number;
  totalServiceMoPlan: number;
  totalServiceMoProg: number;
  totalMaterialMoExec: number;
  totalMaterialMoPend: number;
  totalMaterialMoPlan: number;
  totalMaterialMoProg: number;
  totalServiceMoForecast: number;
  totalMaterialMoForecast: number;
};

export type ForecastGroupTotalsResponse = {
  totalDiff: number;
  totalWorks: number;
  totalServiceMoExecByGrouping: number;
  totalServiceMoPendByGrouping: number;
  totalServiceMoPlanByGrouping: number;
  totalServiceMoProgByGrouping: number;
  totalMaterialMoExecByGrouping: number;
  totalMaterialMoPendByGrouping: number;
  totalMaterialMoPlanByGrouping: number;
  totalMaterialMoProgByGrouping: number;
};

export type ForecastSnapshotDailyData = {
  totals: ForecastDailyTotalsResponse;
  summary: ForecastSnapshotDailyItem[];
};

export type ForecastSnapshotGroupData = {
  totals: ForecastGroupTotalsResponse;
  summary: ForecastSnapshotGroupItem[];
};

export type ForecastSnapshotGetResponse = {
  id: number;
  gerado_em: Date;
  filtros: ForecastSnapshotFilters;
  diario: ForecastSnapshotDailyData;
  grupo: ForecastSnapshotGroupData;
};

export type ForecastSnapshotGetAllResponse = {
  id: number;
  gerado_em: Date;
  filtros: ForecastSnapshotFilters;
};
