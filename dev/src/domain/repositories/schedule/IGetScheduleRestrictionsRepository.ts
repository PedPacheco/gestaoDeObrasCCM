import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

export interface IGetScheduleRestrictionsRepository {
  getRestrictions(
    filters: GetValueWeeklyScheduleDTO,
  ): Promise<GetScheduleRestrictions[]>;
}

export const GET_SCHEDULE_RESTRICTIONS_REPOSITORY = Symbol(
  'GetScheduleRestrictions',
);
