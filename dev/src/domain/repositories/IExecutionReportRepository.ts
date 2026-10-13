import { Prisma } from '@prisma/client';

export interface IExecutionReportRepository {
  create(
    data: Prisma.relatorio_execucaoUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findByScheduleId(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<any>;
  findByWorkId(idWork: number): Promise<any>;
  findById(idExecutionReport: number): Promise<any>;
  update(
    idExecutionReport: number,
    data: Prisma.relatorio_execucaoUpdateInput,
  ): Promise<void>;
  findScheduleWorkMode(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<{
    id_obra: number;
    obras: { programacao_ponto_a_ponto: boolean | null } | null;
  } | null>;
  findScheduledServiceIds(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<number[]>;
  /** Limpa o real de todas as linhas e grava exec = null e o estado indicado na programação. */
  resetScheduleExecution(
    idSchedule: number,
    scheduleStatus: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  clearServicesReal(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  sumWorkSchedulesExec(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number>;
  /** Grava o estado da obra e limpa a data de conclusão. O executado só é gravado se for indicado. */
  updateWorkStatusAfterReset(
    workId: number,
    data: { status: number; executed?: number },
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  deleteReport(id: number, tx: Prisma.TransactionClient): Promise<void>;
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
