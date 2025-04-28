import { GetPendingScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetPendingScheduleValuesResponse } from 'src/interface/types/schedule/getPendingScheduleValuesInterface';

export interface IGetPendingScheduleValuesRepository {
  getValues(
    filters: GetPendingScheduleValuesDTO,
  ): Promise<GetPendingScheduleValuesResponse>;
}

export const GET_PENDING_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetPendingScheduleValuesRepository',
);
