import {
  ForecastDailyTotalsResponse,
  ForecastGroupTotalsResponse,
  ForecastSnapshotDailyData,
  ForecastSnapshotFilters,
  ForecastSnapshotGroupData,
} from 'src/domain/types';

type FormattedForecastSnapshotDailyItem = {
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

export type FormattedForecastSnapshotDaily = {
  totals: ForecastDailyTotalsResponse;
  summary: FormattedForecastSnapshotDailyItem[];
};

export type FormattedForecastSnapshotGroupItem = {
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

export type FormattedForecastSnapshotGroup = {
  totals: ForecastGroupTotalsResponse;
  summary: FormattedForecastSnapshotGroupItem[];
};

export type GetForecastSnapshotOutput = {
  id: number;
  geradoEm: Date;
  nomeArquivo: string;
  diario: FormattedForecastSnapshotDaily;
  grupo: FormattedForecastSnapshotGroup;
};

export type GetAllForecastSnapshotsOutput = {
  id: number;
  nomeArquivo: string;
  filtros: ForecastSnapshotFilters;
};

export type CreateForecastSnapshotInput = {
  diario: ForecastSnapshotDailyData;
  grupo: ForecastSnapshotGroupData;
  filtros?: ForecastSnapshotFilters;
};
