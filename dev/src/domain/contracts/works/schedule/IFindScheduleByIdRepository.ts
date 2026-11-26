import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { Prisma } from 'src/infra/generated/prisma/client';

export interface IFindScheduleByIdRepository {
  findById(id: number, tx?: Prisma.TransactionClient): Promise<WorkSchedule>;
}

export const FIND_SCHEDULE_BY_ID_REPOSITORY = Symbol(
  'FindScheduleByIdRepository',
);
