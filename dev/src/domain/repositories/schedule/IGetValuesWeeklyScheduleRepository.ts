import { GetValueWeeklyScheduleDTO } from '../../../interface/dtos/scheduleDTO';

export interface IGetValuesWeeklyScheduleRepository {
  getValues(filters: GetValueWeeklyScheduleDTO): Promise<any>;
}

export const GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY = Symbol(
  'GetValuesWeeklyScheduleRepository',
);
