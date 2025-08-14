import { Prisma } from '@prisma/client';

export interface IStatusFlowRepository {
  updateStatusWorks(
    idStatus: number,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  updateScheduleStatus(
    idStatus: number,
    id: number,
    tx: Prisma.TransactionClient,
  );
}

export const STATUS_FLOW_REPOSITORY = Symbol('StatusFlowRepository');
