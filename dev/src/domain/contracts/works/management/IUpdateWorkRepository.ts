import { UpdateWorkInput } from 'src/application/types';
import { Prisma } from 'src/infra/generated/prisma/client';

export interface IUpdateWorkRepository {
  update(
    data: UpdateWorkInput,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const UPDATE_WORK_REPOSITORY = Symbol('UpdateWorkRepository');
