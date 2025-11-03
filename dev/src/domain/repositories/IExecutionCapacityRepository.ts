import { ExecutionCapacityFilter } from 'src/interface/types/executionCapacityInterface';

export interface IExecutionCapacityRepository {
  get(filters: ExecutionCapacityFilter): Promise<any>;
}

export const EXECUTION_CAPACITY_REPOSITORY = Symbol(
  'ExecutionCapacityRepository',
);
