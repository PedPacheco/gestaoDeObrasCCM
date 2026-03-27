import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';

export interface IForecastSnapshotRepository {
  create(data: CreateForecastSnapshotDTO): Promise<void>;
  get(id: number): Promise<any>;
  getAll(): Promise<any>;
}

export const FORECAST_SNAPSHOT = Symbol('ForecastSnapshotRepository');
