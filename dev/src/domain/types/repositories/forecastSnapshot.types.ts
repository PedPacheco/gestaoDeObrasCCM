export type ForecastSnapshotDailyItem = {
  dataProg: string | Date;
  qtdeWorks: number | bigint;
  teams: number | bigint;
  financialGoal: number | bigint;
  diaryGoal: number | bigint;
  serviceMoProg: number | bigint;
  serviceMoPlan: number | bigint;
  serviceMoPend: number | bigint;
  serviceMoExec: number | bigint;
  serviceMoForecast: number | bigint;
  materialMoProg: number | bigint;
  materialMoPlan: number | bigint;
  materialMoPend: number | bigint;
  materialMoExec: number | bigint;
  materialMoForecast: number | bigint;
  isServicePendLowerThanProg: boolean;
  isMaterialPendLowerThanProg: boolean;
  forecastTotal: number | bigint;
  execTotal: number | bigint;
  diff: number | bigint;
};

export type ForecastSnapshotGroupItem = {
  grupo: string;
  turma: string;
  qtdeWorks: number | bigint;
  totalServiceMoProg: number | bigint;
  totalServiceMoPlan: number | bigint;
  totalServiceMoPend: number | bigint;
  totalServiceMoPrev: number | bigint;
  totalServiceMoExec: number | bigint;
  totalMaterialMoProg: number | bigint;
  totalMaterialMoPlan: number | bigint;
  totalMaterialMoPend: number | bigint;
  totalMaterialMoPrev: number | bigint;
  totalMaterialMoExec: number | bigint;
  totalForecast: number | bigint;
  totalExec: number | bigint;
  diff: number | bigint;
};

export type ForecastSnapshotFilters = {
  dataInicial: Date;
  dataFinal: Date;
};

export type ForecastSnapshotGetResponse = {
  id: number;
  gerado_em: Date;
  filtros: ForecastSnapshotFilters;
  diario: { totals: number; summary: ForecastSnapshotDailyItem[] };
  grupo: { totals: number; summary: ForecastSnapshotGroupItem[] };
};

export type ForecastSnapshotGetAllResponse = {
  id: number;
  gerado_em: Date;
  filtros: ForecastSnapshotFilters;
};
