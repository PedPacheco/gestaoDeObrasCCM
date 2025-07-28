import { Prisma } from '@prisma/client';

export interface IUpdateSchedulesRepository {
  update(data: any, tx: Prisma.TransactionClient): Promise<void>;
  findExecutionOfSchedules(id: number, idWork: number): Promise<number[]>;
}

export const UPDATE_SCHEDULES_REPOSITORY = Symbol('UpdateSchedulesRepository');
