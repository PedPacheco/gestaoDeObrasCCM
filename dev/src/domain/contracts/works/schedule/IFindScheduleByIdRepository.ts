import { ScheduleState } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';

export interface IFindScheduleByIdRepository {
  findById(id: number, tx?: Prisma.TransactionClient): Promise<ScheduleState>;
}

export const FIND_SCHEDULE_BY_ID_REPOSITORY = Symbol(
  'FindScheduleByIdRepository',
);
