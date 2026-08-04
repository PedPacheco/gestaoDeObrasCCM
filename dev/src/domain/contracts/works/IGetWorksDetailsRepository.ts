import { GetWorksDetailsResponse } from 'src/interface/types/works/getWorksDetailsInterface';

export interface IGetWorksDetailsRepository {
  get(id: number): Promise<GetWorksDetailsResponse>;
}

export const GET_WORKS_DETAILS_REPOSITORY = Symbol('GetWorksDetailsRepository');
