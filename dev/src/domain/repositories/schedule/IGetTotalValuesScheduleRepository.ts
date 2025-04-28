import { GetTotalValuesScheduleDTO } from 'src/interface/dtos/scheduleDTO';

export interface IGetTotalScheduleValuesRepository {
  getTotalValues(filters: GetTotalValuesScheduleDTO): Promise<any>;
}

export const GET_TOTAL_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetTotalScheduleValuesRepository',
);
