import { Prisma } from '@prisma/client';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';

export interface IWorkServicesExecutionRepository {
  finalizeServices(
    data: any,
    pendingExecServicesData: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  reascheduleServices(
    data: { id: number; id_servico: number }[],
    scheduleId: number,
  ): Promise<void>;
  performServices(data: PerformServicesDTO[]): Promise<void>;
}

export const WORK_SERVICES_EXECUTION_REPOSITORY = Symbol(
  'WorkServicesExecutionRepository',
);
