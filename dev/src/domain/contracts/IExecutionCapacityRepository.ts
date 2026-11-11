import {
  ExecutionCapacityInput,
  UpdateExecutionCapacityInput,
} from 'src/application/types';
import { GetFinancialValuesResponse, GetResponse } from '../types';

export interface IExecutionCapacityRepository {
  get(filters: ExecutionCapacityInput): Promise<GetResponse[]>;
  getFinancialValue(
    filters: ExecutionCapacityInput,
  ): Promise<GetFinancialValuesResponse[]>;
  update(data: UpdateExecutionCapacityInput[]): Promise<void>;
}

export const EXECUTION_CAPACITY_REPOSITORY = Symbol(
  'ExecutionCapacityRepository',
);
