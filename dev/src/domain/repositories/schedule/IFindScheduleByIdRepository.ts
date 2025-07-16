export interface IFindScheduleByIdRepository {
  findById(id: number): Promise<any>;
}

export const FIND_SCHEDULE_BY_ID_REPOSITORY = Symbol(
  'FindScheduleByIdRepository',
);
