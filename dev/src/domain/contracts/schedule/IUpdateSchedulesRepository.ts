import {
  ScheduleExecutionData,
  UpdateScheduleRepositoryInput,
} from 'src/domain/types';

import { Prisma } from '@prisma/client';

export interface IUpdateSchedulesRepository {
  update(
    data: UpdateScheduleRepositoryInput,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findExecutionOfSchedules(
    id: number,
    idWork: number,
  ): Promise<ScheduleExecutionData[]>;
}

export const UPDATE_SCHEDULES_REPOSITORY = Symbol('UpdateSchedulesRepository');
