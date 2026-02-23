import { WorksServicesService } from 'src/application/services/worksServices.service';
import { WORKS_SERVICE_REPOSITORY } from 'src/domain/repositories/IWorksServiceRepository';
import { WorksServicesRepository } from 'src/infra/repositories/worksServicesRepository';

import { forwardRef, Module } from '@nestjs/common';

import { ServicesController } from '../controllers/worksServices.controller';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { QueriesServicesService } from 'src/application/services/queriesServices.service';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { ExecutionReportModule } from './executionReport.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { FinalizeServicesService } from 'src/application/services/finalizeServices.service';

@Module({
  imports: [
    UsersModule,
    WorksModule,
    forwardRef(() => ExecutionReportModule),
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
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
    }),
  ],
  controllers: [ServicesController],
  providers: [
    WorksServicesService,
    QueriesServicesService,
    FinalizeServicesService,
    ScheduleExecutionValidatorService,
    {
      provide: WORKS_SERVICE_REPOSITORY,
      useClass: WorksServicesRepository,
    },
    {
      provide: UPDATE_SCHEDULES_REPOSITORY,
      useClass: UpdateSchedulesRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
  ],
  exports: [WorksServicesService],
})
export class WorksServicesModule {}
