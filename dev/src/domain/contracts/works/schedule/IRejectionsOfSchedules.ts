import { RejectionOfSchedulesGetResponse } from 'src/domain/types';

export interface IRejectionOfSchedulesRepository {
  get(idWork: number): Promise<RejectionOfSchedulesGetResponse[]>;
}

export const REJECTION_OF_SCHEDULES_REPOSITORY = Symbol(
  'RejectionsOfSchedulesRepository',
);
