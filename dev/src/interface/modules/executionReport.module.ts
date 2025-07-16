import { forwardRef, Module } from '@nestjs/common';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';
import { ExecutionReportController } from '../controllers/executionReport.controller';
import { ScheduleModule } from './schedule.module';

@Module({
  imports: [forwardRef(() => ScheduleModule)],
  controllers: [ExecutionReportController],
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
