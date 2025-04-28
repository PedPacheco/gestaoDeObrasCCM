import { GetWorksDTO } from 'src/interface/dtos/worksDto';

export interface IGetCompletedWorksRepository {
  getCompletedWorks(filters: GetWorksDTO): Promise<any>;
}

export const GET_COMPLETED_WORKS_REPOSITORY = Symbol(
  'GetCompletedWorksRepository',
);
