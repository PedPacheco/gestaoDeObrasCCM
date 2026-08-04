import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponseRepository } from 'src/interface/types/schedule/getScheduleValuesInterface';

export interface IGetScheduleValuesRepository {
  getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponseRepository>;
}

export const GET_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetScheduleValuesRepository',
);
