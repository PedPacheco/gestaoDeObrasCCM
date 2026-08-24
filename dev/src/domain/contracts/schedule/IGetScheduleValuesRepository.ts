import { GetScheduleValuesRepositoryResponse } from 'src/domain/types';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';

export interface IGetScheduleValuesRepository {
  getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesRepositoryResponse>;
}

export const GET_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetScheduleValuesRepository',
);
