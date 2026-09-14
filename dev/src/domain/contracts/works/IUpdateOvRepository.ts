import { MarketWork } from 'src/domain/entities/works.entity';

export interface IUpdateOvRepository {
  update(data: Partial<MarketWork>[]): Promise<void>;
}

export const UPDATE_OV_REPOSITORY = Symbol('UpdateOvRepository');
