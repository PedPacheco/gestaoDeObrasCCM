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
  reascheduleServices(
    data: { id: number; id_servico: number }[],
    scheduleId: number,
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
}

export const WORK_SERVICES_REPOSITORY = Symbol('WorkServicesRepository');
