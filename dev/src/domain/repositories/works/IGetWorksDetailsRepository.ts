export interface IGetWorksDetailsRepository {
  get(id: number): Promise<any>;
}

export const GET_WORKS_DETAILS_REPOSITORY = Symbol('GetWorksDetailsRepository');
