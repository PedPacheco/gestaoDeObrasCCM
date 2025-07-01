import { Prisma } from '@prisma/client';

export interface IUpdateSchedulesRepository {
  update(data: any, tx: Prisma.TransactionClient): Promise<void>;
}

export const UPDATE_SCHEDULES_REPOSITORY = Symbol('UpdateSchedulesRepository');
