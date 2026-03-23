import {
  CreateForecastSnapshotDTO,
  GetForecastSnapshotDTO,
} from 'src/interface/dtos/forecastSnapshotDTO';

export interface IForecastSnapshotRepository {
  create(data: CreateForecastSnapshotDTO): Promise<void>;
  get(params: GetForecastSnapshotDTO): Promise<any>;
}

export const FORECAST_SNAPSHOT = Symbol('ForecastSnapshotRepository');
