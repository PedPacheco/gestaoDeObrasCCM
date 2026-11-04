import { GetTotalValuesSchedulesInput } from 'src/application/types';
import { GetTotalValuesScheduleResponse } from 'src/domain/types/repositories/schedule/getTotalValuesSchedule.types';

export interface IGetTotalScheduleValuesRepository {
  getTotalValues(
    filters: GetTotalValuesSchedulesInput,
  ): Promise<GetTotalValuesScheduleResponse[]>;
}

export const GET_TOTAL_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetTotalScheduleValuesRepository',
);
