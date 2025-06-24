import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EXECUTION_REPORT_REPOSITORY,
  IExecutionReportRepository,
} from '../repositories/IExecutionReportRepository';
import { Prisma } from '@prisma/client';
import { ExecutionReport } from '../entities/executionReport.entity';
import { ExecutionReportServiceInterface } from 'src/interface/types/executionReportInterface';

@Injectable()
export class ExecutionReportService {
  constructor(
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
  ) {}

  async create(
    data: ExecutionReportServiceInterface,
    scheduledFinishTime: Date,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await this.executionReportRepository.findByScheduleId(
      data.idSchedule,
      tx,
    );

    if (existing) {
      return;
    }

    const executionReport = ExecutionReport.create(data, scheduledFinishTime);

    await this.executionReportRepository.create(
      executionReport.toPersistenceObject() as Prisma.relatorio_execucaoUncheckedCreateInput,
      tx,
    );
  }

  async findByWorkId(idWork: number) {
    if (!idWork) {
      throw new BadRequestException('Id da obra não enviado');
    }

    const result = await this.executionReportRepository.findByWorkId(idWork);

    const formatted = result.map((item) => ({
      nome_usuario: item.usuario?.nome_usuario,
      ovnota: item.obras?.ovnota,
      ordem_dci: item.obras?.ordem_dci,
      tipo_obra: item.obras?.tipos?.tipo_obra,
      ...item,

      // Remove os objetos aninhados
      usuario: undefined,
      obras: undefined,
    }));

    return formatted;
  }
}
