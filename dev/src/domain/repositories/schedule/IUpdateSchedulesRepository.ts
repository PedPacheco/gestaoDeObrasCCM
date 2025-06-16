export interface IUpdateSchedulesRepository {
  update(data: any): Promise<void>;
}

export const UPDATE_SCHEDULES_REPOSITORY = Symbol('UpdateSchedulesRepository');
