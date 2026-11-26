import { RejectionOfSchedulesGetResponse } from 'src/domain/types';

export interface IRejectionOfSchedulesRepository {
  get(workId: number): Promise<RejectionOfSchedulesGetResponse[]>;
}

export const REJECTION_OF_SCHEDULES_REPOSITORY = Symbol(
  'RejectionsOfSchedulesRepository',
);
