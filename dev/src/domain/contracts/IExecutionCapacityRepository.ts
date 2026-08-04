import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from '../../interface/dtos/executionCapacityDTO';
import { GetFinancialValuesResponse, GetResponse } from '../types';

export interface IExecutionCapacityRepository {
  get(filters: ExecutionCapacityDTO): Promise<GetResponse[]>;
  getFinancialValue(
    filters: ExecutionCapacityDTO,
  ): Promise<GetFinancialValuesResponse[]>;
  update(data: UpdateExecutionCapacityDTO[]): Promise<void>;
}

export const EXECUTION_CAPACITY_REPOSITORY = Symbol(
  'ExecutionCapacityRepository',
);
