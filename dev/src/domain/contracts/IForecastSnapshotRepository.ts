import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';
import {
  ForecastSnapshotGetAllResponse,
  ForecastSnapshotGetResponse,
} from '../types';

export interface IForecastSnapshotRepository {
  create(data: CreateForecastSnapshotDTO): Promise<void>;
  delete(id: number): Promise<void>;
  get(id: number): Promise<ForecastSnapshotGetResponse>;
  getAll(params: {
    gerado_em?: { lte: Date; gte: Date };
  }): Promise<ForecastSnapshotGetAllResponse[]>;
}

export const FORECAST_SNAPSHOT = Symbol('ForecastSnapshotRepository');
