export interface IDeleteSchedulesRepository {
  delete(id: number): Promise<void>;
}

export const DELETE_SCHEDULES_REPOSITORY = Symbol('DeleteSchedulesRepository');
