import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { FileService } from 'src/application/usecases/file.service';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { ExecutionReportController } from '../controllers/executionReport.controller';
import { ScheduleModule } from './schedule.module';

@Module({
  imports: [
    forwardRef(() => ScheduleModule),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const multerCfg = createMulterConfig({
          destination: config.get<string>('UPLOAD_AS_BUILD'),
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/png',
            'image/heic',
            'image/heif',
          ],
          allowedExtensions: [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.tiff',
            '.heic',
            '.heif',
          ],
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
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
