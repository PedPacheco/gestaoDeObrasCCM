import { UpdateExecutionCapacityDTO } from './../../interface/dtos/executionCapacityDTO';
import { ExecutionCapacityFilter } from 'src/interface/types/executionCapacityInterface';

export interface IExecutionCapacityRepository {
  get(filters: ExecutionCapacityFilter): Promise<any>;
  getFinancialValue(
    year: string,
    turma?: number[],
    regional?: number[],
  ): Promise<any[]>;
  update(data: UpdateExecutionCapacityDTO[]): Promise<void>;
}

export const EXECUTION_CAPACITY_REPOSITORY = Symbol(
  'ExecutionCapacityRepository',
);
