import { Prisma } from '@prisma/client';
import { CreateExecutionReport } from 'src/interface/types/executionInterface';

export interface IExecutionReportRepository {
  create(
    data: CreateExecutionReport,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findByScheduleId(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<any>;
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
