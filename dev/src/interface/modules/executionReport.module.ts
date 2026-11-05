import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { FileService } from 'src/application/usecases/file.service';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/contracts/IExecutionReportRepository';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { DOCUMENT_UPLOAD_PRESET } from 'src/shared/upload/uploadPresets';
import { ExecutionReportController } from '../controllers/executionReport.controller';
import { ProgressRecalculationModule } from './progressRecalculation.module';
import { ScheduleModule } from './schedule.module';

@Module({
  imports: [
    forwardRef(() => ScheduleModule),
    ProgressRecalculationModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createMulterConfig({
          destination: config.getOrThrow<string>('UPLOAD_AS_BUILD'),
          ...DOCUMENT_UPLOAD_PRESET,
        }),
    }),
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
