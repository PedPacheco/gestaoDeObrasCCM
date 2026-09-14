import { Prisma } from '@prisma/client';
import { UpdateWorkInput } from 'src/application/types';

export interface IUpdateWorkRepository {
  update(
    data: UpdateWorkInput,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const UPDATE_WORK_REPOSITORY = Symbol('UpdateWorkRepository');
