import { Module } from '@nestjs/common';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

@Module({
  providers: [
    ExecutionReportService,
    {
      provide: EXECUTION_REPORT_REPOSITORY,
      useClass: ExecutionReportRepository,
    },
  ],
  exports: [ExecutionReportService],
})
export class ExecutionReportModule {}
