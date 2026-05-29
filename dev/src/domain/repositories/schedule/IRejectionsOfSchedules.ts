export interface IRejectionOfSchedulesRepository {
  get(idWork: number): Promise<any[]>;
}

export const REJECTION_OF_SCHEDULES_REPOSITORY = Symbol(
  'RejectionsOfSchedulesRepository',
);
