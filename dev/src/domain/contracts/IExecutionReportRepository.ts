import { Prisma } from 'src/infra/generated/prisma/client';
import { ExecutionReport } from '../entities/executionReport.entity';
import {
  ExecutionReportDetail,
  ExecutionReportFiles,
  ScheduleWorkMode,
  WorkStatusResetData,
} from '../types';

export interface IExecutionReportRepository {
  create(data: ExecutionReport, tx: Prisma.TransactionClient): Promise<void>;
  update(id: number, data: ExecutionReport): Promise<void>;
  findById(id: number): Promise<ExecutionReportFiles | null>;
  findByScheduleId(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ExecutionReportFiles | null>;
  findByWorkIdentifier(identifier: number): Promise<ExecutionReportDetail[]>;
  findScheduleWorkMode(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleWorkMode | null>;
  findScheduledServiceIds(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number[]>;
  resetScheduleExecution(
    scheduleId: number,
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
  updateWorkStatusAfterReset(
    workId: number,
    data: WorkStatusResetData,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  deleteReport(id: number, tx: Prisma.TransactionClient): Promise<void>;
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
