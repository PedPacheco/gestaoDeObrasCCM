import {
  AddServiceInput,
  ApplyAdditionalInput,
  ScheduleServicesInput,
} from 'src/application/types';
import { ImportServiceItem, SchedulesProgressUpdate } from 'src/domain/types';

import { Prisma } from '@prisma/client';

export interface IWorkServicesRepository {
  scheduleServices(
    data: ScheduleServicesInput[],
    prog: number | { increment: number },
    idSchedule: number,
    idStatusSchedule?: number,
  ): Promise<void>;
  applyAdditional(
    data: ApplyAdditionalInput[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  cancelServices(id: number): Promise<void>;
  addItem(
    data: AddServiceInput,
    type: 'service' | 'material',
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  updateSchedulesProgress(
    data: SchedulesProgressUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  updateWorkExecuted(
    workId: number,
    executed: number | null,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  delete(id: number, tx: Prisma.TransactionClient): Promise<void>;
  deleteAll(workId: number): Promise<void>;
  bulkImportItems(
    workId: number,
    items: ImportServiceItem[],
    tx: Prisma.TransactionClient,
  );
}

export const WORK_SERVICES_REPOSITORY = Symbol('WorkServicesRepository');
