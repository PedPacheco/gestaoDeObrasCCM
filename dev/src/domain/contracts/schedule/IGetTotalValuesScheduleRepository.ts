import { GetTotalValuesScheduleDTO } from 'src/interface/dtos/scheduleDTO';
import { GetTotalValuesScheduleResponse } from 'src/interface/types/schedule/getTotalValuesScheduleInterface';

export interface IGetTotalScheduleValuesRepository {
  getTotalValues(
    filters: GetTotalValuesScheduleDTO,
  ): Promise<GetTotalValuesScheduleResponse[]>;
}

export const GET_TOTAL_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetTotalScheduleValuesRepository',
);
