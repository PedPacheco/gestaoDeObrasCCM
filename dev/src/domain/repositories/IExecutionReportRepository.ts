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
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
