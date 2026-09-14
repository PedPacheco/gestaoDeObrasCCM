import { Prisma } from '@prisma/client';
import {
  FinalizeServicesData,
  PerformServicesInput,
} from 'src/application/types';

export interface IWorkServicesExecutionRepository {
  finalizeServices(
    data: FinalizeServicesData,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  reascheduleServices(
    data: { id: number; id_servico: number }[],
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  performServices(data: PerformServicesInput[]): Promise<void>;
}

export const WORK_SERVICES_EXECUTION_REPOSITORY = Symbol(
  'WorkServicesExecutionRepository',
);
