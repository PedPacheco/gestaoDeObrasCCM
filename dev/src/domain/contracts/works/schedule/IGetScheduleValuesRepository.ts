import {
  GetScheduleFilters,
  GetScheduleValuesRepositoryResponse,
} from 'src/domain/types';

export interface IGetScheduleValuesRepository {
  getValues(
    filters: GetScheduleFilters,
  ): Promise<GetScheduleValuesRepositoryResponse>;
}

export const GET_SCHEDULE_VALUES_REPOSITORY = Symbol(
  'GetScheduleValuesRepository',
);
