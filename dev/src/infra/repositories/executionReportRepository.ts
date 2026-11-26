import { Injectable } from '@nestjs/common';

import { IExecutionReportRepository } from 'src/domain/contracts/IExecutionReportRepository';

import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import { Prisma } from '../generated/prisma/client';

import {
  toExecutionReportDetail,
  toExecutionReportFiles,
  toExecutionReportPersistence,
  toScheduleWorkMode,
} from '../mappers/executionReport.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { workIdentifierWhere } from '../shared/workIdentifierWhere';
import {
  EXECUTION_REPORT_DETAIL_SELECT,
  EXECUTION_REPORT_FILES_SELECT,
  SCHEDULE_WORK_MODE_SELECT,
} from '../types';

@Injectable()
export class ExecutionReportRepository implements IExecutionReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    report: ExecutionReport,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.relatorio_execucao.create({
      data: toExecutionReportPersistence(report),
    });
  }

  async update(id: number, report: ExecutionReport): Promise<void> {
    await this.prisma.relatorio_execucao.update({
      where: { id },
      data: toExecutionReportPersistence(report),
    });
  }

  async findById(id: number) {
    const row = await this.prisma.relatorio_execucao.findFirst({
      where: { id },
      select: EXECUTION_REPORT_FILES_SELECT,
    });
    return row && toExecutionReportFiles(row);
  }

  async findByScheduleId(scheduleId: number, tx: Prisma.TransactionClient) {
    const row = await tx.relatorio_execucao.findFirst({
      where: { id_programacao: scheduleId },
      select: EXECUTION_REPORT_FILES_SELECT,
    });
    return row && toExecutionReportFiles(row);
  }

  async findByWorkIdentifier(id: number) {
    const rows = await this.prisma.relatorio_execucao.findMany({
      where: {
        obras: workIdentifierWhere(id),
      },
      select: EXECUTION_REPORT_DETAIL_SELECT,
    });
    return rows.map(toExecutionReportDetail);
  }

  async findScheduleWorkMode(scheduleId: number, tx: Prisma.TransactionClient) {
    const row = await tx.programacoes.findUnique({
      where: { id: scheduleId },
      select: SCHEDULE_WORK_MODE_SELECT,
    });
    return row && toScheduleWorkMode(row);
  }

  async findScheduledServiceIds(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<number[]> {
    const rows = await tx.programacoes_servicos.findMany({
      where: { id_programacao: idSchedule },
      select: { id_servico: true },
      distinct: ['id_servico'],
    });
    return rows.map((row) => row.id_servico);
  }

  async resetScheduleExecution(
    idSchedule: number,
    scheduleStatus: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all([
      tx.programacoes_servicos.updateMany({
        where: { id_programacao: idSchedule },
        data: { real: null },
      }),
      tx.programacoes.update({
        where: { id: idSchedule },
        data: { exec: null, id_status_programacao: scheduleStatus },
      }),
    ]);
  }

  async clearServicesReal(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.servicos.updateMany({
      where: { id: { in: serviceIds } },
      data: { qtde_real: null },
    });
  }

  async sumWorkSchedulesExec(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const result = await tx.programacoes.aggregate({
      where: { id_obra: workId, exec: { not: null } },
      _sum: { exec: true },
    });
    return Number(result._sum.exec);
  }

  async updateWorkStatusAfterReset(
    workId: number,
    data: { status: number; executed?: number },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.obras.update({
      where: { id: workId },
      data: {
        id_status: data.status,
        data_conclusao: null,
        ...(data.executed !== undefined && { executado: data.executed }),
      },
    });
  }

  async deleteReport(id: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.relatorio_execucao.delete({ where: { id } });
  }
}
