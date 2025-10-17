import { programacoes } from '@prisma/client';

export interface IFindScheduleByIdRepository {
  findById(id: number): Promise<programacoes>;
}

export const FIND_SCHEDULE_BY_ID_REPOSITORY = Symbol(
  'FindScheduleByIdRepository',
);
