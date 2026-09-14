import { Prisma } from '@prisma/client';
import {
  FindByIdResponse,
  FindByScheduleResponse,
  FindByWorkIdResponse,
} from '../types/repositories/executionReport.types';

export interface IExecutionReportRepository {
  create(
    data: Prisma.relatorio_execucaoUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findByScheduleId(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<FindByScheduleResponse>;
  findByWorkId(idWork: number): Promise<FindByWorkIdResponse[]>;
  findById(idExecutionReport: number): Promise<FindByIdResponse>;
  update(
    idExecutionReport: number,
    data: Prisma.relatorio_execucaoUpdateInput,
  ): Promise<void>;
  delete(id: number, idSchedule: number): Promise<void>;
}

export const EXECUTION_REPORT_REPOSITORY = Symbol('ExecutionReportRepository');
