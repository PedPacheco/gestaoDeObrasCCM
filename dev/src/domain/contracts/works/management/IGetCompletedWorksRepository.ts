import { WorkFiltersInput } from 'src/application/types';
import { CompletedWorksRepositoryResponse } from 'src/domain/types';

export interface IGetCompletedWorksRepository {
  getCompletedWorks(
    filters: WorkFiltersInput,
  ): Promise<CompletedWorksRepositoryResponse>;
}

export const GET_COMPLETED_WORKS_REPOSITORY = Symbol(
  'GetCompletedWorksRepository',
);
