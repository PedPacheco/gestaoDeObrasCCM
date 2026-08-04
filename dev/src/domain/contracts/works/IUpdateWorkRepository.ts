import { Prisma } from '@prisma/client';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

export interface IUpdateWorkRepository {
  update(
    data: UpdateWorkDTO,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const UPDATE_WORK_REPOSITORY = Symbol('UpdateWorkRepository');
