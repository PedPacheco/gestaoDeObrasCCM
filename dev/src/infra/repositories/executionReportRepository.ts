import { IExecutionReportRepository } from 'src/domain/repositories/IExecutionReportRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateExecutionReport } from 'src/interface/types/executionInterface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutionReportRepository implements IExecutionReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateExecutionReport,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { idSchedule, idUser, idWork } = data;

    await tx.relatorio_execucao.create({
      data: { id_obra: idWork, id_programacao: idSchedule, id_usuario: idUser },
    });
  }

  async findByScheduleId(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<any> {
    return await tx.relatorio_execucao.findFirst({
      where: { id_programacao: idSchedule },
    });
  }
}
