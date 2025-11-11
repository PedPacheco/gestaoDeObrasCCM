import { Prisma } from '@prisma/client';

export interface returnExecution {
  exec: number;
  prog: number;
}

export interface IUpdateSchedulesRepository {
  update(data: any, tx: Prisma.TransactionClient): Promise<void>;
  findExecutionOfSchedules(
    id: number,
    idWork: number,
  ): Promise<returnExecution[]>;
}

export const UPDATE_SCHEDULES_REPOSITORY = Symbol('UpdateSchedulesRepository');
