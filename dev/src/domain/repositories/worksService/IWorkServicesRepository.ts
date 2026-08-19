import { Prisma } from '@prisma/client';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

export interface SchedulesProgressUpdate {
  idProgramacao: number;
  prog: number;
  exec: number;
}

export interface ParsedSpreadsheetItem {
  point: string | null;
  operation: string | null;
  operationNumber: string | null;
  materialCode: string | null;
  plannedQuantity: number;
  type: 'service' | 'material';
  operationDescription: string | null;
}

export interface ImportServiceItem {
  idService: number;
  type: 'service' | 'material';
  operation?: string;
  point: string;
  operationNumber: string;
  operationDescription: string;
  plannedQuantity: number;
}

export interface IWorkServicesRepository {
  scheduleServices(
    data: ScheduleServicesDTO[],
    prog: number | { increment: number },
    idSchedule: number,
  ): Promise<void>;
  applyAdditional(
    data: ApplyAdditonalDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  cancelServices(id: number): Promise<void>;
  addItem(
    data: AddServicesDTO,
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
