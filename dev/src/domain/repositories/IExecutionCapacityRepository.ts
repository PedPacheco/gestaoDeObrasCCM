import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from './../../interface/dtos/executionCapacityDTO';

export interface IExecutionCapacityRepository {
  get(filters: ExecutionCapacityDTO): Promise<any>;
  getFinancialValue(filters: ExecutionCapacityDTO): Promise<any[]>;
  update(data: UpdateExecutionCapacityDTO[]): Promise<void>;
}

export const EXECUTION_CAPACITY_REPOSITORY = Symbol(
  'ExecutionCapacityRepository',
);
