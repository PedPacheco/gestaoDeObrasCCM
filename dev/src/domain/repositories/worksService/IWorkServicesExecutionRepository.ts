import { ScheduleExecutionRow } from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/generated/prisma/client';

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

export interface IWorkServicesExecutionRepository {
  // ─── Finalização ────────────────────────────────────────────────────
  /** Grava prog/exec e os dados da execução. Devolve false se a programação não existir. */
  finalizeServices(
    data: FinalizationData,
    tx: Prisma.TransactionClient,
  ): Promise<boolean>;

  // ─── Reagendamento ──────────────────────────────────────────────────
  findScheduleWork(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<{ id_obra: number } | null>;
  findScheduleItems(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleExecutionRow[]>;
  deleteScheduleItemsByIds(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  /** Grava prog = 0 e exec = 0 (programação sem linhas). */
  zeroScheduleProgress(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  // ─── Execução ───────────────────────────────────────────────────────
  /** Linhas de programacoes_servicos para o par serviço + programação, com o estado da programação. */
  findExecutionTargets(
    serviceId: number,
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<
    { id: number; programacoes: { id_status_programacao: number | null } }[]
  >;
  updateItemsReal(
    items: { rowId: number; real: number }[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const WORK_SERVICES_EXECUTION_REPOSITORY = Symbol(
  'WorkServicesExecutionRepository',
);
