import { GetValuesWeeklyScheduleResponseRepository } from 'src/interface/types/schedule/getValuesWeeklyScheduleInterface';
import { GetValueWeeklyScheduleDTO } from '../../../interface/dtos/scheduleDTO';

export interface IGetValuesWeeklyScheduleRepository {
  getValues(
    filters: GetValueWeeklyScheduleDTO,
  ): Promise<GetValuesWeeklyScheduleResponseRepository[]>;
}

export const GET_VALUES_WEEKLY_SCHEDULE_REPOSITORY = Symbol(
  'GetValuesWeeklyScheduleRepository',
);
