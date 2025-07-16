export interface IAddSchedulesRepository {
  addSchedules(data: any): Promise<any>;
}

export const ADD_SCHEDULES_REPOSITORY = Symbol('AddSchedulesRepository');
