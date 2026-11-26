import { WorkDetailsRepositoryResponse } from 'src/domain/types';

export interface IGetWorksDetailsRepository {
  get(id: number): Promise<WorkDetailsRepositoryResponse>;
}

export const GET_WORKS_DETAILS_REPOSITORY = Symbol('GetWorksDetailsRepository');
