import { Inject, Injectable } from '@nestjs/common';
import {
  EXECUTION_REPORT_REPOSITORY,
  IExecutionReportRepository,
} from '../repositories/IExecutionReportRepository';
import { CreateExecutionReport } from 'src/interface/types/executionInterface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutionReportService {
  constructor(
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
  ) {}

  async create(data: CreateExecutionReport, tx: Prisma.TransactionClient) {
    const existing = await this.executionReportRepository.findByScheduleId(
      data.idSchedule,
      tx,
    );

    if (existing) {
      return;
    }

    await this.executionReportRepository.create(data, tx);
  }
}
