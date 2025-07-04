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
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
