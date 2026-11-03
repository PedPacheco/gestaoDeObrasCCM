import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';
import { getALlWorksResponseRepository } from 'src/interface/types/works/getAllWorks';

export interface IGetAllWorksRepository {
  getAllWorks(filters: GetAllWorksDTO): Promise<getALlWorksResponseRepository>;
}

export const GET_ALL_WORKS_REPOSITORY = Symbol('GetAllWorksRepository');
