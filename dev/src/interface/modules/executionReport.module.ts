import { ExecutionReportService } from 'src/application/executionReport.service';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

import { forwardRef, Module } from '@nestjs/common';

import { ExecutionReportController } from '../controllers/executionReport.controller';
import { ScheduleModule } from './schedule.module';
import { FileService } from 'src/application/file.service';
import { MulterModule } from '@nestjs/platform-express';
import { createMulterConfig } from 'src/shared/multer/multer.config';

@Module({
  imports: [
    forwardRef(() => ScheduleModule),
    MulterModule.register(
      createMulterConfig({
        destination: process.env.UPLOAD_AS_BUILD,
        allowedMimeTypes: ['application/pdf', 'image/jpeg'],
        maxSize: 5 * 1024 * 1024,
        maxFiles: 3,
      }),
    ),
  ],
  controllers: [ExecutionReportController],
  providers: [
    ExecutionReportService,
    FileService,
    {
      provide: EXECUTION_REPORT_REPOSITORY,
      useClass: ExecutionReportRepository,
    },
  ],
  exports: [ExecutionReportService],
})
export class ExecutionReportModule {}
