import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';

export interface IGetAllWorksRepository {
  getAllWorks(filters: GetAllWorksDTO): Promise<any>;
}

export const GET_ALL_WORKS_REPOSITORY = Symbol('GetAllWorksRepository');
