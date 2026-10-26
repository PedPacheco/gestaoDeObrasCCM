import { ScheduleExecutionRow } from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';

export interface FinalizationData {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec: number;
  idExecutionRestriction: number;
  responsibility: string;
  executionObservation: string;
  userId: number;
}

export interface ExecutionTarget {
  id: number;
  status: string | null;
  programacoes: { id_status_programacao: number | null };
}

export interface IWorkServicesExecutionRepository {
  // Finalização
  finalizeServices(
    data: FinalizationData,
    tx: Prisma.TransactionClient,
  ): Promise<boolean>;

  // Reagendamento / finalização
  findScheduleItems(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleExecutionRow[]>;

  markScheduleItemsAsRescheduled(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<number>;

  // Execução
  findExecutionTargets(
    serviceId: number,
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ExecutionTarget[]>;

  updateItemsExecution(
    items: { rowId: number; real: number | null }[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const WORK_SERVICES_EXECUTION_REPOSITORY = Symbol(
  'WorkServicesExecutionRepository',
);
