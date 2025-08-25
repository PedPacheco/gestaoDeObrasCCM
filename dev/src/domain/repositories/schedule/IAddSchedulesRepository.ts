import { Prisma } from '@prisma/client';

export interface IAddSchedulesRepository {
  addSchedules(data: any, tx: Prisma.TransactionClient): Promise<any>;
}

export const ADD_SCHEDULES_REPOSITORY = Symbol('AddSchedulesRepository');
