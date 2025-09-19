export interface IGetServicesByWorkIdRepository {
  get(id: number): Promise<any>;
}

export const GET_SERVICES_BY_WORK_ID_REPOSITORY = Symbol(
  'GetServicesByWorkIdRepository',
);
