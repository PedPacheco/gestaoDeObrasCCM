import { Prisma, programacoes } from 'src/infra/generated/prisma/client';

export interface IFindScheduleByIdRepository {
  findById(id: number, tx?: Prisma.TransactionClient): Promise<programacoes>;
}

export const FIND_SCHEDULE_BY_ID_REPOSITORY = Symbol(
  'FindScheduleByIdRepository',
);
