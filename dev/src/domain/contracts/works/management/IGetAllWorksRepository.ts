import { GetAllWorksInput } from 'src/application/types';
import { GetAllWorksRepositoryResponse } from 'src/domain/types';

export interface IGetAllWorksRepository {
  getAllWorks(
    filters: GetAllWorksInput,
  ): Promise<GetAllWorksRepositoryResponse>;
}

export const GET_ALL_WORKS_REPOSITORY = Symbol('GetAllWorksRepository');
